
"use client";

import { useState, useEffect, useCallback, createContext, ReactNode } from 'react';
import type { Template, Field } from '@/lib/types';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

const addIdToFields = (fields: any[]): Field[] => {
  return fields.map((field, index) => ({
    ...field,
    id: field.id || `f-${Date.now()}-${index}`,
  }));
};

interface TemplatesContextType {
  templates: Template[];
  getTemplate: (id: string) => Template | undefined;
  saveTemplate: (templateData: Omit<Template, 'createdAt' | 'updatedAt'>, isNewTemplate: boolean) => Promise<any>;
  deleteTemplate: (id: string) => Promise<void>;
  isLoaded: boolean;
  refetchTemplates: () => void;
}

export const TemplatesContext = createContext<TemplatesContextType | undefined>(undefined);

export const TemplatesProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setIsLoaded(false);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/templates`);
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      const apiResponse = await response.json();
      const templatesFromApi = apiResponse.data || [];
      const processedTemplates = templatesFromApi.map((t: any) => ({
          ...t,
          fields: t.fields ? addIdToFields(t.fields) : [],
      }));
      setTemplates(processedTemplates);
    } catch (error) {
      console.error("Failed to fetch templates from API", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const getTemplateById = useCallback((id: string): Template | undefined => {
    return templates.find(t => t.id === id);
  }, [templates]);

  const saveTemplate = async (templateData: Omit<Template, 'createdAt' | 'updatedAt'>, isNewTemplate: boolean) => {
    const formData = new FormData();
    formData.append('name', templateData.name);
    
    const apiFields = templateData.fields.map(({ id, ...rest }) => ({
        ...rest,
        type: 'string' // Ensure type is always string as per requirement
    }));

    formData.append('fields', JSON.stringify(apiFields));
    
    const htmlBlob = new Blob([templateData.htmlContent || ''], { type: 'text/html' });
    formData.append('htmlFile', htmlBlob, 'template.html');

    const url = isNewTemplate
      ? `${API_BASE_URL}/api/v1/templates`
      : `${API_BASE_URL}/api/v1/templates/${templateData.id}`;
    
    const method = isNewTemplate ? 'POST' : 'PUT';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'accept': 'application/json' },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'API call failed');
        }
        
        await fetchTemplates(); 
        
        if (isNewTemplate) {
          router.push('/');
        } else {
          router.refresh(); 
        }
        
        return await response.json();

    } catch (error) {
        console.error(`Failed to ${isNewTemplate ? 'create' : 'update'} template via API:`, error);
        throw error;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/templates/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete template');
      }
      await fetchTemplates();
      router.refresh();
    } catch (error) {
      console.error("Delete failed:", error);
      throw error;
    }
  };

  return (
    <TemplatesContext.Provider value={{ templates, getTemplate: getTemplateById, saveTemplate, deleteTemplate, isLoaded, refetchTemplates: fetchTemplates }}>
      {children}
    </TemplatesContext.Provider>
  );
};
