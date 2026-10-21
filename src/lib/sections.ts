import type { DropResult } from "@hello-pangea/dnd";
import type { SchemaEditorExtensions } from "../components/SchemaEditor/extensions.tsx";
import type { JSONSchema } from "../types/jsonSchema.ts";
import { getSchemaProperties } from "./schemaEditor.ts";

/** A run of root properties: an optional start property and the fields after it. */
export interface Section {
  /** The property starting the section; undefined for the implicit first one. */
  start?: string;
  /** Flat index of the start in the property list; -1 for the implicit section. */
  startIndex: number;
  /** Property names in flat order, the start excluded. */
  fields: string[];
}

/** A position inside a section's field list. */
export interface FieldPosition {
  /** Index into the sections array. */
  section: number;
  /** Index among the section's fields. */
  index: number;
}

/**
 * Splits the property names into sections: the implicit one first (only when it has fields), then
 * one section per start in order.
 */
export function splitSections(
  names: string[],
  isStart: (name: string) => boolean,
): Section[] {
  const implicit: Section = { startIndex: -1, fields: [] };
  const sections: Section[] = [];
  let current = implicit;
  names.forEach((name, index) => {
    if (isStart(name)) {
      current = { start: name, startIndex: index, fields: [] };
      sections.push(current);
    } else {
      current.fields.push(name);
    }
  });
  return implicit.fields.length > 0 ? [implicit, ...sections] : sections;
}

/**
 * True when the extensions define `sections` and some root property of `schema` starts a
 * section.
 */
export function hasSections(
  schema: JSONSchema,
  extensions: SchemaEditorExtensions,
): boolean {
  const { sections } = extensions;
  if (!sections) return false;
  return getSchemaProperties(schema).some((p) => sections.isStart(p.schema));
}

/** Flat index after the section's last entry: where its add button inserts a new property. */
export function sectionEnd(section: Section, names: string[]): number {
  const end =
    section.start === undefined
      ? section.fields.length
      : section.startIndex + 1 + section.fields.length;
  return Math.min(end, names.length);
}

/**
 * Translates a drop of a field into the arguments of `reorderProperties`: `toIndex` is the position
 * in the list without the moved property. Null for an unknown section or field, or a no-op.
 */
export function fieldDrop(
  names: string[],
  sections: Section[],
  from: FieldPosition,
  to: FieldPosition,
): { fromIndex: number; toIndex: number } | null {
  const fromSection = sections[from.section];
  const toSection = sections[to.section];
  if (!fromSection || !toSection) return null;
  if (from.section === to.section && from.index === to.index) return null;

  const moved = fromSection.fields[from.index];
  if (moved === undefined) return null;
  const fromIndex = names.indexOf(moved);
  if (fromIndex < 0) return null;

  const reduced = names.filter((name) => name !== moved);
  let anchor = 0;
  if (toSection.start !== undefined) {
    const startIndex = reduced.indexOf(toSection.start);
    if (startIndex < 0) return null;
    anchor = startIndex + 1;
  }
  const toIndex = anchor + to.index;
  if (toIndex === fromIndex) return null;
  return { fromIndex, toIndex };
}

/**
 * Translates a drop of a section into the arguments of `reorderProperties`. `fromPos` and `toPos`
 * are positions among the sections with a start (the implicit one cannot be moved). Null for an
 * out-of-range position or a no-op.
 */
export function sectionDrop(
  names: string[],
  sections: Section[],
  fromPos: number,
  toPos: number,
): { fromIndex: number; count: number; toIndex: number } | null {
  const movable = sections.filter((s) => s.start !== undefined);
  const moved = movable[fromPos];
  if (!moved || toPos < 0 || toPos >= movable.length) return null;
  if (fromPos === toPos) return null;

  const fromIndex = moved.startIndex;
  const count = 1 + moved.fields.length;
  if (fromIndex + count > names.length) return null;

  const implicitLength =
    sections.find((s) => s.start === undefined)?.fields.length ?? 0;
  const before = movable
    .filter((_, pos) => pos !== fromPos)
    .slice(0, toPos)
    .reduce((sum, s) => sum + 1 + s.fields.length, 0);
  return { fromIndex, count, toIndex: implicitLength + before };
}

/** The reorder a drop asks for, or null when it changes nothing. */
export function dropToReorder(
  result: Pick<DropResult, "type" | "source" | "destination">,
  names: string[],
  sections: Section[],
  droppableIdOf: (section: Section) => string,
): { fromIndex: number; toIndex: number; count: number } | null {
  const { destination, source } = result;
  if (!destination) return null;
  if (result.type === "section") {
    return sectionDrop(names, sections, source.index, destination.index);
  }
  const fromSection = sections.findIndex(
    (s) => droppableIdOf(s) === source.droppableId,
  );
  const toSection = sections.findIndex(
    (s) => droppableIdOf(s) === destination.droppableId,
  );
  const drop = fieldDrop(
    names,
    sections,
    { section: fromSection, index: source.index },
    { section: toSection, index: destination.index },
  );
  return drop && { ...drop, count: 1 };
}
