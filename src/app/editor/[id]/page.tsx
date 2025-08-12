
"use client";

import TemplateEditor from "@/components/editor/TemplateEditor";
import { useTemplates } from "@/hooks/use-templates";
import { useMemo } from "react";
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
  const { getTemplate, isLoaded } = useTemplates();
  
  const template = useMemo(() => {
    if (!isLoaded) return undefined;
    if (id === 'new') {
        // Return a new template structure for code-only editor
        return {
            id: `t-${Date.now()}`,
            name: "New Code Template",
            fields: [
              { id: 'f1', name: 'title', type: 'text', sampleValue: 'Hello World' }
            ],
            htmlContent: defaultHtml,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        } as Template;
    }
    return getTemplate(id);
  }, [id, getTemplate, isLoaded]);

  if (!isLoaded) {
    return (
        <div className="flex h-screen items-center justify-center">
            <p>Loading...</p>
        </div>
    );
  }

  if (!template) {
    return (
        <div className="flex h-screen items-center justify-center">
            <p>Template not found.</p>
        </div>
    );
  }

  return (
      <TemplateEditor initialData={template} isNewTemplate={id === 'new'} />
  )
}
