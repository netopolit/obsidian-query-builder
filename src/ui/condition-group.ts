import { App } from "obsidian";
import { ConditionGroup, Condition, QueryFieldId, OperatorId, LogicalConnector } from "../types";
import { renderConditionRow } from "./condition-row";

let nextId = 1;
export function generateId(): string {
	return "qb-" + (nextId++);
}

export interface GroupCallbacks {
	onChange: () => void;
	onRemove: (id: string) => void;
}

export function createDefaultCondition(): Condition {
	return {
		type: "condition",
		id: generateId(),
		field: QueryFieldId.Keyword,
		operator: OperatorId.Contains,
		value: "",
		propertyName: "",
		caseSensitive: false,
	};
}

export function createDefaultGroup(): ConditionGroup {
	return {
		type: "group",
		id: generateId(),
		connector: "AND",
		negated: false,
		children: [createDefaultCondition()],
	};
}

export function renderConditionGroup(
	parentEl: HTMLElement,
	group: ConditionGroup,
	callbacks: GroupCallbacks,
	app: App,
	depth: number,
): HTMLElement {
	const container = parentEl.createDiv({
		cls: depth > 0 ? "qb-group qb-group--nested" : "qb-group qb-group--root",
	});

	// Group header
	const header = container.createDiv({ cls: "qb-group-header" });

	// AND/OR toggle
	const toggle = header.createDiv({ cls: "qb-connector-toggle" });
	const andBtn = toggle.createEl("button", { cls: "qb-toggle-btn", text: "AND" });
	const orBtn = toggle.createEl("button", { cls: "qb-toggle-btn", text: "OR" });
	updateToggleState(andBtn, orBtn, group.connector);

	andBtn.addEventListener("click", () => {
		group.connector = "AND";
		updateToggleState(andBtn, orBtn, group.connector);
		callbacks.onChange();
	});
	orBtn.addEventListener("click", () => {
		group.connector = "OR";
		updateToggleState(andBtn, orBtn, group.connector);
		callbacks.onChange();
	});

	// NOT toggle
	const notBtn = header.createEl("button", {
		cls: "qb-btn qb-not-toggle",
		text: "NOT",
	});
	notBtn.toggleClass("qb-not-toggle--active", group.negated);
	notBtn.addEventListener("click", () => {
		group.negated = !group.negated;
		notBtn.toggleClass("qb-not-toggle--active", group.negated);
		callbacks.onChange();
	});

	// Remove button (non-root only)
	if (depth > 0) {
		const removeBtn = header.createEl("button", {
			cls: "qb-btn qb-remove-btn",
			attr: { "aria-label": "Remove group" },
		});
		removeBtn.setText("\u00D7");
		removeBtn.addEventListener("click", () => {
			callbacks.onRemove(group.id);
		});
	}

	// Children
	const childrenEl = container.createDiv({ cls: "qb-group-children" });
	renderChildren(childrenEl, group, callbacks, app, depth);

	// Add buttons
	const actions = container.createDiv({ cls: "qb-group-actions" });
	const addConditionBtn = actions.createEl("button", {
		cls: "qb-btn qb-add-btn",
		text: "+ condition",
	});
	addConditionBtn.addEventListener("click", () => {
		group.children.push(createDefaultCondition());
		callbacks.onChange();
	});

	const addGroupBtn = actions.createEl("button", {
		cls: "qb-btn qb-add-btn",
		text: "+ condition group",
	});
	addGroupBtn.addEventListener("click", () => {
		group.children.push(createDefaultGroup());
		callbacks.onChange();
	});

	return container;
}

function renderChildren(
	childrenEl: HTMLElement,
	group: ConditionGroup,
	callbacks: GroupCallbacks,
	app: App,
	depth: number,
): void {
	for (const child of group.children) {
		if (child.type === "condition") {
			renderConditionRow(childrenEl, child, {
				onChange: callbacks.onChange,
				onRemove: (id) => {
					group.children = group.children.filter(c => c.id !== id);
					callbacks.onChange();
				},
			}, app);
		} else {
			renderConditionGroup(childrenEl, child, {
				onChange: callbacks.onChange,
				onRemove: (id) => {
					group.children = group.children.filter(c => c.id !== id);
					callbacks.onChange();
				},
			}, app, depth + 1);
		}
	}
}

function updateToggleState(andBtn: HTMLButtonElement, orBtn: HTMLButtonElement, connector: LogicalConnector): void {
	andBtn.toggleClass("qb-toggle-btn--active", connector === "AND");
	orBtn.toggleClass("qb-toggle-btn--active", connector === "OR");
}
