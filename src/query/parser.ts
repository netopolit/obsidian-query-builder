import { QueryModel, ConditionGroup, Condition, QueryNode, QueryFieldId, OperatorId } from "../types";
import { FIELDS } from "./fields";
import { generateId } from "../ui/condition-group";

// --- Tokenizer ---

enum TokenType {
	Word,
	Quoted,
	Regex,
	Or,
	LParen,
	RParen,
	Negation,
	Prefix,
	MatchCase,
	IgnoreCase,
	PropertyExpr,
}

interface Token {
	type: TokenType;
	value: string;
}

function tokenize(input: string): Token[] {
	const tokens: Token[] = [];
	let i = 0;

	while (i < input.length) {
		// Skip whitespace
		if (input[i] === " " || input[i] === "\t" || input[i] === "\n" || input[i] === "\r") {
			i++;
			continue;
		}

		// Property expression: [name] or [name:value] or [name:>value] etc
		if (input[i] === "[") {
			const end = input.indexOf("]", i);
			if (end !== -1) {
				tokens.push({ type: TokenType.PropertyExpr, value: input.substring(i, end + 1) });
				i = end + 1;
				continue;
			}
		}

		// Parentheses
		if (input[i] === "(") {
			tokens.push({ type: TokenType.LParen, value: "(" });
			i++;
			continue;
		}
		if (input[i] === ")") {
			tokens.push({ type: TokenType.RParen, value: ")" });
			i++;
			continue;
		}

		// Negation
		if (input[i] === "-") {
			// Check if next char starts a term (not a space)
			if (i + 1 < input.length && input[i + 1] !== " ") {
				tokens.push({ type: TokenType.Negation, value: "-" });
				i++;
				continue;
			}
		}

		// Quoted string
		if (input[i] === '"') {
			let j = i + 1;
			while (j < input.length && input[j] !== '"') j++;
			tokens.push({ type: TokenType.Quoted, value: input.substring(i + 1, j) });
			i = j + 1;
			continue;
		}

		// Regex
		if (input[i] === "/") {
			let j = i + 1;
			while (j < input.length && input[j] !== "/") j++;
			tokens.push({ type: TokenType.Regex, value: input.substring(i + 1, j) });
			i = j + 1;
			continue;
		}

		// Word or keyword (OR, prefix, match-case:, ignore-case:)
		let j = i;
		while (j < input.length && input[j] !== " " && input[j] !== ")" && input[j] !== "\t" && input[j] !== "\n" && input[j] !== "\r") {
			// If we hit a quote, regex, or bracket, stop before it
			if (input[j] === '"' || input[j] === "/" || input[j] === "[") break;
			// If we hit ( and we're past the start, stop
			if (input[j] === "(" && j > i) break;
			j++;
		}

		if (j > i) {
			const word = input.substring(i, j);

			if (word === "OR") {
				tokens.push({ type: TokenType.Or, value: "OR" });
			} else if (word === "match-case:") {
				tokens.push({ type: TokenType.MatchCase, value: word });
			} else if (word === "ignore-case:") {
				tokens.push({ type: TokenType.IgnoreCase, value: word });
			} else if (word.endsWith(":") && FIELDS.some(f => f.prefix === word)) {
				tokens.push({ type: TokenType.Prefix, value: word });
			} else {
				tokens.push({ type: TokenType.Word, value: word });
			}
			i = j;
		} else {
			// Single character we can't parse, skip
			i++;
		}
	}

	return tokens;
}

// --- Parser ---

class Parser {
	private tokens: Token[];
	private pos = 0;

	constructor(tokens: Token[]) {
		this.tokens = tokens;
	}

	parse(): QueryModel {
		const children = this.parseSequence();
		const root: ConditionGroup = {
			type: "group",
			id: generateId(),
			connector: "AND",
			negated: false,
			children,
		};

		// If all children are in OR groups, flatten
		this.flattenOrGroups(root);

		return { root };
	}

	private peek(): Token | undefined {
		return this.tokens[this.pos];
	}

