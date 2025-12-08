import { Maximize2 } from "lucide-react";
import {
  type FC,
  type MouseEvent as ReactMouseEvent,
  useRef,
  useState,
} from "react";
import { ActionIcon, Box, Group, Paper, Tabs, Text } from "@mantine/core";
import { useTranslation } from "../../hooks/use-translation.ts";
import { cn } from "../../lib/utils.ts";
import type { JSONSchema } from "../../types/jsonSchema.ts";
import JsonSchemaVisualizer from "./JsonSchemaVisualizer.tsx";
import SchemaVisualEditor from "./SchemaVisualEditor.tsx";

/** @public */
export interface JsonSchemaEditorProps {
  schema?: JSONSchema;
  readOnly: boolean;
  setSchema?: (schema: JSONSchema) => void;
  className?: string;
  showDescription?: boolean;
  theme?: "light" | "dark";
}

/** @public */
const JsonSchemaEditor: FC<JsonSchemaEditorProps> = ({
  schema = { type: "object" },
  readOnly = false,
  setSchema,
  className,
  showDescription = true,
  theme,
}) => {
  // Handle schema changes and propagate to parent if needed
  const handleSchemaChange = (newSchema: JSONSchema) => {
    setSchema(newSchema);
  };

  const t = useTranslation();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // percentage
  const resizeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleMouseDown = (e: ReactMouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth =
      ((e.clientX - containerRect.left) / containerRect.width) * 100;

    // Limit the minimum and maximum width
    if (newWidth >= 20 && newWidth <= 80) {
      setLeftPanelWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  return (
    <Paper
      withBorder
      className={cn(
        "json-editor-container",
        className,
        "jsonjoy",
        theme === "dark" && "dark",
      )}
      pos={isFullscreen ? "fixed" : "relative"}
      top={isFullscreen ? 0 : undefined}
      left={isFullscreen ? 0 : undefined}
      right={isFullscreen ? 0 : undefined}
      bottom={isFullscreen ? 0 : undefined}
      h={isFullscreen ? "100vh" : "600px"}
      w="100%"
      display="flex"
      style={{
        flexDirection: "column",
        overflow: "hidden",
        zIndex: isFullscreen ? 50 : undefined,
      }}
    >
      {/* For mobile screens - show as tabs */}
      <Box display={{ base: "block", lg: "none" }} h="100%">
        <Tabs
          defaultValue="visual"
          h="100%"
          display="flex"
          style={{ flexDirection: "column" }}
        >
          <Group
            justify="space-between"
            px="md"
            py="xs"
            style={{
              borderBottom: "1px solid var(--mantine-color-default-border)",
            }}
          >
            <Tabs.List>
              <Tabs.Tab value="visual">{t.schemaEditorEditModeVisual}</Tabs.Tab>
              <Tabs.Tab value="code">{t.schemaEditorEditModeJson}</Tabs.Tab>
            </Tabs.List>
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={toggleFullscreen}
              aria-label={t.schemaEditorToggleFullscreen}
            >
              <Maximize2 size={16} />
            </ActionIcon>
          </Group>
          <Tabs.Panel value="visual" style={{ flex: 1, overflow: "hidden" }}>
            <SchemaVisualEditor
              readOnly={readOnly}
              schema={schema}
              onChange={handleSchemaChange}
              showDescription={showDescription}
              theme={theme}
            />
          </Tabs.Panel>
          <Tabs.Panel value="code" style={{ flex: 1, overflow: "hidden" }}>
            <JsonSchemaVisualizer
              schema={schema}
              onChange={handleSchemaChange}
              theme={theme}
            />
          </Tabs.Panel>
        </Tabs>
      </Box>

      {/* For large screens - show side by side */}
      <Box
        ref={containerRef}
        display={{ base: "none", lg: "flex" }}
        style={{ flexDirection: "column", width: "100%", height: "100%" }}
      >
        <Group
          justify="space-between"
          px="md"
          py="xs"
          style={{
            borderBottom: "1px solid var(--mantine-color-default-border)",
          }}
        >
          <Text fw={500}>{t.schemaEditorTitle}</Text>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={toggleFullscreen}
            aria-label={t.schemaEditorToggleFullscreen}
          >
            <Maximize2 size={16} />
          </ActionIcon>
        </Group>
        <Box display="flex" style={{ flex: 1, minHeight: 0, width: "100%" }}>
          <Box h="100%" style={{ width: `${leftPanelWidth}%`, minHeight: 0 }}>
            <SchemaVisualEditor
              readOnly={readOnly}
              schema={schema}
              onChange={handleSchemaChange}
              showDescription={showDescription}
              theme={theme}
            />
          </Box>
          <Box
            ref={resizeRef}
            w={4}
            style={{
              cursor: "col-resize",
              backgroundColor: "var(--mantine-color-default-border)",
            }}
            onMouseDown={handleMouseDown}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--mantine-color-primary-filled)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--mantine-color-default-border)";
            }}
          />
          <Box
            h="100%"
            style={{ width: `${100 - leftPanelWidth}%`, minHeight: 0 }}
          >
            <JsonSchemaVisualizer
              schema={schema}
              onChange={handleSchemaChange}
              theme={theme}
            />
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default JsonSchemaEditor;
