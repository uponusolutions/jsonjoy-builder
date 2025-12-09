import { clsx, type ClassValue } from "clsx";
import type { SchemaType } from "../types/jsonSchema.ts";
import type { Translation } from "../i18n/translation-keys.ts";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function getTypeLabel(
  t: Translation,
  type: SchemaType | "textarea" | "html" | undefined,
): string {
  switch (type) {
    case "string":
      return t.schemaTypeString;
    case "textarea":
      return t.schemaTypeTextarea;
    case "html":
      return t.schemaTypeHtml;
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
    default:
      return type || "Unknown";
  }
}
