"use client";

import type { FC } from "react";
import { useDrag } from "react-dnd";
import type { CSSProperties } from "react";
import { ItemTypes } from "@/lib/dnd";
import type { TemplateElement } from "@/lib/types";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface CanvasElementProps {
  element: TemplateElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdateStyle: (id:string, style: Partial<CSSProperties>) => void;
  canvasBounds: { width: number; height: number };
}

const CanvasElement: FC<CanvasElementProps> = ({ element, isSelected, onSelect, onUpdateStyle, canvasBounds }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.CANVAS_ELEMENT,
    item: { id: element.id, style: element.style },
    end: (item, monitor) => {
        const delta = monitor.getDifferenceFromInitialOffset();
        if (delta) {
            const left = Math.round(parseInt(item.style.left as string || "0") + delta.x);
            const top = Math.round(parseInt(item.style.top as string || "0") + delta.y);
            onUpdateStyle(item.id, {
                left: `${Math.max(0, Math.min(left, canvasBounds.width - 50))}px`,
                top: `${Math.max(0, Math.min(top, canvasBounds.height - 20))}px`,
            });
        }
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [element.id, element.style, onUpdateStyle, canvasBounds]);

  const content = element.fieldId ? `{{ ${element.fieldId} }}` : element.content;

  const renderContent = () => {
    if (element.type === 'image') {
        const src = element.fieldId ? 'https://placehold.co/100x100.png' : element.content;
        return <Image data-ai-hint="placeholder image" src={src} alt={element.content} layout="fill" objectFit="contain" className="pointer-events-none"/>
    }
    return content;
  }
  
  return (
    <div
      ref={drag}
      onClick={() => onSelect(element.id)}
      style={{ ...element.style, opacity: isDragging ? 0.5 : 1 }}
      className={cn(
        "p-1 cursor-move select-none",
        "transition-shadow duration-200",
        isSelected && "outline-dashed outline-1 outline-primary shadow-lg z-10"
      )}
    >
        {renderContent()}
    </div>
  );
};

export default CanvasElement;
