import React, { Suspense } from "react";
import { useTranslation } from "../../hooks/use-translation.ts";
import type {
  JSONSchema as JSONSchemaType,
  NewField,
  ObjectJSONSchema,
  SchemaType,
} from "../../types/jsonSchema.ts";
import {
  asObjectSchema,
  getSchemaDescription,
  withObjectSchema,
} from "../../types/jsonSchema.ts";
import SchemaPropertyEditor from "./SchemaPropertyEditor.tsx";

// This component is now just a simple wrapper around SchemaPropertyEditor
// to maintain backward compatibility during migration
interface SchemaFieldProps {
  name: string;
  schema: JSONSchemaType;
  required?: boolean;
  readOnly: boolean;
  onDelete: () => void;
  onEdit: (updatedField: NewField) => void;
  onAddField?: (newField: NewField) => void;
  isNested?: boolean;
  depth?: number;
}

const SchemaField: React.FC<SchemaFieldProps> = (props) => {
  const {
    name,
    schema,
    required = false,
    onDelete,
    onEdit,
    depth = 0,
    readOnly = false,
  } = props;

  // Handle name change
  const handleNameChange = (newName: string) => {
    if (newName === name) return;

    // Get type in a safe way
    const type = withObjectSchema(
      schema,
      (s) => s.type || "object",
      "object",
    ) as SchemaType;

    // Get description in a safe way
    const description = getSchemaDescription(schema);

    onEdit({
      name: newName,
      type: Array.isArray(type) ? type[0] : type,
      description,
      required,
      validation: asObjectSchema(schema),
    });
  };

  // Handle required status change
  const handleRequiredChange = (isRequired: boolean) => {
    if (isRequired === required) return;

    // Get type in a safe way
    const type = withObjectSchema(
      schema,
      (s) => s.type || "object",
      "object",
    ) as SchemaType;

    // Get description in a safe way
    const description = getSchemaDescription(schema);

    onEdit({
      name,
      type: Array.isArray(type) ? type[0] : type,
      description,
      required: isRequired,
      validation: asObjectSchema(schema),
    });
  };

  // Handle schema change
  const handleSchemaChange = (newSchema: ObjectJSONSchema) => {
    // Type will be defined in the schema
    const type = newSchema.type || "object";

    // Description will be defined in the schema
    const description = newSchema.description || "";

    onEdit({
      name,
      type: Array.isArray(type) ? type[0] : type,
      description,
      required,
      validation: newSchema,
    });
  };

  return (
    <SchemaPropertyEditor
      name={name}
      readOnly={readOnly}
      schema={schema}
      required={required}
      onDelete={onDelete}
      onNameChange={handleNameChange}
      onRequiredChange={handleRequiredChange}
      onSchemaChange={handleSchemaChange}
      depth={depth}
    />
  );
};

export default SchemaField;

// ExpandButton - extract for reuse
export interface ExpandButtonProps {
  expanded: boolean;
  onClick: () => void;
}

export const ExpandButton: React.FC<ExpandButtonProps> = ({
  expanded,
  onClick,
}) => {
  const t = useTranslation();
  const ChevronDown = React.lazy(() =>
    import("lucide-react").then((mod) => ({ default: mod.ChevronDown })),
  );
  const ChevronRight = React.lazy(() =>
    import("lucide-react").then((mod) => ({ default: mod.ChevronRight })),
  );

  return (
    <button
      type="button"
      className="text-muted-foreground hover:text-foreground transition-colors"
      onClick={onClick}
      aria-label={expanded ? t.collapse : t.expand}
    >
      <Suspense fallback={<div className="w-[18px] h-[18px]" />}>
        {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </Suspense>
    </button>
  );
};

