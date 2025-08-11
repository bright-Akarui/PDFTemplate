
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Template } from '@/lib/types';

const MOCK_TEMPLATES: Template[] = [
  {
    id: "1",
    name: "Standard Quotation",
    elements: [
       { id: 'el1', type: 'text', content: 'QUOTATION', style: { position: 'absolute', top: '40px', left: '40px', fontSize: '32px', fontWeight: 'bold' } },
       { id: 'el2', type: 'text', content: 'Customer:', style: { position: 'absolute', top: '120px', left: '40px' } },
       { id: 'el3', type: 'text', fieldId: 'f1', content: 'Customer Name', style: { position: 'absolute', top: '120px', left: '150px', fontWeight: 'bold' } },
       { id: 'el4', type: 'text', content: 'Quote #:', style: { position: 'absolute', top: '145px', left: '40px' } },
       { id: 'el5', type: 'text', fieldId: 'f2', content: 'Quote Number', style: { position: 'absolute', top: '145px', left: '150px' } },
       { id: 'el6', type: 'text', content: 'Total:', style: { position: 'absolute', top: '500px', right: '150px', fontSize: '20px' } },
       { id: 'el7', type: 'text', fieldId: 'f3', content: 'Total Amount', style: { position: 'absolute', top: '500px', right: '40px', fontSize: '20px', fontWeight: 'bold' } },
    ],
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
    name: "Invoice Template",
    elements: [],
    htmlContent: `<html><body><h1>Invoice for {{clientName}}</h1></body></html>`,
    fields: [
      { id: "f1", name: "clientName", type: "text", sampleValue: "Jane Smith" },
      { id: "f2", name: "invoiceId", type: "text", sampleValue: "INV-07-334" },
      { id: "f3", name: "dueDate", type: "date", sampleValue: "2024-06-30" },
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
      if (storedItems) {
        setTemplates(JSON.parse(storedItems));
      } else {
        // Initialize with mock data if nothing is in storage
        setTemplates(MOCK_TEMPLATES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_TEMPLATES));
      }
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
    if (!isLoaded) return null;
    return templates.find(t => t.id === id) || null;
  }, [templates, isLoaded]);

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
