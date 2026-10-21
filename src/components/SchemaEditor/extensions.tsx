import { createContext, type ReactNode, useContext } from "react";
import type { JSONSchema, ObjectJSONSchema } from "../../types/jsonSchema.ts";

/** @public What an extension gets to know about the field it renders for. */
export interface FieldExtensionContext {
  /** The field's key within its parent object. */
  name: string;
  /** The field's schema. */
  schema: JSONSchema;
  /** The object schema whose `properties` hold the field and its siblings. */
  parent: ObjectJSONSchema;
  readOnly: boolean;
  /** Replaces the field's schema. */
  onChange: (schema: ObjectJSONSchema) => void;
}

/**
 * @public
 * A kind of field of your own, listed in the type dropdown after the JSON types, e.g. a static
 * heading stored as a custom keyword. The editor shows no type settings for such a field; use
 * `renderFieldSettings` to edit its keywords.
 */
export interface CustomFieldType {
  /** Unique id, used as key. */
  id: string;
  /** Label of the type in the dropdown and the field header. */
  label: string;
  /** Shown as the menu item's description/tooltip. */
  description?: string;
  /** Mantine color of the badge; default "gray". */
  color?: string;
  /** True when the field's schema is of this kind. */
  matches: (schema: JSONSchema) => boolean;
  /**
   * The schema a field gets when switched to this kind; receives the field's current schema.
   * Include a JSON `type`: the editor adds `type: "object"` to a schema without one.
   */
  create: (schema: ObjectJSONSchema) => ObjectJSONSchema;
  /** Keeps the required dropdown; default false: a static element cannot be required. */
  canBeRequired?: boolean;
}

/**
 * @public
 * Hooks to add settings of your own to every field, e.g. stored as custom keywords on the field's
 * schema. Without extensions the editor renders as before.
 */
export interface SchemaEditorExtensions {
  /** Rendered in a field's expanded panel, below the type specific settings. */
  renderFieldSettings?: (ctx: FieldExtensionContext) => ReactNode;
  /** Rendered in a field's header, before the type dropdown. */
  renderFieldBadges?: (ctx: FieldExtensionContext) => ReactNode;
  /**
   * Leaves the allowed values (`enum`) input out of the text type settings, e.g. because
   * `renderFieldSettings` edits the allowed values together with data of your own.
   */
  hideAllowedValues?: boolean;
  /**
   * Called after a property of `parent` was renamed from `oldName` to `newName`; returns the parent
   * with any references to the old name updated.
   */
  onPropertyRenamed?: (
    parent: ObjectJSONSchema,
    oldName: string,
    newName: string,
  ) => ObjectJSONSchema;
  /**
   * Kinds of fields of your own, listed after the JSON types in the type dropdown. A field whose
   * schema matches one shows no type settings (and no required dropdown unless the type
   * `canBeRequired`); the first matching type wins.
   */
  customTypes?: CustomFieldType[];
}

export const SchemaEditorExtensionsContext =
  createContext<SchemaEditorExtensions>({});

/** The object schema whose properties are being listed. */
export const ParentObjectContext = createContext<ObjectJSONSchema>({
  type: "object",
});

export const useSchemaEditorExtensions = () =>
  useContext(SchemaEditorExtensionsContext);

export const useParentObject = () => useContext(ParentObjectContext);

/** Applies `onPropertyRenamed` when the extensions define it. */
export function applyRename(
  extensions: SchemaEditorExtensions,
  parent: ObjectJSONSchema,
  oldName: string,
  newName: string,
): ObjectJSONSchema {
  if (oldName === newName || !extensions.onPropertyRenamed) return parent;
  return extensions.onPropertyRenamed(parent, oldName, newName);
}

/** Returns the first custom type matching `schema`, if any. */
export function matchingCustomType(
  extensions: SchemaEditorExtensions,
  schema: JSONSchema,
): CustomFieldType | undefined {
  return extensions.customTypes?.find((type) => type.matches(schema));
}
