
"use client";

import TemplateEditor from "@/components/editor/TemplateEditor";
import { useTemplates } from "@/hooks/use-templates";
import { useMemo } from "react";
import type { Template } from "@/lib/types";
import { useParams } from "next/navigation";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";


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

export default function CodeEditorPage() {
  const params = useParams();
  let id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { getTemplate, isLoaded } = useTemplates();
  
  const template = useMemo(() => {
    if (!isLoaded) return undefined;
    if (id === 'new') {
        // Return a new template structure for code-only editor
        return {
            id: `t-${Date.now()}`,
            name: "New Code Template",
            elements: [], // Code-only templates start with no visual elements
            fields: [
              { id: 'f1', name: 'title', type: 'text', sampleValue: 'Hello World' }
            ],
            htmlContent: defaultHtml,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        } as Template;
    }
    return getTemplate(id!);
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
    <DndProvider backend={HTML5Backend}>
      <TemplateEditor initialData={template} isNewTemplate={id === 'new'} editorType="code" />
    </DndProvider>
  )
}
