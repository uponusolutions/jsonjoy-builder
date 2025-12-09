import { Check, ChevronDown } from "lucide-react";
import { useState, useId } from "react";
import { Menu, Button, Badge } from "@mantine/core";
import { useTranslation } from "../../hooks/use-translation.ts";

export interface RequiredDropdownProps {
  required: boolean;
  onChange: (required: boolean) => void;
  readOnly: boolean;
}

export const RequiredDropdown: React.FC<RequiredDropdownProps> = ({
  required,
  onChange,
  readOnly,
}) => {
  const t = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();

  const getColor = (isRequired: boolean) => (isRequired ? "red" : "gray");
  const getLabel = (isRequired: boolean) =>
    isRequired ? t.propertyRequired : t.propertyOptional;

  return (
    <Menu id={menuId} opened={isOpen} onChange={setIsOpen} disabled={readOnly}>
      <Menu.Target>
        <Button
          variant="light"
          color={getColor(required)}
          size="xs"
          rightSection={!readOnly && <ChevronDown size={14} />}
          onClick={() => !readOnly && setIsOpen(!isOpen)}
          style={{
            width: readOnly ? "auto" : 120,
            padding: "0 8px",
          }}
        >
          {getLabel(required)}
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item
          onClick={() => onChange(true)}
          rightSection={required && <Check size={14} />}
        >
          <Badge size="xs" variant="light" color={getColor(true)}>
            {getLabel(true)}
          </Badge>
        </Menu.Item>
        <Menu.Item
          onClick={() => onChange(false)}
          rightSection={!required && <Check size={14} />}
        >
          <Badge size="xs" variant="light" color={getColor(false)}>
            {getLabel(false)}
          </Badge>
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};

export default RequiredDropdown;
