
"use client";

import type { FC } from "react";
import { useDrag } from "react-dnd";
import { Text, Image as ImageIcon } from "lucide-react";
import { ItemTypes } from "@/lib/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DraggableItemProps {
  type: 'text' | 'image';
  children: React.ReactNode;
}

const DraggableToolbarItem: FC<DraggableItemProps> = ({ type, children }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: type,
    item: { type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className="flex items-center gap-2 p-3 border rounded-lg bg-secondary/50 hover:bg-accent hover:cursor-grab active:cursor-grabbing transition-colors"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {children}
    </div>
  );
};

const EditorToolbar: FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Toolbox</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <DraggableToolbarItem type="text">
          <Text className="w-5 h-5 text-primary" />
          <span className="font-medium">Text</span>
        </DraggableToolbarItem>
        <DraggableToolbarItem type="image">
          <ImageIcon className="w-5 h-5 text-primary" />
          <span className="font-medium">Image</span>
        </DraggableToolbarItem>
      </CardContent>
    </Card>
  );
};

export default EditorToolbar;
