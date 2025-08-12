
import type { CSSProperties } from 'react';

export interface SubField {
  id: string;
  name: string;
}

export interface Field {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'image' | 'table';
  sampleValue: string;
  itemSchema?: SubField[]; // For 'table' type
}

export interface TemplateElement {
  id:string;
  type: 'text' | 'image' | 'table';
  content: string; // for text content or image placeholder text/alt
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
  containerStyle?: CSSProperties;
}
