
"use client";

import TemplateEditor from "@/components/editor/TemplateEditor";
import { useTemplateEditor, useTemplates } from "@/hooks/use-templates";
import { useEffect, useState } from "react";
import type { Template } from "@/lib/types";
import { useParams } from "next/navigation";

const defaultHtml = `<html>
  <head>
    <style>
      body { 
        font-family: sans-serif;
        margin: 0;
        padding: 0;
      }
      .page {
        width: 210mm;
        min-height: 297mm;
        background: white;
        margin: 20px auto;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
        box-sizing: border-box;
        padding: 40px;
      }
      /* Add your styles here */
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f2f2f2; }
    </style>
  </head>
  <body>
    <div class="page">
      <!-- Add your elements here -->
      <h1>{{.title}}</h1>
      <p>This is a code-only template. You can use Go template syntax for variables.</p>
    </div>
  </body>
</html>`;

export default function EditorPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { template: fetchedTemplate, isLoading } = useTemplateEditor(id !== 'new' ? id : null);
  const [template, setTemplate] = useState<Template | null>(null);

  useEffect(() => {
    if (id === 'new') {
      const newTemplate: Template = {
        id: `t-${Date.now()}`,
        name: "New Code Template",
        fields: [
          { id: 'f1', name: 'title', type: 'text', sampleValue: 'Hello World' }
        ],
        htmlContent: defaultHtml,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTemplate(newTemplate);
    } else if (fetchedTemplate) {
      setTemplate(fetchedTemplate);
    }
  }, [id, fetchedTemplate]);

  if (isLoading && id !== 'new') {
    return (
        <div className="flex h-screen items-center justify-center">
            <p>Loading Template...</p>
        </div>
    );
  }

  if (!template) {
    // This can be a loading state for a new template or a not found state for an existing one.
    return (
        <div className="flex h-screen items-center justify-center">
             <p>{id !== 'new' ? "Template not found." : "Loading..."}</p>
        </div>
    );
  }

  return (
      <TemplateEditor initialData={template} isNewTemplate={id === 'new'} />
  )
}
