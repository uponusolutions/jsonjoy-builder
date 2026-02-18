import { X } from "lucide-react";
import { useState } from "react";
import {
  Select,
  Text,
  Stack,
  Button,
  Badge,
  ActionIcon,
  Group,
  TextInput,
  SimpleGrid,
} from "@mantine/core";
import { useTranslation } from "../../../hooks/use-translation.ts";
import { useValidatedNumericInputs } from "../../../hooks/use-validated-numeric-inputs.ts";
import { withObjectSchema } from "../../../types/jsonSchema.ts";
import type { TypeEditorProps } from "../TypeEditor.tsx";

type Property = "enum" | "minLength" | "maxLength" | "pattern" | "format";
type LengthProperty = "minLength" | "maxLength";

const StringEditor: React.FC<TypeEditorProps> = ({
  schema,
  onChange,
  readOnly = false,
}) => {
  const t = useTranslation();
  const [enumValue, setEnumValue] = useState("");

  const minLength = withObjectSchema(schema, (s) => s.minLength, undefined);
  const maxLength = withObjectSchema(schema, (s) => s.maxLength, undefined);
  const pattern = withObjectSchema(schema, (s) => s.pattern, undefined);
  const format = withObjectSchema(schema, (s) => s.format, undefined);
  const enumValues = withObjectSchema(
    schema,
    (s) => (s.enum as string[]) || [],
    [],
  );

  const { values: lengthInputs, validations: lengthValidations, handleChange: handleLengthRawChange } =
    useValidatedNumericInputs(
      { minLength, maxLength },
      (raw) => {
        if (raw.trim() === "") return { value: undefined };
        const v = Number(raw);
        if (!Number.isInteger(v)) return { error: t.typeValidationErrorIntValue };
        if (v < 0) return { error: t.typeValidationErrorNegativeLength };
        return { value: v };
      },
    );

  const hasLengthRangeError =
    lengthValidations.minLength.value !== undefined &&
    lengthValidations.maxLength.value !== undefined &&
    lengthValidations.minLength.value > lengthValidations.maxLength.value;

  const lengthErrors: Record<LengthProperty, string | boolean | undefined> = {
    minLength: lengthValidations.minLength.error,
    maxLength:
      lengthValidations.maxLength.error ||
      (hasLengthRangeError ? t.stringValidationErrorLengthRange : undefined),
  };

  const lengthFieldConfigs: Array<{
    property: LengthProperty;
    label: string;
    placeholder: string;
  }> = [
      {
        property: "minLength",
        label: t.stringMinimumLengthLabel,
        placeholder: "0",
      },
      {
        property: "maxLength",
        label: t.stringMaximumLengthLabel,
        placeholder: "∞",
      },
    ];

  const handleValidationChange = (property: Property, value: unknown) => {
    onChange({
      ...withObjectSchema(schema, (s) => s, {}),
      [property]: value,
    });
  };

  const handleLengthInputChange = (property: LengthProperty, rawValue: string) => {
    const parsed = handleLengthRawChange(property, rawValue);
    if (!parsed.error) {
      handleValidationChange(property, parsed.value);
    }
  };

  const handleAddEnum = () => {
    if (enumValue.trim() === "") return;
    if (!enumValues.includes(enumValue)) {
      handleValidationChange("enum", [...enumValues, enumValue]);
    }
    setEnumValue("");
  };

  const handleRemoveEnum = (value: string) => {
    const newEnum = enumValues.filter((enumValueItem) => enumValueItem !== value);
    handleValidationChange("enum", newEnum.length > 0 ? newEnum : undefined);
  };

  return (
    <Stack gap="md">
      <SimpleGrid cols={2} spacing="md">
        {lengthFieldConfigs.map((field) => (
          <TextInput
            key={field.property}
            label={field.label}
            type="text"
            inputMode="numeric"
            value={lengthInputs[field.property]}
            onChange={(e) =>
              handleLengthInputChange(field.property, e.target.value)
            }
            placeholder={field.placeholder}
            error={lengthErrors[field.property]}
            disabled={readOnly}
          />
        ))}
      </SimpleGrid>

      <TextInput
        label={t.stringPatternLabel}
        value={pattern ?? ""}
        onChange={(e) =>
          handleValidationChange("pattern", e.target.value || undefined)
        }
        placeholder={t.stringPatternPlaceholder}
        className="font-mono"
        disabled={readOnly}
      />

      <Select
        label={t.stringFormatLabel}
        value={format ?? null}
        onChange={(value) =>
          handleValidationChange("format", value || undefined)
        }
        disabled={readOnly}
        data={[
          { value: "date-time", label: t.stringFormatDateTime },
          { value: "date", label: t.stringFormatDate },
          { value: "time", label: t.stringFormatTime },
          { value: "email", label: t.stringFormatEmail },
          { value: "hostname", label: t.stringFormatHostname },
          { value: "ipv4", label: t.stringFormatIpv4 },
          { value: "ipv6", label: t.stringFormatIpv6 },
          { value: "tel", label: t.stringFormatTel },
          { value: "uri", label: t.stringFormatUri },
          { value: "uuid", label: t.stringFormatUuid },
          { value: "textarea", label: t.stringFormatTextarea },
          { value: "html", label: t.stringFormatHtml },
        ]}
        placeholder={t.stringFormatNone}
        clearable
      />

      <Stack gap="xs">
        <Text size="sm" fw={500}>
          {t.stringAllowedValuesEnumLabel}
        </Text>
        <Group gap="xs">
          <TextInput
            value={enumValue}
            onChange={(e) => setEnumValue(e.target.value)}
            placeholder={t.stringAllowedValuesEnumAddPlaceholder}
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
            disabled={readOnly || !enumValue.trim()}
            variant="default"
          >
            {t.numberAllowedValuesEnumAddLabel}
          </Button>
        </Group>

        {enumValues.length > 0 && (
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

export default StringEditor;
