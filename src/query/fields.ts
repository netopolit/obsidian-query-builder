import { QueryFieldId, OperatorId } from "../types";

export interface FieldDefinition {
	id: QueryFieldId;
	label: string;
	prefix: string;
	allowedOperators: OperatorId[];
	hasPropertyName: boolean;
}

const textOperators: OperatorId[] = [
	OperatorId.Contains,
	OperatorId.DoesNotContain,
	OperatorId.IsExactly,
	OperatorId.IsNotExactly,
	OperatorId.MatchesRegex,
];

const lineOperators: OperatorId[] = [
	OperatorId.Contains,
	OperatorId.DoesNotContain,
	OperatorId.IsExactly,
	OperatorId.MatchesRegex,
];

const propertyOperators: OperatorId[] = [
	OperatorId.Equals,
	OperatorId.DoesNotEqual,
	OperatorId.IsEmpty,
	OperatorId.IsNotEmpty,
	OperatorId.GreaterThan,
	OperatorId.LessThan,
];

export const FIELDS: FieldDefinition[] = [
	{ id: QueryFieldId.Keyword, label: "Keyword", prefix: "", allowedOperators: lineOperators, hasPropertyName: false },
	{ id: QueryFieldId.FileName, label: "File name", prefix: "file:", allowedOperators: textOperators, hasPropertyName: false },
	{ id: QueryFieldId.FilePath, label: "File path", prefix: "path:", allowedOperators: textOperators, hasPropertyName: false },
	{ id: QueryFieldId.Content, label: "Content", prefix: "content:", allowedOperators: textOperators, hasPropertyName: false },
	{ id: QueryFieldId.Tag, label: "Tag", prefix: "tag:", allowedOperators: textOperators, hasPropertyName: false },
	{ id: QueryFieldId.Line, label: "Line", prefix: "line:", allowedOperators: lineOperators, hasPropertyName: false },
	{ id: QueryFieldId.Block, label: "Block", prefix: "block:", allowedOperators: lineOperators, hasPropertyName: false },
	{ id: QueryFieldId.Section, label: "Section", prefix: "section:", allowedOperators: lineOperators, hasPropertyName: false },
	{ id: QueryFieldId.Task, label: "Task", prefix: "task:", allowedOperators: lineOperators, hasPropertyName: false },
	{ id: QueryFieldId.TaskTodo, label: "Task (todo)", prefix: "task-todo:", allowedOperators: lineOperators, hasPropertyName: false },
	{ id: QueryFieldId.TaskDone, label: "Task (done)", prefix: "task-done:", allowedOperators: lineOperators, hasPropertyName: false },
	{ id: QueryFieldId.Property, label: "Property", prefix: "", allowedOperators: propertyOperators, hasPropertyName: true },
];

export function getField(id: QueryFieldId): FieldDefinition {
	const field = FIELDS.find(f => f.id === id);
	if (!field) throw new Error(`Unknown field: ${id}`);
	return field;
}