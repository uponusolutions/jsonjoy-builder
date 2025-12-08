import {
  CheckCircle,
  CirclePlus,
  Code,
  FileJson,
  FileText,
  GitBranch,
  Package,
  Pencil,
  PencilOff,
  RefreshCw,
  User,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  Anchor,
  Badge,
  Box,
  Button,
  Center,
  Container,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import { exampleSchema } from "../../demo/utils/schemaExample.ts";
import { JsonValidator } from "../../src/components/features/JsonValidator.tsx";
import { SchemaInferencer } from "../../src/components/features/SchemaInferencer.tsx";
import JsonSchemaEditor from "../../src/components/SchemaEditor/JsonSchemaEditor.tsx";
import { ThemeToggle } from "../../src/components/ui/theme-toggle.tsx";
import { useTheme } from "../../src/hooks/use-theme.ts";
import { en } from "../../src/i18n/locales/en.ts";
import { TranslationContext } from "../../src/i18n/translation-context.ts";
import type { JSONSchema } from "../../src/types/jsonSchema.ts";

const Index = () => {
  const [schema, setSchema] = useState<JSONSchema>(exampleSchema);
  const [readOnly, setReadOnly] = useState<boolean>(false);
  const [showDescription, setShowDescription] = useState<boolean>(true);
  const [inferDialogOpen, setInferDialogOpen] = useState(false);
  const [validateDialogOpen, setValidateDialogOpen] = useState(false);
  const [language, setLanguage] = useState("en");
  const [translation, setTranslation] = useState(en);
  const { resolvedTheme } = useTheme();
  const { setColorScheme } = useMantineColorScheme();

  useEffect(() => {
    if (resolvedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setColorScheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      setColorScheme("light");
    }
  }, [resolvedTheme, setColorScheme]);

  const handleReset = () => setSchema(exampleSchema);

  const handleReadOnlyToggle = () => setReadOnly(!readOnly);

  const handleClear = () =>
    setSchema({
      type: "object",
      properties: {},
      required: [],
    });

  const handleInferSchema = () => {
    setInferDialogOpen(true);
  };

  const handleValidateJson = () => {
    setValidateDialogOpen(true);
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    import(`../../src/i18n/locales/${value}.ts`).then((module) => {
      setTranslation(module[value]);
    });
  };

  return (
    <TranslationContext value={translation}>
      <Box
        style={{
          minHeight: "100vh",
          background:
            resolvedTheme === "dark"
              ? "linear-gradient(to bottom, var(--mantine-color-dark-7), var(--mantine-color-dark-8))"
              : "linear-gradient(to bottom, var(--mantine-color-gray-0), var(--mantine-color-white))",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background accent */}
        <Box
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "var(--mantine-color-blue-filled)",
            opacity: 0.1,
            filter: "blur(80px)",
            zIndex: 0,
          }}
        />
        <Box
          style={{
            position: "absolute",
            bottom: -100,
            left: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "var(--mantine-color-blue-filled)",
            opacity: 0.05,
            filter: "blur(80px)",
            zIndex: 0,
          }}
        />

        <Container
          size="xl"
          py="xl"
          style={{ position: "relative", zIndex: 1 }}
        >
          <Stack align="center" gap="xl" mb={50}>
            {/* Header */}
            <Stack align="center" gap="xs" ta="center">
              <Badge
                variant="light"
                size="lg"
                leftSection={<FileJson size={14} />}
                color="blue"
              >
                Easy Schema Builder
              </Badge>
              <Title order={1} size={48} style={{ lineHeight: 1.1 }}>
                Create JSON Schemas{" "}
                <Text span c="blue" inherit>
                  Visually
                </Text>
              </Title>
              <Text size="xl" c="dimmed" maw={600}>
                Design your data structure effortlessly without writing a single
                line of code. Perfect for APIs, forms, and data validation.
              </Text>
            </Stack>

            {/* Action Buttons */}
            <Group justify="center" gap="sm">
              <Button
                variant="outline"
                onClick={handleReset}
                leftSection={<RefreshCw size={16} />}
              >
                Reset to Example
              </Button>
              <Button
                variant="outline"
                onClick={handleClear}
                leftSection={<CirclePlus size={16} />}
              >
                Start from Scratch
              </Button>
              <Button
                variant="outline"
                onClick={handleInferSchema}
                leftSection={<Code size={16} />}
              >
                Infer from JSON
              </Button>
              <Button
                variant="outline"
                onClick={handleValidateJson}
                leftSection={<CheckCircle size={16} />}
              >
                Validate JSON
              </Button>
              <Button
                variant="outline"
                onClick={handleReadOnlyToggle}
                leftSection={
                  readOnly ? <Pencil size={16} /> : <PencilOff size={16} />
                }
              >
                {readOnly ? "Writable" : "Read-Only"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDescription(!showDescription)}
                leftSection={<FileText size={16} />}
              >
                {showDescription ? "Hide Descriptions" : "Show Descriptions"}
              </Button>

              <Select
                value={language}
                onChange={(value) => handleLanguageChange(value || "en")}
                data={[
                  { value: "en", label: "English" },
                  { value: "de", label: "German" },
                  { value: "fr", label: "French" },
                  { value: "ru", label: "Russian" },
                ]}
                placeholder="Language"
                w={130}
              />
              <ThemeToggle size="default" />
            </Group>
          </Stack>

          {/* Schema Editor */}
          <Paper shadow="md" radius="md" withBorder>
            <JsonSchemaEditor
              schema={schema}
              readOnly={readOnly}
              setSchema={setSchema}
              showDescription={showDescription}
              theme={resolvedTheme}
            />
          </Paper>

          {/* Schema inferencer component */}
          <SchemaInferencer
            open={inferDialogOpen}
            onOpenChange={setInferDialogOpen}
            onSchemaInferred={setSchema}
          />

          {/* JSON validator component */}
          <JsonValidator
            open={validateDialogOpen}
            onOpenChange={setValidateDialogOpen}
            schema={schema}
          />

          {/* How It Works */}
          <Container size="lg" mt={80}>
            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">
              {[
                {
                  step: 1,
                  title: "Define Schema Structure",
                  desc: "Create a user profile schema with name, email, and age fields. Specify string formats for emails, min/max for ages, and required fields.",
                },
                {
                  step: 2,
                  title: "Create Complex Types",
                  desc: "Build product catalogs with nested objects for variants, arrays for tags, and enums for predefined categories or status values.",
                },
                {
                  step: 3,
                  title: "Use Your Schema",
                  desc: "Export for form validation in React Hook Form, API documentation with OpenAPI, or backend validation with libraries like Ajv.",
                },
              ].map((item) => (
                <Paper key={item.step} p="xl" radius="md" withBorder>
                  <ThemeIcon size={48} radius="md" variant="light" mb="md">
                    <Text fw={700} size="xl">
                      {item.step}
                    </Text>
                  </ThemeIcon>
                  <Title order={3} size="h4" mb="sm">
                    {item.title}
                  </Title>
                  <Text size="sm" c="dimmed">
                    {item.desc}
                  </Text>
                </Paper>
              ))}
            </SimpleGrid>

            {/* Use Case Examples */}
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" mt={40}>
              <Paper p="xl" radius="md" withBorder>
                <Title order={3} size="h4" mb="sm">
                  API Development
                </Title>
                <Text size="sm" c="dimmed" mb="md">
                  Define request/response schemas for endpoints like /api/users
                  to ensure proper data validation and consistent API
                  documentation.
                </Text>
                <Paper
                  bg={resolvedTheme === "dark" ? "dark.6" : "gray.1"}
                  p="xs"
                  radius="sm"
                  style={{ overflowX: "auto" }}
                >
                  <Text component="pre" size="xs" style={{ margin: 0 }}>
                    {`{
  "type": "object",
  "properties": {
    "username": { "type": "string", "minLength": 3 },
    "email": { "type": "string", "format": "email" }
  },
  "required": ["username", "email"]
}`}
                  </Text>
                </Paper>
              </Paper>

              <Paper p="xl" radius="md" withBorder>
                <Title order={3} size="h4" mb="sm">
                  Form Validation
                </Title>
                <Text size="sm" c="dimmed" mb="md">
                  Create schemas for checkout forms with shipping details,
                  payment information, and order specifics - all with proper
                  validation rules.
                </Text>
                <Paper
                  bg={resolvedTheme === "dark" ? "dark.6" : "gray.1"}
                  p="xs"
                  radius="sm"
                  style={{ overflowX: "auto" }}
                >
                  <Text component="pre" size="xs" style={{ margin: 0 }}>
                    {JSON.stringify(
                      {
                        type: "object",
                        properties: {
                          zipCode: { type: "string", pattern: "^\\d{5}$" },
                        },
                        paymentMethod: {
                          type: "string",
                          enum: ["credit", "paypal"],
                        },
                      },
                      null,
                      2,
                    )}
                  </Text>
                </Paper>
              </Paper>
            </SimpleGrid>

            {/* Footer */}
            <Stack align="center" mt={80} mb={40}>
              <Text c="dimmed" size="sm" ta="center">
                Built with simplicity in mind. Design beautiful data structures
                without technical knowledge.
              </Text>
            </Stack>

            {/* Tools Section */}
            <Box mt={50}>
              <Title order={2} ta="center" mb="xl">
                Ecosystem & Tools
              </Title>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                {[
                  {
                    title: "Form Generation",
                    links: [
                      {
                        url: "https://github.com/rjsf-team/react-jsonschema-form?tab=readme-ov-file#react-jsonschema-form",
                        name: "React JSON Schema Form",
                        description: "Build forms from schemas",
                      },
                      {
                        url: "https://jsonforms.io/",
                        name: "JSON Forms",
                        description: "Framework-agnostic form generation",
                      },
                    ],
                  },
                  {
                    title: "Validation Libraries",
                    links: [
                      {
                        url: "https://ajv.js.org/",
                        name: "Ajv",
                        description: "The fastest JSON Schema validator",
                      },
                      {
                        url: "https://python-jsonschema.readthedocs.io/",
                        name: "jsonschema",
                        description: "Python validation library",
                      },
                    ],
                  },
                  {
                    title: "Documentation",
                    links: [
                      {
                        url: "https://www.openapis.org/",
                        name: "OpenAPI",
                        description: "API docs with JSON Schema",
                      },
                      {
                        url: "https://redocly.com/",
                        name: "Redoc",
                        description: "Interactive API documentation",
                      },
                    ],
                  },
                  {
                    title: "IDE Support",
                    links: [
                      {
                        url: "https://code.visualstudio.com/docs/languages/json#_json-schemas-and-settings",
                        name: "VS Code",
                        description: "Built-in schema validation",
                      },
                      {
                        url: "https://www.jetbrains.com/help/idea/json.html#ws_json_using_schemas",
                        name: "JetBrains Idea",
                        description: "Schema-aware completions",
                      },
                    ],
                  },
                  {
                    title: "API Integration",
                    links: [
                      {
                        url: "https://www.postman.com/",
                        name: "Postman",
                        description: "Test APIs with schema validation",
                      },
                      {
                        url: "https://swagger.io/",
                        name: "Swagger",
                        description: "Design and document APIs",
                      },
                    ],
                  },
                  {
                    title: "Data Processing",
                    links: [
                      {
                        url: "https://github.com/json-schema-faker/json-schema-faker",
                        name: "json-schema-faker",
                        description: "Generate mock data",
                      },
                      {
                        url: "https://quicktype.io/",
                        name: "QuickType",
                        description: "Generate code from schema",
                      },
                    ],
                  },
                ].map((section) => (
                  <Paper key={section.title} p="md" withBorder>
                    <Title order={4} size="h5" mb="sm">
                      {section.title}
                    </Title>
                    <Stack gap="xs">
                      {section.links.map((link) => (
                        <Group
                          key={link.url}
                          align="flex-start"
                          wrap="nowrap"
                          gap="xs"
                        >
                          <Text c="blue">•</Text>
                          <Text size="sm" c="dimmed">
                            <Anchor
                              href={link.url}
                              target="_blank"
                              rel="nofollow noopener noreferrer"
                              fw={700}
                            >
                              {link.name}
                            </Anchor>
                            {" - "}
                            {link.description}
                          </Text>
                        </Group>
                      ))}
                    </Stack>
                  </Paper>
                ))}
              </SimpleGrid>
              <Center mt="lg">
                <Anchor
                  href="https://json-schema.org/tools"
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                >
                  Explore more JSON Schema tools →
                </Anchor>
              </Center>
            </Box>

            {/* Author Footer */}
            <Box
              mt={80}
              py="md"
              style={{
                borderTop: "1px solid var(--mantine-color-default-border)",
              }}
            >
              <Group justify="center" gap="xs">
                <Text size="sm" c="dimmed">
                  Built by
                </Text>
                {[
                  {
                    href: "https://ophir.dev",
                    text: "@ophir.dev",
                    icon: User,
                  },
                  {
                    href: "https://github.com/lovasoa/jsonjoy-builder",
                    text: "GitHub",
                    icon: GitBranch,
                    target: "_blank",
                    rel: "nofollow noopener noreferrer",
                  },
                  {
                    href: "https://www.npmjs.com/package/jsonjoy-builder",
                    text: "NPM",
                    icon: Package,
                    target: "_blank",
                    rel: "nofollow noopener noreferrer",
                  },
                ].map((link, index, array) => (
                  <React.Fragment key={link.href}>
                    <Anchor
                      href={link.href}
                      target={link.target}
                      rel={link.rel}
                      c="blue"
                      fw={500}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <link.icon size={14} style={{ opacity: 0.7 }} />
                      {link.text}
                    </Anchor>
                    {index < array.length - 1 && (
                      <Text span c="dimmed" mx={4}>
                        •
                      </Text>
                    )}
                  </React.Fragment>
                ))}
              </Group>
            </Box>
          </Container>
        </Container>
      </Box>
    </TranslationContext>
  );
};

export default Index;
