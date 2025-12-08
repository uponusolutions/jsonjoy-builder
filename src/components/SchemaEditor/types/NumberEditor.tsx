import { X } from "lucide-react";
import { useId, useState } from "react";
import {
  Text,
  Stack,
  Button,
  Badge,
  ActionIcon,
  SimpleGrid,
  Group,
  TextInput,
} from "@mantine/core";
import { useTranslation } from "../../../hooks/use-translation.ts";
import { withObjectSchema } from "../../../types/jsonSchema.ts";
import type { TypeEditorProps } from "../TypeEditor.tsx";

interface NumberEditorProps extends TypeEditorProps {
  integer?: boolean;
}

type Property =
  | "minimum"
  | "maximum"
  | "exclusiveMinimum"
  | "exclusiveMaximum"
  | "multipleOf"
  | "enum";

const NumberEditor: React.FC<NumberEditorProps> = ({
  schema,
  onChange,
  integer = false,
  readOnly = false,
}) => {
  const [enumValue, setEnumValue] = useState("");
  const t = useTranslation();

  const maximumId = useId();
  const minimumId = useId();
  const exclusiveMinimumId = useId();
  const exclusiveMaximumId = useId();
  const multipleOfId = useId();
  const enumInputId = useId();

  // Extract number-specific validations
  const minimum = withObjectSchema(schema, (s) => s.minimum, undefined);
  const maximum = withObjectSchema(schema, (s) => s.maximum, undefined);
  const exclusiveMinimum = withObjectSchema(
    schema,
    (s) => s.exclusiveMinimum,
    undefined,
  );
  const exclusiveMaximum = withObjectSchema(
    schema,
    (s) => s.exclusiveMaximum,
    undefined,
  );
  const multipleOf = withObjectSchema(schema, (s) => s.multipleOf, undefined);
  const enumValues = withObjectSchema(
    schema,
    (s) => s.enum as number[] | undefined,
    undefined,
  );

  const handleNumberChange = (property: Property, value: string) => {
    const numValue = value === "" ? undefined : Number.parseFloat(value);

    onChange({
      ...withObjectSchema(schema, (s) => s, {}),
      [property]: numValue,
    });
  };

  const handleAddEnum = () => {
    if (enumValue === "") return;
    const numValue = Number.parseFloat(enumValue);
    if (Number.isNaN(numValue)) return;

    const currentEnum = enumValues || [];
    if (!currentEnum.includes(numValue)) {
      onChange({
        ...withObjectSchema(schema, (s) => s, {}),
        enum: [...currentEnum, numValue],
      });
    }
    setEnumValue("");
  };

  const handleRemoveEnum = (value: number) => {
    const currentEnum = enumValues || [];
    const newEnum = currentEnum.filter((v) => v !== value);
    onChange({
      ...withObjectSchema(schema, (s) => s, {}),
      enum: newEnum.length > 0 ? newEnum : undefined,
    });
  };

  return (
    <Stack gap="md">
      <SimpleGrid cols={2} spacing="md">
        <Stack gap="xs">
          <Text component="label" htmlFor={minimumId} size="sm" fw={500}>
            {t.numberMinimumLabel}
          </Text>
          <TextInput
            id={minimumId}
            type="number"
            step={integer ? "1" : "any"}
            value={minimum ?? ""}
            onChange={(e) => handleNumberChange("minimum", e.target.value)}
            placeholder="-∞"
            disabled={readOnly}
          />
        </Stack>
        <Stack gap="xs">
          <Text component="label" htmlFor={maximumId} size="sm" fw={500}>
            {t.numberMaximumLabel}
          </Text>
          <TextInput
            id={maximumId}
            type="number"
            step={integer ? "1" : "any"}
            value={maximum ?? ""}
            onChange={(e) => handleNumberChange("maximum", e.target.value)}
            placeholder="∞"
            disabled={readOnly}
          />
        </Stack>
      </SimpleGrid>

      <SimpleGrid cols={2} spacing="md">
        <Stack gap="xs">
          <Text
            component="label"
            htmlFor={exclusiveMinimumId}
            size="sm"
            fw={500}
          >
            {t.numberExclusiveMinimumLabel}
          </Text>
          <TextInput
            id={exclusiveMinimumId}
            type="number"
            step={integer ? "1" : "any"}
            value={exclusiveMinimum ?? ""}
            onChange={(e) =>
              handleNumberChange("exclusiveMinimum", e.target.value)
            }
            placeholder="-∞"
            disabled={readOnly}
          />
        </Stack>
        <Stack gap="xs">
          <Text
            component="label"
            htmlFor={exclusiveMaximumId}
            size="sm"
            fw={500}
          >
            {t.numberExclusiveMaximumLabel}
          </Text>
          <TextInput
            id={exclusiveMaximumId}
            type="number"
            step={integer ? "1" : "any"}
            value={exclusiveMaximum ?? ""}
            onChange={(e) =>
              handleNumberChange("exclusiveMaximum", e.target.value)
            }
            placeholder="∞"
            disabled={readOnly}
          />
        </Stack>
      </SimpleGrid>

      <Stack gap="xs">
        <Text component="label" htmlFor={multipleOfId} size="sm" fw={500}>
          {t.numberMultipleOfLabel}
        </Text>
        <TextInput
          id={multipleOfId}
          type="number"
          step={integer ? "1" : "any"}
          min={0}
          value={multipleOf ?? ""}
          onChange={(e) => handleNumberChange("multipleOf", e.target.value)}
          placeholder="1"
          disabled={readOnly}
        />
      </Stack>

      <Stack gap="xs">
        <Text size="sm" fw={500}>
          {t.numberAllowedValuesEnumLabel}
        </Text>
        <Group gap="xs">
          <TextInput
            id={enumInputId}
            type="number"
            step={integer ? "1" : "any"}
            value={enumValue}
            onChange={(e) => setEnumValue(e.target.value)}
            placeholder={t.numberAllowedValuesEnumAddPlaceholder}
            disabled={readOnly}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddEnum();
              }
            }}
            style={{ flex: 1 }}
          />
          <Button
            onClick={handleAddEnum}
            disabled={readOnly || enumValue === ""}
            variant="default"
          >
            {t.numberAllowedValuesEnumAddLabel}
          </Button>
        </Group>

        {enumValues && enumValues.length > 0 && (
          <Group gap="xs" mt="xs">
            {enumValues.map((value) => (
              <Badge
                key={value}
                variant="light"
                rightSection={
                  !readOnly && (
                    <ActionIcon
                      size="xs"
                      color="blue"
                      radius="xl"
                      variant="transparent"
                      onClick={() => handleRemoveEnum(value)}
                    >
                      <X size={10} />
                    </ActionIcon>
                  )
                }
              >
                {value}
              </Badge>
            ))}
          </Group>
        )}
      </Stack>
    </Stack>
  );
};

export default NumberEditor;
