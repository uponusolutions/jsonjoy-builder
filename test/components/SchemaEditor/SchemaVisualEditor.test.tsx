import { render } from "@testing-library/react";
import "../../setup.ts";
import { describe, test } from "node:test";
import React from "react";
import { MantineProvider } from "@mantine/core";
import SchemaVisualEditor from "../../../src/components/SchemaEditor/SchemaVisualEditor.tsx";

describe("SchemaVisualEditor", () => {
  test("write mode does show constraints", (t) => {
    const element = React.createElement(SchemaVisualEditor, {
      readOnly: false,
      onChange: () => {},
      schema: {
        type: "object",
        properties: {
          name: {
            type: "string",
          },
        },
      },
    });
    t.assert.snapshot(
      render(React.createElement(MantineProvider, null, element)).container
        .innerHTML,
    );
  });
  test("read-only mode doesn't show constraints", (t) => {
    const element = React.createElement(SchemaVisualEditor, {
      readOnly: true,
      onChange: () => {},
      schema: {
        type: "object",
        properties: {
          name: {
            type: "string",
          },
        },
      },
    });
    t.assert.snapshot(
      render(React.createElement(MantineProvider, null, element)).container
        .innerHTML,
    );
  });
});
