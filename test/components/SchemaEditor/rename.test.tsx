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
import SchemaVisualEditor from "../../../src/components/SchemaEditor/SchemaVisualEditor.tsx";
import { en } from "../../../src/i18n/locales/en.ts";
import type { JSONSchema } from "../../../src/types/jsonSchema.ts";

const body = () => within(document.body);

/** The editor with its schema in state, as a host app holds it. */
function Host({ initial }: { initial: JSONSchema }) {
  const [schema, setSchema] = useState(initial);
  return React.createElement(SchemaVisualEditor, {
    readOnly: false,
    schema,
    onChange: setSchema,
  });
}

function renderHost(initial: JSONSchema) {
  render(
    React.createElement(
      MantineProvider,
      null,
      React.createElement(Host, { initial }),
    ),
  );
}

const expand = (name: string) =>
  fireEvent.click(
    body()
      .getAllByRole("button", { name: en.expand })
      .find((b) => b.textContent?.includes(name)) as HTMLElement,
  );

/** Gives the only expanded field a label; its default key follows the label. */
function setLabel(label: string) {
  const input = body()
    .getAllByLabelText(en.fieldLabelLabel)
    .at(-1) as HTMLElement;
  fireEvent.change(input, { target: { value: label } });
  fireEvent.keyDown(input, { key: "Enter" });
}

describe("renaming a field", () => {
  afterEach(cleanup);

  test("keeps a top-level field expanded", async () => {
    renderHost({
      type: "object",
      properties: { newField: { type: "string" } },
    });
    expand("newField");
    setLabel("First name");
    await waitFor(() =>
      assert.ok(body().getByDisplayValue("firstName"), "key follows label"),
    );
    assert.equal(
      body().getAllByRole("button", { name: en.collapse }).length,
      1,
    );
  });

  test("keeps a field in a group expanded", async () => {
    renderHost({
      type: "object",
      properties: {
        group: {
          type: "object",
          properties: { newField: { type: "string" } },
        },
      },
    });
    expand("group");
    await waitFor(() => expand("newField"));
    await waitFor(() =>
      assert.equal(body().getAllByLabelText(en.fieldLabelLabel).length, 2),
    );
    setLabel("City");
    await waitFor(() => assert.ok(body().getByDisplayValue("city")));
    assert.equal(
      body().getAllByRole("button", { name: en.collapse }).length,
      2,
    );
  });
});
