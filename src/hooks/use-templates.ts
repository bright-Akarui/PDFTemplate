
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Template, Field } from '@/lib/types';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// Helper to add a unique ID to fields that don't have one
const addIdToFields = (fields: any[]): Field[] => {
  return fields.map((field, index) => ({
    ...field,
    id: field.id || `f-${Date.now()}-${index}`, // Create a sufficiently unique ID
  }));
};

export const useTemplates = () => {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch all templates from the API on initial load
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/templates`);
        if (!response.ok) {
          throw new Error('Failed to fetch templates');
        }
        const apiResponse = await response.json();
        // The API nests the data in a `data` property
        const templatesFromApi = apiResponse.data || [];
        // Map fields to include a client-side ID
        const processedTemplates = templatesFromApi.map((t: any) => ({
            ...t,
            fields: t.fields ? addIdToFields(t.fields) : [],
        }));

        setTemplates(processedTemplates);
      } catch (error) {
        console.error("Failed to fetch templates from API", error);
        // Optionally set an error state to show in the UI
      } finally {
        setIsLoaded(true);
      }
    };

    fetchTemplates();
  }, []);

  // Fetches a single template and its HTML content
  const getTemplate = useCallback(async (id: string): Promise<Template | null> => {
    try {
        const res = await fetch(`${API_BASE_URL}/api/v1/templates/${id}`);
        if (!res.ok) {
            throw new Error(`Template with id ${id} not found`);
        }
        const templateDataResponse = await res.json();
        const templateData = templateDataResponse.data;

        if (!templateData || !templateData.htmlContent) {
             throw new Error('Invalid template data structure from API');
        }
        
        // Fetch the actual HTML content from the path provided
        const htmlRes = await fetch(`${API_BASE_URL}/${templateData.htmlContent}`);
        if (!htmlRes.ok) {
            throw new Error(`Failed to fetch HTML content for template ${id}`);
        }
        const html = await htmlRes.text();
        
        const fullTemplate: Template = {
            ...templateData,
            htmlContent: html,
            fields: templateData.fields ? addIdToFields(templateData.fields) : [],
        };
        
        return fullTemplate;

    } catch (error) {
        console.error("Error fetching single template:", error);
        return null;
    }
  }, []);


  const saveTemplate = async (templateData: Omit<Template, 'createdAt' | 'updatedAt'>, isNewTemplate: boolean) => {
    if (isNewTemplate) {
        const formData = new FormData();
        formData.append('name', templateData.name);
        
        // Convert fields to the expected format string, removing client-side id.
        const apiFields = templateData.fields.map(f => {
            // Ensure type is always 'string' as per new simplified requirement
            return { name: f.name, type: 'string', sampleValue: f.sampleValue };
        });
        formData.append('fields', JSON.stringify(apiFields));
        
        const htmlBlob = new Blob([templateData.htmlContent || ''], { type: 'text/html' });
        formData.append('htmlFile', htmlBlob, 'template.html');

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/templates/create`, {
                method: 'POST',
                headers: {
                    // Content-Type is set automatically by the browser when using FormData
                    'accept': 'application/json',
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'API call failed');
            }
            
            router.push('/');
            router.refresh(); // Force a refresh to get the new list
            return;

        } catch (error) {
            console.error('Failed to create template via API:', error);
            throw error;
        }
    }
    
    // TODO: Implement update logic (PUT /api/v1/templates/:id)
    console.warn("Update functionality is not yet implemented with the API.");
  };

  const deleteTemplate = (id: string) => {
     // TODO: Implement delete logic (DELETE /api/v1/templates/:id)
    console.warn("Delete functionality is not yet implemented with the API.");
    const newTemplates = templates.filter(t => t.id !== id);
    setTemplates(newTemplates);
  };

  return { templates, getTemplate, saveTemplate, deleteTemplate, isLoaded };
};
