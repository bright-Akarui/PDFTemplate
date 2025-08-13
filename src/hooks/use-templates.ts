
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Template } from '@/lib/types';
import { useRouter } from 'next/navigation';

const MOCK_TEMPLATES: Template[] = [
  {
    id: "1",
    name: "Standard Invoice",
    htmlContent: `<html>
  <head>
    <style>
      body { font-family: sans-serif; }
      .page { width: 210mm; min-height: 297mm; background: white; margin: 20px auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); box-sizing: border-box; padding: 40px; }
      h1 { color: #333; }
      .meta-info { margin-bottom: 30px; }
      .meta-info p { margin: 0; }
    </style>
  </head>
  <body>
    <div class="page">
      <h1>Invoice for {{.customerName}}</h1>
      <div class="meta-info">
        <p><strong>Invoice #:</strong> {{.invoiceNumber}}</p>
        <p><strong>Date:</strong> {{.invoiceDate}}</p>
      </div>
      <p>Details about the service rendered...</p>
      <p style="text-align: right; font-size: 24px; font-weight: bold; margin-top: 50px;">
        Total: {{.totalAmount}}
      </p>
    </div>
  </body>
</html>`,
    fields: [
      { id: "f1", name: "customerName", type: "text", sampleValue: "John Doe" },
      { id: "f2", name: "invoiceNumber", type: "text", sampleValue: "INV-2024-001" },
      { id: "f3", name: "invoiceDate", type: "date", sampleValue: "2024-05-22" },
      { id: "f4", name: "totalAmount", type: "number", sampleValue: "1500.00" },
    ],
    createdAt: "2024-05-20T10:00:00Z",
    updatedAt: "2024-05-21T14:30:00Z",
  },
  {
    id: "2",
    name: "Quotation With Items",
    htmlContent: `<html>
  <head>
    <style>
      body { font-family: sans-serif; }
      .page { width: 210mm; min-height: 297mm; background: white; margin: 20px auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); box-sizing: border-box; padding: 40px; }
      h1, p { margin: 0 0 10px 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f2f2f2; }
    </style>
  </head>
  <body>
    <div class="page">
      <h1>Quotation</h1>
      <p><strong>For:</strong> {{.clientName}}</p>
      <p><strong>Quote #:</strong> {{.quoteId}}</p>
      
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {{range .Items}}
          <tr>
            <td>{{.Name}}</td>
            <td>{{.Qty}}</td>
            <td>{{.Price}}</td>
            <td>{{.Total}}</td>
          </tr>
          {{end}}
        </tbody>
      </table>

       <p style="text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px;">
        Grand Total: {{.grandTotal}}
      </p>
    </div>
  </body>
</html>`,
    fields: [
      { id: "f1", name: "clientName", type: "text", sampleValue: "Jane Smith" },
      { id: "f2", name: "quoteId", type: "text", sampleValue: "Q-07-334" },
      {
        id: "f4",
        name: "Items",
        type: "table",
        sampleValue: '[{"Name":"Web Design","Qty":1,"Price":"1200","Total":"1200"},{"Name":"Hosting (1 year)","Qty":1,"Price":"100","Total":"100"}]',
      },
      { id: "f5", name: "grandTotal", type: "text", sampleValue: "1300.00" },
    ],
    createdAt: "2024-05-18T09:00:00Z",
    updatedAt: "2024-05-18T09:00:00Z",
  },
];

const STORAGE_KEY = 'templateflow_templates';

export const useTemplates = () => {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let storedItems: string | null = null;
    try {
      storedItems = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to access localStorage", error);
    }
    
    if (storedItems) {
      setTemplates(JSON.parse(storedItems));
    } else {
      setTemplates(MOCK_TEMPLATES);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_TEMPLATES));
      } catch (error) {
        console.error("Failed to save initial templates to localStorage", error);
      }
    }
    setIsLoaded(true);
  }, []);

  const saveTemplatesToStorage = (templatesToSave: Template[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templatesToSave));
    } catch (error) {
      console.error("Failed to save templates to localStorage", error);
    }
  };
  
  const getTemplate = useCallback((id: string): Template | null => {
    return templates.find(t => t.id === id) || null;
  }, [templates]);

  const saveTemplate = async (templateData: Omit<Template, 'createdAt' | 'updatedAt'>, isNewTemplate: boolean) => {
    if (isNewTemplate) {
        const formData = new FormData();
        formData.append('name', templateData.name);
        
        // Convert fields to the expected format string.
        const apiFields = templateData.fields.map(f => ({ name: f.name, type: f.type, sampleValue: f.sampleValue }));
        formData.append('fields', JSON.stringify(apiFields));
        
        const htmlBlob = new Blob([templateData.htmlContent || ''], { type: 'text/html' });
        formData.append('htmlFile', htmlBlob, 'template.html');

        try {
            const response = await fetch('http://localhost:8080/api/v1/templates', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'API call failed');
            }
            
            // On successful API call, we don't need to update local state or localStorage
            // The user will be redirected and data should be re-fetched.
            // But we might want to clear local storage if it's out of sync
            router.push('/');
            return; // Exit function after API call for new template

        } catch (error) {
            console.error('Failed to create template via API:', error);
            // Optionally, show an error to the user
            throw error; // re-throw to be caught by the component
        }
    }
    
    // ----- Logic for updating existing templates (keeps using localStorage) -----
    const now = new Date().toISOString();
    const existingIndex = templates.findIndex(t => t.id === templateData.id);

    let newTemplates: Template[];

    if (existingIndex > -1) {
      // Update existing
      newTemplates = templates.map((t, index) => {
        if (index === existingIndex) {
          return { ...templates[existingIndex], ...templateData, updatedAt: now };
        }
        return t;
      });
    } else {
        // This part should ideally not be reached if new templates are handled by API
        // But as a fallback, we'll add it to local state.
      const newTemplate: Template = {
        ...templateData,
        createdAt: now,
        updatedAt: now,
      };
      newTemplates = [...templates, newTemplate];
    }
    
    setTemplates(newTemplates);
    saveTemplatesToStorage(newTemplates);
  };

  const deleteTemplate = (id: string) => {
    const newTemplates = templates.filter(t => t.id !== id);
    setTemplates(newTemplates);
    saveTemplatesToStorage(newTemplates);
  };

  return { templates, getTemplate, saveTemplate, deleteTemplate, isLoaded };
};
