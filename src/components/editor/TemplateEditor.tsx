
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
import { cn } from "@/lib/utils";


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
        router.push(newPath);
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

        <main className={cn(
          "grid flex-1 gap-4 overflow-hidden p-4",
           "grid-cols-[380px_1fr]"
        )}>
          <div className="flex flex-col gap-4 overflow-y-auto rounded-lg border bg-background p-2">
            <FieldsManager templateId={initialData.id} fields={fields} setFields={setFields} />
          </div>

          <div className="flex flex-col overflow-hidden bg-background rounded-lg border p-2">
              <Textarea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  className="flex-grow w-full h-full resize-none font-mono text-xs border-0 focus-visible:ring-0"
                  placeholder="Enter your HTML and CSS here..."
              />
          </div>
        </main>
      </div>
  );
};

export default TemplateEditor;
