import { Editor, MarkdownView, Plugin } from "obsidian";
import { QueryBuilderModal } from "./ui/query-builder-modal";
import { getQueryBlockAtCursor, insertQueryBlock, replaceQueryBlock } from "./utils/editor";
import { parseQuery } from "./query/parser";

export default class QueryBuilderPlugin extends Plugin {
	async onload() {
		this.addCommand({
			id: "build-query",
			name: "Build query",
			editorCallback: (editor: Editor, _view: MarkdownView) => {
				const existing = getQueryBlockAtCursor(editor);
				const model = existing ? parseQuery(existing.text) : null;

				new QueryBuilderModal(this.app, model, (queryText) => {
					if (existing) {
						replaceQueryBlock(editor, existing, queryText);
					} else {
						insertQueryBlock(editor, queryText);
					}
				}).open();
			},
		});
	}
}
