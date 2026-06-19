import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  GripVertical,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "../../hooks/use-translation.ts";
import {
  slugifyKey,
  uniqueKey,
  validateFieldName,
} from "../../lib/schemaEditor.ts";
import type {
  JSONSchema,
  ObjectJSONSchema,
  SchemaType,
} from "../../types/jsonSchema.ts";
import {
  asObjectSchema,
  getSchemaDescription,
  getSchemaTitle,
  withObjectSchema,
} from "../../types/jsonSchema.ts";
import type { ValidationTreeNode } from "../../types/validation.ts";
import RequiredDropdown from "./RequiredDropdown.tsx";
import TypeDropdown from "./TypeDropdown.tsx";
import TypeEditor from "./TypeEditor.tsx";

export interface SchemaPropertyEditorProps {
  name: string;
  schema: JSONSchema;
  required: boolean;
  readOnly: boolean;
  validationNode?: ValidationTreeNode;
  onDelete: () => void;
  onNameChange: (newName: string, newSchema?: ObjectJSONSchema) => void;
  onRequiredChange: (required: boolean) => void;
  onSchemaChange: (schema: ObjectJSONSchema) => void;
  depth?: number;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  showDescription?: boolean;
  /** Keys of sibling properties, used to reject/avoid duplicate keys. */
  existingKeys?: string[];
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
  existingKeys = [],
}) => {
  const t = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [tempName, setTempName] = useState(name);
  const [tempTitle, setTempTitle] = useState(getSchemaTitle(schema));
  const [tempDesc, setTempDesc] = useState(getSchemaDescription(schema));
  // Live validation error for the key field (null = valid).
  const [keyError, setKeyError] = useState<string | null>(null);
  // Becomes true once the key is edited manually; stops label->key coupling.
  const [keyEdited, setKeyEdited] = useState(false);

  // Sibling keys excluding this property's own current key.
  const otherKeys = useMemo(
    () => existingKeys.filter((k) => k !== name),
    [existingKeys, name],
  );

  // The key still carries its generated default name (never named explicitly).
  const isDefaultKey = /^newField\d*$/.test(name);
  const type = withObjectSchema(
    schema,
    (s) => (s.type || "object") as SchemaType,
    "object" as SchemaType,
  );
  const format = withObjectSchema(schema, (s) => s.format, undefined);

  // Update temp values when props change
  useEffect(() => {
    setTempName(name);
    setTempTitle(getSchemaTitle(schema));
    setTempDesc(getSchemaDescription(schema));
    setKeyError(null);
  }, [name, schema]);

  // Validates a candidate key and returns a translation message, or null if ok.
  const validateKey = useCallback(
    (candidate: string): string | null => {
      if (!validateFieldName(candidate)) return t.fieldKeyInvalid;
      if (candidate !== name && otherKeys.includes(candidate))
        return t.fieldKeyDuplicate;
      return null;
    },
    [name, otherKeys, t],
  );

  // Re-validate the key whenever the sibling keys change, so a duplicate error
  // clears once the colliding field is removed/renamed (and reappears if a new
  // collision is introduced) — validation otherwise only re-ran on keystrokes.
  useEffect(() => {
    const trimmed = tempName.trim();
    setKeyError(trimmed === "" ? null : validateKey(trimmed));
  }, [validateKey, tempName]);

  const handleKeyInput = (value: string) => {
    setTempName(value);
    setKeyEdited(true);
    const trimmed = value.trim();
    setKeyError(trimmed === "" ? null : validateKey(trimmed));
  };

  const handleKeySubmit = () => {
    const trimmedName = tempName.trim();
    if (trimmedName === name) {
      setKeyError(null);
      return;
    }
    const error = validateKey(trimmedName);
    if (error) {
      // Reject invalid/duplicate keys: revert and keep the existing key.
      setTempName(name);
      setKeyError(null);
      return;
    }
    onNameChange(trimmedName);
  };

  const handleTitleSubmit = () => {
    const trimmedTitle = tempTitle.trim();
    const titledSchema: ObjectJSONSchema = {
      ...asObjectSchema(schema),
      title: trimmedTitle || undefined,
    };

    // Couple key to label only for new, never-named fields.
    if (!keyEdited && isDefaultKey && trimmedTitle) {
      const candidate = uniqueKey(slugifyKey(trimmedTitle), otherKeys);
      if (validateFieldName(candidate) && candidate !== name) {
        // Rename and set the title in a single update: emitting them as two
        // separate changes would have both derive from the same stale schema,
        // so the rename would overwrite the just-set title (label disappears).
        onNameChange(candidate, titledSchema);
        return;
      }
    }

    if (trimmedTitle !== getSchemaTitle(schema)) {
      onSchemaChange(titledSchema);
    } else {
      setTempTitle(getSchemaTitle(schema));
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

  // Handle schema changes, preserving title and description
  const handleSchemaUpdate = (updatedSchema: ObjectJSONSchema) => {
    const title = getSchemaTitle(schema);
    const description = getSchemaDescription(schema);
    onSchemaChange({
      ...updatedSchema,
      title: title || undefined,
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
            <Group gap="xs" wrap="nowrap">
              {/* Expand/collapse icon */}
              <Box
                c="gray"
                style={{ display: "flex", alignItems: "center", flexShrink: 0 }}
              >
                {expanded ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
              </Box>

              {/* Property label (title) with the technical key alongside */}
              <Text
                fw={500}
                px={8}
                py={2}
                truncate
                style={{ minWidth: 80, maxWidth: "50%" }}
              >
                {tempTitle || name}
              </Text>

              {/* Show the template-relevant key when a label is set */}
              {tempTitle && (
                <Badge
                  variant="light"
                  color="gray"
                  size="sm"
                  ff="monospace"
                  style={{ flexShrink: 0, textTransform: "none" }}
                >
                  {name}
                </Badge>
              )}

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
                label={t.fieldLabelLabel}
                value={tempTitle}
                placeholder={t.fieldLabelPlaceholder}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === "Enter" && handleTitleSubmit()}
              />
              <TextInput
                label={t.fieldNameLabel}
                value={tempName}
                error={keyError}
                onChange={(e) => handleKeyInput(e.target.value)}
                onBlur={handleKeySubmit}
                onKeyDown={(e) => e.key === "Enter" && handleKeySubmit()}
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
