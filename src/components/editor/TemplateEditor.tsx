"use client";

import { useState, useCallback } from "react";
import type { FC } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useRouter } from "next/navigation";
import type { Template, TemplateElement, Field } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, Save } from "lucide-react";
import EditorToolbar from "./EditorToolbar";
import FieldsManager from "./FieldsManager";
import EditorCanvas from "./EditorCanvas";
import PropertiesPanel from "./PropertiesPanel";
import { TemplatePreviewDialog } from "@/components/templates/TemplatePreviewDialog";

interface TemplateEditorProps {
  initialData: Template | null;
}

const TemplateEditor: FC<TemplateEditorProps> = ({ initialData }) => {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(initialData?.name || "New Template");
  const [fields, setFields] = useState<Field[]>(initialData?.fields || []);
  const [elements, setElements] = useState<TemplateElement[]>(initialData?.elements || []);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const selectedElement = elements.find((el) => el.id === selectedElementId) || null;
  const fullTemplate = {
      id: initialData?.id || 'new',
      name,
      fields,
      elements,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
  }

  const addElement = useCallback((type: 'text' | 'image', style: React.CSSProperties) => {
    const newElement: TemplateElement = {
      id: `el-${Date.now()}`,
      type,
      content: type === 'text' ? 'New Text' : 'Image Placeholder',
      style,
    };
    setElements((prev) => [...prev, newElement]);
    setSelectedElementId(newElement.id);
  }, []);

  const updateElement = useCallback((id: string, newProps: Partial<TemplateElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...newProps } : el))
    );
  }, []);
  
  const updateElementStyle = useCallback((id: string, newStyle: Partial<React.CSSProperties>) => {
     setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, style: {...el.style, ...newStyle} } : el))
    );
  }, []);

  const deleteElement = useCallback((id: string) => {
    setElements((prev) => prev.filter(el => el.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  }, [selectedElementId]);

  const handleSave = () => {
    // In a real app, this would call an API
    console.log("Saving template:", { name, fields, elements });
    toast({
      title: "Template Saved!",
      description: `Template "${name}" has been successfully saved.`,
      variant: "default",
    });
    router.push("/");
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen w-full flex-col bg-muted/40">
        <header className="flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/')}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="w-64 text-lg font-semibold"
            />
          </div>
          <div className="flex items-center gap-2">
            <TemplatePreviewDialog template={fullTemplate}>
              <Button variant="outline">
                <Eye className="mr-2 h-4 w-4" /> Preview
              </Button>
            </TemplatePreviewDialog>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Save Template
            </Button>
          </div>
        </header>

        <main className="flex-1 grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[300px_1fr_300px] gap-2 p-2 overflow-hidden">
          {/* Left Panel */}
          <div className="flex flex-col gap-2 bg-background rounded-lg border p-2 overflow-y-auto">
            <EditorToolbar />
            <FieldsManager fields={fields} setFields={setFields} />
          </div>

          {/* Center Panel */}
          <div className="flex items-center justify-center overflow-auto bg-background rounded-lg border p-4">
             <EditorCanvas
                elements={elements}
                onDropElement={addElement}
                onSelectElement={setSelectedElementId}
                onUpdateElementStyle={updateElementStyle}
                selectedElementId={selectedElementId}
              />
          </div>

          {/* Right Panel */}
          <div className="bg-background rounded-lg border p-4 overflow-y-auto">
             <PropertiesPanel
                element={selectedElement}
                fields={fields}
                onUpdate={updateElement}
                onDelete={deleteElement}
              />
          </div>
        </main>
      </div>
    </DndProvider>
  );
};

export default TemplateEditor;
