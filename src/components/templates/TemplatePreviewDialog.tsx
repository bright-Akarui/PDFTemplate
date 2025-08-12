
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
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { Template } from "@/lib/types"

interface TemplatePreviewDialogProps {
  template: Template
  children: React.ReactNode
}

export function TemplatePreviewDialog({ template, children }: TemplatePreviewDialogProps) {
  const [formData, setFormData] = useState<Record<string, string>>(() =>
    template.fields.reduce((acc, field) => {
      acc[field.name] = field.sampleValue
      return acc
    }, {} as Record<string, string>)
  )

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }))
  }

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
    Object.entries(formData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g")
      populatedHtml = populatedHtml.replace(regex, value || `{{${key}}}`)
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
                  <Input
                    id={field.name}
                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder={field.sampleValue}
                  />
                </div>
              ))}
              {template.fields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center">No dynamic fields.</p>
              )}
            </div>
          </div>
          <div className="md:col-span-2 border rounded-lg overflow-hidden bg-muted/60 flex items-center justify-center p-4">
             <div
              className="bg-white shadow-lg"
              style={{
                width: '794px',
                height: '1123px',
                transform: 'scale(0.5)',
                transformOrigin: 'top center',
              }}
            >
              <iframe
                srcDoc={finalHtml}
                title="Template Preview"
                className="w-full h-full border-0"
                sandbox="allow-same-origin allow-scripts"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
