export enum QueryFieldId {
	Keyword = "keyword",
	FileName = "file-name",
	FilePath = "file-path",
	Content = "content",
	Tag = "tag",
	Line = "line",
	Block = "block",
	Section = "section",
	Task = "task",
	TaskTodo = "task-todo",
	TaskDone = "task-done",
	Property = "property",
}

export enum OperatorId {
	Contains = "contains",
	DoesNotContain = "does-not-contain",
	IsExactly = "is-exactly",
	IsNotExactly = "is-not-exactly",
	MatchesRegex = "matches-regex",
	Equals = "equals",
	DoesNotEqual = "does-not-equal",
	IsEmpty = "is-empty",
	IsNotEmpty = "is-not-empty",
	GreaterThan = "greater-than",
	LessThan = "less-than",
}

export type LogicalConnector = "AND" | "OR";

export interface Condition {
	type: "condition";
	id: string;
	field: QueryFieldId;
	operator: OperatorId;
	value: string;
	propertyName: string;
	caseSensitive: boolean;
}

export interface ConditionGroup {
	type: "group";
	id: string;
	connector: LogicalConnector;
	negated: boolean;
	children: QueryNode[];
}

export type QueryNode = Condition | ConditionGroup;

export interface QueryModel {
	root: ConditionGroup;
}
