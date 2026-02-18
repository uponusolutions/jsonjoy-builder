import { Stack, SimpleGrid, TextInput, TagsInput } from "@mantine/core";
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
  const t = useTranslation();

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

  const {
    values: numberInputs,
    validations: numberValidations,
    handleChange: handleNumberRawChange,
  } = useValidatedNumericInputs(
    { minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf },
    (raw, key) => {
      if (raw.trim() === "") return { value: undefined };
      const v = Number(raw);
      if (Number.isNaN(v)) return { error: true };
      if (integer && !Number.isInteger(v))
        return { error: t.typeValidationErrorIntValue };
      if (key === "multipleOf" && v <= 0)
        return { error: t.typeValidationErrorPositive };
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

  const handleEnumChange = (tags: string[]) => {
    const nums = tags
      .map(Number)
      .filter((v) => !Number.isNaN(v))
      .filter((v) => !integer || Number.isInteger(v));
    const unique = [...new Set(nums)];
    onChange({
      ...withObjectSchema(schema, (s) => s, {}),
      enum: unique.length > 0 ? unique : undefined,
    });
  };

  return (
    <Stack gap="md">
      <SimpleGrid cols={2} spacing="md">
        <TextInput
          label={t.numberMinimumLabel}
          type="text"
          inputMode={integer ? "numeric" : "decimal"}
          value={numberInputs.minimum}
          onChange={(e) => handleNumberChange("minimum", e.target.value)}
          placeholder="-∞"
          error={numberErrors.minimum}
          disabled={readOnly}
        />
        <TextInput
          label={t.numberMaximumLabel}
          type="text"
          inputMode={integer ? "numeric" : "decimal"}
          value={numberInputs.maximum}
          onChange={(e) => handleNumberChange("maximum", e.target.value)}
          placeholder="∞"
          error={numberErrors.maximum}
          disabled={readOnly}
        />
      </SimpleGrid>

      <SimpleGrid cols={2} spacing="md">
        <TextInput
          label={t.numberExclusiveMinimumLabel}
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
        <TextInput
          label={t.numberExclusiveMaximumLabel}
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
      </SimpleGrid>

      <TextInput
        label={t.numberMultipleOfLabel}
        type="text"
        inputMode={integer ? "numeric" : "decimal"}
        value={numberInputs.multipleOf}
        onChange={(e) => handleNumberChange("multipleOf", e.target.value)}
        placeholder="1"
        error={numberErrors.multipleOf}
        disabled={readOnly}
      />

      <TagsInput
        label={t.numberAllowedValuesEnumLabel}
        placeholder={t.numberAllowedValuesEnumAddPlaceholder}
        value={enumValues?.map(String) ?? []}
        onChange={handleEnumChange}
        disabled={readOnly}
        splitChars={[",", " ", "Enter"]}
        acceptValueOnBlur
      />
    </Stack>
  );
};

export default NumberEditor;
