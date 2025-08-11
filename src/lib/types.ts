import type { CSSProperties } from 'react';

export interface Field {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'image';
  sampleValue: string;
}

export interface TemplateElement {
  id: string;
  type: 'text' | 'image';
  content: string; // for text content or image placeholder text
  fieldId?: string; // link to a field
  style: CSSProperties;
}

export interface Template {
  id: string;
  name: string;
  elements: TemplateElement[];
  fields: Field[];
  htmlContent?: string; // Stored for saving
  createdAt: string;
  updatedAt: string;
}
