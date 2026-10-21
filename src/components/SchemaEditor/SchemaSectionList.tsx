import {
  DragDropContext,
  Draggable,
  type DraggableProvided,
  type DraggableProvidedDragHandleProps,
  type DraggableStateSnapshot,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Box, Paper, Stack, Text } from "@mantine/core";
import { type FC, type ReactNode, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "../../hooks/use-translation.ts";
import { getSchemaProperties, type Property } from "../../lib/schemaEditor.ts";
import {
  dropToReorder,
  type Section,
  sectionEnd,
  splitSections,
} from "../../lib/sections.ts";
import type { JSONSchema, NewField } from "../../types/jsonSchema.ts";
import AddFieldButton from "./AddFieldButton.tsx";
import { useSchemaEditorExtensions } from "./extensions.tsx";

interface SchemaSectionListProps {
  schema: JSONSchema;
  readOnly: boolean;
  /** Adds a field; `atIndex` is the flat position to insert it at. */
  onAddField: (newField: NewField, atIndex?: number) => void;
  onReorderFields?: (
    fromIndex: number,
    toIndex: number,
    count?: number,
  ) => void;
  /** Renders the editor row of a property, with the handle that drags it. */
  renderRow: (
    property: Property,
    dragHandleProps?: DraggableProvidedDragHandleProps | null,
  ) => ReactNode;
  /** The stable React key of a property. */
  keyOf: (name: string) => string;
}

const FIRST_ID = "section-first";

/** The title of a section: its start's title or key, or the host's title of the implicit one. */
function sectionTitle(
  section: Section,
  properties: Property[],
  firstTitle: string,
): string {
  if (section.start === undefined) return firstTitle;
  const schema = properties.find((p) => p.name === section.start)?.schema;
  const title = typeof schema === "object" ? schema.title : undefined;
  return title || section.start;
}

/** A box around a section: its header and, indented like nested rows, its body. */
const SectionBox: FC<{
  title: string;
  header: ReactNode;
  children: ReactNode;
}> = ({ title, header, children }) => (
  // biome-ignore lint/a11y/useSemanticElements: a fieldset brings browser styles and layout quirks
  <Paper withBorder radius="md" p="xs" role="group" aria-label={title}>
    {header}
    <Box
      ml="md"
      pl="xs"
      mt="xs"
      style={{ borderLeft: "4px solid var(--mantine-color-gray-3)" }}
    >
      {children}
    </Box>
  </Paper>
);

/**
 * Wraps a dragged item. While dragging it is portaled into the body, inside the jsonjoy class to
 * keep the styles, to avoid transform issues.
 */
function draggableContent(
  provided: DraggableProvided,
  snapshot: DraggableStateSnapshot,
  children: ReactNode,
): ReactNode {
  const content = (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      style={{
        ...provided.draggableProps.style,
        opacity: snapshot.isDragging ? 0.9 : 1,
        boxShadow: snapshot.isDragging ? "var(--mantine-shadow-lg)" : "none",
      }}
    >
      {children}
    </div>
  );
  if (snapshot.isDragging) {
    return createPortal(
      <div className="jsonjoy">{content}</div>,
      document.body,
    );
  }
  return content;
}

/**
 * The root properties as boxes, one per section (e.g. page of a form): the start property is the
 * header, its fields sit inside. Fields drag between boxes, a box drags by its header.
 */
const SchemaSectionList: FC<SchemaSectionListProps> = ({
  schema,
  readOnly,
  onAddField,
  onReorderFields,
  renderRow,
  keyOf,
}) => {
  const t = useTranslation();
  const extensions = useSchemaEditorExtensions();
  const sectionsExtension = extensions.sections;

  const properties = useMemo(() => getSchemaProperties(schema), [schema]);
  const names = useMemo(() => properties.map((p) => p.name), [properties]);
  const sections = useMemo(() => {
    const byName = new Map(properties.map((p) => [p.name, p.schema]));
    const isStart = sectionsExtension?.isStart;
    return splitSections(names, (name) => {
      const propSchema = byName.get(name);
      return !!isStart && propSchema !== undefined && isStart(propSchema);
    });
  }, [properties, names, sectionsExtension]);

  const firstTitle = sectionsExtension?.firstTitle ?? "";
  const dnd = !readOnly && !!onReorderFields;
  const propertyOf = (name: string) =>
    properties.find((p) => p.name === name) as Property;

  const droppableIdOf = (section: Section) =>
    section.start === undefined ? FIRST_ID : `section-${keyOf(section.start)}`;

  const handleDragEnd = (result: DropResult) => {
    if (!onReorderFields) return;
    const drop = dropToReorder(result, names, sections, droppableIdOf);
    if (drop) onReorderFields(drop.fromIndex, drop.toIndex, drop.count);
  };

  const fieldRow = (name: string, index: number) => {
    const property = propertyOf(name);
    if (!dnd) return <div key={keyOf(name)}>{renderRow(property)}</div>;
    return (
      <Draggable key={keyOf(name)} draggableId={keyOf(name)} index={index}>
        {(provided, snapshot) =>
          draggableContent(
            provided,
            snapshot,
            renderRow(property, provided.dragHandleProps),
          )
        }
      </Draggable>
    );
  };

  const fieldList = (section: Section) => {
    if (!dnd) {
      return (
        <Stack gap="xs">
          {section.fields.map((name, index) => fieldRow(name, index))}
        </Stack>
      );
    }
    return (
      <Droppable droppableId={droppableIdOf(section)} type="field">
        {(provided, snapshot) => (
          <Stack
            {...provided.droppableProps}
            ref={provided.innerRef}
            gap="xs"
            mih={section.fields.length === 0 ? 40 : undefined}
            justify="center"
          >
            {section.fields.map((name, index) => fieldRow(name, index))}
            {provided.placeholder}
            {section.fields.length === 0 && !snapshot.isDraggingOver && (
              <Text size="sm" fs="italic" c="dimmed" ta="center">
                {t.sectionEmpty}
              </Text>
            )}
          </Stack>
        )}
      </Droppable>
    );
  };

  const body = (section: Section) => (
    <>
      {fieldList(section)}
      {!readOnly && (
        <Box mt="xs">
          <AddFieldButton
            variant="secondary"
            onAddField={(field) =>
              onAddField(field, sectionEnd(section, names))
            }
            existingFields={names}
          />
        </Box>
      )}
    </>
  );

  const implicit = sections.find((s) => s.start === undefined);
  const starts = sections.filter((s) => s.start !== undefined);

  const startBox = (
    section: Section,
    dragHandleProps?: DraggableProvidedDragHandleProps | null,
  ) => (
    <SectionBox
      title={sectionTitle(section, properties, firstTitle)}
      header={renderRow(propertyOf(section.start as string), dragHandleProps)}
    >
      {body(section)}
    </SectionBox>
  );

  const implicitBox = implicit && (
    <SectionBox
      title={firstTitle}
      header={
        <Text fw={500} px="xs">
          {firstTitle}
        </Text>
      }
    >
      {body(implicit)}
    </SectionBox>
  );

  if (!dnd) {
    return (
      <Stack gap="xs" className="animate-in">
        {implicitBox}
        {starts.map((section) => (
          <div key={droppableIdOf(section)}>{startBox(section)}</div>
        ))}
      </Stack>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Stack gap="xs" className="animate-in">
        {implicitBox}
        <Droppable droppableId="sections" type="section">
          {(provided) => (
            <Stack
              {...provided.droppableProps}
              ref={provided.innerRef}
              gap="xs"
            >
              {starts.map((section, index) => (
                <Draggable
                  key={droppableIdOf(section)}
                  draggableId={droppableIdOf(section)}
                  index={index}
                >
                  {(provided, snapshot) =>
                    draggableContent(
                      provided,
                      snapshot,
                      startBox(section, provided.dragHandleProps),
                    )
                  }
                </Draggable>
              ))}
              {provided.placeholder}
            </Stack>
          )}
        </Droppable>
      </Stack>
    </DragDropContext>
  );
};

export default SchemaSectionList;
