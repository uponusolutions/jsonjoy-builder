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
import type {
  CustomFieldType,
  SchemaEditorExtensions,
} from "../../../src/components/SchemaEditor/extensions.tsx";
import SchemaVisualEditor from "../../../src/components/SchemaEditor/SchemaVisualEditor.tsx";
import { en } from "../../../src/i18n/locales/en.ts";
import type { JSONSchema } from "../../../src/types/jsonSchema.ts";

const body = () => within(document.body);

const pageBreak: CustomFieldType = {
  id: "pageBreak",
  label: "Page break",
  matches: (schema) =>
    typeof schema === "object" && schema["x-page" as never] === true,
  create: (schema) =>
    ({ type: "string", title: schema.title, "x-page": true }) as never,
};

const extensions: SchemaEditorExtensions = {
  customTypes: [pageBreak],
  sections: { isStart: pageBreak.matches, firstTitle: "Page 1" },
};

const field = (title: string) => ({ type: "string", title });
const brk = (title: string) =>
  ({ type: "string", title, "x-page": true }) as never;

const initial: JSONSchema = {
  type: "object",
  properties: {
    intro: field("Intro"),
    name: field("Name"),
    second: brk("Second"),
    email: field("Email"),
    third: brk("Third"),
    phone: field("Phone"),
  },
};

const withAddSection: SchemaEditorExtensions = {
  ...extensions,
  sections: {
    isStart: pageBreak.matches,
    firstTitle: "Page 1",
    addSection: {
      label: "Add page",
      name: "page",
      create: () => ({ type: "string", "x-page": true }) as never,
    },
  },
};

function Host({
  start,
  readOnly = false,
  ext = extensions,
  onSchema,
}: {
  start: JSONSchema;
  readOnly?: boolean;
  ext?: SchemaEditorExtensions;
  onSchema: (s: JSONSchema) => void;
}) {
  const [schema, setSchema] = useState(start);
  return React.createElement(SchemaVisualEditor, {
    readOnly,
    schema,
    extensions: ext,
    onChange: (s: JSONSchema) => {
      onSchema(s);
      setSchema(s);
    },
  });
}

function renderHost(
  start: JSONSchema = initial,
  readOnly = false,
  ext: SchemaEditorExtensions = extensions,
) {
  const schemas: JSONSchema[] = [];
  render(
    React.createElement(
      MantineProvider,
      null,
      React.createElement(Host, {
        start,
        readOnly,
        ext,
        onSchema: (s) => schemas.push(s),
      }),
    ),
  );
  return schemas;
}

const keys = (schema: JSONSchema | undefined) =>
  Object.keys((schema as { properties: object }).properties);

const groups = () => body().queryAllByRole("group");
const group = (name: string) => body().getByRole("group", { name });

/** The row of a field: the Paper holding the expand button with its name. */
const row = (name: string) =>
  body()
    .getAllByRole("button", { name: en.expand })
    .find((b) => b.textContent?.includes(name))
    ?.closest(".mantine-Paper-root") as HTMLElement;

