import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  X,
  AlertCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  Text,
  Stack,
  Alert,
  Badge,
  TextInput,
  UnstyledButton,
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
  const allErrors = useMemo(() => {
    const collectErrors = (
      node: ValidationTreeNode | undefined,
      path: string | undefined,
    ): Array<{ message: string; path?: string }> => {
      if (!node) return [];
      const ownErrors = node.validation.success
        ? []
        : node.validation.errors || [];
      const current = ownErrors.map((err) => ({
        message: err.message,
        path,
      }));
      const children = Object.entries(node.children || {}).flatMap(
        ([key, child]) => {
          const childPath = path ? `${path}.${key}` : key;
          return collectErrors(child, childPath);
        },
      );
      return [...current, ...children];
    };

    return collectErrors(validationNode, name);
  }, [name, validationNode]);

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

          {/* Clickable area: chevron + name + description */}
          <UnstyledButton
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label={expanded ? t.collapse : t.expand}
            style={{ flexGrow: 1, minWidth: 0 }}
          >
            <Group
              gap="xs"
              wrap="nowrap"
            >
              {/* Expand/collapse icon */}
              <Box c="gray" style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </Box>

              {/* Property name and description (labels only) */}
              <Text
                fw={500}
                px={8}
                py={2}
                truncate
                style={{ minWidth: 80, maxWidth: "50%" }}
              >
                {name}
              </Text>

              {/* Description label */}
              {showDescription && tempDesc && (
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
              )}
            </Group>
          </UnstyledButton>
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

      {allErrors.length > 0 && (
        <Alert
          icon={<AlertCircle size={16} />}
          color="red"
          title={t.validationErrors}
          mt="xs"
          mb="xs"
        >
          <Stack gap="xs">
            {allErrors.map((err, idx) => (
              <Text key={`${err.message}-${idx}`} size="sm">
                {err.path ? `${err.path}: ` : ""}
                {err.message}
              </Text>
            ))}
          </Stack>
        </Alert>
      )}

      {/* Expanded editor section */}
      {expanded && (
        <Box pt="xs" px="xs">
          {!readOnly && (
            <Stack gap="md" mb="sm">
              <TextInput
                label={t.fieldNameLabel}
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleNameSubmit}
                onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
              />
              {showDescription && (
                <TextInput
                  label={t.fieldDescription}
                  value={tempDesc}
                  onChange={(e) => setTempDesc(e.target.value)}
                  onBlur={handleDescSubmit}
                  onKeyDown={(e) => e.key === "Enter" && handleDescSubmit()}
                  placeholder={t.propertyDescriptionPlaceholder}
                />
              )}
            </Stack>
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
