import { Check, ChevronDown } from "lucide-react";
import { useState, useId } from "react";
import { Menu, Button, Badge } from "@mantine/core";
import { useTranslation } from "../../hooks/use-translation.ts";
import { getTypeLabel } from "../../lib/utils.ts";
import type { SchemaType } from "../../types/jsonSchema.ts";

export interface TypeDropdownProps {
  value: SchemaType;
  format?: string;
  onChange: (value: SchemaType, format?: string) => void;
  className?: string;
  readOnly: boolean;
}

const typeOptions: (SchemaType | "textarea" | "html")[] = [
  "string",
  "textarea",
  "html",
  "number",
  "boolean",
  "object",
  "array",
  "null",
];

const getTypeColor = (
  type: SchemaType | "textarea" | "html" | undefined,
): string => {
  switch (type) {
    case "string":
      return "green";
    case "textarea":
      return "teal";
    case "html":
      return "cyan";
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
  format,
  onChange,
  className,
  readOnly,
}) => {
  const t = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();

  // Determine effective type for UI
  const effectiveType =
    value === "string" && format === "textarea"
      ? "textarea"
      : value === "string" && format === "html"
        ? "html"
        : value;

  const handleTypeChange = (newType: SchemaType | "textarea" | "html") => {
    if (newType === "textarea") {
      onChange("string", "textarea");
    } else if (newType === "html") {
      onChange("string", "html");
    } else {
      // If switching away from textarea/html to string, clear format?
      // Or if switching to any other type, format is irrelevant (usually cleared by parent or ignored)
      // But if switching to string, we should probably clear format if it was textarea/html
      const newFormat =
        newType === "string" &&
        (effectiveType === "textarea" || effectiveType === "html")
          ? undefined
          : undefined;
      onChange(newType as SchemaType, newFormat);
    }
  };

  return (
    <Menu id={menuId} opened={isOpen} onChange={setIsOpen} disabled={readOnly}>
      <Menu.Target>
        <Button
          variant="light"
          color={getTypeColor(effectiveType)}
          size="xs"
          rightSection={!readOnly && <ChevronDown size={14} />}
          onClick={() => !readOnly && setIsOpen(!isOpen)}
          style={{
            width: readOnly ? "auto" : 120,
            padding: "0 8px",
          }}
          className={className}
        >
          {getTypeLabel(t, effectiveType)}
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        {typeOptions.map((type) => (
          <Menu.Item
            key={type}
            onClick={() => handleTypeChange(type)}
            rightSection={effectiveType === type && <Check size={14} />}
          >
            <Badge size="xs" variant="light" color={getTypeColor(type)}>
              {getTypeLabel(t, type)}
            </Badge>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
};

export default TypeDropdown;
