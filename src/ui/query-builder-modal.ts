import { App, Modal } from "obsidian";
import { QueryModel, ConditionGroup } from "../types";
import { serialize } from "../query/serializer";
import { renderConditionGroup, createDefaultCondition, generateId } from "./condition-group";
import { QueryPreview } from "./query-preview";

export class QueryBuilderModal extends Modal {
	private model: QueryModel;
	private preview: QueryPreview | null = null;
	private bodyEl: HTMLElement | null = null;
	private debounceTimer: ReturnType<typeof setTimeout> | null = null;
	private onSubmit: (queryText: string) => void;

	constructor(app: App, model: QueryModel | null, onSubmit: (queryText: string) => void) {
		super(app);
		this.onSubmit = onSubmit;

		if (model) {
			this.model = model;
		} else {
			this.model = {
				root: {
					type: "group",
					id: generateId(),
					connector: "AND",
					negated: false,
					children: [createDefaultCondition()],
				} as ConditionGroup,
			};
		}
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.addClass("qb-modal");

		contentEl.createEl("h3", { text: "Build query", cls: "qb-modal-title" });

		this.bodyEl = contentEl.createDiv({ cls: "qb-modal-body" });
		this.renderBody();

		contentEl.createEl("hr", { cls: "qb-divider" });

		this.preview = new QueryPreview(contentEl);
		this.updatePreview();

		const footer = contentEl.createDiv({ cls: "qb-modal-footer" });
		const cancelBtn = footer.createEl("button", { text: "Cancel" });
		cancelBtn.addEventListener("click", () => this.close());

		const insertBtn = footer.createEl("button", {
			cls: "mod-cta",
			text: "Insert query",
		});
		insertBtn.addEventListener("click", () => {
			const text = serialize(this.model);
			if (text) {
				this.onSubmit(text);
			}
			this.close();
		});
	}

	onClose(): void {
		if (this.debounceTimer) clearTimeout(this.debounceTimer);
		this.contentEl.empty();
	}

	private renderBody(): void {
		if (!this.bodyEl) return;
		this.bodyEl.empty();

		renderConditionGroup(this.bodyEl, this.model.root, {
			onChange: () => this.onModelChange(),
			onValueChange: () => this.schedulePreviewUpdate(),
			onRemove: () => {}, // root can't be removed
		}, this.app, 0);
	}

	private onModelChange(): void {
		this.renderBody();
		this.schedulePreviewUpdate();
	}

	private schedulePreviewUpdate(): void {
		if (this.debounceTimer) clearTimeout(this.debounceTimer);
		this.debounceTimer = setTimeout(() => this.updatePreview(), 200);
	}

	private updatePreview(): void {
		if (!this.preview) return;
		this.preview.update(serialize(this.model));
	}
}
