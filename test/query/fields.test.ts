import { getField, FIELDS } from "../../src/query/fields";
import { QueryFieldId, OperatorId } from "../../src/types";

describe("field definitions", () => {
	test("tag field does not allow exact operators", () => {
		const tag = getField(QueryFieldId.Tag);
		expect(tag.allowedOperators).not.toContain(OperatorId.IsExactly);
		expect(tag.allowedOperators).not.toContain(OperatorId.IsNotExactly);
	});

	test("tag field allows contains, does not contain, and regex", () => {
		const tag = getField(QueryFieldId.Tag);
		expect(tag.allowedOperators).toContain(OperatorId.Contains);
		expect(tag.allowedOperators).toContain(OperatorId.DoesNotContain);
		expect(tag.allowedOperators).toContain(OperatorId.MatchesRegex);
	});

	test("getField throws for unknown field", () => {
		expect(() => getField("bogus" as QueryFieldId)).toThrow("Unknown field: bogus");
	});

	test("every field has a non-empty allowedOperators list", () => {
		for (const field of FIELDS) {
			expect(field.allowedOperators.length).toBeGreaterThan(0);
		}
	});
});
