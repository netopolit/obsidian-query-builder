import { serialize } from "../../src/query/serializer";
import { QueryModel, ConditionGroup, Condition, QueryFieldId, OperatorId } from "../../src/types";

function cond(overrides: Partial<Condition> = {}): Condition {
	return {
		type: "condition",
		id: "c1",
		field: QueryFieldId.Keyword,
		operator: OperatorId.Contains,
		value: "test",
		propertyName: "",
		caseSensitive: false,
		...overrides,
	};
}

function group(overrides: Partial<ConditionGroup> = {}, children: ConditionGroup["children"] = []): ConditionGroup {
	return {
		type: "group",
		id: "g1",
		connector: "AND",
		negated: false,
		children,
		...overrides,
	};
}

function model(root: ConditionGroup): QueryModel {
	return { root };
}

describe("serializer", () => {
	test("single keyword condition", () => {
		const m = model(group({}, [cond({ value: "hello" })]));
		expect(serialize(m)).toBe("hello");
	});

	test("keyword with spaces gets quoted", () => {
		const m = model(group({}, [cond({ value: "hello world" })]));
		expect(serialize(m)).toBe('"hello world"');
	});

	test("file: prefix with contains operator", () => {
		const m = model(group({}, [cond({ field: QueryFieldId.FileName, value: "notes" })]));
		expect(serialize(m)).toBe("file:notes");
	});

	test("file: prefix with exact operator", () => {
		const m = model(group({}, [
			cond({ field: QueryFieldId.FileName, operator: OperatorId.IsExactly, value: "readme" }),
		]));
		expect(serialize(m)).toBe('file:"readme"');
	});

	test("negated operator (does not contain)", () => {
		const m = model(group({}, [
			cond({ field: QueryFieldId.FileName, operator: OperatorId.DoesNotContain, value: "draft" }),
		]));
		expect(serialize(m)).toBe("-file:draft");
	});

	test("negated exact (is not exactly)", () => {
		const m = model(group({}, [
			cond({ field: QueryFieldId.FileName, operator: OperatorId.IsNotExactly, value: "draft" }),
		]));
		expect(serialize(m)).toBe('-file:"draft"');
	});

	test("regex operator", () => {
		const m = model(group({}, [
			cond({ field: QueryFieldId.Content, operator: OperatorId.MatchesRegex, value: "foo.*bar" }),
		]));
		expect(serialize(m)).toBe("content:/foo.*bar/");
	});

	test("case sensitive wrapping", () => {
		const m = model(group({}, [
			cond({ field: QueryFieldId.FileName, value: "Notes", caseSensitive: true }),
		]));
		expect(serialize(m)).toBe("match-case:(file:Notes)");
	});

	test("tag field", () => {
		const m = model(group({}, [
			cond({ field: QueryFieldId.Tag, value: "#work" }),
		]));
		expect(serialize(m)).toBe("tag:#work");
	});

	test("tag with IsExactly operator still produces unquoted output", () => {
		const m = model(group({}, [
			cond({ field: QueryFieldId.Tag, operator: OperatorId.IsExactly, value: "#work" }),
		]));
		expect(serialize(m)).toBe("tag:#work");
	});

	test("tag value with spaces produces unquoted output", () => {
		const m = model(group({}, [
			cond({ field: QueryFieldId.Tag, value: "#my tag" }),
		]));
		expect(serialize(m)).toBe("tag:#my tag");
	});

	test("multiple AND conditions", () => {
		const m = model(group({}, [
			cond({ field: QueryFieldId.Tag, value: "#work" }),
			cond({ field: QueryFieldId.FileName, value: "notes" }),
		]));
		expect(serialize(m)).toBe("tag:#work file:notes");
	});

	test("OR group", () => {
		const m = model(group({ connector: "OR" }, [
			cond({ value: "foo" }),
			cond({ value: "bar" }),
		]));
		expect(serialize(m)).toBe("foo OR bar");
	});

	test("nested OR group inside AND root", () => {
		const m = model(group({}, [
			cond({ field: QueryFieldId.Tag, value: "#work" }),
			group({ id: "g2", connector: "OR" }, [
				cond({ field: QueryFieldId.FileName, value: "draft" }),
				cond({ field: QueryFieldId.FileName, value: "archive" }),
			]),
		]));
		expect(serialize(m)).toBe("tag:#work (file:draft OR file:archive)");
	});

	test("negated nested group", () => {
		const m = model(group({}, [
			cond({ field: QueryFieldId.Tag, value: "#work" }),
			group({ id: "g2", connector: "OR", negated: true }, [
				cond({ field: QueryFieldId.FileName, value: "draft" }),
				cond({ field: QueryFieldId.FileName, value: "archive" }),
			]),
		]));
		expect(serialize(m)).toBe('tag:#work -(file:draft OR file:archive)');
	});

	test("property equals", () => {
		const m = model(group({}, [
			cond({ field: QueryFieldId.Property, operator: OperatorId.Equals, propertyName: "status", value: "done" }),
		]));
		expect(serialize(m)).toBe("[status:done]");
	});

	test("property does not equal", () => {
		const m = model(group({}, [
			cond({ field: QueryFieldId.Property, operator: OperatorId.DoesNotEqual, propertyName: "status", value: "draft" }),
		]));
		expect(serialize(m)).toBe("-[status:draft]");
	});

	test("property is empty", () => {
		const m = model(group({}, [
			cond({ field: QueryFieldId.Property, operator: OperatorId.IsEmpty, propertyName: "due" }),
		]));
		expect(serialize(m)).toBe("-[due]");
	});

	test("property is not empty", () => {
		const m = model(group({}, [
			cond({ field: QueryFieldId.Property, operator: OperatorId.IsNotEmpty, propertyName: "due" }),
		]));
		expect(serialize(m)).toBe("[due]");
	});

	test("property greater than", () => {
		const m = model(group({}, [
			cond({ field: QueryFieldId.Property, operator: OperatorId.GreaterThan, propertyName: "priority", value: "5" }),
		]));
		expect(serialize(m)).toBe("[priority:>5]");
	});

	test("property less than", () => {
		const m = model(group({}, [
			cond({ field: QueryFieldId.Property, operator: OperatorId.LessThan, propertyName: "priority", value: "3" }),
		]));
		expect(serialize(m)).toBe("[priority:<3]");
	});

	test("empty model returns empty string", () => {
		const m = model(group({}, []));
		expect(serialize(m)).toBe("");
	});

	test("complex plan example", () => {
		const m = model(group({}, [
			cond({ field: QueryFieldId.Tag, value: "#work" }),
			group({ id: "g2", connector: "OR", negated: true }, [
				cond({ field: QueryFieldId.FileName, operator: OperatorId.IsExactly, value: "draft" }),
				cond({ field: QueryFieldId.FileName, operator: OperatorId.IsExactly, value: "archive" }),
			]),
			cond({ field: QueryFieldId.TaskTodo, value: "call" }),
		]));
		expect(serialize(m)).toBe('tag:#work -(file:"draft" OR file:"archive") task-todo:call');
	});
});
