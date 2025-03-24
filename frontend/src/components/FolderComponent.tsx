import React from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import ItemCard, { ItemType } from "./ItemCard";

export type FolderType = {
  id: string;
  type: "folder";
  name: string;
  open: boolean;
  items: ItemType[];
  createdAt: number;
};

interface FolderComponentProps {
  folder: FolderType;
  index: number;
  toggleFolder: (id: string) => void;
}

const FolderComponent: React.FC<FolderComponentProps> = ({
  folder,
  toggleFolder,
}) => {
  return (
    <div className="border rounded p-2">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => toggleFolder(folder.id)}
      >
        <div className="flex items-center">
          <span className="mr-2">📁</span>
          <span className="font-bold">{folder.name}</span>
        </div>
        <span>{folder.open ? "−" : "+"}</span>
      </div>
      {folder.open && (
        <Droppable droppableId={folder.id}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="mt-2 space-y-2"
            >
              {folder.items.map((item, idx) => (
                <Draggable key={item.id} draggableId={item.id} index={idx}>
                  {(provided) => <ItemCard item={item} provided={provided} />}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      )}
    </div>
  );
};

export default FolderComponent;
