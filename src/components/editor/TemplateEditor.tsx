
"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useTemplates } from "@/hooks/use-templates";

interface TemplateEditorProps {
  initialData: Template | null;
}

const generateHtmlForTemplate = (template: Partial<Template>): string => {
    if (!template.elements) return ""

    const elementsHtml = template.elements
      .map((el) => {
        const styleString = Object.entries(el.style)
          .map(([key, value]) => `${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}: ${value};`)
          .join(" ")
        
        const content = el.fieldId
          ? `{{${template.fields?.find(f => f.id === el.fieldId)?.name || ''}}}`
          : el.content;

        if (el.type === 'image') {
          const src = el.fieldId ? `{{${template.fields?.find(f => f.id === el.fieldId)?.name || ''}}}` : el.content;
          return `<img src="${src}" alt="${el.content}" style="${styleString}" />`
        }
        
        return `<div style="${styleString}">${content}</div>`
      })
      .join("\n")

    return `<html>
  <head>
    <style>
      body { font-family: sans-serif; }
      .template-container { 
        position: relative; 
        width: 210mm; 
        height: 297mm; 
        background: white; 
        margin: auto; 
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
      }
    </style>
  </head>
  <body>
    <div class="template-container">
      ${elementsHtml}
    </div>
  </body>
</html>
    `
  }

const TemplateEditor: FC<TemplateEditorProps> = ({ initialData }) => {
  const router = useRouter();
  const { toast } = useToast();
  const { saveTemplate } = useTemplates();

  const [name, setName] = useState(initialData?.name || "New Template");
  const [fields, setFields] = useState<Field[]>(initialData?.fields || []);
  const [elements, setElements] = useState<TemplateElement[]>(initialData?.elements || []);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  const initialHtml = useMemo(() => {
    if (initialData?.htmlContent) {
        return initialData.htmlContent;
    }
    return generateHtmlForTemplate({...(initialData || {}), name, fields, elements});
  }, [initialData, name, fields, elements]);
  
  const [htmlContent, setHtmlContent] = useState(initialHtml);
  const [activeTab, setActiveTab] = useState("visual");

  // This effect ensures that if we switch to the code tab, the htmlContent state is up-to-date
  // with any changes made in the visual editor.
  useEffect(() => {
    if (activeTab === 'code') {
      setHtmlContent(generateHtmlForTemplate({ name, fields, elements }));
    }
  }, [name, fields, elements, activeTab]);


  const selectedElement = elements.find((el) => el.id === selectedElementId) || null;
  
  const getCurrentTemplateState = (): Omit<Template, 'createdAt' | 'updatedAt'> => {
    const isCodeEditing = activeTab === 'code';
    const generatedHtml = generateHtmlForTemplate({ name, fields, elements });

    return {
      id: initialData?.id || `t-${Date.now()}`,
      name,
      fields,
      elements: isCodeEditing ? [] : elements, // If editing code, we don't save the visual elements
      htmlContent: isCodeEditing ? htmlContent : generatedHtml,
    }
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
    const templateToSave = getCurrentTemplateState();
    saveTemplate(templateToSave);
    
    toast({
      title: "Template Saved!",
      description: `Template "${templateToSave.name}" has been successfully saved.`,
      variant: "default",
    });
    router.push("/");
    router.refresh(); // To ensure the list page re-fetches data
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
            <TemplatePreviewDialog template={getCurrentTemplateState() as Template}>
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col overflow-auto bg-background rounded-lg border p-4">
              <TabsList className="self-center mb-4">
                <TabsTrigger value="visual">Visual Editor</TabsTrigger>
                <TabsTrigger value="code">Code Editor</TabsTrigger>
              </TabsList>
              <TabsContent value="visual" className="flex-grow flex items-center justify-center overflow-auto">
                <EditorCanvas
                  elements={elements}
                  onDropElement={addElement}
                  onSelectElement={setSelectedElementId}
                  onUpdateElementStyle={updateElementStyle}
                  selectedElementId={selectedElementId}
                />
              </TabsContent>
               <TabsContent value="code" className="flex-grow flex flex-col">
                <Textarea
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    className="flex-grow w-full h-full font-mono text-xs"
                    placeholder="Enter your HTML and CSS here..."
                />
            </TabsContent>
          </Tabs>

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
