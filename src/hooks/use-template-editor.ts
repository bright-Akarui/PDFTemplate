
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Template } from '@/lib/types';
import { addIdToFields } from '@/lib/utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// A hook specifically for fetching a single template with its HTML content for the editor pages.
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

            // Cache-busting: Append updatedAt timestamp to the URL
            const cacheBustingUrl = `${API_BASE_URL}/${templateData.htmlContent}?v=${new Date(templateData.updatedAt).getTime()}`;
            const htmlRes = await fetch(cacheBustingUrl);
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
