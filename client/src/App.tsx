import React, { useState, useEffect } from "react";
import io, { Socket } from "socket.io-client";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import ItemCard, { ItemType } from "./components/ItemCard";
import FolderComponent, { FolderType } from "./components/FolderComponent";

export type AppItem = ItemType | FolderType;

const iconOptions = [
  { value: "😊", label: "Smile" },
  { value: "❤️", label: "Heart" },
  { value: "⭐", label: "Star" },
  { value: "🎵", label: "Music" },
  { value: "📷", label: "Camera" },
  { value: "📁", label: "Folder" },
  { value: "📌", label: "Pin" },
  { value: "☕", label: "Coffee" },
  { value: "🎁", label: "Gift" },
  { value: "🔖", label: "Bookmark" },
  { value: "🚀", label: "Rocket" },
  { value: "💡", label: "Idea" },
];

const socket: Socket = io(
  process.env.REACT_APP_SERVER_URL || "http://localhost:4000"
);

const App: React.FC = () => {
  const [items, setItems] = useState<AppItem[]>([]);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemIcon, setNewItemIcon] = useState("😊");
  const [newFolderName, setNewFolderName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchState = () => {
    socket.emit("fetchState");
  };

  const updateState = (newState: AppItem[]) => {
    socket.emit("updateState", newState);
  };

  useEffect(() => {
    fetchState();

    socket.on("stateData", (data: AppItem[]) => {
      console.log("stateData", data);
      setItems(data);
    });

    socket.on("error", (error: any) => {
      console.error("Socket error:", error);
    });

    return () => {
      socket.off("stateData");
      socket.off("error");
    };
  }, []);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const draggedItem = items.find((item) => item.id === draggableId);
    if (draggedItem?.type === "folder" && destination.droppableId !== "main") {
      return;
    }

    const newItems = [...items];

    const getFolderIndex = (folderId: string) =>
      newItems.findIndex(
        (item) => item.type === "folder" && item.id === folderId
      );

    if (source.droppableId === "main" && destination.droppableId === "main") {
      const [movedItem] = newItems.splice(source.index, 1);
      newItems.splice(destination.index, 0, movedItem);
    } else if (
      source.droppableId === "main" &&
      destination.droppableId !== "main"
    ) {
      const folderIndex = getFolderIndex(destination.droppableId);
      if (folderIndex === -1) return;
      const folder = newItems[folderIndex] as FolderType;
      const [movedItem] = newItems.splice(source.index, 1);
      // @ts-ignore
      folder.items.splice(destination.index, 0, movedItem);
    } else if (
      source.droppableId !== "main" &&
      destination.droppableId === "main"
    ) {
      const folderIndex = getFolderIndex(source.droppableId);
      if (folderIndex === -1) return;
      const folder = newItems[folderIndex] as FolderType;
      const [movedItem] = folder.items.splice(source.index, 1);
      newItems.splice(destination.index, 0, movedItem);
    } else if (
      source.droppableId !== "main" &&
      destination.droppableId !== "main"
    ) {
      if (source.droppableId === destination.droppableId) {
        const folderIndex = getFolderIndex(source.droppableId);
        if (folderIndex === -1) return;
        const folder = newItems[folderIndex] as FolderType;
        const [movedItem] = folder.items.splice(source.index, 1);
        folder.items.splice(destination.index, 0, movedItem);
      } else {
        const sourceFolderIndex = getFolderIndex(source.droppableId);
        const destFolderIndex = getFolderIndex(destination.droppableId);
        if (sourceFolderIndex === -1 || destFolderIndex === -1) return;
        const sourceFolder = newItems[sourceFolderIndex] as FolderType;
        const destFolder = newItems[destFolderIndex] as FolderType;
        const [movedItem] = sourceFolder.items.splice(source.index, 1);
        destFolder.items.splice(destination.index, 0, movedItem);
      }
    }

    setItems(newItems);
    updateState(newItems);
  };

  const addItem = () => {
    if (newItemTitle.trim() === "" || newItemIcon.trim() === "") return;
    const newItem: ItemType = {
      id: uuidv4(),
      type: "item",
      title: newItemTitle,
      icon: newItemIcon,
      createdAt: Date.now(),
    };
    const newState = [...items, newItem];
    setItems(newState);
    updateState(newState);
    setNewItemTitle("");
    setNewItemIcon("😊");
  };

  const addFolder = () => {
    if (newFolderName.trim() === "") return;
    const newFolder: FolderType = {
      id: uuidv4(),
      type: "folder",
      name: newFolderName,
      open: true,
      items: [],
      createdAt: Date.now(),
    };
    const newState = [...items, newFolder];
    setItems(newState);
    updateState(newState);
    setNewFolderName("");
  };

  const toggleFolder = (id: string) => {
    const newState = items.map((item) =>
      item.type === "folder" && item.id === id
        ? { ...item, open: !item.open }
        : item
    );
    setItems(newState);
    updateState(newState);
  };

  const filteredItems = items.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    if (item.type === "item") {
      return (
        item.title.toLowerCase().includes(searchLower) ||
        item.icon.includes(searchLower)
      );
    } else {
      return (
        item.name.toLowerCase().includes(searchLower) ||
        item.items.some(
          (subItem) =>
            subItem.title.toLowerCase().includes(searchLower) ||
            subItem.icon.includes(searchLower)
        )
      );
    }
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="p-6 shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Realtime Items and Folders
        </h1>

        <div className="space-y-4 mb-6">
          <Input
            placeholder="Search items and folders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Add Item */}
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Item Title"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  className="flex-1"
                />
                <Select value={newItemIcon} onValueChange={setNewItemIcon}>
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((icon) => (
                      <SelectItem key={icon.value} value={icon.value}>
                        <div className="flex items-center">
                          <span className="mr-2">{icon.value}</span>
                          <span>{icon.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addItem} className="w-full">
                <span className="mr-2">＋</span>
                Add Item
              </Button>
            </div>

            {/* Add Folder */}
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Folder Name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full"
              />
              <Button onClick={addFolder} className="w-full">
                <span className="mr-2">＋</span>
                Add Folder
              </Button>
            </div>
          </div>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="main" direction="vertical">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-2"
              >
                {filteredItems.map((item, index) =>
                  item.type === "item" ? (
                    <Draggable
                      key={item.id}
                      draggableId={item.id}
                      index={index}
                    >
                      {(provided) => (
                        <ItemCard item={item} provided={provided} />
                      )}
                    </Draggable>
                  ) : (
                    <Draggable
                      key={item.id}
                      draggableId={item.id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <FolderComponent
                            folder={item}
                            index={index}
                            toggleFolder={toggleFolder}
                          />
                        </div>
                      )}
                    </Draggable>
                  )
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </Card>
    </div>
  );
};

export default App;
