import { Badge, Button, Menu } from "@mantine/core";
import { Check, ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "../../hooks/use-translation.ts";
import { getTypeLabel } from "../../lib/utils.ts";
import type { JSONSchema, SchemaType } from "../../types/jsonSchema.ts";
import {
  type CustomFieldType,
  matchingCustomType,
  useSchemaEditorExtensions,
} from "./extensions.tsx";

export interface TypeDropdownProps {
  value: SchemaType;
  format?: string;
  onChange: (value: SchemaType, format?: string) => void;
  /** Called when a custom type of the extensions is chosen. */
  onCustomType?: (type: CustomFieldType) => void;
  /** The field's schema, to tell which custom type (if any) it matches. */
  schema?: JSONSchema;
  className?: string;
  readOnly: boolean;
}

const typeOptions: SchemaType[] = [
  "string",
  "number",
  "boolean",
  "object",
  "array",
  "null",
];

const getTypeColor = (type: SchemaType | undefined): string => {
  switch (type) {
    case "string":
      return "green";
    case "number":
    case "integer":
      return "blue";
    case "boolean":
      return "orange";
    case "object":
      return "grape";
    case "array":
      return "indigo";
    case "null":
      return "gray";
    default:
      return "gray";
  }
};

export const TypeDropdown: React.FC<TypeDropdownProps> = ({
  value,
  onChange,
  onCustomType,
  schema,
  className,
  readOnly,
}) => {
  const t = useTranslation();
  const extensions = useSchemaEditorExtensions();
  // Without a handler a custom item would be dead, so only offer them then.
  const customTypes = onCustomType ? (extensions.customTypes ?? []) : [];
  const activeCustomType =
    schema === undefined ? undefined : matchingCustomType(extensions, schema);
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();

  const handleTypeChange = (newType: SchemaType) => {
    onChange(newType, undefined);
  };

  return (
    <Menu id={menuId} opened={isOpen} onChange={setIsOpen} disabled={readOnly}>
      <Menu.Target>
        <Button
          variant="light"
          color={activeCustomType?.color ?? getTypeColor(value)}
          size="xs"
          rightSection={!readOnly && <ChevronDown size={14} />}
          onClick={() => !readOnly && setIsOpen(!isOpen)}
          style={{
            width: readOnly ? "auto" : 120,
            padding: "0 8px",
          }}
          className={className}
        >
          {activeCustomType?.label ?? getTypeLabel(t, value)}
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        {typeOptions.map((type) => (
          <Menu.Item
            key={type}
            onClick={() => handleTypeChange(type)}
            rightSection={
              !activeCustomType && value === type && <Check size={14} />
            }
          >
            <Badge size="xs" variant="light" color={getTypeColor(type)}>
              {getTypeLabel(t, type)}
            </Badge>
          </Menu.Item>
        ))}
        {customTypes.length > 0 && <Menu.Divider />}
        {customTypes.map((type) => (
          <Menu.Item
            key={type.id}
            title={type.description}
            onClick={() => onCustomType?.(type)}
            rightSection={activeCustomType === type && <Check size={14} />}
          >
            <Badge size="xs" variant="light" color={type.color ?? "gray"}>
              {type.label}
            </Badge>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
};

export default TypeDropdown;
