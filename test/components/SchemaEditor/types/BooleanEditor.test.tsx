import { render } from "@testing-library/react";
import "../../../setup.ts";
import { describe, test } from "node:test";
import React from "react";
import { MantineProvider } from "@mantine/core";
import BooleanEditor from "../../../../src/components/SchemaEditor/types/BooleanEditor.tsx";

describe("BooleanEditor", () => {
  test("write mode does show constraints", (t) => {
    const element = React.createElement(BooleanEditor, {
      readOnly: false,
      onChange: () => {},
      validationNode: undefined,
      schema: {
        type: "boolean",
      },
    });
    t.assert.snapshot(
      render(React.createElement(MantineProvider, null, element)).container
        .innerHTML,
    );
  });
  test("read-only mode doesn't show constraints", (t) => {
    const element = React.createElement(BooleanEditor, {
      readOnly: true,
      onChange: () => {},
      validationNode: undefined,
      schema: {
        type: "boolean",
      },
    });
    t.assert.snapshot(
      render(React.createElement(MantineProvider, null, element)).container
        .innerHTML,
    );
  });
});
