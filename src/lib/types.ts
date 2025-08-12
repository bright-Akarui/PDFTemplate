
export interface Field {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'image' | 'table';
  sampleValue: string;
}

export interface Template {
  id: string;
  name: string;
  fields: Field[];
  htmlContent?: string; // Stored for saving
  createdAt: string;
  updatedAt: string;
}
