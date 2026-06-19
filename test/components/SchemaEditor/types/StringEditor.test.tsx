import { render } from "@testing-library/react";
import "../../../setup.ts";
import { describe, test } from "node:test";
import { MantineProvider } from "@mantine/core";
import React from "react";
import StringEditor from "../../../../src/components/SchemaEditor/types/StringEditor.tsx";
import { stabilizeHtml } from "../../../utils.ts";

describe("StringEditor", () => {
  test("write mode does show constraints", (t) => {
    const element = React.createElement(StringEditor, {
      readOnly: false,
      onChange: () => {},
      validationNode: undefined,
      schema: {
        type: "number",
      },
    });
    t.assert.snapshot(
      stabilizeHtml(
        render(React.createElement(MantineProvider, null, element)).container
          .innerHTML,
      ),
    );
  });
  test("read-only mode doesn't show constraints", (t) => {
    const element = React.createElement(StringEditor, {
      readOnly: true,
      onChange: () => {},
      validationNode: undefined,
      schema: {
        type: "number",
      },
    });
    t.assert.snapshot(
      stabilizeHtml(
        render(React.createElement(MantineProvider, null, element)).container
          .innerHTML,
      ),
    );
  });
});
