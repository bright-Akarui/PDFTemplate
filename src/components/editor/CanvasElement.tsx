
"use client";

import type { FC } from "react";
import { useDrag } from "react-dnd";
import type { CSSProperties } from "react";
import { ItemTypes } from "@/lib/dnd";
import type { TemplateElement, Field } from "@/lib/types";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface CanvasElementProps {
  element: TemplateElement;
  fields: Field[];
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdateStyle: (id:string, style: Partial<CSSProperties>) => void;
  canvasBounds: { width: number; height: number };
}

const SampleTable: FC<{element: TemplateElement, fields: Field[]}> = ({element, fields}) => {
    const linkedField = fields.find(f => f.id === element.fieldId);

    if (!linkedField || linkedField.type !== 'table' || !linkedField.itemSchema) {
        return <div className="p-4 text-center text-muted-foreground bg-secondary/30 rounded-lg">Link to a table field to see a preview.</div>
    }

    let sampleData: any[] = [];
    try {
        const parsed = JSON.parse(linkedField.sampleValue);
        if (Array.isArray(parsed)) {
            sampleData = parsed;
        }
    } catch {
        // ignore parsing errors, show empty table
    }

    return (
        <table className="w-full border-collapse text-sm">
            <thead>
                <tr className="bg-muted">
                    {linkedField.itemSchema.map(col => (
                        <th key={col.id} className="p-2 border font-medium text-left">{col.name}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {sampleData.slice(0, 3).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                        {linkedField.itemSchema?.map(col => (
                            <td key={col.id} className="p-2 border">{String(row[col.name] || '')}</td>
                        ))}
                    </tr>
                ))}
                 {sampleData.length === 0 && (
                    <tr>
                        <td colSpan={linkedField.itemSchema.length} className="p-2 border text-center text-muted-foreground">
                            No sample data provided.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
};

const CanvasElement: FC<CanvasElementProps> = ({ element, fields, isSelected, onSelect, onUpdateStyle, canvasBounds }) => {
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

  const renderContent = () => {
    switch (element.type) {
        case 'text':
            return element.fieldId ? `{{ ${element.fieldId} }}` : element.content;
        case 'image':
            const src = element.fieldId ? 'https://placehold.co/100x100.png' : element.content;
            return <Image data-ai-hint="placeholder image" src={src} alt={element.content} layout="fill" objectFit="contain" className="pointer-events-none"/>
        case 'table':
            return <SampleTable element={element} fields={fields}/>;
        default:
            return null;
    }
  }
  
  return (
    <div
      ref={drag}
      onClick={(e) => { e.stopPropagation(); onSelect(element.id); }}
      style={{ ...element.style, opacity: isDragging ? 0.5 : 1 }}
      className={cn(
        "p-1 cursor-move select-none",
        "transition-shadow duration-200",
        isSelected && "outline-dashed outline-1 outline-primary shadow-lg z-10",
        element.type === 'table' && "w-full"
      )}
    >
        {renderContent()}
    </div>
  );
};

export default CanvasElement;

    