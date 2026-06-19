import { Button } from "@mantine/core";
import { CirclePlus } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "../../hooks/use-translation.ts";
import { uniqueKey } from "../../lib/schemaEditor.ts";
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
    const name = uniqueKey("newField", existingFields);

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
