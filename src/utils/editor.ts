import { Editor } from "obsidian";

export interface QueryBlockRange {
	text: string;
	from: { line: number; ch: number };
	to: { line: number; ch: number };
}

export function getQueryBlockAtCursor(editor: Editor): QueryBlockRange | null {
	const cursor = editor.getCursor();
	const lineCount = editor.lineCount();

	let fenceStart = -1;
	for (let i = cursor.line; i >= 0; i--) {
		const line = editor.getLine(i);
		if (/^```query\s*$/.test(line)) {
			fenceStart = i;
			break;
		}
		if (/^```/.test(line) && i !== cursor.line) {
			break;
		}
	}

	if (fenceStart === -1) return null;

	let fenceEnd = -1;
	for (let i = cursor.line; i < lineCount; i++) {
		if (i === fenceStart) continue;
		const line = editor.getLine(i);
		if (/^```\s*$/.test(line)) {
			fenceEnd = i;
			break;
		}
	}

	if (fenceEnd === -1) return null;
	if (cursor.line <= fenceStart || cursor.line >= fenceEnd) return null;

	const lines: string[] = [];
	for (let i = fenceStart + 1; i < fenceEnd; i++) {
		lines.push(editor.getLine(i));
	}

	return {
		text: lines.join("\n"),
		from: { line: fenceStart, ch: 0 },
		to: { line: fenceEnd, ch: editor.getLine(fenceEnd).length },
	};
}

export function insertQueryBlock(editor: Editor, text: string): void {
	const block = "```query\n" + text + "\n```\n";
	editor.replaceSelection(block);
}

export function replaceQueryBlock(editor: Editor, range: QueryBlockRange, text: string): void {
	const block = "```query\n" + text + "\n```";
	editor.replaceRange(block, range.from, range.to);
}
