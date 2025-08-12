
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

  const handlePositioningChange = (prop: keyof React.CSSProperties, value: string) => {
    const newStyle = { ...element.style, [prop]: value ? `${value}px` : undefined };
    // To avoid conflicts, if top is set, remove bottom, and vice-versa. Same for left/right.
    if (prop === 'top' && value) delete newStyle.bottom;
    if (prop === 'bottom' && value) delete newStyle.top;
    if (prop === 'left' && value) delete newStyle.right;
    if (prop === 'right' && value) delete newStyle.left;
    onUpdate(element.id, { style: newStyle });
  }
  
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

        <div className="space-y-4 border-t pt-4">
            <Label className="font-semibold">Styling</Label>
            
            {element.type === 'text' && (
                <div className="space-y-2">
                    <Label className="text-xs font-medium">Typography</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label htmlFor="fontSize" className="text-xs text-muted-foreground">Font Size</Label>
                            <Input
                                id="fontSize"
                                type="number"
                                value={parseInt(element.style.fontSize as string) || 16}
                                onChange={e => handleStyleChange('fontSize', `${e.target.value}px`)}
                                placeholder="16"
                            />
                        </div>
                         <div>
                            <Label htmlFor="color" className="text-xs text-muted-foreground">Color</Label>
                            <Input
                                id="color"
                                type="text"
                                value={element.style.color as string || '#000000'}
                                onChange={e => handleStyleChange('color', e.target.value)}
                                placeholder="#000000"
                            />
                        </div>
                    </div>
                </div>
            )}
            
            <div className="space-y-2">
                <Label className="text-xs font-medium">Positioning</Label>
                 <div className="grid grid-cols-2 gap-2">
                    <div>
                        <Label htmlFor="top" className="text-xs text-muted-foreground">Top (px)</Label>
                        <Input
                            id="top"
                            type="number"
                            value={parseInt(element.style.top as string) || ''}
                            onChange={e => handlePositioningChange('top', e.target.value)}
                            placeholder="auto"
                        />
                    </div>
                    <div>
                        <Label htmlFor="right" className="text-xs text-muted-foreground">Right (px)</Label>
                        <Input
                            id="right"
                            type="number"
                            value={parseInt(element.style.right as string) || ''}
                            onChange={e => handlePositioningChange('right', e.target.value)}
                            placeholder="auto"
                        />
                    </div>
                    <div>
                        <Label htmlFor="bottom" className="text-xs text-muted-foreground">Bottom (px)</Label>
                        <Input
                            id="bottom"
                            type="number"
                            value={parseInt(element.style.bottom as string) || ''}
                            onChange={e => handlePositioningChange('bottom', e.target.value)}
                            placeholder="auto"
                        />
                    </div>
                    <div>
                        <Label htmlFor="left" className="text-xs text-muted-foreground">Left (px)</Label>
                        <Input
                            id="left"
                            type="number"
                            value={parseInt(element.style.left as string) || ''}
                            onChange={e => handlePositioningChange('left', e.target.value)}
                            placeholder="auto"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-xs font-medium">Sizing</Label>
                 <div className="grid grid-cols-2 gap-2">
                    <div>
                       <Label htmlFor="width" className="text-xs text-muted-foreground">Width (px)</Label>
                        <Input
                            id="width"
                            type="number"
                            value={parseInt(element.style.width as string) || ''}
                            onChange={e => handleStyleChange('width', `${e.target.value}px`)}
                            placeholder="auto"
                            disabled={element.type === 'table'}
                        />
                    </div>
                    <div>
                        <Label htmlFor="height" className="text-xs text-muted-foreground">Height (px)</Label>
                        <Input
                            id="height"
                            type="number"
                            value={parseInt(element.style.height as string) || ''}
                            onChange={e => handleStyleChange('height', `${e.target.value}px`)}
                            placeholder="auto"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-xs font-medium">Border</Label>
                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <Label htmlFor="borderWidth" className="text-xs text-muted-foreground">Width</Label>
                        <Input
                            id="borderWidth"
                            type="number"
                            value={parseInt(element.style.borderWidth as string) || 0}
                            onChange={e => handleStyleChange('borderWidth', `${e.target.value}px`)}
                            placeholder="0"
                        />
                    </div>
                    <div className="col-span-2">
                        <Label htmlFor="borderStyle" className="text-xs text-muted-foreground">Style</Label>
                        <Select onValueChange={(value) => handleStyleChange('borderStyle', value)} defaultValue={element.style.borderStyle || 'none'} name="borderStyle">
                            <SelectTrigger id="borderStyle"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="solid">Solid</SelectItem>
                                <SelectItem value="dashed">Dashed</SelectItem>
                                <SelectItem value="dotted">Dotted</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="col-span-3">
                        <Label htmlFor="borderColor" className="text-xs text-muted-foreground">Color</Label>
                         <Input
                            id="borderColor"
                            type="text"
                            value={element.style.borderColor as string || '#000000'}
                            onChange={e => handleStyleChange('borderColor', e.target.value)}
                            placeholder="#000000"
                        />
                    </div>
                </div>
            </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default PropertiesPanel;
