
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
import type { Template, Field } from "@/lib/types"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

interface TemplatePreviewDialogProps {
  template: Template
  children: React.ReactNode
}

const ITEMS_PER_PAGE = 15; // Adjust as needed for A4 layout

const generatePagedHtml = (templateHtml: string, formData: Record<string, any>, fields: Field[]): string => {
  // Check if this is a designer template by looking for a template container
  const isDesignerTemplate = /<div class="template-container"/.test(templateHtml);

  // If it's NOT a designer template, it's a code-only template.
  // Just replace variables and return. Do not attempt pagination.
  if (!isDesignerTemplate) {
    let populatedHtml = templateHtml;
    Object.entries(formData).forEach(([key, value]) => {
      if (typeof value !== 'object' || value === null) {
        const regex = new RegExp(`\\{\\{\\s*\\.${key}\\s*\\}\\}`, "g");
        populatedHtml = populatedHtml.replace(regex, String(value ?? ""));
      }
    });
    // For code-only templates, we assume any {{range}} blocks are handled by the user's own logic if any.
    return populatedHtml;
  }
  
  // The rest of the logic is for designer templates with pagination.
  const parser = new DOMParser();
  const doc = parser.parseFromString(templateHtml, 'text/html');
  const body = doc.body;

  const tableField = fields.find(f => f.type === 'table');
  const rangeRegex = /\{\{range \.([^\}]+)\}\}([\s\S]*?)\{\{end\}\}/g;
  
  let pagedHtml = '';
  
  // Find the table and its template row
  const tableMatch = templateHtml.match(rangeRegex);
  
  if (!tableField || !tableMatch) {
    // No table field or range block, just do simple replacement
    let populatedHtml = templateHtml;
    Object.entries(formData).forEach(([key, value]) => {
      if (typeof value !== 'object' || value === null) {
        const regex = new RegExp(`\\{\\{\\s*\\.${key}\\s*\\}\\}`, "g");
        populatedHtml = populatedHtml.replace(regex, String(value ?? ""));
      }
    });
    return populatedHtml;
  }
  
  const arrayName = tableField.name;
  const items = formData[arrayName] as any[];

  if (!Array.isArray(items) || items.length === 0) {
     // Clear the range block if no items
    const finalHtml = templateHtml.replace(rangeRegex, '');
    return finalHtml;
  }
  
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);

  for (let page = 1; page <= totalPages; page++) {
    const pageItems = items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    
    // Clone the original body for each page
    const pageBody = body.cloneNode(true) as HTMLElement;

    // Simple placeholder replacement for non-table fields
    let pageHtml = pageBody.innerHTML;
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== arrayName) {
        const regex = new RegExp(`\\{\\{\\s*\\.${key}\\s*\\}\\}`, "g");
        pageHtml = pageHtml.replace(regex, String(value ?? ""));
      }
    });

    // Replace table content
    pageHtml = pageHtml.replace(rangeRegex, (match, _, content) => {
        return pageItems.map(item => {
            let itemContent = content;
            Object.keys(item).forEach(key => {
                const itemRegex = new RegExp(`\\{\\{\\.${key}\\}\\}`, 'g');
                itemContent = itemContent.replace(itemRegex, item[key]);
            });
            return itemContent;
        }).join('');
    });

    // Wrap in A4 page container
    pagedHtml += `<div class="page">${pageHtml}</div>`;
  }
  
  // Reconstruct the full HTML document with styles and paged body
  const finalDoc = `
    <html>
      <head>
        ${doc.head.innerHTML}
        <style>
            @media print {
              body { margin: 0; }
              .page { 
                page-break-after: always; 
                page-break-inside: avoid;
              }
            }
            .page {
                width: 210mm;
                min-height: 297mm;
                background: white;
                margin: 20px auto;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                box-sizing: border-box;
                position: relative;
            }
        </style>
      </head>
      <body>${pagedHtml}</body>
    </html>
  `;
  
  return finalDoc;
};


export function TemplatePreviewDialog({ template, children }: TemplatePreviewDialogProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewContent, setPreviewContent] = useState('');

  // Determine if it's a pure code template (no visual elements defined)
  const isCodeOnlyTemplate = !template.elements || template.elements.length === 0;

  useEffect(() => {
    // Populate form data from sample values
    setFormData(template.fields.reduce((acc, field) => {
      if (field.type === 'table') {
        try {
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


  useEffect(() => {
    // Generate the final HTML for the preview
    if (!template.htmlContent) {
      setPreviewContent('');
      return;
    }
    
    if (isCodeOnlyTemplate) {
      // For code-only templates, simply replace variables and render the content.
      // This allows free-form HTML/CSS/JS to work as intended.
      let content = template.htmlContent;
      Object.entries(formData).forEach(([key, value]) => {
        if (typeof value !== 'object' && !Array.isArray(value)) {
          const regex = new RegExp(`\\{\\{\\s*\\.${key}\\s*\\}\\}`, "g");
          content = content.replace(regex, String(value ?? ''));
        }
      });
      // A simple way to represent table data for code-only templates is to make it available as a JSON string
      const tableField = template.fields.find(f => f.type === 'table');
      if (tableField && formData[tableField.name]) {
         const regex = new RegExp(`\\{\\{\\s*\\.${tableField.name}\\s*\\}\\}`, "g");
         content = content.replace(regex, JSON.stringify(formData[tableField.name]));
      }

      setPreviewContent(content);

    } else {
      // For designer templates, use the pagination logic.
      setPreviewContent(generatePagedHtml(template.htmlContent, formData, template.fields));
    }
  }, [template.htmlContent, formData, template.fields, isCodeOnlyTemplate]);


  const handleInputChange = (fieldName: string, value: string, type: string) => {
    setFormData((prev) => {
      if (type === 'table') {
        try {
          return { ...prev, [fieldName]: JSON.parse(value) };
        } catch {
          // If JSON is invalid during typing, keep it as a string
          return { ...prev, [fieldName]: value };
        }
      }
      return { ...prev, [fieldName]: value };
    });
  };

  const handlePrint = () => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus(); 
      iframe.contentWindow.print();
    }
  };

  const iframeSrcDoc = isCodeOnlyTemplate ? previewContent : `<!DOCTYPE html><html><head><style>body{margin:0;}</style></head><body>${previewContent}</body></html>`
  const iframeSandboxOptions = isCodeOnlyTemplate 
      ? "allow-scripts allow-same-origin allow-modals" 
      : "allow-same-origin allow-modals";


  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Preview: {template.name}</DialogTitle>
          <DialogDescription>
            {isCodeOnlyTemplate 
              ? "Live preview of your code. Variables are replaced with sample data."
              : "Fill in the sample data to see a live preview of your template. Pagination is applied automatically."
            }
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
              className="w-full h-full bg-gray-400 overflow-y-auto"
            >
              <iframe
                ref={iframeRef}
                srcDoc={previewContent}
                title="Template Preview"
                className="w-full h-full border-0 bg-white shadow-lg"
                style={{
                  transform: 'scale(0.9)', 
                  transformOrigin: 'top center'
                }}
                sandbox={iframeSandboxOptions}
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
