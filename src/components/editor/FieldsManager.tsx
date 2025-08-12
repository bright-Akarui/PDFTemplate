
"use client";

import type { FC } from "react";
import type { Field } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
      type: z.enum(["text", "number", "date", "image", "table"]),
      sampleValue: z.string().min(1, "Sample value is required"),
      itemSchema: z.array(
        z.object({
          id: z.string(),
          name: z.string().min(1, "Column name is required"),
        })
      ).optional(),
    })
  ),
});

type FormData = z.infer<typeof formSchema>;

interface FieldsManagerProps {
  templateId: string;
  fields: Field[];
  setFields: (fields: Field[]) => void;
}

const TableField: FC<{ nestIndex: number; control: any; }> = ({ nestIndex, control }) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `fields.${nestIndex}.itemSchema`
    });

    return (
        <div className="space-y-2 mt-2 border-t pt-2">
            <Label className="text-xs font-semibold">Table Columns</Label>
            {fields.map((item, k) => (
                <div key={item.id} className="flex items-center gap-2">
                    <Controller
                        name={`fields.${nestIndex}.itemSchema.${k}.name`}
                        control={control}
                        render={({ field }) => <Input {...field} placeholder="Column Name" className="h-8"/>}
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => remove(k)} type="button">
                        <Trash2 className="w-4 h-4 text-destructive"/>
                    </Button>
                </div>
            ))}
            <Button size="sm" variant="outline" className="w-full h-8" onClick={() => append({ name: '', id: `sf-${Date.now()}` })} type="button">
                <Plus className="w-4 h-4 mr-2"/> Add Column
            </Button>
        </div>
    )
}

const FieldsManager: FC<FieldsManagerProps> = ({ templateId, fields: initialFields, setFields }) => {
  const { control, handleSubmit, watch, getValues, reset, trigger } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { fields: initialFields },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "fields",
  });
  
  useEffect(() => {
    reset({ fields: initialFields });
  }, [templateId, initialFields, reset]);

  const handleFormChange = () => {
    trigger();
    const currentFields = getValues().fields;
    setFields(currentFields as Field[]);
  };

  const addNewField = () => {
    append({ id: `f-${Date.now()}`, name: "", type: "text", sampleValue: "" });
    // This is a workaround to ensure the state updates after appending
    setTimeout(() => {
        const currentFields = getValues().fields;
        setFields(currentFields as Field[]);
    }, 0);
  };
  
  const removeField = (index: number) => {
    remove(index);
    setTimeout(() => {
        const currentFields = getValues().fields;
        setFields(currentFields as Field[]);
    }, 0);
  }


  const watchedFields = watch("fields");

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Data Fields</CardTitle>
        <CardDescription>Define variables for your template.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onBlur={handleSubmit(handleFormChange)}>
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
                    <Label>Field Type</Label>
                    <Controller
                        name={`fields.${index}.type`}
                        control={control}
                        render={({ field }) => (
                        <Select onValueChange={(value) => {
                            field.onChange(value);
                            handleFormChange();
                        }} defaultValue={field.value}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="image">Image URL</SelectItem>
                            <SelectItem value="table">Table (Array)</SelectItem>
                            </SelectContent>
                        </Select>
                        )}
                    />
                </div>
                <div>
                    <Label>Sample Value</Label>
                    { watchedFields[index]?.type === 'table' ? (
                        <Controller
                            name={`fields.${index}.sampleValue`}
                            control={control}
                            render={({ field }) => <Textarea {...field} placeholder='e.g., [{"col": "value"}]' className="text-xs" rows={4} />}
                        />
                    ) : (
                        <Controller
                        name={`fields.${index}.sampleValue`}
                        control={control}
                        render={({ field }) => <Input {...field} placeholder="e.g., John Doe" />}
                        />
                    )}
                </div>
                {watchedFields[index]?.type === 'table' && <TableField nestIndex={index} control={control} />}
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
