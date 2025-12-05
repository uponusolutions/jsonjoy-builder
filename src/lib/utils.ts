import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Translation } from "../i18n/translation-keys.ts";
import type { SchemaType } from "../types/jsonSchema.ts";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper functions for backward compatibility
export const getTypeColor = (type: SchemaType): string => {
  switch (type) {
    case "string":
      return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950";
    case "number":
    case "integer":
      return "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950";
    case "boolean":
      return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950";
    case "object":
      return "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950";
    case "array":
      return "text-pink-600 bg-pink-50 dark:text-pink-400 dark:bg-pink-950";
    case "null":
      return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800";
  }
};

// Get type display label
export const getTypeLabel = (t: Translation, type: SchemaType): string => {
  switch (type) {
    case "string":
      return t.schemaTypeString;
    case "number":
    case "integer":
      return t.schemaTypeNumber;
    case "boolean":
      return t.schemaTypeBoolean;
    case "object":
      return t.schemaTypeObject;
    case "array":
      return t.schemaTypeArray;
    case "null":
      return t.schemaTypeNull;
  }
};
