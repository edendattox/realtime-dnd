import React from "react";
import { DraggableProvided } from "react-beautiful-dnd";

export type ItemType = {
  id: string;
  type: "item";
  title: string;
  icon: string;
  createdAt: number;
};

// A helper function to restrict translation to the vertical axis only.
const getVerticalStyle = (style: any) => {
  if (!style || !style.transform) return style;
  // Extract the translateY value from the transform string.
  const match = style.transform.match(
    /translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/
  );
  if (match) {
    const translateY = match[2];
    return {
      ...style,
      transform: `translate(0px, ${translateY}px)`,
    };
  }
  return style;
};

interface ItemCardProps {
  item: ItemType;
  provided: DraggableProvided;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, provided }) => {
  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={getVerticalStyle(provided.draggableProps.style)}
      className="p-4 bg-white rounded shadow flex items-center"
    >
      <span className="text-xl mr-2">{item.icon}</span>
      <span>{item.title}</span>
    </div>
  );
};

export default ItemCard;
