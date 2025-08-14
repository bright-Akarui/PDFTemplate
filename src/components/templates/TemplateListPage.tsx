
"use client";

import Link from "next/link";
import { type FC } from "react";
import { Button } from "@/components/ui/button";
import { FileText, PlusSquare } from "lucide-react";
import TemplateCard from "./TemplateCard";
import { useTemplates } from "@/hooks/use-templates";
import { Skeleton } from "@/components/ui/skeleton";

const TemplateListPage: FC = () => {
  const { templates, isLoaded } = useTemplates();

  return (
      <div className="container mx-auto py-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Templates</h1>
            <p className="text-muted-foreground mt-1">
              Manage, edit, or create new document templates.
            </p>
          </div>
        </header>

        <main>
          {!isLoaded ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col space-y-3">
                  <Skeleton className="h-[125px] w-full rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
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
                <Link href="/editor/new" passHref>
                  <Button>
                    <PlusSquare className="mr-2 h-4 w-4" />
                    Create New Template
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
