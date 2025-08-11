import TemplateEditor from "@/components/editor/TemplateEditor";

// Mock data fetching function. In a real app, this would be an API call.
import type { Template } from "@/lib/types";

const MOCK_TEMPLATES: Template[] = [
  {
    id: "1",
    name: "Standard Quotation",
    elements: [
       { id: 'el1', type: 'text', content: 'QUOTATION', style: { position: 'absolute', top: '40px', left: '40px', fontSize: '32px', fontWeight: 'bold' } },
       { id: 'el2', type: 'text', content: 'Customer:', style: { position: 'absolute', top: '120px', left: '40px' } },
       { id: 'el3', type: 'text', fieldId: 'f1', content: 'Customer Name', style: { position: 'absolute', top: '120px', left: '150px', fontWeight: 'bold' } },
       { id: 'el4', type: 'text', content: 'Quote #:', style: { position: 'absolute', top: '145px', left: '40px' } },
       { id: 'el5', type: 'text', fieldId: 'f2', content: 'Quote Number', style: { position: 'absolute', top: '145px', left: '150px' } },
       { id: 'el6', type: 'text', content: 'Total:', style: { position: 'absolute', top: '500px', right: '150px', fontSize: '20px' } },
       { id: 'el7', type: 'text', fieldId: 'f3', content: 'Total Amount', style: { position: 'absolute', top: '500px', right: '40px', fontSize: '20px', fontWeight: 'bold' } },
    ],
    fields: [
      { id: "f1", name: "customerName", type: "text", sampleValue: "John Doe" },
      { id: "f2", name: "quoteNumber", type: "text", sampleValue: "Q-2024-001" },
      { id: "f3", name: "totalAmount", type: "number", sampleValue: "1500.00" },
    ],
    createdAt: "2024-05-20T10:00:00Z",
    updatedAt: "2024-05-21T14:30:00Z",
  },
  {
    id: "2",
    name: "Invoice Template",
    elements: [],
    fields: [
      { id: "f1", name: "clientName", type: "text", sampleValue: "Jane Smith" },
      { id: "f2", name: "invoiceId", type: "text", sampleValue: "INV-07-334" },
      { id: "f3", name: "dueDate", type: "date", sampleValue: "2024-06-30" },
    ],
    createdAt: "2024-05-18T09:00:00Z",
    updatedAt: "2024-05-18T09:00:00Z",
  },
    {
    id: "3",
    name: "Marketing Flyer",
    elements: [],
    fields: [
      { id: "f1", name: "headline", type: "text", sampleValue: "Summer Sale!" },
      { id: "f2", name: "promoCode", type: "text", sampleValue: "SUMMER25" },
    ],
    createdAt: "2024-05-15T16:20:00Z",
    updatedAt: "2024-05-19T11:00:00Z",
  },
];

const getTemplate = (id: string): Template | null => {
  if (id === 'new') {
    return null;
  }
  return MOCK_TEMPLATES.find(t => t.id === id) || null;
}

export default function EditorPage({ params }: { params: { id: string } }) {
  const template = getTemplate(params.id);

  if (params.id !== 'new' && !template) {
    return (
        <div className="flex h-screen items-center justify-center">
            <p>Template not found.</p>
        </div>
    );
  }

  return <TemplateEditor initialData={template} />;
}
