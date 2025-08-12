
"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import type { FC } from "react";
import { useRouter } from "next/navigation";
import type { Template, TemplateElement, Field, CSSProperties } from "@/lib/types";
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
  initialData: Template;
  isNewTemplate: boolean;
}

const generateHtmlForTemplate = (template: Partial<Template>): string => {
    // If htmlContent already exists and we are not in visual editing mode, prefer it.
    if (template.htmlContent && !template.elements?.length) {
        return template.htmlContent;
    }

    if (!template.elements) return ""

    const elementsHtml = template.elements
      .map((el) => {
        const styleString = Object.entries(el.style)
          .map(([key, value]) => `${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}: ${value};`)
          .join(" ")
        
        const content = el.fieldId
          ? `{{.${template.fields?.find(f => f.id === el.fieldId)?.name || ''}}}`
          : el.content;

        if (el.type === 'image') {
          const src = el.fieldId ? `{{.${template.fields?.find(f => f.id === el.fieldId)?.name || ''}}}` : el.content;
          return `<img src="${src}" alt="${el.content}" style="${styleString}" data-id="${el.id}" data-type="image" data-field-id="${el.fieldId || ''}" />`
        }
        
        return `<div style="${styleString}" data-id="${el.id}" data-type="text" data-field-id="${el.fieldId || ''}">${content}</div>`
      })
      .join("\n")
    
    // Preserve range blocks if they exist in the original htmlContent
    const rangeRegex = /\{\{range \.([^\}]+)\}\}([\s\S]*?)\{\{end\}\}/g;
    const existingHtml = template.htmlContent || '';
    let rangeBlocks = '';
    let match;
    while ((match = rangeRegex.exec(existingHtml)) !== null) {
      rangeBlocks += match[0];
    }

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
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f2f2f2; }
      ul { padding-left: 20px; }
    </style>
  </head>
  <body>
    <div class="template-container">
      ${elementsHtml}
      ${rangeBlocks}
    </div>
  </body>
