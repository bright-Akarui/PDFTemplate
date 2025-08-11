
"use client";

import TemplateEditor from "@/components/editor/TemplateEditor";
import { useTemplates } from "@/hooks/use-templates";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useMemo } from "react";
import type { Template } from "@/lib/types";

export default function EditorPage({ params }: { params: { id: string } }) {
  const { getTemplate, isLoaded } = useTemplates();
  
  const template = useMemo(() => {
    if (!isLoaded) return undefined;
    if (params.id === 'new') {
        // Return a new template structure, but don't save it yet.
        return {
            id: `t-${Date.now()}`,
            name: "New Template",
            elements: [],
            fields: [],
            htmlContent: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        } as Template;
    }
    return getTemplate(params.id);
  }, [params.id, getTemplate, isLoaded]);

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
      <TemplateEditor initialData={template} isNewTemplate={params.id === 'new'} />
    </DndProvider>
  )
}
