import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  X,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "../../hooks/use-translation.ts";
import type {
  JSONSchema,
  ObjectJSONSchema,
  SchemaType,
} from "../../types/jsonSchema.ts";
import {
  asObjectSchema,
  getSchemaDescription,
  withObjectSchema,
} from "../../types/jsonSchema.ts";
import type { ValidationTreeNode } from "../../types/validation.ts";
import TypeDropdown from "./TypeDropdown.tsx";
import RequiredDropdown from "./RequiredDropdown.tsx";
import TypeEditor from "./TypeEditor.tsx";
import {
  Paper,
  Group,
  Box,
  ActionIcon,
  UnstyledButton,
  Text,
  Stack,
  Alert,
  Badge,
  TextInput,
} from "@mantine/core";

export interface SchemaPropertyEditorProps {
  name: string;
  schema: JSONSchema;
  required: boolean;
  readOnly: boolean;
  validationNode?: ValidationTreeNode;
  onDelete: () => void;
  onNameChange: (newName: string) => void;
  onRequiredChange: (required: boolean) => void;
  onSchemaChange: (schema: ObjectJSONSchema) => void;
  depth?: number;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  showDescription?: boolean;
}

export const SchemaPropertyEditor: React.FC<SchemaPropertyEditorProps> = ({
  name,
  schema,
  required,
  readOnly = false,
  validationNode,
  onDelete,
  onNameChange,
  onRequiredChange,
  onSchemaChange,
  depth = 0,
  dragHandleProps,
  showDescription = true,
}) => {
  const t = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [tempName, setTempName] = useState(name);
  const [tempDesc, setTempDesc] = useState(getSchemaDescription(schema));
  const type = withObjectSchema(
    schema,
    (s) => (s.type || "object") as SchemaType,
    "object" as SchemaType,
  );
  const format = withObjectSchema(schema, (s) => s.format, undefined);

  // Update temp values when props change
  useEffect(() => {
    setTempName(name);
    setTempDesc(getSchemaDescription(schema));
  }, [name, schema]);

  const handleNameSubmit = () => {
    const trimmedName = tempName.trim();
    if (trimmedName && trimmedName !== name) {
      onNameChange(trimmedName);
    } else {
      setTempName(name);
    }
    setIsEditingName(false);
  };

  const handleDescSubmit = () => {
    const trimmedDesc = tempDesc.trim();
    if (trimmedDesc !== getSchemaDescription(schema)) {
      onSchemaChange({
        ...asObjectSchema(schema),
        description: trimmedDesc || undefined,
      });
    } else {
      setTempDesc(getSchemaDescription(schema));
    }
    setIsEditingDesc(false);
  };

  // Handle schema changes, preserving description
  const handleSchemaUpdate = (updatedSchema: ObjectJSONSchema) => {
    const description = getSchemaDescription(schema);
    onSchemaChange({
      ...updatedSchema,
      description: description || undefined,
    });
  };

  const hasErrors = validationNode?.validation?.success === false;
  const errors = hasErrors ? validationNode?.validation?.errors : [];

  return (
    <Paper
      withBorder
      p="xs"
      radius="md"
      ml={depth > 0 ? "md" : 0}
      style={{
        borderLeft:
          depth > 0 ? "4px solid var(--mantine-color-gray-3)" : undefined,
        borderColor: hasErrors ? "var(--mantine-color-red-filled)" : undefined,
      }}
    >
      <Group justify="space-between" wrap="nowrap" align="center">
        <Group gap="xs" style={{ flexGrow: 1, minWidth: 0 }} wrap="nowrap">
          {/* Drag handle */}
          {dragHandleProps && (
            <ActionIcon
              variant="transparent"
              color="gray"
              {...dragHandleProps}
              style={{ cursor: "grab" }}
              aria-label="Drag to reorder"
            >
              <GripVertical size={16} />
            </ActionIcon>
          )}

          {/* Expand/collapse button */}
          <ActionIcon
            variant="transparent"
            color="gray"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? t.collapse : t.expand}
          >
            {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </ActionIcon>

          {/* Property name */}
          <Group
            gap="xs"
            style={{ flexGrow: 1, minWidth: 0, overflow: "hidden" }}
            wrap="nowrap"
          >
            {!readOnly && isEditingName ? (
              <TextInput
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleNameSubmit}
                onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                size="xs"
                style={{
                  fontWeight: 500,
                  minWidth: 120,
                  maxWidth: "100%",
                  zIndex: 10,
                }}
                autoFocus
                onFocus={(e) => e.target.select()}
              />
            ) : readOnly ? (
              <Text
                fw={500}
                px={8}
                py={2}
                truncate
                style={{ minWidth: 80, maxWidth: "50%" }}
              >
                {name}
              </Text>
            ) : (
              <UnstyledButton
                onClick={() => setIsEditingName(true)}
                onKeyDown={(e) => e.key === "Enter" && setIsEditingName(true)}
                style={{
                  fontWeight: 500,
                  padding: "2px 8px",
                  borderRadius: "var(--mantine-radius-sm)",
                  textAlign: "left",
                  minWidth: 80,
                  maxWidth: "50%",
                }}
              >
                <Text truncate fw={500}>
                  {name}
                </Text>
              </UnstyledButton>
            )}

            {/* Description */}
            {showDescription &&
              (!readOnly && isEditingDesc ? (
                <TextInput
                  value={tempDesc}
                  onChange={(e) => setTempDesc(e.target.value)}
                  onBlur={handleDescSubmit}
                  onKeyDown={(e) => e.key === "Enter" && handleDescSubmit()}
                  placeholder={t.propertyDescriptionPlaceholder}
                  size="xs"
                  style={{
                    fontStyle: "italic",
                    flex: 1,
                    minWidth: 150,
                    zIndex: 10,
                  }}
                  autoFocus
                  onFocus={(e) => e.target.select()}
                />
              ) : tempDesc ? (
                readOnly ? (
                  <Text
                    size="xs"
                    c="dimmed"
                    fs="italic"
                    px={8}
                    py={2}
                    truncate
                    style={{ flex: 1, maxWidth: "40%", marginRight: 8 }}
                  >
                    {tempDesc}
                  </Text>
                ) : (
                  <UnstyledButton
                    onClick={() => setIsEditingDesc(true)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && setIsEditingDesc(true)
                    }
                    style={{
                      padding: "2px 8px",
                      borderRadius: "var(--mantine-radius-sm)",
                      textAlign: "left",
                      flex: 1,
                      maxWidth: "40%",
                      marginRight: 8,
                    }}
                  >
                    <Text size="xs" c="dimmed" fs="italic" truncate>
                      {tempDesc}
                    </Text>
                  </UnstyledButton>
                )
              ) : (
                !readOnly && (
                  <UnstyledButton
                    onClick={() => setIsEditingDesc(true)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && setIsEditingDesc(true)
                    }
                    style={{
                      padding: "2px 8px",
                      borderRadius: "var(--mantine-radius-sm)",
                      color: "var(--mantine-color-dimmed)",
                      fontSize: "var(--mantine-font-size-xs)",
                      fontStyle: "italic",
                      opacity: 0.5,
                      textAlign: "left",
                      flex: 1,
                      maxWidth: "40%",
                      marginRight: 8,
                    }}
                  >
                    {t.propertyDescriptionButton}
                  </UnstyledButton>
                )
              ))}
          </Group>
        </Group>

        {/* Right side controls */}
        <Group gap="xs" wrap="nowrap">
          <TypeDropdown
            value={type}
            format={format}
            readOnly={readOnly}
            onChange={(newType, newFormat) => {
              onSchemaChange({
                ...asObjectSchema(schema),
                type: newType,
                format: newFormat,
              });
            }}
          />

          {/* Required toggle */}
          <RequiredDropdown
            required={required}
            onChange={onRequiredChange}
            readOnly={readOnly}
          />

          {/* Error badge */}
          {validationNode?.cumulativeChildrenErrors > 0 && (
            <Badge
              color="red"
              variant="filled"
              size="sm"
              circle
              style={{
                minWidth: 20,
                height: 20,
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {validationNode.cumulativeChildrenErrors}
            </Badge>
          )}

          {/* Delete button */}
          {!readOnly && (
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={onDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={t.propertyDelete}
            >
              <X size={16} />
            </ActionIcon>
          )}
        </Group>
      </Group>

      {/* Type-specific editor */}
      {expanded && (
        <Box pt="xs" px="xs">
          {hasErrors && errors && errors.length > 0 && (
            <Alert
              variant="light"
              color="red"
              title="Validation Errors"
              icon={<AlertCircle size={16} />}
              mb="xs"
            >
              <Stack gap="xs">
                {errors.map((error, i) => (
                  <Text key={`${error.code}-${i}`} size="sm">
                    {error.message}
                  </Text>
                ))}
              </Stack>
            </Alert>
          )}
          {readOnly && tempDesc && (
            <p className="pb-2 text-sm text-gray-600">{tempDesc}</p>
          )}
          <TypeEditor
            schema={schema}
            readOnly={readOnly}
            validationNode={validationNode}
            onChange={handleSchemaUpdate}
            depth={depth + 1}
            showDescription={showDescription}
          />
        </Box>
      )}
    </Paper>
  );
};

export default SchemaPropertyEditor;
