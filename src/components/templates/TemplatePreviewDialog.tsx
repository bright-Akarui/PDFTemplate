"use client"

import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { Template } from "@/lib/types"
import { Textarea } from "@/components/ui/textarea"

interface TemplatePreviewDialogProps {
  template: Template
  children: React.ReactNode
}

export function TemplatePreviewDialog({ template, children }: TemplatePreviewDialogProps) {
  const [formData, setFormData] = useState<Record<string, any>>(() =>
    template.fields.reduce((acc, field) => {
      if (field.type === 'table') {
        try {
          acc[field.name] = JSON.parse(field.sampleValue || '[]');
        } catch {
          acc[field.name] = [];
        }
      } else {
         acc[field.name] = field.sampleValue;
      }
      return acc
    }, {} as Record<string, any>)
  );

  const handleInputChange = (fieldName: string, value: string, type: string) => {
    setFormData((prev) => {
      if (type === 'table') {
        try {
          return { ...prev, [fieldName]: JSON.parse(value) };
        } catch {
          return { ...prev, [fieldName]: [] };
        }
      }
      return { ...prev, [fieldName]: value };
    });
  };

  const generatedHtmlForSave = useMemo(() => {
    if (template.htmlContent) {
      return template.htmlContent;
    }
    
    if (!template.elements) return ""

    const elementsHtml = template.elements
      .map((el) => {
        const styleString = Object.entries(el.style)
          .map(([key, value]) => `${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}: ${value};`)
          .join(" ")
        
        const content = el.fieldId
          ? `{{${template.fields.find(f => f.id === el.fieldId)?.name || ''}}}`
          : el.content;

        if (el.type === 'image') {
          const src = el.fieldId ? `{{${template.fields.find(f => f.id === el.fieldId)?.name || ''}}}` : el.content;
          return `<img src="${src}" alt="${el.content}" style="${styleString}" />`
        }
        
        return `<div style="${styleString}">${content}</div>`
      })
      .join("\n")

    return `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; margin: 0; }
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
  }, [template])


  const finalHtml = useMemo(() => {
    let populatedHtml = generatedHtmlForSave;
    
    // Handle {{range}} blocks first
    const rangeRegex = /\{\{range \.([^\}]+)\}\}([\s\S]*?)\{\{end\}\}/g;
    populatedHtml = populatedHtml.replace(rangeRegex, (match, arrayName, content) => {
        const items = formData[arrayName.trim()] as any[];
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


    // Handle simple {{.field}} replacements
    Object.entries(formData).forEach(([key, value]) => {
      if (typeof value !== 'object') {
        const regex = new RegExp(`\\{\\{\\s*\\.${key}\\s*\\}\\}`, "g");
        populatedHtml = populatedHtml.replace(regex, String(value) || "");
      }
    });

    return populatedHtml;
  }, [generatedHtmlForSave, formData]);

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
                      value={typeof formData[field.name] === 'object' ? JSON.stringify(formData[field.name], null, 2) : String(formData[field.name])}
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
      </DialogContent>
    </Dialog>
  )
}
