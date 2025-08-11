
"use client";

import TemplateEditor from "@/components/editor/TemplateEditor";
import { useTemplates } from "@/hooks/use-templates";

export default function EditorPage({ params }: { params: { id: string } }) {
  const { getTemplate } = useTemplates();
  const template = params.id === 'new' ? null : getTemplate(params.id);

  if (params.id !== 'new' && !template) {
    return (
        <div className="flex h-screen items-center justify-center">
            <p>Template not found.</p>
        </div>
    );
  }

  return <TemplateEditor initialData={template} />;
}
