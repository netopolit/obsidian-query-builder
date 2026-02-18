import { OperatorId } from "../types";

export interface OperatorDefinition {
	id: OperatorId;
	label: string;
	negated: boolean;
	exact: boolean;
	regex: boolean;
	requiresValue: boolean;
}

export const OPERATORS: OperatorDefinition[] = [
	{ id: OperatorId.Contains, label: "contains", negated: false, exact: false, regex: false, requiresValue: true },
	{ id: OperatorId.DoesNotContain, label: "does not contain", negated: true, exact: false, regex: false, requiresValue: true },
	{ id: OperatorId.IsExactly, label: "is exactly", negated: false, exact: true, regex: false, requiresValue: true },
	{ id: OperatorId.IsNotExactly, label: "is not exactly", negated: true, exact: true, regex: false, requiresValue: true },
	{ id: OperatorId.MatchesRegex, label: "matches regex", negated: false, exact: false, regex: true, requiresValue: true },
	{ id: OperatorId.Equals, label: "equals", negated: false, exact: false, regex: false, requiresValue: true },
	{ id: OperatorId.DoesNotEqual, label: "does not equal", negated: true, exact: false, regex: false, requiresValue: true },
	{ id: OperatorId.IsEmpty, label: "is empty", negated: false, exact: false, regex: false, requiresValue: false },
	{ id: OperatorId.IsNotEmpty, label: "is not empty", negated: true, exact: false, regex: false, requiresValue: false },
	{ id: OperatorId.GreaterThan, label: "greater than", negated: false, exact: false, regex: false, requiresValue: true },
	{ id: OperatorId.LessThan, label: "less than", negated: false, exact: false, regex: false, requiresValue: true },
];

export function getOperator(id: OperatorId): OperatorDefinition {
	const op = OPERATORS.find(o => o.id === id);
	if (!op) throw new Error(`Unknown operator: ${id}`);
	return op;
}
