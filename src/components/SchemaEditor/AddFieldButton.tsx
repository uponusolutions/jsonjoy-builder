import { CirclePlus } from "lucide-react";
import type { FC } from "react";
import { Button } from "@mantine/core";
import { useTranslation } from "../../hooks/use-translation.ts";
import type { NewField } from "../../types/jsonSchema.ts";

interface AddFieldButtonProps {
  onAddField: (field: NewField) => void;
  variant?: "primary" | "secondary";
  showDescription?: boolean;
  existingFields?: string[];
}

const AddFieldButton: FC<AddFieldButtonProps> = ({
  onAddField,
  variant = "primary",
  existingFields = [],
}) => {
  const t = useTranslation();

  const handleAddField = () => {
    let name = "newField";
    let counter = 1;
    while (existingFields.includes(name)) {
      name = `newField${counter}`;
      counter++;
    }

    onAddField({
      name,
      type: "string",
      description: "",
      required: false,
      validation: {
        type: "string",
      },
    });
  };

  return (
    <Button
      onClick={handleAddField}
      variant={variant === "primary" ? "filled" : "outline"}
      size="sm"
      leftSection={<CirclePlus size={16} />}
    >
      {t.fieldAddNewButton}
    </Button>
  );
};

export default AddFieldButton;
