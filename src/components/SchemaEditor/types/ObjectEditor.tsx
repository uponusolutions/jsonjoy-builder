import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Box, Paper, Stack, Text } from "@mantine/core";
import { useId, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "../../../hooks/use-translation.ts";
import {
  getSchemaProperties,
  removeObjectProperty,
  renameObjectProperty,
  reorderProperties,
  updateObjectProperty,
  updatePropertyRequired,
} from "../../../lib/schemaEditor.ts";
import { cn } from "../../../lib/utils.ts";
import type { NewField, ObjectJSONSchema } from "../../../types/jsonSchema.ts";
import { asObjectSchema, isBooleanSchema } from "../../../types/jsonSchema.ts";
import AddFieldButton from "../AddFieldButton.tsx";
import SchemaPropertyEditor from "../SchemaPropertyEditor.tsx";
import type { TypeEditorProps } from "../TypeEditor.tsx";

const ObjectEditor: React.FC<TypeEditorProps> = ({
  schema,
  validationNode,
  onChange,
  depth = 0,
  readOnly = false,
  showDescription = true,
}) => {
  const t = useTranslation();

  // Get object properties
  const properties = useMemo(() => getSchemaProperties(schema), [schema]);

  // Stable list of sibling keys, so SchemaPropertyEditor's otherKeys memo holds.
  const existingKeys = useMemo(
    () => properties.map((p) => p.name),
    [properties],
  );

  // Create a normalized schema object
  const normalizedSchema: ObjectJSONSchema = isBooleanSchema(schema)
    ? { type: "object", properties: {} }
    : { ...schema, type: "object", properties: schema.properties || {} };

  // Handle adding a new property
  const handleAddProperty = (newField: NewField) => {
    // Create field schema from the new field data
    const fieldSchema = {
      type: newField.type,
      description: newField.description || undefined,
      ...(newField.validation || {}),
    } as ObjectJSONSchema;

    // Add the property to the schema
    let newSchema = updateObjectProperty(
      normalizedSchema,
      newField.name,
      fieldSchema,
    );

    // Update required status if needed
    if (newField.required) {
      newSchema = updatePropertyRequired(newSchema, newField.name, true);
    }

    // Update the schema
    onChange(newSchema);
  };

  // Handle deleting a property
  const handleDeleteProperty = (propertyName: string) => {
    const newSchema = removeObjectProperty(normalizedSchema, propertyName);
    onChange(newSchema);
  };

  // Handle property name change
  const handlePropertyNameChange = (
    oldName: string,
    newName: string,
    newSchema?: ObjectJSONSchema,
  ) => {
    if (oldName === newName && !newSchema) return;

    const property = properties.find((p) => p.name === oldName);
    if (!property) return;

    // When the key is auto-derived from the label, the caller passes the
    // updated schema (carrying the new title) so the rename and the title
    // change land in one update instead of overwriting each other.
    const propertySchemaObj = newSchema ?? asObjectSchema(property.schema);

    // renameObjectProperty preserves the property's position and remaps the
    // required array; the old add-then-remove approach moved it to the end.
    onChange(
      renameObjectProperty(
        normalizedSchema,
        oldName,
        newName,
        propertySchemaObj,
      ),
    );
  };

  // Handle property required status change
  const handlePropertyRequiredChange = (
    propertyName: string,
    required: boolean,
  ) => {
    const newSchema = updatePropertyRequired(
      normalizedSchema,
      propertyName,
      required,
    );
    onChange(newSchema);
  };

  const handlePropertySchemaChange = (
    propertyName: string,
    propertySchema: ObjectJSONSchema,
  ) => {
    const newSchema = updateObjectProperty(
      normalizedSchema,
      propertyName,
      propertySchema,
    );
    onChange(newSchema);
  };

  const droppableId = useId();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    const newSchema = reorderProperties(
      normalizedSchema,
      result.source.index,
      result.destination.index,
    );
    onChange(newSchema);
  };

  return (
    <Stack gap="md">
      {properties.length > 0 ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId={droppableId}>
            {(provided) => (
              <Stack
                gap="xs"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {properties.map((property, index) => (
                  <Draggable
                    key={property.name}
                    draggableId={`${droppableId}-${property.name}`}
                    index={index}
                    isDragDisabled={readOnly}
                  >
                    {(provided, snapshot) => {
                      const draggableContent = (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            snapshot.isDragging && "opacity-90 shadow-lg",
                          )}
                        >
                          <SchemaPropertyEditor
                            readOnly={readOnly}
                            name={property.name}
                            schema={property.schema}
                            required={property.required}
                            validationNode={
                              validationNode?.children[property.name]
                            }
                            onDelete={() => handleDeleteProperty(property.name)}
                            onNameChange={(newName, newSchema) =>
                              handlePropertyNameChange(
                                property.name,
                                newName,
                                newSchema,
                              )
                            }
                            onRequiredChange={(required) =>
                              handlePropertyRequiredChange(
                                property.name,
                                required,
                              )
                            }
                            onSchemaChange={(schema) =>
                              handlePropertySchemaChange(property.name, schema)
                            }
                            depth={depth}
                            showDescription={showDescription}
                            dragHandleProps={provided.dragHandleProps}
                            existingKeys={existingKeys}
                          />
                        </div>
                      );

                      // Use portal when dragging to escape stacking context
                      // Wrap in jsonjoy class to preserve styles
                      if (snapshot.isDragging) {
                        return createPortal(
                          <div className="jsonjoy">{draggableContent}</div>,
                          document.body,
                        );
                      }
                      return draggableContent;
                    }}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Stack>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <Paper withBorder p="xs" radius="md">
          <Text size="sm" c="dimmed" fs="italic" ta="center">
            {t.objectPropertiesNone}
          </Text>
        </Paper>
      )}

      {!readOnly && (
        <Box mt="md">
          <AddFieldButton
            onAddField={handleAddProperty}
            variant="secondary"
            showDescription={showDescription}
            existingFields={properties.map((p) => p.name)}
          />
        </Box>
      )}
    </Stack>
  );
};

export default ObjectEditor;