	private advance(): Token | undefined {
		return this.tokens[this.pos++];
	}

	private parseSequence(): QueryNode[] {
		const nodes: QueryNode[] = [];

		while (this.pos < this.tokens.length) {
			const tok = this.peek();
			if (!tok || tok.type === TokenType.RParen) break;

			if (tok.type === TokenType.Or) {
				this.advance(); // consume OR
				// Convert previous node + next node into an OR group
				const prev = nodes.pop();
				const next = this.parseSingleNode();
				if (prev && next) {
					// Check if prev is already an OR group we can extend
					if (prev.type === "group" && prev.connector === "OR" && !prev.negated) {
						prev.children.push(next);
						nodes.push(prev);
					} else {
						const orGroup: ConditionGroup = {
							type: "group",
							id: generateId(),
							connector: "OR",
							negated: false,
							children: [prev, next],
						};
						nodes.push(orGroup);
					}
				} else if (prev) {
					nodes.push(prev);
				} else if (next) {
					nodes.push(next);
				}
				continue;
			}

			const node = this.parseSingleNode();
			if (node) nodes.push(node);
		}

		return nodes;
	}

	private parseSingleNode(): QueryNode | null {
		const tok = this.peek();
		if (!tok || tok.type === TokenType.RParen) return null;

		let negated = false;
		if (tok.type === TokenType.Negation) {
			negated = true;
			this.advance();
		}

		let caseSensitive = false;
		let caseInsensitive = false;
		const current = this.peek();
		if (current?.type === TokenType.MatchCase) {
			caseSensitive = true;
			this.advance();
		} else if (current?.type === TokenType.IgnoreCase) {
			caseInsensitive = true;
			this.advance();
		}

		const next = this.peek();
		if (!next) return null;

		// Parenthesized group
		if (next.type === TokenType.LParen) {
			this.advance(); // consume (
			const children = this.parseSequence();
			if (this.peek()?.type === TokenType.RParen) this.advance(); // consume )
			const group: ConditionGroup = {
				type: "group",
				id: generateId(),
				connector: this.inferConnector(children),
				negated,
				children,
			};
			return group;
		}

		// Property expression
		if (next.type === TokenType.PropertyExpr) {
			this.advance();
			return this.parsePropertyExpr(next.value, negated);
		}

		// Prefix + value
		let fieldId = QueryFieldId.Keyword;
		if (next.type === TokenType.Prefix) {
			this.advance();
			const field = FIELDS.find(f => f.prefix === next.value);
			if (field) fieldId = field.id;
		}

		// Read value
		const valueTok = this.peek();
		if (!valueTok) {
			// Prefix with no value — create empty condition
			return this.makeCondition(fieldId, negated, false, false, "", caseSensitive);
		}

		if (valueTok.type === TokenType.Quoted) {
			this.advance();
			return this.makeCondition(fieldId, negated, true, false, valueTok.value, caseSensitive);
		}
		if (valueTok.type === TokenType.Regex) {
			this.advance();
			return this.makeCondition(fieldId, negated, false, true, valueTok.value, caseSensitive);
		}
		if (valueTok.type === TokenType.Word) {
			this.advance();
			// Check if the word itself contains a colon (e.g. unparsed prefix)
			const colonIdx = valueTok.value.indexOf(":");
			if (colonIdx > 0 && next.type !== TokenType.Prefix) {
				const possiblePrefix = valueTok.value.substring(0, colonIdx + 1);
				const field = FIELDS.find(f => f.prefix === possiblePrefix);
				if (field) {
					const val = valueTok.value.substring(colonIdx + 1);
					return this.makeCondition(field.id, negated, false, false, val, caseSensitive);
				}
			}
			return this.makeCondition(fieldId, negated, false, false, valueTok.value, caseSensitive);
		}

		// Fallback for LParen after prefix
		if (valueTok.type === TokenType.LParen && (caseSensitive || caseInsensitive)) {
			this.advance(); // consume (
			const innerNode = this.parseSingleNode();
			if (this.peek()?.type === TokenType.RParen) this.advance();
			if (innerNode && innerNode.type === "condition") {
				innerNode.caseSensitive = caseSensitive;
				if (negated && !this.isNegatedOperator(innerNode.operator)) {
					innerNode.operator = this.negateOperator(innerNode.operator);
				}
				return innerNode;
			}
			return innerNode;
		}

		return null;
	}

