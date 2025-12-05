import type { FC } from "react";
import { useTranslation } from "../../hooks/use-translation.ts";
import {
  createFieldSchema,
  renameObjectProperty,
  reorderProperties,
  updateObjectProperty,
  updatePropertyRequired,
} from "../../lib/schemaEditor.ts";
import type { JSONSchema, NewField } from "../../types/jsonSchema.ts";
import { asObjectSchema, isBooleanSchema } from "../../types/jsonSchema.ts";
import AddFieldButton from "./AddFieldButton.tsx";
import SchemaFieldList from "./SchemaFieldList.tsx";

/** @public */
export interface SchemaVisualEditorProps {
  schema: JSONSchema;
  readOnly: boolean;
  onChange: (schema: JSONSchema) => void;
  showDescription?: boolean;
  disableAnimations?: boolean;
  /** Theme mode: 'light' or 'dark'. Default is 'light'. */
  theme?: "light" | "dark";
}

/** @public */
const SchemaVisualEditor: FC<SchemaVisualEditorProps> = ({
  schema,
  onChange,
  readOnly = false,
  showDescription = true,
  disableAnimations = false,
  theme = "light",
}) => {
  const t = useTranslation();
  // Handle adding a top-level field
  const handleAddField = (newField: NewField) => {
    // Create a field schema based on the new field data
    const fieldSchema = createFieldSchema(newField);

    // Add the field to the schema
    let newSchema = updateObjectProperty(
      asObjectSchema(schema),
      newField.name,
      fieldSchema,
    );

    // Update required status if needed
    if (newField.required) {
      newSchema = updatePropertyRequired(newSchema, newField.name, true);
    }

    // Update the schema
    onChange(newSchema);
  };

  // Handle editing a top-level field
  const handleEditField = (name: string, updatedField: NewField) => {
    // Create a field schema based on the updated field data
    const fieldSchema = createFieldSchema(updatedField);

    let newSchema = asObjectSchema(schema);

    // Use renameObjectProperty to preserve position when name changes
    if (name !== updatedField.name) {
      newSchema = renameObjectProperty(newSchema, name, updatedField.name, fieldSchema);
    } else {
      newSchema = updateObjectProperty(newSchema, name, fieldSchema);
    }

    // Update required status
    newSchema = updatePropertyRequired(
      newSchema,
      updatedField.name,
      updatedField.required || false,
    );

    // Update the schema
    onChange(newSchema);
  };

  // Handle deleting a top-level field
  const handleDeleteField = (name: string) => {
    // Check if the schema is valid first
    if (isBooleanSchema(schema) || !schema.properties) {
      return;
    }

    // Create a new schema without the field
    const { [name]: _, ...remainingProps } = schema.properties;

    const newSchema = {
      ...schema,
      properties: remainingProps,
    };

    // Remove from required array if present
    if (newSchema.required) {
      newSchema.required = newSchema.required.filter((field) => field !== name);
    }

    // Update the schema
    onChange(newSchema);
  };

  // Handle reordering fields via drag and drop
  const handleReorderFields = (fromIndex: number, toIndex: number) => {
    const newSchema = reorderProperties(asObjectSchema(schema), fromIndex, toIndex);
    onChange(newSchema);
  };

  const hasFields =
    !isBooleanSchema(schema) &&
    schema.properties &&
    Object.keys(schema.properties).length > 0;

  const themeClass = theme === "dark" ? "dark" : "";

  return (
    <div className={`p-4 h-full flex flex-col overflow-auto jsonjoy ${themeClass}`}>
      {!readOnly && (
        <div className="mb-6 shrink-0">
          <AddFieldButton onAddField={handleAddField} showDescription={showDescription} disableAnimations={disableAnimations} />
        </div>
      )}

      <div className="grow overflow-auto">
        {!hasFields ? (
          <div className="text-center py-10 text-muted-foreground">
            <p className="mb-3">{t.visualEditorNoFieldsHint1}</p>
            <p className="text-sm">{t.visualEditorNoFieldsHint2}</p>
          </div>
        ) : (
          <SchemaFieldList
            schema={schema}
            readOnly={readOnly}
            onAddField={handleAddField}
            onEditField={handleEditField}
            onDeleteField={handleDeleteField}
            onReorderFields={handleReorderFields}
            showDescription={showDescription}
            disableAnimations={disableAnimations}
          />
        )}
      </div>
    </div>
  );
};

export default SchemaVisualEditor;
