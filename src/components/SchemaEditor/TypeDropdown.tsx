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
  format,
  onChange,
  className,
  readOnly,
}) => {
  const t = useTranslation();
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
          color={getTypeColor(value)}
          size="xs"
          rightSection={!readOnly && <ChevronDown size={14} />}
          onClick={() => !readOnly && setIsOpen(!isOpen)}
          style={{
            width: readOnly ? "auto" : 120,
            padding: "0 8px",
          }}
          className={className}
        >
          {getTypeLabel(t, value)}
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        {typeOptions.map((type) => (
          <Menu.Item
            key={type}
            onClick={() => handleTypeChange(type)}
            rightSection={value === type && <Check size={14} />}
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
