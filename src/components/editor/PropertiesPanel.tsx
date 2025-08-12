
"use client";

import type { FC } from "react";
import type { TemplateElement, Field } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Settings2, MousePointerSquareDashed } from "lucide-react";

interface PropertiesPanelProps {
  element: TemplateElement | null;
  fields: Field[];
  onUpdate: (id: string, newProps: Partial<TemplateElement>) => void;
  onDelete: (id: string) => void;
}

const PropertiesPanel: FC<PropertiesPanelProps> = ({ element, fields, onUpdate, onDelete }) => {
  if (!element) {
    return (
      <Card className="h-full border-0 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold"><Settings2 /> Properties</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground h-1/2">
            <MousePointerSquareDashed className="w-10 h-10 mb-4" />
            <p className="font-medium">Select an element</p>
            <p className="text-sm">Click an element on the canvas to edit its properties.</p>
        </CardContent>
      </Card>
    );
  }

  const handleStyleChange = (prop: keyof React.CSSProperties, value: string) => {
    onUpdate(element.id, { style: { ...element.style, [prop]: value } });
  };
  
  const handleContentChange = (value: string) => {
    onUpdate(element.id, { content: value });
  };

  const handleFieldLink = (fieldId: string) => {
    const selectedField = fields.find(f => f.id === fieldId);
    if (selectedField && element.type !== selectedField.type && !(element.type === 'image' && selectedField.type === 'text')) {
      alert(`Cannot link a ${element.type} element to a ${selectedField.type} field.`);
      return;
    }
    onUpdate(element.id, { fieldId: fieldId === "none" ? undefined : fieldId });
  };
  
  const availableFields = fields.filter(field => {
    if (element.type === 'text') return field.type === 'text' || field.type === 'number' || field.type === 'date';
    if (element.type === 'image') return field.type === 'image' || field.type === 'text'; // Allow text for URLs
    if (element.type === 'table') return field.type === 'table';
    return false;
  });

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <CardTitle className="capitalize flex justify-between items-center text-base font-semibold">
          <span>{element.type} Properties</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(element.id)}>
              <Trash2 className="w-4 h-4 text-destructive"/>
          </Button>
        </CardTitle>
        <CardDescription>ID: {element.id}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Link to Field</Label>
           <Select onValueChange={handleFieldLink} value={element.fieldId || "none"}>
            <SelectTrigger><SelectValue placeholder="Link to a data field" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {availableFields.map(field => (
                    <SelectItem key={field.id} value={field.id}>{field.name}</SelectItem>
                ))}
            </SelectContent>
          </Select>
          {availableFields.length === 0 && <p className="text-xs text-muted-foreground mt-1">No compatible fields of type '{element.type}' found.</p>}
        </div>
        
        {element.type === 'text' && !element.fieldId && (
          <div>
            <Label>Text Content</Label>
            <Textarea value={element.content} onChange={e => handleContentChange(e.target.value)} />
          </div>
        )}
        
        {element.type === 'image' && !element.fieldId && (
            <div>
                <Label>Image URL</Label>
                <Input type="text" value={element.content} onChange={e => handleContentChange(e.target.value)} placeholder="https://placehold.co/100x100" />
            </div>
        )}

        <div className="space-y-2">
            <Label>Styling</Label>
            {element.type === 'text' && (
                <div className="grid grid-cols-2 gap-2">
                    <Input 
                        type="number"
                        value={parseInt(element.style.fontSize as string) || 16}
                        onChange={e => handleStyleChange('fontSize', `${e.target.value}px`)}
                        placeholder="Font Size"
                    />
                    <Input 
                        type="text"
                        value={element.style.color as string || '#000000'}
                        onChange={e => handleStyleChange('color', e.target.value)}
                        placeholder="Color"
                    />
                </div>
            )}
             <div className="grid grid-cols-2 gap-2">
                <Input
                    type="text"
                    value={parseInt(element.style.width as string) || "auto"}
                    onChange={e => handleStyleChange('width', `${e.target.value}px`)}
                    placeholder="Width (px)"
                    disabled={element.type === 'table'}
                />
                <Input
                    type="text"
                    value={parseInt(element.style.height as string) || "auto"}
                    onChange={e => handleStyleChange('height', `${e.target.value}px`)}
                    placeholder="Height (px)"
                />
            </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default PropertiesPanel;

    