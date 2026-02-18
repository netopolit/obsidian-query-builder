import { AbstractInputSuggest, App } from "obsidian";

export class TagSuggest extends AbstractInputSuggest<string> {
	private allTags: string[] = [];
	private textInputEl: HTMLInputElement;

	constructor(app: App, inputEl: HTMLInputElement) {
		super(app, inputEl);
		this.textInputEl = inputEl;
		this.loadTags();
	}

	private loadTags(): void {
		const cache = this.app.metadataCache as { getTags?: () => Record<string, number> };
		if (typeof cache.getTags === "function") {
			this.allTags = Object.keys(cache.getTags()).sort();
		}
	}

	getSuggestions(query: string): string[] {
		const lower = query.toLowerCase();
		return this.allTags.filter(t => t.toLowerCase().includes(lower));
	}

	renderSuggestion(tag: string, el: HTMLElement): void {
		el.setText(tag);
	}

	selectSuggestion(tag: string): void {
		this.textInputEl.value = tag;
		this.textInputEl.trigger("input");
		this.close();
	}
}
