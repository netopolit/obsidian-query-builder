import { App } from "obsidian";
import { Condition, QueryFieldId, OperatorId } from "../types";
import { FIELDS, getField } from "../query/fields";
import { getOperator } from "../query/operators";
import { TagSuggest } from "./tag-suggest";

export interface ConditionRowCallbacks {
	onChange: () => void;
	onValueChange: () => void;
	onRemove: (id: string) => void;
}

export function renderConditionRow(
	parentEl: HTMLElement,
	condition: Condition,
	callbacks: ConditionRowCallbacks,
	app: App,
): HTMLElement {
	const row = parentEl.createDiv({ cls: "qb-condition-row" });

	// Validate operator is allowed for this field (fixes parsed queries with unsupported operators)
	const initialField = getField(condition.field);
	if (!initialField.allowedOperators.includes(condition.operator)) {
		condition.operator = initialField.allowedOperators[0] as OperatorId;
	}

	// Field dropdown
	const fieldSelect = row.createEl("select", { cls: "qb-select qb-field-select" });
	for (const f of FIELDS) {
		const opt = fieldSelect.createEl("option", { value: f.id, text: f.label });
		if (f.id === condition.field) opt.selected = true;
	}
	fieldSelect.addEventListener("change", () => {
		condition.field = fieldSelect.value as QueryFieldId;
		const field = getField(condition.field);
		if (!field.allowedOperators.includes(condition.operator)) {
			condition.operator = field.allowedOperators[0] as OperatorId;
		}
		if (condition.field !== QueryFieldId.Property) {
			condition.propertyName = "";
		}
		callbacks.onChange();
	});

	// Property name input (conditional)
	if (condition.field === QueryFieldId.Property) {
		const propInput = row.createEl("input", {
			cls: "qb-input qb-property-name",
			attr: { type: "text", placeholder: "Property name" },
		});
		propInput.value = condition.propertyName;
		propInput.addEventListener("input", () => {
			condition.propertyName = propInput.value;
			callbacks.onValueChange();
		});
	}

	// Operator dropdown
	const field = getField(condition.field);
	const operatorSelect = row.createEl("select", { cls: "qb-select qb-operator-select" });
	for (const opId of field.allowedOperators) {
		const op = getOperator(opId);
		const opt = operatorSelect.createEl("option", { value: op.id, text: op.label });
		if (op.id === condition.operator) opt.selected = true;
	}
	operatorSelect.addEventListener("change", () => {
		condition.operator = operatorSelect.value as OperatorId;
		callbacks.onChange();
	});

	// Value input (conditional on operator)
	const operator = getOperator(condition.operator);
	if (operator.requiresValue) {
		const valueInput = row.createEl("input", {
			cls: "qb-input qb-value-input",
			attr: { type: "text", placeholder: "Value" },
		});
		valueInput.value = condition.value;
		valueInput.addEventListener("input", () => {
			condition.value = valueInput.value;
			callbacks.onValueChange();
		});

		if (condition.field === QueryFieldId.Tag) {
			new TagSuggest(app, valueInput);
		}
	}

	// Case-sensitive toggle
	if (condition.field !== QueryFieldId.Property) {
		const csBtn = row.createEl("button", {
			cls: "qb-btn qb-case-toggle",
			attr: { "aria-label": "Toggle case sensitivity", title: "Match case" },
		});
		csBtn.setText("Aa");
		csBtn.toggleClass("qb-case-toggle--active", condition.caseSensitive);
		csBtn.addEventListener("click", () => {
			condition.caseSensitive = !condition.caseSensitive;
			csBtn.toggleClass("qb-case-toggle--active", condition.caseSensitive);
			callbacks.onChange();
		});
	}

	// Remove button
	const removeBtn = row.createEl("button", {
		cls: "qb-btn qb-remove-btn",
		attr: { "aria-label": "Remove condition" },
	});
	removeBtn.setText("\u00D7");
	removeBtn.addEventListener("click", () => {
		callbacks.onRemove(condition.id);
	});

	return row;
}
