import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import { AlertCircle, Check } from "lucide-react";
import type * as Monaco from "monaco-editor";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Modal,
  Text,
  Box,
  Group,
  Stack,
  Alert,
  ScrollArea,
  UnstyledButton,
  Badge,
  Loader,
} from "@mantine/core";
import { useMonacoTheme } from "../../hooks/use-monaco-theme.ts";
import {
  formatTranslation,
  useTranslation,
} from "../../hooks/use-translation.ts";
import type { JSONSchema } from "../../types/jsonSchema.ts";
import {
  type ValidationResult,
  validateJson,
} from "../../utils/jsonValidator.ts";

/** @public */
export interface JsonValidatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schema: JSONSchema;
}

/** @public */
export function JsonValidator({
  open,
  onOpenChange,
  schema,
}: JsonValidatorProps) {
  const t = useTranslation();
  const [jsonInput, setJsonInput] = useState("");
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const schemaMonacoRef = useRef<typeof Monaco | null>(null);
  const {
    currentTheme,
    defineMonacoThemes,
    configureJsonDefaults,
    defaultEditorOptions,
  } = useMonacoTheme();

  const validateJsonAgainstSchema = useCallback(() => {
    if (!jsonInput.trim()) {
      setValidationResult(null);
      return;
    }

    const result = validateJson(jsonInput, schema);
    setValidationResult(result);
  }, [jsonInput, schema]);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      validateJsonAgainstSchema();
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [validateJsonAgainstSchema]);

  const handleJsonEditorBeforeMount: BeforeMount = (monaco) => {
    monacoRef.current = monaco;
    defineMonacoThemes(monaco);
    configureJsonDefaults(monaco, schema);
  };

  const handleSchemaEditorBeforeMount: BeforeMount = (monaco) => {
    schemaMonacoRef.current = monaco;
    defineMonacoThemes(monaco);
  };

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  const handleEditorChange = (value: string | undefined) => {
    setJsonInput(value || "");
  };

  const goToError = (line: number, column: number) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(line);
      editorRef.current.setPosition({ lineNumber: line, column: column });
      editorRef.current.focus();
    }
  };

  // Create a modified version of defaultEditorOptions for the editor
  const editorOptions = {
    ...defaultEditorOptions,
    readOnly: false,
  };

  // Create read-only options for the schema viewer
  const schemaViewerOptions = {
    ...defaultEditorOptions,
    readOnly: true,
  };

  return (
    <Modal
      opened={open}
      onClose={() => onOpenChange(false)}
      title={t.validatorTitle}
      size="90%"
      styles={{
        body: { height: "80vh", display: "flex", flexDirection: "column" },
      }}
    >
      <Text size="sm" c="dimmed" mb="md">
        {t.validatorDescription}
      </Text>

      <Group style={{ flex: 1, overflow: "hidden", minHeight: 0 }} gap="md">
        <Stack style={{ flex: 1, height: "100%" }} gap="xs">
          <Text size="sm" fw={500}>
            {t.validatorContent}
          </Text>
          <Box
            style={{
              border: "1px solid var(--mantine-color-default-border)",
              borderRadius: "var(--mantine-radius-md)",
              flex: 1,
              overflow: "hidden",
            }}
          >
            <Editor
              height="100%"
              defaultLanguage="json"
              value={jsonInput}
              onChange={handleEditorChange}
              beforeMount={handleJsonEditorBeforeMount}
              onMount={handleEditorDidMount}
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
              options={editorOptions}
              theme={currentTheme}
            />
          </Box>
        </Stack>

        <Stack style={{ flex: 1, height: "100%" }} gap="xs">
          <Text size="sm" fw={500}>
            {t.validatorCurrentSchema}
          </Text>
          <Box
            style={{
              border: "1px solid var(--mantine-color-default-border)",
              borderRadius: "var(--mantine-radius-md)",
              flex: 1,
              overflow: "hidden",
            }}
          >
            <Editor
              height="100%"
              defaultLanguage="json"
              value={JSON.stringify(schema, null, 2)}
              beforeMount={handleSchemaEditorBeforeMount}
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
              options={schemaViewerOptions}
              theme={currentTheme}
            />
          </Box>
        </Stack>
      </Group>

      {validationResult && (
        <Alert
          mt="md"
          color={validationResult.valid ? "green" : "red"}
          variant="light"
          title={
            <Group>
              {validationResult.valid ? (
                <Check size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
              <Text fw={500}>
                {validationResult.valid
                  ? t.validatorValid
                  : validationResult.errors.length === 1
                    ? validationResult.errors[0].path === "/"
                      ? t.validatorErrorInvalidSyntax
                      : t.validatorErrorSchemaValidation
                    : formatTranslation(t.validatorErrorCount, {
                        count: validationResult.errors.length,
                      })}
              </Text>
            </Group>
          }
        >
          {!validationResult.valid &&
            validationResult.errors &&
            validationResult.errors.length > 0 && (
              <ScrollArea h={200} mt="sm">
                <Stack gap="xs">
                  {validationResult.errors.map((error, index) => (
                    <UnstyledButton
                      key={`error-${error.path}-${index}`}
                      onClick={() =>
                        error.line &&
                        error.column &&
                        goToError(error.line, error.column)
                      }
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px",
                        borderRadius: "var(--mantine-radius-sm)",
                        border: "1px solid var(--mantine-color-red-2)",
                        backgroundColor: "var(--mantine-color-body)",
                      }}
                    >
                      <Group justify="space-between" align="flex-start">
                        <Box style={{ flex: 1 }}>
                          <Text size="sm" fw={500} c="red">
                            {error.path === "/"
                              ? t.validatorErrorPathRoot
                              : error.path}
                          </Text>
                          <Text size="sm" c="dimmed">
                            {error.message}
                          </Text>
                        </Box>
                        {error.line && (
                          <Badge variant="light" color="gray">
                            {error.column
                              ? formatTranslation(
                                  t.validatorErrorLocationLineAndColumn,
                                  { line: error.line, column: error.column },
                                )
                              : formatTranslation(
                                  t.validatorErrorLocationLineOnly,
                                  { line: error.line },
                                )}
                          </Badge>
                        )}
                      </Group>
                    </UnstyledButton>
                  ))}
                </Stack>
              </ScrollArea>
            )}
        </Alert>
      )}
    </Modal>
  );
}
