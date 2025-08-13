
export interface Field {
  id?: string; // Made optional as API response doesn't always have it
  name: string;
  sampleValue: string;
}

export interface Template {
  id: string;
  name: string;
  fields: Field[];
  htmlContent: string; // Will hold the actual HTML content, not the path
  createdAt: string;
  updatedAt: string;
}
