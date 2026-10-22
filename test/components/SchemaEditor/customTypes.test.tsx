// First: react-dom checks for a DOM when it loads, so jsdom has to be registered before it.
import "../../setup.ts";
import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import { MantineProvider } from "@mantine/core";
import {
  cleanup,
  fireEvent,
  render,
  waitFor,
  within,
} from "@testing-library/react";
import React, { useState } from "react";
import {
  type CustomFieldType,
  matchingCustomType,
  type SchemaEditorExtensions,
} from "../../../src/components/SchemaEditor/extensions.tsx";
import SchemaVisualEditor from "../../../src/components/SchemaEditor/SchemaVisualEditor.tsx";
import { en } from "../../../src/i18n/locales/en.ts";
import type { JSONSchema } from "../../../src/types/jsonSchema.ts";

const body = () => within(document.body);

const created: unknown[] = [];

const heading: CustomFieldType = {
  id: "heading",
  label: "Heading",
  description: "A static heading",
  color: "teal",
  matches: (schema) =>
    typeof schema === "object" && schema["x-heading" as never] === true,
  create: (schema) => {
    created.push(schema);
    return {
      type: "string",
      title: schema.title,
      description: schema.description,
      "x-heading": true,
    } as never;
  },
};

const extensions: SchemaEditorExtensions = {
  customTypes: [heading],
  renderFieldSettings: ({ name }) =>
    React.createElement("span", null, `settings-${name}`),
};

const initial: JSONSchema = {
  type: "object",
  required: ["name", "title"],
  properties: {
    name: { type: "string", title: "Name", description: "Full name" },
    title: { type: "string", title: "Intro", "x-heading": true } as never,
  },
};

/** The editor with its schema in state, as a host app holds it. */
function Host({ onSchema }: { onSchema: (s: JSONSchema) => void }) {
  const [schema, setSchema] = useState(initial);
  return React.createElement(SchemaVisualEditor, {
    readOnly: false,
    schema,
    extensions,
    onChange: (s: JSONSchema) => {
      onSchema(s);
      setSchema(s);
    },
  });
}

function renderHost() {
  const schemas: JSONSchema[] = [];
  render(
    React.createElement(
      MantineProvider,
      null,
      React.createElement(Host, { onSchema: (s) => schemas.push(s) }),
    ),
  );
  return schemas;
}

/** The row of a field: its header, found through the expand button holding the name. */
const row = (name: string) =>
  body()
    .getAllByRole("button", { name: en.expand })
    .find((b) => b.textContent?.includes(name))
    ?.closest(".mantine-Paper-root") as HTMLElement;

const expand = (name: string) =>
  fireEvent.click(within(row(name)).getByRole("button", { name: en.expand }));

const openTypeMenu = (name: string, current: string) =>
  fireEvent.click(within(row(name)).getByRole("button", { name: current }));

