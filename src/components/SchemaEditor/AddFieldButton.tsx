import { CirclePlus, HelpCircle, Info } from "lucide-react";
import { type FC, type FormEvent, useId, useState } from "react";
import {
  Badge,
  Button,
  Modal,
  TextInput,
  Tooltip,
  Checkbox,
  Group,
  Stack,
  Code,
  Text,
  Box,
  SimpleGrid,
} from "@mantine/core";
import { useTranslation } from "../../hooks/use-translation.ts";
import type {
  NewField,
  ObjectJSONSchema,
  SchemaType,
} from "../../types/jsonSchema.ts";
import SchemaTypeSelector from "./SchemaTypeSelector.tsx";
import TypeEditor from "./TypeEditor.tsx";

interface AddFieldButtonProps {
  onAddField: (field: NewField) => void;
  variant?: "primary" | "secondary";
  showDescription?: boolean;
}

const AddFieldButton: FC<AddFieldButtonProps> = ({
  onAddField,
  variant = "primary",
  showDescription = true,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState<SchemaType>("string");
  const [fieldDesc, setFieldDesc] = useState("");
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldValidation, setFieldValidation] = useState<ObjectJSONSchema>({
    type: "string",
  });
  const fieldNameId = useId();
  const fieldDescId = useId();
  const fieldRequiredId = useId();
  const fieldTypeId = useId();

  const t = useTranslation();

  const handleTypeChange = (newType: SchemaType) => {
    setFieldType(newType);
    setFieldValidation({ type: newType });
  };

  const handleValidationChange = (schema: ObjectJSONSchema) => {
    setFieldValidation(schema);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!fieldName.trim()) return;

    onAddField({
      name: fieldName,
      type: fieldType,
      description: fieldDesc,
      required: fieldRequired,
      validation: {
        ...fieldValidation,
        type: fieldType,
        description: fieldDesc || undefined,
      },
    });

    setFieldName("");
    setFieldType("string");
    setFieldDesc("");
    setFieldRequired(false);
    setFieldValidation({ type: "string" });
    setDialogOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        variant={variant === "primary" ? "filled" : "outline"}
        size="sm"
        leftSection={<CirclePlus size={16} />}
      >
        {t.fieldAddNewButton}
      </Button>

      <Modal
        opened={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={
          <Group gap="xs">
            {t.fieldAddNewLabel}
            <Badge variant="light" size="sm">
              {t.fieldAddNewBadge}
            </Badge>
          </Group>
        }
        size="75%"
      >
        <Text size="sm" c="dimmed" mb="md">
          {t.fieldAddNewDescription}
        </Text>

        <form onSubmit={handleSubmit}>
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
            <Stack gap="md">
              <div>
                <Group gap={4} mb={4}>
                  <Text
                    component="label"
                    htmlFor={fieldNameId}
                    size="sm"
                    fw={500}
                  >
                    {t.fieldNameLabel}
                  </Text>
                  <Tooltip label={t.fieldNameTooltip} multiline w={300}>
                    <Info className="h-4 w-4 text-gray-500 shrink-0" />
                  </Tooltip>
                </Group>
                <TextInput
                  id={fieldNameId}
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  placeholder={t.fieldNamePlaceholder}
                  required
                  styles={{ input: { fontFamily: "monospace" } }}
                />
              </div>

              {showDescription && (
                <div>
                  <Group gap={4} mb={4}>
                    <Text
                      component="label"
                      htmlFor={fieldDescId}
                      size="sm"
                      fw={500}
                    >
                      {t.fieldDescription}
                    </Text>
                    <Tooltip
                      label={t.fieldDescriptionTooltip}
                      multiline
                      w={300}
                    >
                      <Info className="h-4 w-4 text-gray-500 shrink-0" />
                    </Tooltip>
                  </Group>
                  <TextInput
                    id={fieldDescId}
                    value={fieldDesc}
                    onChange={(e) => setFieldDesc(e.target.value)}
                    placeholder={t.fieldDescriptionPlaceholder}
                  />
                </div>
              )}

              <Checkbox
                id={fieldRequiredId}
                checked={fieldRequired}
                onChange={(e) => setFieldRequired(e.currentTarget.checked)}
                label={t.fieldRequiredLabel}
              />
            </Stack>

            <Stack gap="md">
              <div>
                <Group gap={4} mb={4}>
                  <Text
                    component="label"
                    htmlFor={fieldTypeId}
                    size="sm"
                    fw={500}
                  >
                    {t.fieldType}
                  </Text>
                  <Tooltip
                    label={
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "4px",
                        }}
                      >
                        <div>• {t.fieldTypeTooltipString}</div>
                        <div>• {t.fieldTypeTooltipNumber}</div>
                        <div>• {t.fieldTypeTooltipBoolean}</div>
                        <div>• {t.fieldTypeTooltipObject}</div>
                        <div style={{ gridColumn: "span 2" }}>
                          • {t.fieldTypeTooltipArray}
                        </div>
                      </div>
                    }
                    multiline
                    w={300}
                    position="left"
                  >
                    <HelpCircle
                      size={16}
                      style={{ color: "var(--mantine-color-gray-5)" }}
                    />
                  </Tooltip>
                </Group>
                <SchemaTypeSelector
                  id={fieldTypeId}
                  value={fieldType}
                  onChange={handleTypeChange}
                />
              </div>

              <Box
                p="xs"
                style={{
                  borderRadius: "var(--mantine-radius-md)",
                  border: "1px solid var(--mantine-color-default-border)",
                }}
              >
                <Text size="xs" fw={500} mb={8}>
                  {t.fieldTypeExample}
                </Text>
                <Code block>
                  {fieldType === "string" && '"example"'}
                  {fieldType === "number" && "42"}
                  {fieldType === "integer" && "42"}
                  {fieldType === "boolean" && "true"}
                  {fieldType === "object" && '{ "key": "value" }'}
                  {fieldType === "array" && '["item1", "item2"]'}
                </Code>
              </Box>

              {/* Type-specific validation options */}
              <Box
                p="xs"
                style={{
                  borderRadius: "var(--mantine-radius-md)",
                  border: "1px solid var(--mantine-color-default-border)",
                }}
              >
                <TypeEditor
                  schema={fieldValidation}
                  readOnly={false}
                  validationNode={undefined}
                  onChange={handleValidationChange}
                  depth={0}
                />
              </Box>
            </Stack>
          </SimpleGrid>

          <Group justify="flex-end" mt="xl">
            <Button
              variant="default"
              size="sm"
              onClick={() => setDialogOpen(false)}
            >
              {t.fieldAddNewCancel}
            </Button>
            <Button type="submit" size="sm">
              {t.fieldAddNewConfirm}
            </Button>
          </Group>
        </form>
      </Modal>
    </>
  );
};

export default AddFieldButton;
