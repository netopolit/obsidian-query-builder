# Query Builder

Visual query builder for Obsidian search. Build complex queries using dropdowns and inputs instead of memorizing syntax, then insert the result as a live `query` code block.

## Features

- **Visual query construction** — select fields, operators, and values from dropdowns instead of writing raw query syntax
- **Nested condition groups** — combine conditions with AND/OR logic and nest groups arbitrarily deep
- **NOT groups** — negate any condition group to exclude matching results
- **Edit existing queries** — place your cursor inside a `query` block and run the command again to reopen the builder pre-populated with parsed conditions
- **Tag autocomplete** — when using the Tag field, get suggestions from your vault's existing tags
- **Live preview** — expand the preview pane to see the generated query text in real time, with a copy button
- **Case sensitivity toggle** — per-condition toggle for `match-case:` wrapping
- **Property support** — query frontmatter properties with equals, not equals, empty, not empty, greater than, and less than operators
- **Mobile compatible** — works on both desktop and mobile

## Usage

1. Open the command palette (**Ctrl/Cmd + P**)
2. Run **Build query**
3. Add conditions using the **+ condition** button
4. Select a field, operator, and enter a value for each condition
5. Use the **AND/OR** toggle to control how conditions combine
6. Click **+ condition group** to create nested groups for complex logic
7. Click **Insert query** to insert the result at your cursor

To **edit** an existing query block, place your cursor anywhere inside the ` ```query ``` ` fences and run **Build query** again. The modal opens pre-populated with the parsed conditions.

## Supported fields

| Field | Obsidian prefix | Description |
|---|---|---|
| Keyword | *(none)* | Search across all content |
| File name | `file:` | Match against file names |
| File path | `path:` | Match against full file paths |
| Content | `content:` | Match within file content only |
| Tag | `tag:` | Match tags (with autocomplete) |
| Line | `line:` | Match entire lines |
| Block | `block:` | Match blocks |
| Section | `section:` | Match sections |
| Task | `task:` | Match all tasks |
| Task (todo) | `task-todo:` | Match incomplete tasks |
| Task (done) | `task-done:` | Match completed tasks |
| Property | `[name:value]` | Match frontmatter properties |

## Operators

**Text fields** (file name, file path, content, tag):
- contains, does not contain, is exactly, is not exactly, matches regex

**Line-scope fields** (keyword, line, block, section, task, task-todo, task-done):
- contains, does not contain, is exactly, matches regex

**Property field**:
- equals, does not equal, is empty, is not empty, greater than, less than

## Examples

| You build | Generated query |
|---|---|
| Tag contains `#work` AND File name does not contain `draft` | `tag:#work -file:draft` |
| Tag contains `#work` AND NOT (File name is exactly `draft` OR File name is exactly `archive`) | `tag:#work -(file:"draft" OR file:"archive")` |
| Property `status` equals `done` | `[status:done]` |
| Property `priority` greater than `5` | `[priority:>5]` |
| Content matches regex `TODO\|FIXME` | `content:/TODO\|FIXME/` |

## Commands

| Command | ID | Description |
|---|---|---|
| Build query | `query-builder:build-query` | Open the visual query builder (or edit an existing query block at cursor) |

## Installation

### From community plugins

1. Open **Settings -> Community plugins**
2. Select **Browse** and search for "Query Builder"
3. Select **Install**, then **Enable**

### Manual installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/your-repo/obsidian-query-builder/releases/latest)
2. Create a folder at `<your-vault>/.obsidian/plugins/query-builder/`
3. Copy the downloaded files into that folder
4. Reload Obsidian and enable the plugin in **Settings -> Community plugins**

## Development

```bash
# Install dependencies
npm install

# Development build (watch mode)
npm run dev

# Production build
npm run build

# Run tests
npm test

# Lint
npm run lint
```
