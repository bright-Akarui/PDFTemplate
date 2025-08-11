
"use client";

import Link from "next/link";
import { type FC } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText } from "lucide-react";
import TemplateCard from "./TemplateCard";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useTemplates } from "@/hooks/use-templates";

const TemplateListPage: FC = () => {
  const { templates, deleteTemplate } = useTemplates();

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container mx-auto p-4 md:p-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">TemplateFlow</h1>
            <p className="text-muted-foreground mt-1">
              Manage your document templates here.
            </p>
          </div>
          <Link href="/editor/new" passHref>
            <Button className="mt-4 sm:mt-0">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </Link>
        </header>

        <main>
          {templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onDelete={deleteTemplate}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border-2 border-dashed rounded-lg">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No templates found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by creating a new template.
              </p>
              <Link href="/editor/new" passHref className="mt-6">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Template
                </Button>
              </Link>
            </div>
          )}
        </main>
      </div>
    </DndProvider>
  );
};

export default TemplateListPage;
