import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { reorderProperties } from "../src/lib/schemaEditor.ts";
import {
  dropToReorder,
  fieldDrop,
  hasSections,
  type Section,
  sectionDrop,
  sectionEnd,
  splitSections,
} from "../src/lib/sections.ts";
import type { ObjectJSONSchema } from "../src/types/jsonSchema.ts";

const isBreak = (name: string) => name.startsWith("p");

const schemaOf = (names: string[]): ObjectJSONSchema => ({
  type: "object",
  required: [names[0]],
  properties: Object.fromEntries(
    names.map((name) => [
      name,
      isBreak(name)
        ? ({ type: "string", "x-page": true } as never)
        : { type: "string" },
    ]),
  ),
});

const keysOf = (schema: ObjectJSONSchema) =>
  Object.keys(schema.properties ?? {}).join(",");

// a, b | p2: c, d | p3: e | p4 (empty)
const flat = ["a", "b", "p2", "c", "d", "p3", "e", "p4"];

describe("splitSections", () => {
  test("without starts there is one implicit section", () => {
    const sections = splitSections(["a", "b"], isBreak);
    assert.deepEqual(sections, [{ startIndex: -1, fields: ["a", "b"] }]);
  });

  test("a leading start leaves no implicit section", () => {
    const sections = splitSections(["p1", "a", "p2", "b"], isBreak);
    assert.deepEqual(sections, [
      { start: "p1", startIndex: 0, fields: ["a"] },
      { start: "p2", startIndex: 2, fields: ["b"] },
    ]);
  });

  test("consecutive starts give an empty section", () => {
    const sections = splitSections(["a", "p2", "p3", "b"], isBreak);
    assert.deepEqual(sections, [
      { startIndex: -1, fields: ["a"] },
      { start: "p2", startIndex: 1, fields: [] },
      { start: "p3", startIndex: 2, fields: ["b"] },
    ]);
  });
});

describe("hasSections", () => {
  const matches = (s: unknown) =>
    typeof s === "object" && (s as Record<string, unknown>)["x-page"] === true;

  test("needs the extension and a start", () => {
    const withStart = schemaOf(["a", "p2"]);
    const without = schemaOf(["a", "b"]);
    const sections = { isStart: matches, firstTitle: "Page 1" };
    assert.equal(hasSections(withStart, { sections }), true);
    assert.equal(hasSections(without, { sections }), false);
    assert.equal(hasSections(withStart, {}), false);
  });
});

describe("sectionEnd", () => {
  const sections = splitSections(flat, isBreak);

  test("is the flat index after the section's last entry", () => {
    assert.deepEqual(
      sections.map((s) => sectionEnd(s, flat)),
      [2, 5, 7, 8],
    );
  });
});

describe("fieldDrop", () => {
  const sections = splitSections(flat, isBreak);
  const move = (
    from: { section: number; index: number },
    to: { section: number; index: number },
  ) => {
    const drop = fieldDrop(flat, sections, from, to);
    assert.ok(drop);
    return keysOf(
      reorderProperties(schemaOf(flat), drop.fromIndex, drop.toIndex),
    );
  };

  test("moves down within a section", () => {
    assert.equal(
      move({ section: 1, index: 0 }, { section: 1, index: 1 }),
      "a,b,p2,d,c,p3,e,p4",
    );
  });

  test("moves up within a section", () => {
    assert.equal(
      move({ section: 1, index: 1 }, { section: 1, index: 0 }),
      "a,b,p2,d,c,p3,e,p4",
    );
    assert.equal(
      move({ section: 0, index: 1 }, { section: 0, index: 0 }),
      "b,a,p2,c,d,p3,e,p4",
    );
  });

  test("moves into a later section", () => {
    assert.equal(
      move({ section: 0, index: 0 }, { section: 2, index: 1 }),
      "b,p2,c,d,p3,e,a,p4",
    );
    assert.equal(
      move({ section: 1, index: 0 }, { section: 2, index: 0 }),
      "a,b,p2,d,p3,c,e,p4",
    );
  });

  test("moves into an earlier section", () => {
    assert.equal(
      move({ section: 2, index: 0 }, { section: 1, index: 1 }),
      "a,b,p2,c,e,d,p3,p4",
    );
    assert.equal(
      move({ section: 1, index: 1 }, { section: 0, index: 0 }),
      "d,a,b,p2,c,p3,e,p4",
    );
  });

  test("moves into an empty section", () => {
    assert.equal(
      move({ section: 0, index: 1 }, { section: 3, index: 0 }),
      "a,p2,c,d,p3,e,p4,b",
    );
  });

  test("moves into the implicit section", () => {
    assert.equal(
      move({ section: 2, index: 0 }, { section: 0, index: 2 }),
      "a,b,e,p2,c,d,p3,p4",
    );
  });

  test("is null for a no-op or unknown positions", () => {
    assert.equal(
      fieldDrop(
        flat,
        sections,
        { section: 1, index: 1 },
        { section: 1, index: 1 },
      ),
      null,
    );
    assert.equal(
      fieldDrop(
        flat,
        sections,
        { section: 9, index: 0 },
        { section: 1, index: 0 },
      ),
      null,
    );
    assert.equal(
      fieldDrop(
        flat,
        sections,
        { section: 1, index: 0 },
        { section: 9, index: 0 },
      ),
      null,
    );
    assert.equal(
      fieldDrop(
        flat,
        sections,
        { section: 1, index: 5 },
        { section: 0, index: 0 },
      ),
      null,
    );
  });
});

