import { parseQuery } from "../../src/query/parser";
import { serialize } from "../../src/query/serializer";
import { QueryFieldId, OperatorId, Condition, ConditionGroup } from "../../src/types";

function firstCondition(queryText: string): Condition {
	const model = parseQuery(queryText);
	const child = model.root.children[0];
	if (!child || child.type !== "condition") throw new Error("Expected first child to be a condition");
	return child;
}

describe("parser", () => {
	test("empty input", () => {
		const model = parseQuery("");
		expect(model.root.children).toHaveLength(0);
	});

	test("single keyword", () => {
		const c = firstCondition("hello");
		expect(c.field).toBe(QueryFieldId.Keyword);
		expect(c.operator).toBe(OperatorId.Contains);
		expect(c.value).toBe("hello");
	});

	test("quoted keyword", () => {
		const c = firstCondition('"hello world"');
		expect(c.field).toBe(QueryFieldId.Keyword);
		expect(c.operator).toBe(OperatorId.IsExactly);
		expect(c.value).toBe("hello world");
	});

	test("regex keyword", () => {
		const c = firstCondition("/foo.*bar/");
		expect(c.field).toBe(QueryFieldId.Keyword);
		expect(c.operator).toBe(OperatorId.MatchesRegex);
		expect(c.value).toBe("foo.*bar");
	});

	test("negated keyword", () => {
		const c = firstCondition("-draft");
		expect(c.field).toBe(QueryFieldId.Keyword);
		expect(c.operator).toBe(OperatorId.DoesNotContain);
		expect(c.value).toBe("draft");
	});

	test("negated quoted keyword", () => {
		const c = firstCondition('-"hello world"');
		expect(c.field).toBe(QueryFieldId.Keyword);
		expect(c.operator).toBe(OperatorId.IsNotExactly);
		expect(c.value).toBe("hello world");
	});

	test("file: prefix", () => {
		const c = firstCondition("file:notes");
		expect(c.field).toBe(QueryFieldId.FileName);
		expect(c.operator).toBe(OperatorId.Contains);
		expect(c.value).toBe("notes");
	});

	test("file: prefix with quoted value", () => {
		const c = firstCondition('file:"my notes"');
		expect(c.field).toBe(QueryFieldId.FileName);
		expect(c.operator).toBe(OperatorId.IsExactly);
		expect(c.value).toBe("my notes");
	});

	test("negated file: prefix", () => {
		const c = firstCondition("-file:draft");
		expect(c.field).toBe(QueryFieldId.FileName);
		expect(c.operator).toBe(OperatorId.DoesNotContain);
		expect(c.value).toBe("draft");
	});

	test("tag: prefix", () => {
		const c = firstCondition("tag:#work");
		expect(c.field).toBe(QueryFieldId.Tag);
		expect(c.value).toBe("#work");
	});

	test("path: prefix", () => {
		const c = firstCondition("path:projects");
		expect(c.field).toBe(QueryFieldId.FilePath);
		expect(c.value).toBe("projects");
	});

	test("content: prefix", () => {
		const c = firstCondition("content:important");
		expect(c.field).toBe(QueryFieldId.Content);
		expect(c.value).toBe("important");
	});

	test("task-todo: prefix", () => {
		const c = firstCondition("task-todo:call");
		expect(c.field).toBe(QueryFieldId.TaskTodo);
		expect(c.value).toBe("call");
	});

	test("multiple AND conditions", () => {
		const model = parseQuery("tag:#work file:notes");
		expect(model.root.connector).toBe("AND");
		expect(model.root.children).toHaveLength(2);

		const c1 = model.root.children[0] as Condition;
		expect(c1.field).toBe(QueryFieldId.Tag);
		expect(c1.value).toBe("#work");

		const c2 = model.root.children[1] as Condition;
		expect(c2.field).toBe(QueryFieldId.FileName);
		expect(c2.value).toBe("notes");
	});

	test("OR conditions", () => {
		const model = parseQuery("foo OR bar");
		expect(model.root.children).toHaveLength(1);

		const orGroup = model.root.children[0] as ConditionGroup;
		expect(orGroup.type).toBe("group");
		expect(orGroup.connector).toBe("OR");
		expect(orGroup.children).toHaveLength(2);
	});

	test("parenthesized group", () => {
		const model = parseQuery("tag:#work (file:draft OR file:archive)");
		expect(model.root.children).toHaveLength(2);

		const c1 = model.root.children[0] as Condition;
		expect(c1.field).toBe(QueryFieldId.Tag);

		const grp = model.root.children[1] as ConditionGroup;
		expect(grp.type).toBe("group");
		expect(grp.children).toHaveLength(2);
	});

	test("negated parenthesized group", () => {
		const model = parseQuery("-(file:draft OR file:archive)");
		const grp = model.root.children[0] as ConditionGroup;
		expect(grp.type).toBe("group");
		expect(grp.negated).toBe(true);
	});

	test("property expression [name:value]", () => {
		const c = firstCondition("[status:done]");
		expect(c.field).toBe(QueryFieldId.Property);
		expect(c.operator).toBe(OperatorId.Equals);
		expect(c.propertyName).toBe("status");
		expect(c.value).toBe("done");
	});

	test("negated property -[name:value]", () => {
		const c = firstCondition("-[status:draft]");
		expect(c.field).toBe(QueryFieldId.Property);
		expect(c.operator).toBe(OperatorId.DoesNotEqual);
		expect(c.propertyName).toBe("status");
		expect(c.value).toBe("draft");
	});

	test("property is not empty [name]", () => {
		const c = firstCondition("[due]");
		expect(c.field).toBe(QueryFieldId.Property);
		expect(c.operator).toBe(OperatorId.IsNotEmpty);
		expect(c.propertyName).toBe("due");
	});

	test("property is empty -[name]", () => {
		const c = firstCondition("-[due]");
		expect(c.field).toBe(QueryFieldId.Property);
		expect(c.operator).toBe(OperatorId.IsEmpty);
		expect(c.propertyName).toBe("due");
	});

	test("property greater than [name:>5]", () => {
		const c = firstCondition("[priority:>5]");
		expect(c.field).toBe(QueryFieldId.Property);
		expect(c.operator).toBe(OperatorId.GreaterThan);
		expect(c.propertyName).toBe("priority");
		expect(c.value).toBe("5");
	});

	test("property less than [name:<3]", () => {
		const c = firstCondition("[priority:<3]");
		expect(c.field).toBe(QueryFieldId.Property);
		expect(c.operator).toBe(OperatorId.LessThan);
		expect(c.propertyName).toBe("priority");
		expect(c.value).toBe("3");
	});
});

describe("round-trip: serialize → parse → serialize", () => {
	const cases = [
		"hello",
		'"hello world"',
		"file:notes",
		'file:"readme"',
		"-file:draft",
		"content:/foo.*bar/",
		"tag:#work file:notes",
		"tag:#work task-todo:call",
		"[status:done]",
		"-[status:draft]",
		"[due]",
		"-[due]",
		"[priority:>5]",
		"[priority:<3]",
	];

	for (const input of cases) {
		test(`round-trip: ${input}`, () => {
			const parsed = parseQuery(input);
			const output = serialize(parsed);
			expect(output).toBe(input);
		});
	}
});
