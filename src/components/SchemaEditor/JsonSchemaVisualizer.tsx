import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import { Download, FileJson } from "lucide-react";
import { type FC, useRef } from "react";
import { ActionIcon, Box, Group, Loader, Paper, Text } from "@mantine/core";
import { useMonacoTheme } from "../../hooks/use-monaco-theme.ts";
import { useTranslation } from "../../hooks/use-translation.ts";
import { cn } from "../../lib/utils.ts";
import type { JSONSchema } from "../../types/jsonSchema.ts";

/** @public */
export interface JsonSchemaVisualizerProps {
  schema: JSONSchema;
  className?: string;
  onChange?: (schema: JSONSchema) => void;
  theme?: "light" | "dark";
}

/** @public */
const JsonSchemaVisualizer: FC<JsonSchemaVisualizerProps> = ({
  schema,
  className,
  onChange,
  theme,
}) => {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const {
    currentTheme,
    defineMonacoThemes,
    configureJsonDefaults,
    defaultEditorOptions,
  } = useMonacoTheme(theme);

  const t = useTranslation();

  const handleBeforeMount: BeforeMount = (monaco) => {
    defineMonacoThemes(monaco);
    configureJsonDefaults(monaco);
  };

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  const handleEditorChange = (value: string | undefined) => {
    if (!value) return;

    try {
      const parsedJson = JSON.parse(value);
      if (onChange) {
        onChange(parsedJson);
      }
    } catch (_error) {
      // Monaco will show the error inline, no need for additional error handling
    }
  };

  const handleDownload = () => {
    const content = JSON.stringify(schema, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = t.visualizerDownloadFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Paper
      className={cn(
        "json-visualizer-container",
        className,
        "jsonjoy",
        theme === "dark" && "dark",
      )}
      h="100%"
      display="flex"
      style={{
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Group
        justify="space-between"
        px="md"
        py="xs"
        style={{
          borderBottom: "1px solid var(--mantine-color-default-border)",
          backgroundColor: "var(--mantine-color-body)",
        }}
      >
        <Group gap="xs">
          <FileJson size={18} />
          <Text size="sm" fw={500}>
            {t.visualizerSource}
          </Text>
        </Group>
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={handleDownload}
          title={t.visualizerDownloadTitle}
        >
          <Download size={16} />
        </ActionIcon>
      </Group>
      <Box style={{ flex: 1, minHeight: 0 }}>
        <Editor
          height="100%"
          defaultLanguage="json"
          value={JSON.stringify(schema, null, 2)}
          onChange={handleEditorChange}
          beforeMount={handleBeforeMount}
          onMount={handleEditorDidMount}
          className="monaco-editor-container"
          loading={
            <Box
              display="flex"
              style={{
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                width: "100%",
              }}
            >
              <Loader size="sm" />
            </Box>
          }
          options={defaultEditorOptions}
          theme={currentTheme}
        />
      </Box>
    </Paper>
  );
};

export default JsonSchemaVisualizer;
