import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import sqlite3 from "sqlite3";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 4000;

const db = new sqlite3.Database("./database.sqlite", (err) => {
  if (err) {
    console.error("Error connecting to SQLite:", err);
  } else {
    console.log("Connected to SQLite database.");
  }
});

db.serialize(() => {
  db.run(
    `
    CREATE TABLE IF NOT EXISTS app_state (
      id TEXT PRIMARY KEY,
      data TEXT
    )
  `,
    () => {
      // Insert initial empty state if not exists
      db.get(
        `SELECT COUNT(*) as count FROM app_state WHERE id = 'state'`,
        (err, row) => {
          if (err) {
            console.error(err);
            // @ts-ignore
          } else if (row.count === 0) {
            db.run(`INSERT INTO app_state (id, data) VALUES ('state', ?)`, [
              JSON.stringify([]),
            ]);
          }
        }
      );
    }
  );
});

const dbGet = (sql: string, params: any[] = []): Promise<any> =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });

const dbRun = (sql: string, params: any[] = []): Promise<any> =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

io.on("connection", (socket: Socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("fetchState", async () => {
    try {
      const row = await dbGet(`SELECT data FROM app_state WHERE id = 'state'`);
      console.log("Row:", row);
      const state = row ? JSON.parse(row.data) : [];
      socket.emit("stateData", state);
    } catch (error) {
      socket.emit("error", error);
    }
  });

  socket.on("updateState", async (newState: any[]) => {
    try {
      console.log("Updating state:", newState);
      await dbRun(`UPDATE app_state SET data = ? WHERE id = 'state'`, [
        JSON.stringify(newState),
      ]);
      io.emit("stateData", newState);
    } catch (error) {
      socket.emit("error", error);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
