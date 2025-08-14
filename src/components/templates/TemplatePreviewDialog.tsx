
"use client"

import { useState, useEffect, useRef, ReactNode } from "react"
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
  template: Template;
  children: ReactNode;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

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
      let items;
      try {
        // The form data for an array field will be a string, so we must parse it.
        const rawValue = formData[arrayName];
        items = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
      } catch {
        // If parsing fails, default to an empty array so the preview doesn't break.
        items = [];
      }
      
      if (!Array.isArray(items)) return '';

      return items.map(item => {
          let itemContent = content;
          // Replace placeholders within the loop content (e.g., {{.Name}})
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
        // Cache-busting: Append updatedAt timestamp to the URL
        const cacheBustingUrl = `${API_BASE_URL}/${template.htmlContent}?v=${new Date(template.updatedAt).getTime()}`;
        fetch(cacheBustingUrl)
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
  }, [isDialogOpen, template.htmlContent, template.updatedAt]);


  useEffect(() => {
    // Populate form data from sample values when the template changes
    const newFormData: Record<string, any> = {};
    template.fields.forEach(field => {
        newFormData[field.name] = field.sampleValue;
    });
    setFormData(newFormData);
  }, [template.fields]);


  // Re-generate HTML when form data or the raw HTML changes
  useEffect(() => {
    if (currentHtml) {
        setPreviewContent(generatePreviewHtml(currentHtml, formData, template.fields));
    }
  }, [formData, currentHtml, template.fields]);


  const handleInputChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handlePrint = () => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage('print-template', '*');
    }
  };
  
  const isLikelyJson = (value: string) => {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    return (trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'));
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
                   <Textarea
                      id={field.name}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      placeholder={field.sampleValue}
                      className="text-xs font-mono"
                      rows={isLikelyJson(formData[field.name] || '') ? 5 : 2}
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
