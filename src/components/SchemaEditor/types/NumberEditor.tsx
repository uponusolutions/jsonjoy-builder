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
import { useValidatedNumericInputs } from "../../../hooks/use-validated-numeric-inputs.ts";
import { withObjectSchema } from "../../../types/jsonSchema.ts";
import type { TypeEditorProps } from "../TypeEditor.tsx";

interface NumberEditorProps extends TypeEditorProps {
  integer?: boolean;
}

type NumericProperty =
  | "minimum"
  | "maximum"
  | "exclusiveMinimum"
  | "exclusiveMaximum"
  | "multipleOf";

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

  const { values: numberInputs, validations: numberValidations, handleChange: handleNumberRawChange } =
    useValidatedNumericInputs(
      { minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf },
      (raw, key) => {
        if (raw.trim() === "") return { value: undefined };
        const v = Number(raw);
        if (Number.isNaN(v)) return { error: true };
        if (integer && !Number.isInteger(v)) return { error: t.typeValidationErrorIntValue };
        if (key === "multipleOf" && v <= 0) return { error: t.typeValidationErrorPositive };
        return { value: v };
      },
    );

  const hasMinMaxError =
    numberValidations.minimum.value !== undefined &&
    numberValidations.maximum.value !== undefined &&
    numberValidations.minimum.value > numberValidations.maximum.value;

  const numberErrors: Record<NumericProperty, string | boolean | undefined> = {
    minimum: numberValidations.minimum.error,
    maximum:
      numberValidations.maximum.error ||
      (hasMinMaxError ? t.numberValidationErrorMinMax : undefined),
    exclusiveMinimum: numberValidations.exclusiveMinimum.error,
    exclusiveMaximum: numberValidations.exclusiveMaximum.error,
    multipleOf: numberValidations.multipleOf.error,
  };

  const handleNumberChange = (property: NumericProperty, value: string) => {
    const parsed = handleNumberRawChange(property, value);
    if (parsed.error) {
      return;
    }

    onChange({
      ...withObjectSchema(schema, (s) => s, {}),
      [property]: parsed.value,
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
            type="text"
            inputMode={integer ? "numeric" : "decimal"}
            value={numberInputs.minimum}
            onChange={(e) => handleNumberChange("minimum", e.target.value)}
            placeholder="-∞"
            error={numberErrors.minimum}
            disabled={readOnly}
          />
        </Stack>
        <Stack gap="xs">
          <Text component="label" htmlFor={maximumId} size="sm" fw={500}>
            {t.numberMaximumLabel}
          </Text>
          <TextInput
            id={maximumId}
            type="text"
            inputMode={integer ? "numeric" : "decimal"}
            value={numberInputs.maximum}
            onChange={(e) => handleNumberChange("maximum", e.target.value)}
            placeholder="∞"
            error={numberErrors.maximum}
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
            type="text"
            inputMode={integer ? "numeric" : "decimal"}
            value={numberInputs.exclusiveMinimum}
            onChange={(e) =>
              handleNumberChange("exclusiveMinimum", e.target.value)
            }
            placeholder="-∞"
            error={numberErrors.exclusiveMinimum}
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
            type="text"
            inputMode={integer ? "numeric" : "decimal"}
            value={numberInputs.exclusiveMaximum}
            onChange={(e) =>
              handleNumberChange("exclusiveMaximum", e.target.value)
            }
            placeholder="∞"
            error={numberErrors.exclusiveMaximum}
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
          type="text"
          inputMode={integer ? "numeric" : "decimal"}
          value={numberInputs.multipleOf}
          onChange={(e) => handleNumberChange("multipleOf", e.target.value)}
          placeholder="1"
          error={numberErrors.multipleOf}
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