describe("sectionDrop", () => {
  const apply = (
    names: string[],
    sections: Section[],
    from: number,
    to: number,
  ) => {
    const drop = sectionDrop(names, sections, from, to);
    assert.ok(drop);
    return keysOf(
      reorderProperties(
        schemaOf(names),
        drop.fromIndex,
        drop.toIndex,
        drop.count,
      ),
    );
  };

  test("moves a section down with an implicit first section", () => {
    const sections = splitSections(flat, isBreak);
    assert.equal(apply(flat, sections, 0, 1), "a,b,p3,e,p2,c,d,p4");
    assert.equal(apply(flat, sections, 0, 2), "a,b,p3,e,p4,p2,c,d");
  });

  test("moves a section up with an implicit first section", () => {
    const sections = splitSections(flat, isBreak);
    assert.equal(apply(flat, sections, 1, 0), "a,b,p3,e,p2,c,d,p4");
    assert.equal(apply(flat, sections, 2, 0), "a,b,p4,p2,c,d,p3,e");
  });

  test("moves sections without an implicit first section", () => {
    const names = ["p1", "a", "p2", "b", "c", "p3"];
    const sections = splitSections(names, isBreak);
    assert.equal(apply(names, sections, 0, 1), "p2,b,c,p1,a,p3");
    assert.equal(apply(names, sections, 0, 2), "p2,b,c,p3,p1,a");
    assert.equal(apply(names, sections, 1, 0), "p2,b,c,p1,a,p3");
    assert.equal(apply(names, sections, 2, 1), "p1,a,p3,p2,b,c");
  });

  test("is null for a no-op or an out-of-range position", () => {
    const sections = splitSections(flat, isBreak);
    assert.equal(sectionDrop(flat, sections, 1, 1), null);
    assert.equal(sectionDrop(flat, sections, 0, 3), null);
    assert.equal(sectionDrop(flat, sections, 5, 0), null);
    assert.equal(sectionDrop(flat, sections, 0, -1), null);
  });
});

describe("dropToReorder", () => {
  const sections = splitSections(flat, isBreak);
  const idOf = (s: Section) => `box-${s.start ?? "first"}`;
  const apply = (drop: { fromIndex: number; toIndex: number; count: number }) =>
    keysOf(
      reorderProperties(
        schemaOf(flat),
        drop.fromIndex,
        drop.toIndex,
        drop.count,
      ),
    );

  test("translates a field drop between two sections", () => {
    const drop = dropToReorder(
      {
        type: "field",
        source: { droppableId: "box-p2", index: 0 },
        destination: { droppableId: "box-p3", index: 1 },
      },
      flat,
      sections,
      idOf,
    );
    assert.deepEqual(drop, { fromIndex: 3, toIndex: 6, count: 1 });
    assert.ok(drop);
    assert.equal(apply(drop), "a,b,p2,d,p3,e,c,p4");
  });

  test("translates a section drop", () => {
    const drop = dropToReorder(
      {
        type: "section",
        source: { droppableId: "sections", index: 0 },
        destination: { droppableId: "sections", index: 1 },
      },
      flat,
      sections,
      idOf,
    );
    assert.deepEqual(drop, { fromIndex: 2, toIndex: 4, count: 3 });
    assert.ok(drop);
    assert.equal(apply(drop), "a,b,p3,e,p2,c,d,p4");
  });

  test("is null without a destination", () => {
    assert.equal(
      dropToReorder(
        {
          type: "field",
          source: { droppableId: "box-p2", index: 0 },
          destination: null,
        },
        flat,
        sections,
        idOf,
      ),
      null,
    );
  });

  test("is null for an unknown droppable id", () => {
    assert.equal(
      dropToReorder(
        {
          type: "field",
          source: { droppableId: "box-p2", index: 0 },
          destination: { droppableId: "box-nope", index: 0 },
        },
        flat,
        sections,
        idOf,
      ),
      null,
    );
  });
});
