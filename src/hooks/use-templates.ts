
"use client";

import { useState, useEffect, useCallback, useContext } from 'react';
import type { Template, Field } from '@/lib/types';
import { TemplatesContext } from '@/components/providers/TemplatesProvider';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

const addIdToFields = (fields: any[]): Field[] => {
  return fields.map((field, index) => ({
    ...field,
    id: field.id || `f-${Date.now()}-${index}`,
  }));
};

export const useTemplates = () => {
  const context = useContext(TemplatesContext);
  if (context === undefined) {
    throw new Error('useTemplates must be used within a TemplatesProvider');
  }
  return context;
};

// A new hook specifically for fetching a single template with its HTML content for the editor pages.
export const useTemplateEditor = (id: string | null) => {
    const [template, setTemplate] = useState<Template | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTemplateWithHtml = useCallback(async () => {
        if (!id || id === 'new') {
            setIsLoading(false);
            return;
        };
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/templates/${id}`);
            if (!res.ok) throw new Error(`Template with id ${id} not found`);
            
            const templateDataResponse = await res.json();
            const templateData = templateDataResponse.data;

            if (!templateData || !templateData.htmlContent) {
                throw new Error('Invalid template data structure from API');
            }

            const htmlRes = await fetch(`${API_BASE_URL}/${templateData.htmlContent}`);
            if (!htmlRes.ok) throw new Error(`Failed to fetch HTML content`);
            
            const html = await htmlRes.text();
            
            setTemplate({
                ...templateData,
                htmlContent: html,
                fields: templateData.fields ? addIdToFields(templateData.fields) : [],
            });
        } catch (error) {
            console.error("Error fetching single template:", error);
            setTemplate(null);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchTemplateWithHtml();
    }, [fetchTemplateWithHtml]);

    return { template, isLoading };
};
