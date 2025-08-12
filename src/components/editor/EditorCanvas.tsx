
"use client";

import type { FC } from "react";
import { useDrop } from "react-dnd";
import type { CSSProperties } from "react";
import type { TemplateElement } from "@/lib/types";
import { ItemTypes } from "@/lib/dnd";
import { cn } from "@/lib/utils";
import CanvasElement from "./CanvasElement";

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

interface EditorCanvasProps {
  elements: TemplateElement[];
  onDropElement: (type: 'text' | 'image', style: CSSProperties) => void;
  onSelectElement: (id: string | null) => void;
  onUpdateElementStyle: (id: string, newStyle: Partial<CSSProperties>) => void;
  selectedElementId: string | null;
}

const EditorCanvas: FC<EditorCanvasProps> = ({
  elements,
  onDropElement,
  onSelectElement,
  onUpdateElementStyle,
  selectedElementId,
}) => {
  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: [ItemTypes.TEXT, ItemTypes.IMAGE],
    drop: (item: { type: 'text' | 'image' }, monitor) => {
      const dropTarget = document.getElementById("editor-canvas-wrapper")?.getBoundingClientRect();
      const canvasEl = document.getElementById("editor-canvas");
      if (!delta || !dropTarget || !canvasEl) return;
      
      const style = window.getComputedStyle(canvasEl);
      const matrix = new DOMMatrixReadOnly(style.transform);
      const scale = matrix.m11;

      const delta = monitor.getClientOffset();

      if (delta && dropTarget) {
        const top = (delta.y - dropTarget.top) / scale;
        const left = (delta.x - dropTarget.left) / scale;
        onDropElement(item.type, { top: `${top}px`, left: `${left}px`, position: 'absolute' });
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [onDropElement]);

  const isActive = canDrop && isOver;

  return (
    <div id="editor-canvas-wrapper" className="w-full h-full flex items-center justify-center">
        <div
            id="editor-canvas"
            ref={drop}
            onClick={(e) => {
                if (e.target === e.currentTarget) onSelectElement(null);
            }}
            className={cn(
                "relative bg-white shadow-lg origin-top",
                "transition-all duration-200",
                isActive ? 'outline-dashed outline-2 outline-offset-4 outline-primary' : '',
                canDrop ? 'bg-primary/5' : ''
            )}
            style={{
                width: `${A4_WIDTH_PX}px`,
                height: `${A4_HEIGHT_PX}px`,
                transform: `scale(var(--canvas-scale, 0.75))`,
                transformOrigin: 'top center',
            }}
        >
        {elements.map((el) => (
            <CanvasElement
            key={el.id}
            element={el}
            isSelected={selectedElementId === el.id}
            onSelect={onSelectElement}
            onUpdateStyle={onUpdateElementStyle}
            canvasBounds={{ width: A4_WIDTH_PX, height: A4_HEIGHT_PX }}
            />
        ))}
        </div>
    </div>
  );
};

export default EditorCanvas;