describe("custom field types", () => {
  afterEach(cleanup);

  test("matchingCustomType returns the first match", () => {
    const other: CustomFieldType = { ...heading, id: "other" };
    assert.equal(
      matchingCustomType({ customTypes: [heading, other] }, {
        "x-heading": true,
      } as never),
      heading,
    );
    assert.equal(
      matchingCustomType({}, { "x-heading": true } as never),
      undefined,
    );
    assert.equal(
      matchingCustomType({ customTypes: [heading] }, { type: "string" }),
      undefined,
    );
  });

  test("list the custom type in the dropdown after the JSON types", async () => {
    renderHost();
    openTypeMenu("Name", en.schemaTypeString);
    const items = await waitFor(() => {
      const found = body().getAllByRole("menuitem");
      assert.equal(found.length, 7);
      return found;
    });
    assert.equal(items.at(-1)?.textContent, "Heading");
    assert.equal(items.at(-1)?.getAttribute("title"), "A static heading");
    assert.ok(
      document.body.querySelector('[role="separator"], .mantine-Menu-divider'),
    );
  });

  test("show the label of a matching custom type on the button", () => {
    renderHost();
    assert.ok(within(row("Intro")).getByRole("button", { name: "Heading" }));
    assert.equal(
      within(row("Intro")).queryByRole("button", { name: en.schemaTypeString }),
      null,
    );
    assert.ok(
      within(row("Name")).getByRole("button", { name: en.schemaTypeString }),
    );
  });

  test("choosing it creates the schema from the current one and drops required", async () => {
    created.length = 0;
    const schemas = renderHost();
    openTypeMenu("Name", en.schemaTypeString);
    const item = await waitFor(
      () =>
        body()
          .getAllByRole("menuitem")
          .find((i) => i.textContent === "Heading") as HTMLElement,
    );
    fireEvent.click(item);
    assert.equal(created.length, 1);
    assert.equal((created[0] as { title: string }).title, "Name");
    await waitFor(() =>
      assert.ok(within(row("Name")).getByRole("button", { name: "Heading" })),
    );
    // No required dropdown any more, and the required entry is gone.
    await waitFor(() => {
      const last = schemas.at(-1) as { required?: string[] };
      assert.deepEqual(last.required, ["title"]);
    });
    const last = schemas.at(-1) as {
      properties: Record<string, Record<string, unknown>>;
    };
    assert.equal(last.properties.name["x-heading"], true);
    assert.equal(last.properties.name.description, "Full name");
  });

  test("a matching custom type hides the required dropdown and the type editor", async () => {
    renderHost();
    assert.ok(
      within(row("Name")).getByRole("button", { name: en.propertyRequired }),
    );
    assert.equal(
      within(row("Intro")).queryByRole("button", { name: en.propertyRequired }),
      null,
    );
    assert.equal(
      within(row("Intro")).queryByRole("button", { name: en.propertyOptional }),
      null,
    );
    expand("Name");
    await waitFor(() => assert.ok(body().getByText(en.stringPatternLabel)));
    cleanup();
    renderHost();
    expand("Intro");
    // Name, label, description inputs and the extension settings stay, the type editor goes.
    await waitFor(() => assert.ok(body().getByText("settings-title")));
    assert.ok(body().getByLabelText(en.fieldNameLabel));
    assert.ok(body().getByLabelText(en.fieldDescription));
    assert.equal(body().queryByText(en.stringPatternLabel), null);
  });

  test("a custom type that can be required keeps the required dropdown", () => {
    const required: CustomFieldType = { ...heading, canBeRequired: true };
    render(
      React.createElement(
        MantineProvider,
        null,
        React.createElement(SchemaVisualEditor, {
          readOnly: false,
          schema: initial,
          extensions: { customTypes: [required] },
          onChange: () => {},
        }),
      ),
    );
    assert.ok(
      within(row("Intro")).getByRole("button", { name: en.propertyRequired }),
    );
  });

  test("inputs relabel, explain or leave out the label and description inputs", async () => {
    const schemas: JSONSchema[] = [];
    const paragraph: CustomFieldType = {
      ...heading,
      inputs: {
        title: false,
        description: {
          label: "Text",
          description: "Shown in the form",
          multiline: true,
        },
      },
    };
    render(
      React.createElement(
        MantineProvider,
        null,
        React.createElement(SchemaVisualEditor, {
          readOnly: false,
          schema: initial,
          extensions: { customTypes: [paragraph] },
          onChange: (s: JSONSchema) => schemas.push(s),
        }),
      ),
    );
    expand("Intro");
    const text = await waitFor(() => body().getByLabelText("Text"));
    assert.equal(text.tagName, "TEXTAREA");
    assert.ok(body().getByText("Shown in the form"));
    assert.equal(body().queryByLabelText(en.fieldLabelLabel), null);
    assert.ok(body().getByLabelText(en.fieldNameLabel));
    fireEvent.change(text, { target: { value: "Line 1\nLine 2" } });
    fireEvent.blur(text);
    const last = schemas.at(-1) as {
      properties: Record<string, Record<string, unknown>>;
    };
    assert.equal(last.properties.title.description, "Line 1\nLine 2");
  });

  test("choosing a JSON type for a custom field keeps only title and description", async () => {
    const schemas = renderHost();
    openTypeMenu("Intro", "Heading");
    const item = await waitFor(
      () =>
        body()
          .getAllByRole("menuitem")
          .find((i) => i.textContent === en.schemaTypeNumber) as HTMLElement,
    );
    fireEvent.click(item);
    const last = schemas.at(-1) as {
      properties: Record<string, Record<string, unknown>>;
    };
    const field = last.properties.title;
    assert.equal(field.type, "number");
    assert.equal(field.title, "Intro");
    assert.equal("x-heading" in field, false);
  });

  test("the array item type dropdown does not offer custom types", async () => {
    render(
      React.createElement(
        MantineProvider,
        null,
        React.createElement(SchemaVisualEditor, {
          readOnly: false,
          schema: {
            type: "object",
            properties: { tags: { type: "array", items: { type: "string" } } },
          } as JSONSchema,
          extensions,
          onChange: () => {},
        }),
      ),
    );
    expand("tags");
    const label = await waitFor(() => body().getByText(en.arrayItemTypeLabel));
    const group = label.parentElement as HTMLElement;
    fireEvent.click(
      within(group).getByRole("button", { name: en.schemaTypeString }),
    );
    const items = await waitFor(() => {
      const found = body().getAllByRole("menuitem");
      assert.ok(found.length > 0);
      return found;
    });
    assert.equal(items.length, 6);
    assert.equal(
      items.some((i) => i.textContent === "Heading"),
      false,
    );
  });
});
