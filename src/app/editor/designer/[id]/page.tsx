
"use client";

import TemplateEditor from "@/components/editor/TemplateEditor";
import { useTemplates } from "@/hooks/use-templates";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useMemo } from "react";
import type { Template } from "@/lib/types";
import { useParams } from "next/navigation";

export default function DesignerEditorPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { getTemplate, isLoaded } = useTemplates();
  
  const template = useMemo(() => {
    if (!isLoaded) return undefined;
    if (id === 'new') {
        // Return a new template structure, but don't save it yet.
        return {
            id: `t-${Date.now()}`,
            name: "New Designer Template",
            elements: [],
            fields: [],
            htmlContent: '',
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
    <DndProvider backend={HTML5Backend}>
      <TemplateEditor initialData={template} isNewTemplate={id === 'new'} editorType="designer" />
    </DndProvider>
  )
}
