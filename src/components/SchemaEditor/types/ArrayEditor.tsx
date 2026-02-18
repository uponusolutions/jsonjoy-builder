import { useState } from "react";
import {
  Text,
  Group,
  Stack,
  Box,
  SimpleGrid,
  TextInput,
  Checkbox,
} from "@mantine/core";
import { useTranslation } from "../../../hooks/use-translation.ts";
import { useValidatedNumericInputs } from "../../../hooks/use-validated-numeric-inputs.ts";
import { getArrayItemsSchema } from "../../../lib/schemaEditor.ts";
import type {
  ObjectJSONSchema,
  SchemaType,
} from "../../../types/jsonSchema.ts";
import { withObjectSchema } from "../../../types/jsonSchema.ts";
import TypeDropdown from "../TypeDropdown.tsx";
import type { TypeEditorProps } from "../TypeEditor.tsx";
import TypeEditor from "../TypeEditor.tsx";

const ArrayEditor: React.FC<TypeEditorProps> = ({
  schema,
  readOnly = false,
  validationNode,
  onChange,
  depth = 0,
  showDescription = true,
}) => {
  const t = useTranslation();
  const minItems = withObjectSchema(schema, (s) => s.minItems, undefined);
  const maxItems = withObjectSchema(schema, (s) => s.maxItems, undefined);
  const [uniqueItems, setUniqueItems] = useState<boolean>(
    withObjectSchema(schema, (s) => s.uniqueItems || false, false),
  );

  const {
    values: lengthInputs,
    validations: lengthValidations,
    handleChange: handleLengthChange,
  } = useValidatedNumericInputs({ minItems, maxItems }, (raw) => {
    if (raw.trim() === "") return { value: undefined };
    const v = Number(raw);
    if (!Number.isInteger(v)) return { error: t.typeValidationErrorIntValue };
    if (v < 0) return { error: t.typeValidationErrorNegativeLength };
    return { value: v };
  });

  const hasMinMaxError =
    lengthValidations.minItems.value !== undefined &&
    lengthValidations.maxItems.value !== undefined &&
    lengthValidations.minItems.value > lengthValidations.maxItems.value;

  const minItemsError = lengthValidations.minItems.error;
  const maxItemsError =
    lengthValidations.maxItems.error ||
    (hasMinMaxError ? t.arrayValidationErrorMinMax : undefined);

  // Get the array's item schema
  const itemsSchema = getArrayItemsSchema(schema) || { type: "string" };

  // Get the type of the array items
  const itemType = withObjectSchema(
    itemsSchema,
    (s) => (s.type || "string") as SchemaType,
    "string" as SchemaType,
  );

  const handleArrayLengthInputChange = (
    property: "minItems" | "maxItems",
    rawValue: string,
  ) => {
    const parsed = handleLengthChange(property, rawValue);
    if (!parsed.error) {
      onChange({
        ...withObjectSchema(schema, (s) => s, {}),
        [property]: parsed.value,
      });
    }
  };

  const handleUniqueItemsChange = (checked: boolean) => {
    setUniqueItems(checked);
    onChange({
      ...withObjectSchema(schema, (s) => s, {}),
      uniqueItems: checked,
    });
  };

  const handleItemsTypeChange = (newType: SchemaType) => {
    // Create a new items schema with the new type
    const newItemsSchema: ObjectJSONSchema = {
      ...withObjectSchema(itemsSchema, (s) => s, {}),
      type: newType,
    };

    onChange({
      ...withObjectSchema(schema, (s) => s, {}),
      items: newItemsSchema,
    });
  };

  const handleItemsSchemaChange = (newItemsSchema: ObjectJSONSchema) => {
    onChange({
      ...withObjectSchema(schema, (s) => s, {}),
      items: newItemsSchema,
    });
  };

  return (
    <Stack gap="md">
      <SimpleGrid cols={2} spacing="md">
        <TextInput
          label={t.arrayMinimumLabel}
          type="text"
          inputMode="numeric"
          value={lengthInputs.minItems}
          onChange={(e) =>
            handleArrayLengthInputChange("minItems", e.target.value)
          }
          placeholder="0"
          error={minItemsError}
          disabled={readOnly}
        />
        <TextInput
          label={t.arrayMaximumLabel}
          type="text"
          inputMode="numeric"
          value={lengthInputs.maxItems}
          onChange={(e) =>
            handleArrayLengthInputChange("maxItems", e.target.value)
          }
          placeholder="∞"
          error={maxItemsError}
          disabled={readOnly}
        />
      </SimpleGrid>

      <Checkbox
        label={t.arrayForceUniqueItemsLabel}
        checked={uniqueItems}
        onChange={(e) => handleUniqueItemsChange(e.currentTarget.checked)}
        disabled={readOnly}
      />

      <Stack
        gap="md"
        pt="xs"
        style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}
      >
        <Group justify="space-between" align="center">
          <Text size="sm" fw={500}>
            {t.arrayItemTypeLabel}
          </Text>
          <TypeDropdown
            value={itemType}
            onChange={handleItemsTypeChange}
            readOnly={readOnly}
          />
        </Group>

        <Box
          pl="md"
          ml="xs"
          style={{
            borderLeft: "2px solid var(--mantine-color-default-border)",
          }}
        >
          <TypeEditor
            schema={itemsSchema}
            readOnly={readOnly}
            validationNode={validationNode?.children?.items}
            onChange={handleItemsSchemaChange}
            depth={depth + 1}
            showDescription={showDescription}
          />
        </Box>
      </Stack>
    </Stack>
  );
};

export default ArrayEditor;
