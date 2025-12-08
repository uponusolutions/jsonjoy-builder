import { useId } from "react";
import { Switch, Text, Group, Stack, Paper } from "@mantine/core";
import { useTranslation } from "../../../hooks/use-translation.ts";
import { withObjectSchema } from "../../../types/jsonSchema.ts";
import type { TypeEditorProps } from "../TypeEditor.tsx";

const BooleanEditor: React.FC<TypeEditorProps> = ({
  schema,
  onChange,
  readOnly = false,
}) => {
  const t = useTranslation();
  const allowTrueId = useId();
  const allowFalseId = useId();

  // Extract boolean-specific validation
  const enumValues = withObjectSchema(
    schema,
    (s) => s.enum as boolean[] | undefined,
    null,
  );

  // Determine if we have enum restrictions
  const hasRestrictions = Array.isArray(enumValues);
  const allowsTrue = !hasRestrictions || enumValues?.includes(true) || false;
  const allowsFalse = !hasRestrictions || enumValues?.includes(false) || false;

  // Handle changing the allowed values
  const handleAllowedChange = (value: boolean, allowed: boolean) => {
    let newEnum: boolean[] | undefined;

    if (allowed) {
      // If allowing this value
      if (!hasRestrictions) {
        // No current restrictions, nothing to do
        return;
      }

      if (enumValues?.includes(value)) {
        // Already allowed, nothing to do
        return;
      }

      // Add this value to enum
      newEnum = enumValues ? [...enumValues, value] : [value];

      // If both are now allowed, we can remove the enum constraint
      if (newEnum.includes(true) && newEnum.includes(false)) {
        newEnum = undefined;
      }
    } else {
      // If disallowing this value
      if (!hasRestrictions) {
        // Currently no restrictions, so we need to restrict to the OTHER value
        newEnum = [!value];
      } else {
        // Remove this value from enum
        newEnum = enumValues?.filter((v) => v !== value);
      }
    }

    onChange({
      ...withObjectSchema(schema, (s) => s, {}),
      enum: newEnum,
    });
  };

  return (
    <Stack gap="md">
      <Paper withBorder p="xs" radius="md" shadow="xs">
        <Group justify="space-between" align="center">
          <Stack gap={2}>
            <Text component="label" htmlFor={allowTrueId} size="sm" fw={500}>
              {t.booleanAllowTrueLabel}
            </Text>
          </Stack>
          <Switch
            id={allowTrueId}
            checked={allowsTrue}
            onChange={(e) => handleAllowedChange(true, e.currentTarget.checked)}
            disabled={readOnly}
          />
        </Group>
      </Paper>

      <Paper withBorder p="xs" radius="md" shadow="xs">
        <Group justify="space-between" align="center">
          <Stack gap={2}>
            <Text component="label" htmlFor={allowFalseId} size="sm" fw={500}>
              {t.booleanAllowFalseLabel}
            </Text>
          </Stack>
          <Switch
            id={allowFalseId}
            checked={allowsFalse}
            onChange={(e) => handleAllowedChange(false, e.currentTarget.checked)}
            disabled={readOnly}
          />
        </Group>
      </Paper>
    </Stack>
  );
};

export default BooleanEditor;
