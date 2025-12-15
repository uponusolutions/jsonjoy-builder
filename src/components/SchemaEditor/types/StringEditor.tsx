import { X, AlertCircle } from "lucide-react";
import { useId, useState } from "react";
import {
  Select,
  Text,
  Stack,
  Button,
  Badge,
  ActionIcon,
  Group,
  TextInput,
  Alert,
} from "@mantine/core";
import { useTranslation } from "../../../hooks/use-translation.ts";
import { withObjectSchema } from "../../../types/jsonSchema.ts";
import type { TypeEditorProps } from "../TypeEditor.tsx";

type Property = "enum" | "minLength" | "maxLength" | "pattern" | "format";

const StringEditor: React.FC<TypeEditorProps> = ({
  schema,
  onChange,
  readOnly = false,
  validationNode,
}) => {
  const t = useTranslation();
  const [enumValue, setEnumValue] = useState("");

  const minLengthId = useId();
  const maxLengthId = useId();
  const patternId = useId();
  const formatId = useId();
  const enumInputId = useId();

  // Extract string-specific validations
  const minLength = withObjectSchema(schema, (s) => s.minLength, undefined);
  const maxLength = withObjectSchema(schema, (s) => s.maxLength, undefined);
  const pattern = withObjectSchema(schema, (s) => s.pattern, undefined);
  const format = withObjectSchema(schema, (s) => s.format, undefined);
  const enumValues = withObjectSchema(
    schema,
    (s) => (s.enum as string[]) || [],
    [],
  );

  // Find validation errors
  const errors = validationNode?.validation.errors || [];
  const conflictError = errors.find((e) =>
    e.path.includes("enumLengthConflict"),
  );

  // Handle validation change
  const handleValidationChange = (property: Property, value: unknown) => {
    onChange({
      ...withObjectSchema(schema, (s) => s, {}),
      [property]: value,
    });
  };

  const handleAddEnum = () => {
    if (enumValue.trim() === "") return;
    if (!enumValues.includes(enumValue)) {
      handleValidationChange("enum", [...enumValues, enumValue]);
    }
    setEnumValue("");
  };

  const handleRemoveEnum = (value: string) => {
    const newEnum = enumValues.filter((v) => v !== value);
    handleValidationChange("enum", newEnum.length > 0 ? newEnum : undefined);
  };

  return (
    <Stack gap="md">
      {conflictError && (
        <Alert
          icon={<AlertCircle size={16} />}
          title="Validation Error"
          color="red"
        >
          {conflictError.message}
        </Alert>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Text component="label" htmlFor={minLengthId} size="sm" fw={500}>
            {t.stringMinimumLengthLabel}
          </Text>
          <TextInput
            id={minLengthId}
            type="number"
            min={0}
            value={minLength ?? ""}
            onChange={(e) =>
              handleValidationChange(
                "minLength",
                e.target.value
                  ? Number.parseInt(e.target.value, 10)
                  : undefined,
              )
            }
            placeholder="0"
            disabled={readOnly}
          />
        </div>
        <div className="space-y-2">
          <Text component="label" htmlFor={maxLengthId} size="sm" fw={500}>
            {t.stringMaximumLengthLabel}
          </Text>
          <TextInput
            id={maxLengthId}
            type="number"
            min={0}
            value={maxLength ?? ""}
            onChange={(e) =>
              handleValidationChange(
                "maxLength",
                e.target.value
                  ? Number.parseInt(e.target.value, 10)
                  : undefined,
              )
            }
            placeholder="∞"
            disabled={readOnly}
          />
        </div>
      </div>

      <Stack gap="xs">
        <Text component="label" htmlFor={patternId} size="sm" fw={500}>
          {t.stringPatternLabel}
        </Text>
        <TextInput
          id={patternId}
          value={pattern ?? ""}
          onChange={(e) =>
            handleValidationChange("pattern", e.target.value || undefined)
          }
          placeholder={t.stringPatternPlaceholder}
          className="font-mono"
          disabled={readOnly}
        />
      </Stack>

      <Stack gap="xs">
        <Text component="label" htmlFor={formatId} size="sm" fw={500}>
          {t.stringFormatLabel}
        </Text>
        <Select
          id={formatId}
          value={format}
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
            { value: "uri", label: t.stringFormatUri },
            { value: "uuid", label: t.stringFormatUuid },
          ]}
          placeholder={t.stringFormatNone}
          clearable
        />
      </Stack>

      <Stack gap="xs">
        <Text size="sm" fw={500}>
          {t.stringAllowedValuesEnumLabel}
        </Text>
        <Group gap="xs">
          <TextInput
            id={enumInputId}
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
