import type {
  JSONSchema,
  NewField,
  ObjectJSONSchema,
} from "../types/jsonSchema.ts";
import { isBooleanSchema, isObjectSchema } from "../types/jsonSchema.ts";

export type Property = {
  name: string;
  schema: JSONSchema;
  required: boolean;
};

export function copySchema<T extends JSONSchema>(schema: T): T {
  if (typeof structuredClone === "function") return structuredClone(schema);
  return JSON.parse(JSON.stringify(schema));
}

/**
 * Updates a property in an object schema
 */
export function updateObjectProperty(
  schema: ObjectJSONSchema,
  propertyName: string,
  propertySchema: JSONSchema,
): ObjectJSONSchema {
  if (!isObjectSchema(schema)) return schema;

  const newSchema = copySchema(schema);
  if (!newSchema.properties) {
    newSchema.properties = {};
  }

  newSchema.properties[propertyName] = propertySchema;
  return newSchema;
}

/**
 * Renames a property in an object schema while preserving its position
 */
export function renameObjectProperty(
  schema: ObjectJSONSchema,
  oldName: string,
  newName: string,
  newPropertySchema: JSONSchema,
): ObjectJSONSchema {
  if (!isObjectSchema(schema) || !schema.properties) return schema;
  if (oldName === newName) {
    return updateObjectProperty(schema, oldName, newPropertySchema);
  }
  if (!(oldName in schema.properties)) return schema;

  const newSchema = copySchema(schema);
  const newProperties: Record<string, JSONSchema> = {};

  for (const [key, value] of Object.entries(newSchema.properties)) {
    if (key === oldName) {
      newProperties[newName] = newPropertySchema;
    } else {
      newProperties[key] = value;
    }
  }

  newSchema.properties = newProperties;

  if (newSchema.required) {
    newSchema.required = newSchema.required.map((name) =>
      name === oldName ? newName : name,
    );
  }

  return newSchema;
}

/**
 * Removes a property from an object schema
 */
export function removeObjectProperty(
  schema: ObjectJSONSchema,
  propertyName: string,
): ObjectJSONSchema {
  if (!isObjectSchema(schema) || !schema.properties) return schema;

  const newSchema = copySchema(schema);
  const { [propertyName]: _, ...remainingProps } = newSchema.properties;
  newSchema.properties = remainingProps;

  // Also remove from required array if present
  if (newSchema.required) {
    newSchema.required = newSchema.required.filter(
      (name) => name !== propertyName,
    );
  }

  return newSchema;
}

/**
 * Reorders properties in an object schema
 */
export function reorderProperties(
  schema: ObjectJSONSchema,
  fromIndex: number,
  toIndex: number,
): ObjectJSONSchema {
  if (!isObjectSchema(schema) || !schema.properties) return schema;

  const entries = Object.entries(schema.properties);
  if (fromIndex < 0 || fromIndex >= entries.length) return schema;
  if (toIndex < 0 || toIndex >= entries.length) return schema;

  const newSchema = copySchema(schema);
  const [moved] = entries.splice(fromIndex, 1);
  entries.splice(toIndex, 0, moved);

  newSchema.properties = Object.fromEntries(entries);
  return newSchema;
}

/**
 * Updates the 'required' status of a property
 */
export function updatePropertyRequired(
  schema: ObjectJSONSchema,
  propertyName: string,
  required: boolean,
): ObjectJSONSchema {
  if (!isObjectSchema(schema)) return schema;

  const newSchema = copySchema(schema);
  if (!newSchema.required) {
    newSchema.required = [];
  }

  if (required) {
    // Add to required array if not already there
    if (!newSchema.required.includes(propertyName)) {
      newSchema.required.push(propertyName);
    }
  } else {
    // Remove from required array
    newSchema.required = newSchema.required.filter(
      (name) => name !== propertyName,
    );
  }

  return newSchema;
}

/**
 * Updates an array schema's items
 */
export function updateArrayItems(
  schema: JSONSchema,
  itemsSchema: JSONSchema,
): JSONSchema {
  if (isObjectSchema(schema) && schema.type === "array") {
    return {
      ...schema,
      items: itemsSchema,
    };
  }
  return schema;
}

/**
 * Creates a schema for a new field
 */
export function createFieldSchema(field: NewField): JSONSchema {
  const { type, description, validation } = field;
  if (isObjectSchema(validation)) {
    return {
      type,
      description,
      ...validation,
    };
  }
  return validation;
}

/**
 * Validates a field name (property key).
 *
 * The key is restricted to characters that are safe to use as a Go template
 * field name (`{{ .key }}`): letters, digits and underscore, not starting with
 * a digit. Note this is stricter than a JS identifier — `$` is intentionally
 * not allowed because Go templates reject it.
 */
export function validateFieldName(name: string): boolean {
  if (!name || name.trim() === "") {
    return false;
  }

  const validNamePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  return validNamePattern.test(name);
}

/**
 * Turns a free-form label into a template-safe camelCase property key.
 *
 * Splits on any non-alphanumeric character, joins the tokens in camelCase,
 * prefixes a leading digit with `_`, and falls back to `"field"` when the
 * label yields nothing usable.
 *
 * Examples: "First Name" -> "firstName", "E-Mail Adr." -> "eMailAdr",
 * "2. Adresse" -> "_2Adresse".
 */
export function slugifyKey(label: string): string {
  const tokens = label.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  if (tokens.length === 0) return "field";

  const camel = tokens
    .map((token, index) =>
      index === 0
        ? token.charAt(0).toLowerCase() + token.slice(1)
        : token.charAt(0).toUpperCase() + token.slice(1),
    )
    .join("");

  return /^[0-9]/.test(camel) ? `_${camel}` : camel;
}

/**
 * Returns `base` if unused, otherwise appends a counter until the key is unique
 * among `existingKeys` (e.g. "firstName", "firstName2", ...).
 */
export function uniqueKey(base: string, existingKeys: string[]): string {
  if (!existingKeys.includes(base)) return base;

  let counter = 2;
  while (existingKeys.includes(`${base}${counter}`)) {
    counter++;
  }
  return `${base}${counter}`;
}

/**
 * Gets properties from an object schema
 */
export function getSchemaProperties(schema: JSONSchema): Property[] {
  if (!isObjectSchema(schema) || !schema.properties) return [];

  const required = schema.required || [];

  return Object.entries(schema.properties).map(([name, propSchema]) => ({
    name,
    schema: propSchema,
    required: required.includes(name),
  }));
}

/**
 * Gets the items schema from an array schema
 */
export function getArrayItemsSchema(schema: JSONSchema): JSONSchema | null {
  if (isBooleanSchema(schema)) return null;
  if (schema.type !== "array") return null;

  return schema.items || null;
}

/**
 * Checks if a schema has children
 */
export function hasChildren(schema: JSONSchema): boolean {
  if (!isObjectSchema(schema)) return false;

  if (schema.type === "object" && schema.properties) {
    return Object.keys(schema.properties).length > 0;
  }

  if (schema.type === "array" && schema.items && isObjectSchema(schema.items)) {
    return schema.items.type === "object" && !!schema.items.properties;
  }

  return false;
}
