import { useId, useState } from "react";
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
  const [minItems, setMinItems] = useState<number | undefined>(
    withObjectSchema(schema, (s) => s.minItems, undefined),
  );
  const [maxItems, setMaxItems] = useState<number | undefined>(
    withObjectSchema(schema, (s) => s.maxItems, undefined),
  );
  const [uniqueItems, setUniqueItems] = useState<boolean>(
    withObjectSchema(schema, (s) => s.uniqueItems || false, false),
  );

  const minItemsId = useId();
  const maxItemsId = useId();
  const uniqueItemsId = useId();

  // Get the array's item schema
  const itemsSchema = getArrayItemsSchema(schema) || { type: "string" };

  // Get the type of the array items
  const itemType = withObjectSchema(
    itemsSchema,
    (s) => (s.type || "string") as SchemaType,
    "string" as SchemaType,
  );

  const handleMinItemsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
      ? Number.parseInt(e.target.value, 10)
      : undefined;
    setMinItems(val);
    onChange({
      ...withObjectSchema(schema, (s) => s, {}),
      minItems: val,
    });
  };

  const handleMaxItemsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
      ? Number.parseInt(e.target.value, 10)
      : undefined;
    setMaxItems(val);
    onChange({
      ...withObjectSchema(schema, (s) => s, {}),
      maxItems: val,
    });
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
        <Stack gap="xs">
          <Text component="label" htmlFor={minItemsId} size="sm" fw={500}>
            {t.arrayMinimumLabel}
          </Text>
          <TextInput
            id={minItemsId}
            type="number"
            min={0}
            value={minItems ?? ""}
            onChange={handleMinItemsChange}
            placeholder="0"
            disabled={readOnly}
          />
        </Stack>
        <Stack gap="xs">
          <Text component="label" htmlFor={maxItemsId} size="sm" fw={500}>
            {t.arrayMaximumLabel}
          </Text>
          <TextInput
            id={maxItemsId}
            type="number"
            min={0}
            value={maxItems ?? ""}
            onChange={handleMaxItemsChange}
            placeholder="∞"
            disabled={readOnly}
          />
        </Stack>
      </SimpleGrid>

      <Checkbox
        label={t.arrayForceUniqueItemsLabel}
        id={uniqueItemsId}
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
