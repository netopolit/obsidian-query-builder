import { Notice } from "obsidian";

export class QueryPreview {
	private containerEl: HTMLElement;
	private codeEl: HTMLElement;
	private collapsed = true;

	constructor(parentEl: HTMLElement) {
		this.containerEl = parentEl.createDiv({ cls: "qb-preview" });

		const header = this.containerEl.createDiv({ cls: "qb-preview-header" });
		header.addEventListener("click", () => this.toggle());

		const chevron = header.createSpan({ cls: "qb-preview-chevron" });
		chevron.setText("\u25B6");
		header.createSpan({ text: "Query preview" });

		const copyBtn = header.createEl("button", { cls: "qb-preview-copy", attr: { "aria-label": "Copy query" } });
		copyBtn.setText("Copy");
		copyBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			this.copyToClipboard();
		});

		const body = this.containerEl.createDiv({ cls: "qb-preview-body" });
		const pre = body.createEl("pre");
		this.codeEl = pre.createEl("code");

		this.updateCollapsedState();
	}

	private toggle(): void {
		this.collapsed = !this.collapsed;
		this.updateCollapsedState();
	}

	private updateCollapsedState(): void {
		this.containerEl.toggleClass("qb-preview--collapsed", this.collapsed);
		const chevron = this.containerEl.querySelector(".qb-preview-chevron");
		if (chevron) {
			chevron.textContent = this.collapsed ? "\u25B6" : "\u25BC";
		}
	}

	update(queryText: string): void {
		this.codeEl.textContent = queryText;
	}

	private copyToClipboard(): void {
		const text = this.codeEl.textContent || "";
		void navigator.clipboard.writeText(text).then(() => {
			new Notice("Query copied to clipboard");
		});
	}
}
