import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import { useRef, useState } from "react";
import { Button, Modal, Text, Box, Group, Alert, Loader } from "@mantine/core";
import { useMonacoTheme } from "../../hooks/use-monaco-theme.ts";
import { useTranslation } from "../../hooks/use-translation.ts";
import { createSchemaFromJson } from "../../lib/schema-inference.ts";
import type { JSONSchema } from "../../types/jsonSchema.ts";

/** @public */
export interface SchemaInferencerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchemaInferred: (schema: JSONSchema) => void;
}

/** @public */
export function SchemaInferencer({
  open,
  onOpenChange,
  onSchemaInferred,
}: SchemaInferencerProps) {
  const t = useTranslation();
  const [jsonInput, setJsonInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const {
    currentTheme,
    defineMonacoThemes,
    configureJsonDefaults,
    defaultEditorOptions,
  } = useMonacoTheme();

  const handleBeforeMount: BeforeMount = (monaco) => {
    defineMonacoThemes(monaco);
    configureJsonDefaults(monaco);
  };

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  const handleEditorChange = (value: string | undefined) => {
    setJsonInput(value || "");
  };

  const inferSchemaFromJson = () => {
    try {
      const jsonObject = JSON.parse(jsonInput);
      setError(null);

      // Use the schema inference service to create a schema
      const inferredSchema = createSchemaFromJson(jsonObject);

      onSchemaInferred(inferredSchema);
      onOpenChange(false);
    } catch (error) {
      console.error("Invalid JSON input:", error);
      setError(t.inferrerErrorInvalidJson);
    }
  };

  const handleClose = () => {
    setJsonInput("");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Modal
      opened={open}
      onClose={handleClose}
      title={t.inferrerTitle}
      size="lg"
    >
      <Text size="sm" c="dimmed" mb="md">
        {t.inferrerDescription}
      </Text>

      <Box
        style={{
          border: "1px solid var(--mantine-color-default-border)",
          borderRadius: "var(--mantine-radius-md)",
          height: "450px",
          overflow: "hidden",
          marginBottom: "16px",
        }}
      >
        <Editor
          height="100%"
          defaultLanguage="json"
          value={jsonInput}
          onChange={handleEditorChange}
          beforeMount={handleBeforeMount}
          onMount={handleEditorDidMount}
          options={defaultEditorOptions}
          theme={currentTheme}
          loading={
            <Box
              display="flex"
              style={{
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <Loader size="sm" />
            </Box>
          }
        />
      </Box>

      {error && (
        <Alert color="red" mb="md">
          {error}
        </Alert>
      )}

      <Group justify="flex-end">
        <Button variant="default" onClick={handleClose}>
          {t.inferrerCancel}
        </Button>
        <Button onClick={inferSchemaFromJson}>{t.inferrerGenerate}</Button>
      </Group>
    </Modal>
  );
}