</html>
    `
  }
  
const parseHtmlToElements = (html: string, fields: Field[]): TemplateElement[] => {
  if (typeof window === 'undefined' || !html) return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const parsedElements: TemplateElement[] = [];

  // This will select only elements that are direct children of the container,
  // effectively ignoring anything inside a potential range block for visual editing.
  doc.querySelectorAll('.template-container > [data-id]').forEach(node => {
    const el = node as HTMLElement;
    const style: CSSProperties = {};
    for (let i = 0; i < el.style.length; i++) {
        const propName = el.style[i];
        const camelCaseName = propName.replace(/-([a-z])/g, g => g[1].toUpperCase());
        style[camelCaseName as keyof CSSProperties] = el.style.getPropertyValue(propName);
    }
    
    const fieldId = el.dataset.fieldId;
    let content = el.innerHTML;
    
    // For visual representation, we don't show the {{.FieldName}} syntax
    if (el.tagName.toLowerCase() === 'img') {
        content = (el as HTMLImageElement).alt;
    } else {
        content = el.innerHTML;
    }

    parsedElements.push({
      id: el.dataset.id || `el-${Date.now()}`,
      type: (el.dataset.type as 'text' | 'image') || 'text',
      content: content,
      style: style,
      fieldId: el.dataset.fieldId || undefined,
    });
  });

  return parsedElements;
};


const TemplateEditor: FC<TemplateEditorProps> = ({ initialData, isNewTemplate }) => {
  const router = useRouter();
  const { toast } = useToast();
  const { saveTemplate } = useTemplates();

  const [name, setName] = useState(initialData.name);
  const [fields, setFields] = useState<Field[]>(initialData.fields || []);
  const [elements, setElements] = useState<TemplateElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  const [htmlContent, setHtmlContent] = useState('');
  const [activeTab, setActiveTab] = useState("visual");
  const [isInitializing, setIsInitializing] = useState(true);
  
  useEffect(() => {
    setName(initialData.name);
    setFields(initialData.fields || []);
    
    const initialHtml = initialData.htmlContent || generateHtmlForTemplate({ ...initialData, fields: initialData.fields || [] });
    setHtmlContent(initialHtml);
    
    const initialElements = parseHtmlToElements(initialHtml, initialData.fields || []);
    setElements(initialElements);

    setIsInitializing(false);
  }, [initialData]);

  const handleTabChange = (value: string) => {
    if (isInitializing) return;
    
    if (activeTab === 'visual' && value === 'code') {
      // visual -> code
      const generatedHtml = generateHtmlForTemplate({ name, fields, elements, htmlContent });
      setHtmlContent(generatedHtml);
    } else if (activeTab === 'code' && value === 'visual') {
      // code -> visual
      const newElements = parseHtmlToElements(htmlContent, fields);
      setElements(newElements);
    }
    setActiveTab(value);
  }

  const selectedElement = useMemo(() => {
    return elements.find((el) => el.id === selectedElementId) || null;
  }, [elements, selectedElementId]);

  
  const getCurrentTemplateState = (): Omit<Template, 'createdAt' | 'updatedAt'> => {
    const isCodeEditing = activeTab === 'code';
    
    let finalElements: TemplateElement[];
    let generatedHtml: string;

    if (isCodeEditing) {
        generatedHtml = htmlContent;
        finalElements = parseHtmlToElements(htmlContent, fields);
    } else {
        finalElements = elements;
        generatedHtml = generateHtmlForTemplate({ name, fields, elements, htmlContent });
    }

    return {
      id: initialData.id,
      name,
      fields,
      elements: finalElements, 
      htmlContent: generatedHtml,
    }
  }

  const addElement = useCallback((type: 'text' | 'image', style: React.CSSProperties) => {
    const newElement: TemplateElement = {
      id: `el-${Date.now()}`,
      type,
      content: type === 'text' ? 'New Text' : 'https://placehold.co/100x50.png',
      style: {
        ...style,
        width: type === 'image' ? '100px' : 'auto',
        height: type === 'image' ? '50px' : 'auto',
        fontSize: '16px',
        color: '#000000'
      },
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

    if (isNewTemplate) {
        router.push(`/editor/${templateToSave.id}`);
    } else {
        router.push("/");
    }
    router.refresh();
  };
  
  return (
      <div className="flex h-screen w-full flex-col bg-muted/40">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 lg:px-6">
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

        <main className="grid flex-1 gap-4 overflow-hidden p-4 grid-cols-[320px_1fr_300px]">
          <div className="flex flex-col gap-4 overflow-y-auto rounded-lg border bg-background p-2">
            <EditorToolbar />
            <FieldsManager templateId={initialData.id} fields={fields} setFields={setFields} />
          </div>

          <div className="flex flex-col overflow-hidden bg-background rounded-lg border">
             <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-grow flex-col">
                <div className="flex justify-center p-2 border-b">
                    <TabsList>
                      <TabsTrigger value="visual">Visual Editor</TabsTrigger>
                      <TabsTrigger value="code">Code Editor</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="visual" className="flex-grow overflow-y-auto bg-muted/60">
                   <div className="flex-grow p-4 mx-auto w-full h-full flex items-start justify-center">
                      <EditorCanvas
                        elements={elements}
                        onDropElement={addElement}
                        onSelectElement={setSelectedElementId}
                        onUpdateElementStyle={updateElementStyle}
                        selectedElementId={selectedElementId}
                      />
                   </div>
                </TabsContent>
                 <TabsContent value="code" className="flex-grow flex flex-col p-2">
                  <Textarea
                      value={htmlContent}
                      onChange={(e) => setHtmlContent(e.target.value)}
                      className="flex-grow w-full h-full resize-none font-mono text-xs border-0 focus-visible:ring-0"
                      placeholder="Enter your HTML and CSS here..."
                  />
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="overflow-y-auto rounded-lg border bg-background p-2">
             <PropertiesPanel
                element={selectedElement}
                fields={fields}
                onUpdate={updateElement}
                onDelete={deleteElement}
              />
          </div>
        </main>
      </div>
  );
};

export default TemplateEditor;
