"use client";

import type { FC, Dispatch, SetStateAction } from "react";
import type { Field } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, FileJson2 } from "lucide-react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  fields: z.array(
    z.object({
      name: z.string().min(1, "Name is required"),
      type: z.enum(["text", "number", "date", "image"]),
      sampleValue: z.string().min(1, "Sample value is required"),
    })
  ),
});

interface FieldsManagerProps {
  fields: Field[];
  setFields: Dispatch<SetStateAction<Field[]>>;
}

const FieldsManager: FC<FieldsManagerProps> = ({ fields, setFields }) => {
  const { control, handleSubmit, watch } = useForm<{ fields: Omit<Field, 'id'>[] }>({
    resolver: zodResolver(formSchema),
    defaultValues: { fields: fields.map(({id, ...rest}) => rest) },
  });

  const { fields: formFields, append, remove } = useFieldArray({
    control,
    name: "fields",
  });
  
  watch((value) => {
    const newFields: Field[] = (value.fields || []).map((f, i) => ({
      id: fields[i]?.id || `f-${Date.now()}-${i}`,
      ...f,
    })) as Field[];
    setFields(newFields);
  });
  
  const addNewField = () => {
    append({ name: "", type: "text", sampleValue: "" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Fields</CardTitle>
        <CardDescription>Define variables for your template.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {formFields.length > 0 ? formFields.map((field, index) => (
            <div key={field.id} className="p-3 border rounded-lg space-y-3 relative bg-secondary/30">
              <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => remove(index)}>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="image">Image URL</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
              </div>
               <div>
                <Label>Sample Value</Label>
                <Controller
                  name={`fields.${index}.sampleValue`}
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="e.g., John Doe" />}
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
        <Button onClick={addNewField} variant="outline" className="w-full mt-4">
          <Plus className="w-4 h-4 mr-2" /> Add Field
        </Button>
      </CardContent>
    </Card>
  );
};

export default FieldsManager;
