import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Field } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const addIdToFields = (fields: any[]): Field[] => {
  return fields.map((field, index) => ({
    ...field,
    id: field.id || `f-${Date.now()}-${index}`,
  }));
};
