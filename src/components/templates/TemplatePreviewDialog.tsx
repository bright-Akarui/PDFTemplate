
"use client"

import { useState, useMemo, useEffect, useRef } from "react"
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
import type { Template } from "@/lib/types"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

interface TemplatePreviewDialogProps {
  template: Template
  children: React.ReactNode
}

export function TemplatePreviewDialog({ template, children }: TemplatePreviewDialogProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setFormData(template.fields.reduce((acc, field) => {
      if (field.type === 'table') {
        try {
          // Ensure sampleValue is a string before parsing
          const sample = typeof field.sampleValue === 'string' ? field.sampleValue : '[]';
          acc[field.name] = JSON.parse(sample);
        } catch {
          acc[field.name] = [];
        }
      } else {
         acc[field.name] = field.sampleValue;
      }
      return acc
    }, {} as Record<string, any>));
  }, [template.fields]);

  const handleInputChange = (fieldName: string, value: string, type: string) => {
    setFormData((prev) => {
      if (type === 'table') {
        try {
          return { ...prev, [fieldName]: JSON.parse(value) };
        } catch {
          // If parsing fails, keep the raw string value to allow user to fix it.
          // This is useful for letting the user correct syntax errors in the textarea.
          return { ...prev, [fieldName]: value };
        }
      }
      return { ...prev, [fieldName]: value };
    });
  };

  const finalHtml = useMemo(() => {
    let populatedHtml = template.htmlContent || '';
    
    // Handle {{range .Items}} blocks first
    const rangeRegex = /\{\{range \.([^\}]+)\}\}([\s\S]*?)\{\{end\}\}/g;
    populatedHtml = populatedHtml.replace(rangeRegex, (match, arrayName, content) => {
        const items = formData[arrayName.trim()] as any[];
        if (!Array.isArray(items)) {
          console.warn(`Template Warning: Field "${arrayName.trim()}" is not an array for range.`);
          return ''; // Return empty string if data is not an array
        }

        return items.map(item => {
            let itemContent = content;
            // Replace item properties like {{.Name}}, {{.Qty}}
            Object.keys(item).forEach(key => {
                const itemRegex = new RegExp(`\\{\\{\\.${key}\\}\\}`, 'g');
                itemContent = itemContent.replace(itemRegex, item[key]);
            });
            return itemContent;
        }).join('');
    });


    // Handle simple {{.field}} replacements for non-object values
    Object.entries(formData).forEach(([key, value]) => {
      if (typeof value !== 'object' || value === null) {
        const regex = new RegExp(`\\{\\{\\s*\\.${key}\\s*\\}\\}`, "g");
        populatedHtml = populatedHtml.replace(regex, String(value ?? ""));
      }
    });

    return populatedHtml;
  }, [template.htmlContent, formData]);

  const handlePrint = () => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus(); // Required for some browsers
      iframe.contentWindow.print();
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Preview: {template.name}</DialogTitle>
          <DialogDescription>
            Fill in the sample data to see a live preview of your template.
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
                      value={typeof formData[field.name] === 'object' ? JSON.stringify(formData[field.name], null, 2) : String(formData[field.name] || '')}
                      onChange={(e) => handleInputChange(field.name, e.target.value, field.type)}
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
              className="w-full h-full"
              style={{
                aspectRatio: '210 / 297',
              }}
            >
              <iframe
                ref={iframeRef}
                srcDoc={finalHtml}
                title="Template Preview"
                className="w-full h-full border-0 bg-white shadow-lg"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  transform: 'scale(1)',
                  transformOrigin: 'center center'
                }}
                sandbox="allow-same-origin allow-scripts"
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
