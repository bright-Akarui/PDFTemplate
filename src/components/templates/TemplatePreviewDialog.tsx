
"use client"

import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { Template, Field } from "@/lib/types"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

interface TemplatePreviewDialogProps {
  template: Template
  children: React.ReactNode
}

const generatePreviewHtml = (templateHtml: string, formData: Record<string, any>, fields: Field[]): string => {
  let populatedHtml = templateHtml;

  // Handle simple value replacements first
  Object.entries(formData).forEach(([key, value]) => {
    if (typeof value !== 'object' || value === null) {
      const regex = new RegExp(`\\{\\{\\s*\\.${key}\\s*\\}\\}`, "g");
      populatedHtml = populatedHtml.replace(regex, String(value ?? ""));
    }
  });

  // Handle table/range replacements
  const rangeRegex = /\{\{range \.([^\}]+)\}\}([\s\S]*?)\{\{end\}\}/g;
  populatedHtml = populatedHtml.replace(rangeRegex, (match, arrayName, content) => {
      const items = formData[arrayName];
      if (!Array.isArray(items)) return '';

      return items.map(item => {
          let itemContent = content;
          Object.keys(item).forEach(key => {
              const itemRegex = new RegExp(`\\{\\{\\.${key}\\}\\}`, 'g');
              itemContent = itemContent.replace(itemRegex, item[key]);
          });
          return itemContent;
      }).join('');
  });

  // Inject a script to handle printing via postMessage
  const printScript = `
    <script>
      window.addEventListener('message', function(event) {
        if (event.data === 'print-template') {
          window.focus();
          window.print();
        }
      }, false);
    </script>
  `;
  
  // Add the script to the head or body of the HTML
  if (populatedHtml.includes('</body>')) {
    populatedHtml = populatedHtml.replace('</body>', printScript + '</body>');
  } else {
    populatedHtml += printScript;
  }


  return populatedHtml;
};


export function TemplatePreviewDialog({ template, children }: TemplatePreviewDialogProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewContent, setPreviewContent] = useState('');

  useEffect(() => {
    // Populate form data from sample values
    const newFormData: Record<string, any> = {};
    template.fields.forEach(field => {
        try {
            if (field.type === 'table') {
                newFormData[field.name] = JSON.parse(field.sampleValue || '[]');
            } else {
                newFormData[field.name] = field.sampleValue;
            }
        } catch (e) {
            console.error(`Error parsing sample value for ${field.name}:`, e);
            newFormData[field.name] = field.type === 'table' ? [] : '';
        }
    });
    setFormData(newFormData);
  }, [template.fields]);


  useEffect(() => {
    // Generate the final HTML for the preview
    if (!template.htmlContent) {
      setPreviewContent('');
      return;
    }
    
    setPreviewContent(generatePreviewHtml(template.htmlContent, formData, template.fields));

  }, [template.htmlContent, formData, template.fields]);


  const handleInputChange = (fieldName: string, value: string, type: string) => {
    setFormData((prev) => {
      if (type === 'table') {
        try {
          // Keep it as a valid JSON object while editing
          return { ...prev, [fieldName]: JSON.parse(value) };
        } catch {
          // If JSON is invalid during typing, we can't update the preview correctly.
          // You might want to show an error to the user.
          // For now, we'll just not update the state for invalid JSON.
          console.warn("Invalid JSON in table field:", fieldName);
          return prev;
        }
      }
      return { ...prev, [fieldName]: value };
    });
  };

  const handlePrint = () => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage('print-template', '*');
    }
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Preview: {template.name}</DialogTitle>
          <DialogDescription>
             Live preview of your code. Variables are replaced with sample data.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow min-h-0">
          <div className="md:col-span-1 bg-secondary/50 p-4 rounded-lg overflow-y-auto">
            <h3 className="font-semibold mb-4 text-primary">Dynamic Fields</h3>
            <div className="space-y-4">
              {template.fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.name} className="capitalize">
                    {field.name.replace(/([A-Z])/g, ' $1')}
                  </Label>
                  {field.type === 'table' ? (
                    <Textarea
                      id={field.name}
                      defaultValue={typeof formData[field.name] === 'object' ? JSON.stringify(formData[field.name], null, 2) : String(formData[field.name] || '')}
                      onBlur={(e) => handleInputChange(field.name, e.target.value, field.type)}
                      placeholder={field.sampleValue}
                      className="text-xs font-mono"
                      rows={5}
                    />
                  ) : (
                    <Input
                      id={field.name}
                      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                      value={formData[field.name] || ""}
                      onChange={(e) => handleInputChange(field.name, e.target.value, field.type)}
                      placeholder={field.sampleValue}
                    />
                  )}
                </div>
              ))}
              {template.fields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center">No dynamic fields.</p>
              )}
            </div>
          </div>
          <div className="md:col-span-2 border rounded-lg overflow-hidden bg-muted/60 flex items-center justify-center p-4">
             <div
              className="w-full h-full bg-gray-400 overflow-y-auto"
            >
              <iframe
                ref={iframeRef}
                srcDoc={previewContent}
                title="Template Preview"
                className="w-full h-full border-0 bg-white shadow-lg"
                sandbox="allow-scripts allow-modals"
              />
            </div>
          </div>
        </div>
         <DialogFooter className="mt-4">
            <Button onClick={handlePrint} variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
