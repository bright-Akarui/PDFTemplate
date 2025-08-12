
"use client";

import Link from "next/link";
import { type FC } from "react";
import { Button } from "@/components/ui/button";
import { FileText, LayoutTemplate, Code2 } from "lucide-react";
import TemplateCard from "./TemplateCard";
import { useTemplates } from "@/hooks/use-templates";

const TemplateListPage: FC = () => {
  const { templates, deleteTemplate } = useTemplates();

  return (
      <div className="container mx-auto">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Your Templates</h1>
            <p className="text-muted-foreground mt-1">
              Manage, edit, or create new document templates.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <Link href="/editor/designer/new" passHref>
              <Button>
                <LayoutTemplate className="mr-2 h-4 w-4" />
                New Designer Template
              </Button>
            </Link>
             <Link href="/editor/code/new" passHref>
              <Button variant="secondary">
                <Code2 className="mr-2 h-4 w-4" />
                New Code Template
              </Button>
            </Link>
          </div>
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
              <div className="flex justify-center items-center gap-2 mt-6">
                <Link href="/editor/designer/new" passHref>
                  <Button>
                    <LayoutTemplate className="mr-2 h-4 w-4" />
                    Create Designer Template
                  </Button>
                </Link>
                 <Link href="/editor/code/new" passHref>
                  <Button variant="secondary">
                    <Code2 className="mr-2 h-4 w-4" />
                    Create Code Template
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
  );
};

export default TemplateListPage;
