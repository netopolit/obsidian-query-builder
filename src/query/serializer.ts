import { Condition, ConditionGroup, QueryModel, QueryNode, QueryFieldId, OperatorId } from "../types";
import { getField } from "./fields";
import { getOperator } from "./operators";

function needsQuotes(value: string): boolean {
	return value.includes(" ") || value === "";
}

function serializeCondition(condition: Condition): string {
	const field = getField(condition.field);
	const operator = getOperator(condition.operator);

	if (condition.field === QueryFieldId.Property) {
		return serializePropertyCondition(condition);
	}

	let valuePart: string;
	if (operator.regex) {
		valuePart = `/${condition.value}/`;
	} else if (condition.field === QueryFieldId.Tag) {
		// Tags are metadata identifiers, not text search — quoting is not valid Obsidian syntax
		valuePart = condition.value;
	} else if (operator.exact) {
		valuePart = `"${condition.value}"`;
	} else {
		valuePart = needsQuotes(condition.value) ? `"${condition.value}"` : condition.value;
	}

	let term = field.prefix ? `${field.prefix}${valuePart}` : valuePart;

	if (operator.negated) {
		term = `-${term}`;
	}

	if (condition.caseSensitive) {
		term = `match-case:(${term})`;
	}

	return term;
}

function serializePropertyCondition(condition: Condition): string {
	const name = condition.propertyName || "name";

	switch (condition.operator) {
		case OperatorId.IsEmpty:
			return `-[${name}]`;
		case OperatorId.IsNotEmpty:
			return `[${name}]`;
		case OperatorId.DoesNotEqual:
			return `-[${name}:${condition.value}]`;
		case OperatorId.GreaterThan:
			return `[${name}:>${condition.value}]`;
		case OperatorId.LessThan:
			return `[${name}:<${condition.value}]`;
		case OperatorId.Equals:
		default:
			return `[${name}:${condition.value}]`;
	}
}

function serializeGroup(group: ConditionGroup, isRoot: boolean): string {
	const parts: string[] = [];
	for (const child of group.children) {
		const s = serializeNode(child, false);
		if (s) parts.push(s);
	}

	if (parts.length === 0) return "";

	const joiner = group.connector === "OR" ? " OR " : " ";
	let result = parts.join(joiner);

	if (!isRoot && group.connector === "OR" && parts.length > 1) {
		result = `(${result})`;
	}

	if (group.negated) {
		if (!result.startsWith("(")) {
			result = `(${result})`;
		}
		result = `-${result}`;
	}

	return result;
}

function serializeNode(node: QueryNode, isRoot: boolean): string {
	if (node.type === "condition") {
		return serializeCondition(node);
	}
	return serializeGroup(node, isRoot);
}

export function serialize(model: QueryModel): string {
	return serializeGroup(model.root, true);
}
