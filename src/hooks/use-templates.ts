
"use client";

import { useContext } from 'react';
import { TemplatesContext } from '@/components/providers/TemplatesProvider';

export const useTemplates = () => {
  const context = useContext(TemplatesContext);
  if (context === undefined) {
    throw new Error('useTemplates must be used within a TemplatesProvider');
  }
  return context;
};
