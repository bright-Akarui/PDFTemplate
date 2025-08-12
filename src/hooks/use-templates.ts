
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Template } from '@/lib/types';

const MOCK_TEMPLATES: Template[] = [
  {
    id: "1",
    name: "Standard Quotation",
    elements: [],
    htmlContent: `<html>
  <head>
    <style>
      body { font-family: sans-serif; }
      .template-container { position: relative; width: 210mm; height: 297mm; background: white; margin: auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); padding: 40px; }
      .title { font-size: 32px; font-weight: bold; }
    </style>
  </head>
  <body>
    <div class="template-container">
      <div data-id="el-1" data-type="text" style="position: absolute; top: 40px; left: 40px; font-size: 32px; font-weight: bold;">QUOTATION</div>
      <div data-id="el-2" data-type="text" style="position: absolute; top: 120px; left: 40px;">Customer:</div>
      <div data-id="el-3" data-type="text" data-field-id="f1" style="position: absolute; top: 120px; left: 150px; font-weight: bold;">{{.customerName}}</div>
      <div data-id="el-4" data-type="text" style="position: absolute; top: 145px; left: 40px;">Quote #:</div>
      <div data-id="el-5" data-type="text" data-field-id="f2" style="position: absolute; top: 145px; left: 150px;">{{.quoteNumber}}</div>
      <div data-id="el-6" data-type="text" style="position: absolute; top: 500px; right: 150px; font-size: 20px;">Total:</div>
      <div data-id="el-7" data-type="text" data-field-id="f3" style="position: absolute; top: 500px; right: 40px; font-size: 20px; font-weight: bold;">{{.totalAmount}}</div>
    </div>
  </body>
</html>`,
    fields: [
      { id: "f1", name: "customerName", type: "text", sampleValue: "John Doe" },
      { id: "f2", name: "quoteNumber", type: "text", sampleValue: "Q-2024-001" },
      { id: "f3", name: "totalAmount", type: "number", sampleValue: "1500.00" },
    ],
    createdAt: "2024-05-20T10:00:00Z",
    updatedAt: "2024-05-21T14:30:00Z",
  },
  {
    id: "2",
    name: "Invoice With Items",
    elements: [],
    htmlContent: `<html>
  <head>
    <style>
      body { font-family: sans-serif; }
      .template-container { position: relative; width: 210mm; height: 297mm; background: white; margin: auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); padding: 40px; }
      h1, p { margin: 0 0 10px 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f2f2f2; }
    </style>
  </head>
  <body>
    <div class="template-container">
      <h1 data-id="el-inv-1" data-type="text">Invoice</h1>
      <p data-id="el-inv-2" data-type="text" data-field-id="f2"><strong>Invoice #:</strong> {{.invoiceId}}</p>
      <p data-id="el-inv-3" data-type="text" data-field-id="f1"><strong>Client:</strong> {{.clientName}}</p>
      <p data-id="el-inv-4" data-type="text" data-field-id="f3"><strong>Date:</strong> {{.dueDate}}</p>
      
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Price</th>
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
    </div>
  </body>
</html>`,
    fields: [
      { id: "f1", name: "clientName", type: "text", sampleValue: "Jane Smith" },
      { id: "f2", name: "invoiceId", type: "text", sampleValue: "INV-07-334" },
      { id: "f3", name: "dueDate", type: "date", sampleValue: "2024-06-30" },
      {
        id: "f4",
        name: "Items",
        type: "table",
        sampleValue: '[{"Name":"Web Design","Qty":1,"Price":1200,"Total":1200},{"Name":"Hosting","Qty":1,"Price":100,"Total":100}]',
        itemSchema: [
            { id: 'sf1', name: 'Name' },
            { id: 'sf2', name: 'Qty' },
            { id: 'sf3', name: 'Price' },
            { id: 'sf4', name: 'Total' },
        ]
      }
    ],
    createdAt: "2024-05-18T09:00:00Z",
    updatedAt: "2024-05-18T09:00:00Z",
  },
];

const STORAGE_KEY = 'templateflow_templates';

export const useTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedItems = localStorage.getItem(STORAGE_KEY);
      // To ensure latest mock data is always used for this tutorial, we reset it on load.
      // In a real app, you would likely only set this if `storedItems` is null.
      setTemplates(MOCK_TEMPLATES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_TEMPLATES));
    } catch (error) {
      console.error("Failed to access localStorage", error);
      setTemplates(MOCK_TEMPLATES);
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

  const saveTemplate = (templateData: Omit<Template, 'createdAt' | 'updatedAt'>) => {
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
      // Add new
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