	private makeCondition(
		fieldId: QueryFieldId,
		negated: boolean,
		exact: boolean,
		regex: boolean,
		value: string,
		caseSensitive: boolean,
	): Condition {
		let operator: OperatorId;
		if (regex) {
			operator = OperatorId.MatchesRegex;
		} else if (exact && negated) {
			operator = OperatorId.IsNotExactly;
			negated = false; // negation encoded in operator
		} else if (exact) {
			operator = OperatorId.IsExactly;
		} else if (negated) {
			operator = OperatorId.DoesNotContain;
			negated = false;
		} else {
			operator = OperatorId.Contains;
		}

		return {
			type: "condition",
			id: generateId(),
			field: fieldId,
			operator,
			value,
			propertyName: "",
			caseSensitive,
		};
	}

	private parsePropertyExpr(expr: string, negated: boolean): Condition {
		// Remove brackets: [name:value] → name:value
		const inner = expr.substring(1, expr.length - 1);
		const colonIdx = inner.indexOf(":");

		if (colonIdx === -1) {
			// [name] → property exists (IsNotEmpty) or -[name] → IsEmpty
			return {
				type: "condition",
				id: generateId(),
				field: QueryFieldId.Property,
				operator: negated ? OperatorId.IsEmpty : OperatorId.IsNotEmpty,
				value: "",
				propertyName: inner,
				caseSensitive: false,
			};
		}

		const name = inner.substring(0, colonIdx);
		let value = inner.substring(colonIdx + 1);
		let operator: OperatorId;

		if (value.startsWith(">")) {
			operator = OperatorId.GreaterThan;
			value = value.substring(1);
		} else if (value.startsWith("<")) {
			operator = OperatorId.LessThan;
			value = value.substring(1);
		} else if (negated) {
			operator = OperatorId.DoesNotEqual;
		} else {
			operator = OperatorId.Equals;
		}

		return {
			type: "condition",
			id: generateId(),
			field: QueryFieldId.Property,
			operator,
			value,
			propertyName: name,
			caseSensitive: false,
		};
	}

	private inferConnector(children: QueryNode[]): "AND" | "OR" {
		// If all nodes were joined by OR at the sequence level, they'd be in OR groups
		// Default to AND
		return "AND";
	}

	private isNegatedOperator(op: OperatorId): boolean {
		return op === OperatorId.DoesNotContain || op === OperatorId.IsNotExactly || op === OperatorId.DoesNotEqual || op === OperatorId.IsNotEmpty;
	}

	private negateOperator(op: OperatorId): OperatorId {
		switch (op) {
			case OperatorId.Contains: return OperatorId.DoesNotContain;
			case OperatorId.IsExactly: return OperatorId.IsNotExactly;
			case OperatorId.Equals: return OperatorId.DoesNotEqual;
			case OperatorId.IsNotEmpty: return OperatorId.IsEmpty;
			default: return op;
		}
	}

	private flattenOrGroups(group: ConditionGroup): void {
		// Recursively flatten single-child OR groups
		for (let i = 0; i < group.children.length; i++) {
			const child = group.children[i];
			if (child && child.type === "group") {
				this.flattenOrGroups(child);
				// If group has only one child, unwrap it
				if (child.children.length === 1 && !child.negated) {
					group.children[i] = child.children[0] as QueryNode;
				}
			}
		}
	}
}

export function parseQuery(input: string): QueryModel {
	const trimmed = input.trim();
	if (!trimmed) {
		return {
			root: {
				type: "group",
				id: generateId(),
				connector: "AND",
				negated: false,
				children: [],
			},
		};
	}

	const tokens = tokenize(trimmed);
	const parser = new Parser(tokens);
	return parser.parse();
}
