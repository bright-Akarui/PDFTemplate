
"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import type { FC } from "react";
import { useRouter } from "next/navigation";
import type { Template, TemplateElement, Field, CSSProperties } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, Save, Settings } from "lucide-react";
import EditorToolbar from "./EditorToolbar";
import FieldsManager from "./FieldsManager";
import EditorCanvas from "./EditorCanvas";
import PropertiesPanel from "./PropertiesPanel";
import { TemplatePreviewDialog } from "@/components/templates/TemplatePreviewDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useTemplates } from "@/hooks/use-templates";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const PageStyling: FC<{
  style: CSSProperties;
  setStyle: (style: CSSProperties) => void;
}> = ({ style, setStyle }) => {
  
  const handleStyleChange = (prop: keyof React.CSSProperties, value: string) => {
    setStyle({ ...style, [prop]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Page Styling</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Label className="font-semibold">Container Border</Label>
        <div className="grid grid-cols-3 gap-2">
            <Input 
              type="number"
              value={parseInt(style.borderWidth as string) || 0}
              onChange={e => handleStyleChange('borderWidth', `${e.target.value}px`)}
              placeholder="Width (px)"
              aria-label="Border Width"
          />
            <Select onValueChange={(value) => handleStyleChange('borderStyle', value)} defaultValue={style.borderStyle || 'none'}>
              <SelectTrigger aria-label="Border Style"><SelectValue /></SelectTrigger>
              <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="dashed">Dashed</SelectItem>
                  <SelectItem value="dotted">Dotted</SelectItem>
              </SelectContent>
          </Select>
            <Input 
              type="text"
              value={style.borderColor as string || '#000000'}
              onChange={e => handleStyleChange('borderColor', e.target.value)}
              placeholder="Color"
              aria-label="Border Color"
          />
        </div>
      </CardContent>
    </Card>
  )
}


const generateHtmlForTemplate = (template: Partial<Template>): string => {
    if (template.htmlContent && !template.elements?.length && !template.containerStyle) {
        return template.htmlContent;
    }

    if (!template.elements) return "";

    const elementsHtml = template.elements
      .map((el) => {
        const styleString = Object.entries(el.style)
          .map(([key, value]) => `${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}: ${value};`)
          .join(" ");
        
        const dataAttrs = `data-id="${el.id}" data-type="${el.type}" data-field-id="${el.fieldId || ''}"`;

        if (el.type === 'text') {
            const content = el.fieldId ? `{{.${template.fields?.find(f => f.id === el.fieldId)?.name || ''}}}` : el.content;
            return `<div style="${styleString}" ${dataAttrs}>${content}</div>`;
        }

        if (el.type === 'image') {
          const src = el.fieldId ? `{{.${template.fields?.find(f => f.id === el.fieldId)?.name || ''}}}` : el.content;
          return `<img src="${src}" alt="${el.content}" style="${styleString}" ${dataAttrs} />`;
        }

        if (el.type === 'table' && el.fieldId) {
            const field = template.fields?.find(f => f.id === el.fieldId);
            if (!field || field.type !== 'table' || !field.itemSchema) return '';

            const headers = field.itemSchema.map(col => `<th>${col.name}</th>`).join('');
            const cells = field.itemSchema.map(col => `<td>{{.${col.name}}}</td>`).join('');
            
            const tableHtml = `<table style="${styleString}" ${dataAttrs}>
                <thead><tr>${headers}</tr></thead>
                <tbody>{{range .${field.name}}}<tr>${cells}</tr>{{end}}</tbody>
              </table>`;
            
            return tableHtml;
        }

        return '';
      })
      .join("\n");
    
    const containerStyleString = template.containerStyle ? Object.entries(template.containerStyle)
      .map(([key, value]) => `${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}: ${value};`)
      .join(" ") : '';

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
        box-sizing: border-box; /* Important for border */
      }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f2f2f2; }
    </style>
  </head>
  <body>
    <div class="template-container" style="${containerStyleString}">
      ${elementsHtml}
    </div>
  </body>
</html>`;
}
  
const parseHtmlToElements = (html: string, fields: Field[]): { elements: TemplateElement[], containerStyle: CSSProperties } => {
  if (typeof window === 'undefined' || !html) return { elements: [], containerStyle: {} };
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const parsedElements: TemplateElement[] = [];

  doc.querySelectorAll('.template-container > [data-id]').forEach(node => {
    const el = node as HTMLElement;
    const style: CSSProperties = {};
    for (let i = 0; i < el.style.length; i++) {
        const propName = el.style[i];
        const camelCaseName = propName.replace(/-([a-z])/g, g => g[1].toUpperCase());
        style[camelCaseName as keyof CSSProperties] = el.style.getPropertyValue(propName);
    }
    
    let content = '';
    const type = (el.dataset.type as 'text' | 'image' | 'table') || 'text';

    if (type === 'text') {
        content = el.innerHTML;
    } else if (type === 'image') {
        content = (el as HTMLImageElement).alt;
    }

    parsedElements.push({
      id: el.dataset.id || `el-${Date.now()}`,
      type: type,
      content: content,
      style: style,
      fieldId: el.dataset.fieldId || undefined,
    });
  });

  const containerEl = doc.querySelector('.template-container') as HTMLElement;
  const containerStyle: CSSProperties = {};
  if (containerEl) {
     for (let i = 0; i < containerEl.style.length; i++) {
        const propName = containerEl.style[i];
        const camelCaseName = propName.replace(/-([a-z])/g, g => g[1].toUpperCase());
        containerStyle[camelCaseName as keyof CSSProperties] = containerEl.style.getPropertyValue(propName);
    }
  }


  return { elements: parsedElements, containerStyle };
};


const TemplateEditor: FC<{ initialData: Template; isNewTemplate: boolean; }> = ({ initialData, isNewTemplate }) => {
  const router = useRouter();
  const { toast } = useToast();
  const { saveTemplate } = useTemplates();

  const [name, setName] = useState(initialData.name);
  const [fields, setFields] = useState<Field[]>(initialData.fields || []);
  const [elements, setElements] = useState<TemplateElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  const [containerStyle, setContainerStyle] = useState<CSSProperties>(initialData.containerStyle || {});
  const [htmlContent, setHtmlContent] = useState('');
  const [activeTab, setActiveTab] = useState("visual");
  const [isInitializing, setIsInitializing] = useState(true);
  
  useEffect(() => {
    setName(initialData.name);
    const initialFields = initialData.fields || [];
    setFields(initialFields);
    
    const initialHtml = initialData.htmlContent || generateHtmlForTemplate({ ...initialData, fields: initialFields });
    setHtmlContent(initialHtml);
    
    const { elements: initialElements, containerStyle: initialContainerStyle } = parseHtmlToElements(initialHtml, initialFields);
    setElements(initialElements);
    setContainerStyle(initialContainerStyle);

    setIsInitializing(false);
  }, [initialData]);

  const handleTabChange = (value: string) => {
    if (isInitializing) return;
    
    if (activeTab === 'visual' && value === 'code') {
      const currentTemplateState = { name, fields, elements, htmlContent: '', containerStyle };
      const generatedHtml = generateHtmlForTemplate(currentTemplateState);
      setHtmlContent(generatedHtml);
    } else if (activeTab === 'code' && value === 'visual') {
      const { elements: newElements, containerStyle: newContainerStyle } = parseHtmlToElements(htmlContent, fields);
      setElements(newElements);
      setContainerStyle(newContainerStyle);
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
    let finalContainerStyle: CSSProperties;

    if (isCodeEditing) {
        generatedHtml = htmlContent;
        const parsed = parseHtmlToElements(htmlContent, fields);
        finalElements = parsed.elements;
        finalContainerStyle = parsed.containerStyle;
    } else {
        finalElements = elements;
        finalContainerStyle = containerStyle;
        const stateForHtmlGen = { name, fields, elements, htmlContent: '', containerStyle };
        generatedHtml = generateHtmlForTemplate(stateForHtmlGen);
    }

    return {
      id: initialData.id,
      name,
      fields,
      elements: finalElements, 
      htmlContent: generatedHtml,
      containerStyle: finalContainerStyle
    }
  }

  const addElement = useCallback((type: 'text' | 'image' | 'table', style: React.CSSProperties) => {
    const newElement: TemplateElement = {
      id: `el-${Date.now()}`,
      type,
      content: type === 'text' ? 'New Text' : type === 'image' ? 'https://placehold.co/100x50.png' : '',
      style: {
        ...style,
        fontSize: '16px',
        color: '#000000',
        ...(type === 'image' && { width: '100px', height: '50px' }),
        ...(type === 'table' && { width: '100%', height: 'auto' }),
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
            <PageStyling style={containerStyle} setStyle={setContainerStyle} />
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
                        fields={fields}
                        containerStyle={containerStyle}
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