describe("sections", () => {
  afterEach(cleanup);

  test("renders a box per section with its fields inside", () => {
    renderHost();
    assert.deepEqual(
      groups().map((g) => g.getAttribute("aria-label")),
      ["Page 1", "Second", "Third"],
    );
    const first = within(group("Page 1"));
    assert.ok(first.getByText("Intro"));
    assert.ok(first.getByText("Name"));
    assert.equal(first.queryByText("Email"), null);
    const second = within(group("Second"));
    assert.ok(second.getByText("Email"));
    assert.equal(second.queryByText("Phone"), null);
    assert.ok(within(group("Third")).getByText("Phone"));
  });

  test("replaces the top add button with one per section that inserts at the section's end", () => {
    const schemas = renderHost();
    const buttons = body().getAllByRole("button", {
      name: en.fieldAddNewButton,
    });
    assert.equal(buttons.length, 3);
    assert.equal(
      within(group("Page 1")).getAllByRole("button", {
        name: en.fieldAddNewButton,
      }).length,
      1,
    );
    fireEvent.click(buttons[0]);
    assert.deepEqual(keys(schemas.at(-1)), [
      "intro",
      "name",
      "newField",
      "second",
      "email",
      "third",
      "phone",
    ]);
    fireEvent.click(
      within(group("Second")).getByRole("button", {
        name: en.fieldAddNewButton,
      }),
    );
    assert.deepEqual(keys(schemas.at(-1)), [
      "intro",
      "name",
      "newField",
      "second",
      "email",
      "newField2",
      "third",
      "phone",
    ]);
    fireEvent.click(
      within(group("Third")).getByRole("button", {
        name: en.fieldAddNewButton,
      }),
    );
    assert.equal(keys(schemas.at(-1)).at(-1), "newField3");
  });

  test("addSection adds a button outside the boxes that appends a section", async () => {
    const schemas = renderHost(initial, false, withAddSection);
    const add = body().getByRole("button", { name: "Add page" });
    assert.equal(add.closest("[role=group]"), null);
    fireEvent.click(add);
    assert.deepEqual(keys(schemas.at(-1)).slice(-2), ["phone", "page"]);
    assert.equal(
      (schemas.at(-1) as { properties: Record<string, object> }).properties
        .page["x-page" as never],
      true,
    );
    await waitFor(() => assert.equal(groups().length, 4));
    fireEvent.click(body().getByRole("button", { name: "Add page" }));
    assert.equal(keys(schemas.at(-1)).at(-1), "page2");
  });

  test("addSection shows no button without a section or read-only", () => {
    renderHost(
      { type: "object", properties: { a: field("A") } },
      false,
      withAddSection,
    );
    assert.equal(body().queryByRole("button", { name: "Add page" }), null);
    cleanup();
    renderHost(initial, true, withAddSection);
    assert.equal(body().queryByRole("button", { name: "Add page" }), null);
  });

  test("a schema starting with a break has no implicit section", () => {
    renderHost({
      type: "object",
      properties: { first: brk("First"), a: field("A"), second: brk("Second") },
    });
    assert.deepEqual(
      groups().map((g) => g.getAttribute("aria-label")),
      ["First", "Second"],
    );
    assert.equal(body().queryByRole("group", { name: "Page 1" }), null);
    assert.ok(within(group("Second")).getByText(en.sectionEmpty));
  });

  test("a schema without a break renders as before", () => {
    renderHost({
      type: "object",
      properties: { a: field("A"), b: field("B") },
    });
    assert.equal(groups().length, 0);
    assert.equal(
      body().getAllByRole("button", { name: en.fieldAddNewButton }).length,
      1,
    );
  });

  test("read-only renders the boxes without add buttons or handles", () => {
    renderHost(initial, true);
    assert.equal(groups().length, 3);
    assert.equal(
      body().queryAllByRole("button", { name: en.fieldAddNewButton }).length,
      0,
    );
    assert.equal(
      body().queryAllByRole("button", { name: "Drag to reorder" }).length,
      0,
    );
  });

  test("deleting a break keeps its fields in place", async () => {
    const schemas = renderHost();
    assert.equal(
      within(group("Second")).getAllByRole("button", {
        name: "Drag to reorder",
      }).length,
      2,
    );
    fireEvent.click(
      within(row("Second")).getByRole("button", { name: en.propertyDelete }),
    );
    assert.deepEqual(keys(schemas.at(-1)), [
      "intro",
      "name",
      "email",
      "third",
      "phone",
    ]);
    await waitFor(() => {
      assert.deepEqual(
        groups().map((g) => g.getAttribute("aria-label")),
        ["Page 1", "Third"],
      );
    });
    assert.ok(within(group("Page 1")).getByText("Email"));
  });
});
