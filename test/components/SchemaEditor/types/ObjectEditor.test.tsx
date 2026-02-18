import { render } from "@testing-library/react";
import "../../../setup.ts";
import { stabilizeHtml } from "../../../utils.ts";
import { describe, test } from "node:test";
import React from "react";
import { MantineProvider } from "@mantine/core";
import ObjectEditor from "../../../../src/components/SchemaEditor/types/ObjectEditor.tsx";

describe("ObjectEditor", () => {
  test("write mode does show constraints", (t) => {
    const element = React.createElement(ObjectEditor, {
      readOnly: false,
      onChange: () => { },
      depth: 0,
      validationNode: undefined,
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
      stabilizeHtml(
        render(React.createElement(MantineProvider, null, element)).container
          .innerHTML,
      ),
    );
  });
  test("read-only mode doesn't show constraints", (t) => {
    const element = React.createElement(ObjectEditor, {
      readOnly: true,
      onChange: () => { },
      depth: 0,
      validationNode: undefined,
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
      stabilizeHtml(
        render(React.createElement(MantineProvider, null, element)).container
          .innerHTML,
      ),
    );
  });
});
