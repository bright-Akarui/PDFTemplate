
"use client";

import TemplateEditor from "@/components/editor/TemplateEditor";
import { useTemplates } from "@/hooks/use-templates";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

export default function EditorPage({ params }: { params: { id: string } }) {
  const { getTemplate, isLoaded } = useTemplates();
  const template = params.id === 'new' ? null : getTemplate(params.id);

  if (!isLoaded) {
    return (
        <div className="flex h-screen items-center justify-center">
            <p>Loading...</p>
        </div>
    );
  }

  if (params.id !== 'new' && !template) {
    return (
        <div className="flex h-screen items-center justify-center">
            <p>Template not found.</p>
        </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <TemplateEditor initialData={template} />
    </DndProvider>
  )
}
