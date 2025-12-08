import { render } from "@testing-library/react";
import "../../../setup.ts";
import { describe, test } from "node:test";
import React from "react";
import { MantineProvider } from "@mantine/core";
import ArrayEditor from "../../../../src/components/SchemaEditor/types/ArrayEditor.tsx";

describe("ArrayEditor", () => {
  test("write mode does show constraints", (t) => {
    const element = React.createElement(ArrayEditor, {
      readOnly: false,
      onChange: () => {},
      depth: 0,
      validationNode: undefined,
      schema: {
        type: "array",
        items: {
          type: "string",
        },
      },
    });
    t.assert.snapshot(
      render(React.createElement(MantineProvider, null, element)).container
        .innerHTML,
    );
  });
  test("read-only mode doesn't show constraints", (t) => {
    const element = React.createElement(ArrayEditor, {
      readOnly: true,
      onChange: () => {},
      depth: 0,
      validationNode: undefined,
      schema: {
        type: "array",
        items: {
          type: "string",
        },
      },
    });
    t.assert.snapshot(
      render(React.createElement(MantineProvider, null, element)).container
        .innerHTML,
    );
  });
});
