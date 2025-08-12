
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

export interface Template {
  id: string;
  name: string;
  fields: Field[];
  htmlContent?: string; // Stored for saving
  createdAt: string;
  updatedAt: string;
}
