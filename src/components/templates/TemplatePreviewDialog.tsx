
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

interface TemplatePreviewDialogProps {
    template: Template;
    children: React.ReactNode;
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
          // Add a small delay to ensure focus is acquired, especially in Firefox
          setTimeout(() => {
            try {
              window.focus();
              window.print();
            } catch(e) {
              console.error("Print failed:", e);
              // You could post a message back to the parent if you want to show an error
            }
          }, 50);
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
  const [currentHtml, setCurrentHtml] = useState(''); // State to hold the fetched raw HTML
  const [previewContent, setPreviewContent] = useState('Loading preview...');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Effect to fetch full HTML content when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      // API returns a path like "templates/id/template.html"
      // Check if htmlContent is a path or actual content
      if (template.htmlContent && template.htmlContent.startsWith('templates/')) {
        setPreviewContent('Loading preview...'); // Reset while fetching
        fetch(`${API_BASE_URL}/${template.htmlContent}`)
          .then(res => {
            if (!res.ok) throw new Error('Could not load template content');
            return res.text();
          })
          .then(html => {
            setCurrentHtml(html); // Store the raw HTML
          })
          .catch(err => {
            console.error(err);
            setCurrentHtml('<p>Error loading preview.</p>');
          });
      } else {
         // It's already full content (e.g., from editor unsaved state)
         setCurrentHtml(template.htmlContent);
      }
    }
  }, [isDialogOpen, template.htmlContent]);


  useEffect(() => {
    // Populate form data from sample values when the template changes
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


  // Re-generate HTML when form data or the raw HTML changes
  useEffect(() => {
    if (currentHtml) {
        setPreviewContent(generatePreviewHtml(currentHtml, formData, template.fields));
    }
  }, [formData, currentHtml, template.fields]);


  const handleInputChange = (fieldName: string, value: string, type: string) => {
    setFormData((prev) => {
      let newValue: any = value;
      if (type === 'table') {
        try {
          // Keep it as a valid JSON object while editing
          newValue = JSON.parse(value);
        } catch {
          // If JSON is invalid, don't update the state to avoid breaking the preview
          console.warn("Invalid JSON in table field:", fieldName);
          return prev; 
        }
      }
      return { ...prev, [fieldName]: newValue };
    });
  };

  const handlePrint = () => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage('print-template', '*');
    }
  };
  
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                <div key={field.id || field.name} className="space-y-2">
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
                sandbox="allow-scripts allow-modals allow-same-origin"
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
