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
