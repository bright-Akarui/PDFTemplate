
"use client";

import { useState, useCallback, useEffect } from "react";
import type { FC } from "react";
import { useRouter } from "next/navigation";
import type { Template, Field } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, Save } from "lucide-react";
import FieldsManager from "./FieldsManager";
import { TemplatePreviewDialog } from "@/components/templates/TemplatePreviewDialog";
import { Textarea } from "@/components/ui/textarea";
import { useTemplates } from "@/hooks/use-templates";

const TemplateEditor: FC<{ initialData: Template; isNewTemplate: boolean; }> = ({ initialData, isNewTemplate }) => {
  const router = useRouter();
  const { toast } = useToast();
  const { saveTemplate } = useTemplates();

  const [name, setName] = useState(initialData.name);
  const [fields, setFields] = useState<Field[]>(initialData.fields || []);
  const [htmlContent, setHtmlContent] = useState(initialData.htmlContent || '');
  
  useEffect(() => {
    setName(initialData.name);
    setFields(initialData.fields || []);
    setHtmlContent(initialData.htmlContent || '');
  }, [initialData]);
  
  const getCurrentTemplateState = (): Omit<Template, 'createdAt' | 'updatedAt'> => {
    return {
      id: initialData.id,
      name,
      fields,
      htmlContent: htmlContent,
    }
  }

  const handleSave = () => {
    const templateToSave = getCurrentTemplateState();
    
    saveTemplate(templateToSave);
    
    toast({
      title: "Template Saved!",
      description: `Template "${templateToSave.name}" has been successfully saved.`,
      variant: "default",
    });

    if (isNewTemplate) {
        const newPath = `/editor/${templateToSave.id}`;
        router.replace(newPath);
    } else {
        router.refresh();
    }
  };
  
  return (
      <div className="flex flex-col h-screen">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 lg:px-6">
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.push('/')}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="w-40 md:w-64 text-lg font-semibold"
            />
          </div>
          <div className="flex items-center gap-2">
            <TemplatePreviewDialog template={getCurrentTemplateState() as Template}>
              <Button variant="outline" size="sm">
                <Eye className="mr-0 md:mr-2 h-4 w-4" /> <span className="hidden md:inline">Preview</span>
              </Button>
            </TemplatePreviewDialog>
            <Button onClick={handleSave} size="sm">
              <Save className="mr-0 md:mr-2 h-4 w-4" /> <span className="hidden md:inline">Save Template</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 grid grid-rows-2 lg:grid-rows-1 lg:grid-cols-4 gap-4 overflow-hidden">
          {/* Code Editor */}
          <div className="row-span-1 lg:col-span-3 bg-background rounded-lg border flex flex-col min-h-0">
            <Textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              className="flex-1 w-full resize-none font-mono text-sm border-0 focus-visible:ring-0 p-4"
              placeholder="Enter your HTML and CSS here..."
            />
          </div>

          {/* Fields Manager */}
          <div className="row-span-1 lg:col-span-1 min-h-0">
            <div className="overflow-y-auto rounded-lg border bg-background h-full">
              <FieldsManager templateId={initialData.id} fields={fields} setFields={setFields} />
            </div>
          </div>
        </main>
      </div>
  );
};

export default TemplateEditor;
