import type { FC } from "react";
import { SimpleGrid, UnstyledButton, Text, Paper } from "@mantine/core";
import { useTranslation } from "../../hooks/use-translation.ts";
import type { Translation } from "../../i18n/translation-keys.ts";
import type { SchemaType } from "../../types/jsonSchema.ts";

interface SchemaTypeSelectorProps {
  id?: string;
  value: SchemaType;
  onChange: (value: SchemaType) => void;
}

interface TypeOption {
  id: SchemaType;
  label: keyof Translation;
  description: keyof Translation;
}

const typeOptions: TypeOption[] = [
  {
    id: "string",
    label: "fieldTypeTextLabel",
    description: "fieldTypeTextDescription",
  },
  {
    id: "number",
    label: "fieldTypeNumberLabel",
    description: "fieldTypeNumberDescription",
  },
  {
    id: "boolean",
    label: "fieldTypeBooleanLabel",
    description: "fieldTypeBooleanDescription",
  },
  {
    id: "object",
    label: "fieldTypeObjectLabel",
    description: "fieldTypeObjectDescription",
  },
  {
    id: "array",
    label: "fieldTypeArrayLabel",
    description: "fieldTypeArrayDescription",
  },
];

const SchemaTypeSelector: FC<SchemaTypeSelectorProps> = ({
  id,
  value,
  onChange,
}) => {
  const t = useTranslation();
  return (
    <SimpleGrid cols={{ base: 1, xs: 2, md: 3 }} spacing="xs" id={id}>
      {typeOptions.map((type) => (
        <UnstyledButton
          key={type.id}
          title={t[type.description]}
          onClick={() => onChange(type.id)}
          style={{ width: "100%" }}
        >
          <Paper
            withBorder
            p="xs"
            radius="md"
            style={{
              borderColor:
                value === type.id
                  ? "var(--mantine-color-blue-filled)"
                  : undefined,
              backgroundColor:
                value === type.id
                  ? "var(--mantine-color-blue-light)"
                  : undefined,
            }}
          >
            <Text size="sm" fw={500}>
              {t[type.label]}
            </Text>
            <Text size="xs" c="dimmed" lineClamp={1}>
              {t[type.description]}
            </Text>
          </Paper>
        </UnstyledButton>
      ))}
    </SimpleGrid>
  );
};

export default SchemaTypeSelector;
