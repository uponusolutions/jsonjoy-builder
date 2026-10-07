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
import React from "react";
import type { FieldExtensionContext } from "../../../src/components/SchemaEditor/extensions.tsx";
import SchemaVisualEditor from "../../../src/components/SchemaEditor/SchemaVisualEditor.tsx";
import { en } from "../../../src/i18n/locales/en.ts";
import type { JSONSchema } from "../../../src/types/jsonSchema.ts";

const schema: JSONSchema = {
  type: "object",
  properties: {
    kind: { type: "string" },
    group: { type: "object", properties: { inner: { type: "string" } } },
  },
};

function renderEditor(
  extensions: React.ComponentProps<typeof SchemaVisualEditor>["extensions"],
) {
  const changes: JSONSchema[] = [];
  render(
    React.createElement(
      MantineProvider,
      null,
      React.createElement(SchemaVisualEditor, {
        readOnly: false,
        schema,
        onChange: (s) => changes.push(s),
        extensions,
      }),
    ),
  );
  return changes;
}

const body = () => within(document.body);

const expand = (name: string) =>
  fireEvent.click(
    body()
      .getAllByRole("button", { name: en.expand })
      .find((b) => b.textContent?.includes(name)) as HTMLElement,
  );

describe("SchemaVisualEditor extensions", () => {
  afterEach(cleanup);

  test("render badges for every field with its parent", () => {
    const seen: Array<[string, string[]]> = [];
    renderEditor({
      renderFieldBadges: (ctx) => {
        seen.push([ctx.name, Object.keys(ctx.parent.properties ?? {})]);
        return React.createElement("span", null, `badge-${ctx.name}`);
      },
    });
    assert.ok(body().getByText("badge-kind"));
    assert.ok(body().getByText("badge-group"));
    assert.deepEqual(seen.find(([n]) => n === "kind")?.[1], ["kind", "group"]);
  });

  test("render settings in the expanded panel, nested fields with their own parent", async () => {
    const seen: FieldExtensionContext[] = [];
    renderEditor({
      renderFieldSettings: (ctx) => {
        seen.push(ctx);
        return React.createElement("span", null, `settings-${ctx.name}`);
      },
    });
    assert.equal(body().queryByText("settings-kind"), null);
    expand("group");
    // The type specific editors (here: the group's fields) are loaded lazily.
    await waitFor(() => assert.ok(body().getByText("settings-group")));
    await waitFor(() => expand("inner"));
    await waitFor(() => assert.ok(body().getByText("settings-inner")));
    const inner = seen.find((c) => c.name === "inner");
    assert.deepEqual(Object.keys(inner?.parent.properties ?? {}), ["inner"]);
  });

  test("change the field's schema through the context", () => {
    let context: FieldExtensionContext | undefined;
    const changes = renderEditor({
      renderFieldBadges: (ctx) => {
        if (ctx.name === "kind") context = ctx;
        return null;
      },
    });
    context?.onChange({ type: "string", "x-test": 1 } as never);
    const last = changes.at(-1) as { properties: Record<string, unknown> };
    assert.equal(
      (last.properties.kind as Record<string, unknown>)["x-test"],
      1,
    );
  });

  test("let the extension update references after a rename", () => {
    const calls: string[][] = [];
    const changes = renderEditor({
      onPropertyRenamed: (parent, oldName, newName) => {
        calls.push([oldName, newName]);
        return { ...parent, $comment: `renamed ${oldName}` };
      },
    });
    expand("kind");
    const input = body().getByLabelText(en.fieldNameLabel);
    fireEvent.change(input, { target: { value: "type" } });
    fireEvent.keyDown(input, { key: "Enter" });
    assert.deepEqual(calls, [["kind", "type"]]);
    const last = changes.at(-1) as {
      $comment: string;
      properties: Record<string, unknown>;
    };
    assert.equal(last.$comment, "renamed kind");
    assert.deepEqual(Object.keys(last.properties), ["type", "group"]);
  });
});
