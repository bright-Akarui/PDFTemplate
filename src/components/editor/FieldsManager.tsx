
"use client";

import type { FC } from "react";
import type { Field } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, FileJson2 } from "lucide-react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";

const formSchema = z.object({
  fields: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1, "Name is required"),
      sampleValue: z.string().min(1, "Sample value is required"),
    })
  ),
});

type FormData = z.infer<typeof formSchema>;

interface FieldsManagerProps {
  initialFields: Field[];
  onFieldsChange: (fields: Field[]) => void;
}

const FieldsManager: FC<FieldsManagerProps> = ({ initialFields, onFieldsChange }) => {
  const { control, watch, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { fields: initialFields },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "fields",
  });
  
  useEffect(() => {
    reset({ fields: initialFields });
  }, [initialFields, reset]);

  const watchedFields = watch("fields");

  useEffect(() => {
    onFieldsChange(watchedFields as Field[]);
  }, [watchedFields, onFieldsChange]);
  
  const addNewField = () => {
    append({ id: `f-${Date.now()}`, name: "", sampleValue: "" });
  };
  
  const removeField = (index: number) => {
    remove(index);
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Data Fields</CardTitle>
        <CardDescription>Define variables for your template.</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
            <div className="space-y-4">
            {fields.length > 0 ? fields.map((field, index) => (
                <div key={field.id} className="p-3 border rounded-lg space-y-3 relative bg-secondary/30">
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => removeField(index)} type="button">
                    <Trash2 className="w-4 h-4 text-destructive"/>
                </Button>
                <div>
                    <Label>Field Name</Label>
                    <Controller
                    name={`fields.${index}.name`}
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="e.g., customerName" />}
                    />
                </div>
                <div>
                    <Label>Sample Value</Label>
                    <Controller
                        name={`fields.${index}.sampleValue`}
                        control={control}
                        render={({ field }) => <Textarea {...field} placeholder='e.g., John Doe or [{"col": "value"}]' className="text-xs" rows={4} />}
                    />
                </div>
                </div>
            )) : (
                <div className="text-center text-sm text-muted-foreground py-4">
                <FileJson2 className="mx-auto h-8 w-8 mb-2" />
                No fields defined.
                </div>
            )}
            </div>
        </form>
        <Button onClick={addNewField} variant="outline" className="w-full mt-4" type="button">
          <Plus className="w-4 h-4 mr-2" /> Add Field
        </Button>
      </CardContent>
    </Card>
  );
};

export default FieldsManager;
