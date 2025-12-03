import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { type FC, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "../../hooks/use-translation.ts";
import { getSchemaProperties } from "../../lib/schemaEditor.ts";
import { cn } from "../../lib/utils.ts";
import type {
  JSONSchema as JSONSchemaType,
  NewField,
  ObjectJSONSchema,
  SchemaType,
} from "../../types/jsonSchema.ts";
import { buildValidationTree } from "../../types/validation.ts";
import SchemaPropertyEditor from "./SchemaPropertyEditor.tsx";

interface SchemaFieldListProps {
  schema: JSONSchemaType;
  readOnly: boolean;
  onAddField: (newField: NewField) => void;
  onEditField: (name: string, updatedField: NewField) => void;
  onDeleteField: (name: string) => void;
  onReorderFields?: (fromIndex: number, toIndex: number) => void;
  showDescription?: boolean;
  disableAnimations?: boolean;
}

const SchemaFieldList: FC<SchemaFieldListProps> = ({
  schema,
  onEditField,
  onDeleteField,
  onReorderFields,
  readOnly = false,
  showDescription = true,
  disableAnimations = false,
}) => {
  const t = useTranslation();

  // Get the properties from the schema
  const properties = getSchemaProperties(schema);

  // Get schema type as a valid SchemaType
  const getValidSchemaType = (propSchema: JSONSchemaType): SchemaType => {
    if (typeof propSchema === "boolean") return "object";

    // Handle array of types by picking the first one
    const type = propSchema.type;
    if (Array.isArray(type)) {
      return type[0] || "object";
    }

    return type || "object";
  };

  // Handle field name change (generates an edit event)
  const handleNameChange = (oldName: string, newName: string) => {
    const property = properties.find((prop) => prop.name === oldName);
    if (!property) return;

    onEditField(oldName, {
      name: newName,
      type: getValidSchemaType(property.schema),
      description:
        typeof property.schema === "boolean"
          ? ""
          : property.schema.description || "",
      required: property.required,
      validation:
        typeof property.schema === "boolean"
          ? { type: "object" }
          : property.schema,
    });
  };

  // Handle required status change
  const handleRequiredChange = (name: string, required: boolean) => {
    const property = properties.find((prop) => prop.name === name);
    if (!property) return;

    onEditField(name, {
      name,
      type: getValidSchemaType(property.schema),
      description:
        typeof property.schema === "boolean"
          ? ""
          : property.schema.description || "",
      required,
      validation:
        typeof property.schema === "boolean"
          ? { type: "object" }
          : property.schema,
    });
  };

  // Handle schema change
  const handleSchemaChange = (
    name: string,
    updatedSchema: ObjectJSONSchema,
  ) => {
    const property = properties.find((prop) => prop.name === name);
    if (!property) return;

    const type = updatedSchema.type || "object";
    // Ensure we're using a single type, not an array of types
    const validType = Array.isArray(type) ? type[0] || "object" : type;

    onEditField(name, {
      name,
      type: validType,
      description: updatedSchema.description || "",
      required: property.required,
      validation: updatedSchema,
    });
  };

  const validationTree = useMemo(
    () => buildValidationTree(schema, t),
    [schema, t],
  );

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    onReorderFields?.(result.source.index, result.destination.index);
  };

  // When readOnly or no reorder handler, render without drag-drop
  if (readOnly || !onReorderFields) {
    return (
      <div className={cn("space-y-2", !disableAnimations && "animate-in")}>
        {properties.map((property) => (
          <SchemaPropertyEditor
            key={property.name}
            name={property.name}
            schema={property.schema}
            required={property.required}
            validationNode={validationTree.children[property.name] ?? undefined}
            onDelete={() => onDeleteField(property.name)}
            onNameChange={(newName) => handleNameChange(property.name, newName)}
            onRequiredChange={(required) =>
              handleRequiredChange(property.name, required)
            }
            onSchemaChange={(schema) =>
              handleSchemaChange(property.name, schema)
            }
            readOnly={readOnly}
            showDescription={showDescription}
            disableAnimations={disableAnimations}
          />
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="schema-fields">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={cn("space-y-2", !disableAnimations && "animate-in")}
          >
            {properties.map((property, index) => (
              <Draggable
                key={property.name}
                draggableId={property.name}
                index={index}
              >
                {(provided, snapshot) => {
                  const content = (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={snapshot.isDragging ? "opacity-90 shadow-lg" : ""}
                    >
                      <SchemaPropertyEditor
                        name={property.name}
                        schema={property.schema}
                        required={property.required}
                        validationNode={
                          validationTree.children[property.name] ?? undefined
                        }
                        onDelete={() => onDeleteField(property.name)}
                        onNameChange={(newName) =>
                          handleNameChange(property.name, newName)
                        }
                        onRequiredChange={(required) =>
                          handleRequiredChange(property.name, required)
                        }
                        onSchemaChange={(schema) =>
                          handleSchemaChange(property.name, schema)
                        }
                        readOnly={readOnly}
                        dragHandleProps={provided.dragHandleProps}
                        showDescription={showDescription}
                        disableAnimations={disableAnimations}
                      />
                    </div>
                  );

                  // Use portal when dragging to avoid transform issues
                  // Wrap in jsonjoy class to preserve styles
                  if (snapshot.isDragging) {
                    return createPortal(
                      <div className="jsonjoy">{content}</div>,
                      document.body,
                    );
                  }
                  return content;
                }}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default SchemaFieldList;
