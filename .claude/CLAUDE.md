# Query Builder — Obsidian plugin

## Project overview

- Target: Obsidian Community Plugin (TypeScript → bundled JavaScript).
- Entry point: `src/main.ts` compiled to `main.js` and loaded by Obsidian.
- Required release artifacts: `main.js`, `manifest.json`, and `styles.css`.
- Single command: `build-query` ("Build query") — opens a visual query builder modal.

## Environment & tooling

- Node.js: use current LTS (Node 18+ recommended).
- **Package manager: npm** — `package.json` defines npm scripts and dependencies.
- **Bundler: esbuild** — `esbuild.config.mjs` bundles all source into `main.js`.
- **Test runner: Jest + ts-jest** — `jest.config.js` configured for ESM with obsidian mock.
- Types: `obsidian` type definitions.

### Install

```bash
npm install
```

### Dev (watch)

```bash
npm run dev
```

### Production build

```bash
npm run build
```

### Test

```bash
npm test
```

### Lint

```bash
npm run lint
```

## File structure

```
src/
  main.ts                    # Plugin entry point, command registration (~25 lines)
  types.ts                   # All interfaces and enums (QueryFieldId, OperatorId, Condition, ConditionGroup, QueryModel)

  query/
    fields.ts                # Field definitions array (id, label, prefix, allowed operators)
    operators.ts             # Operator definitions array (id, label, negated/exact/regex flags)
    serializer.ts            # QueryModel → Obsidian query string
    parser.ts                # Obsidian query string → QueryModel (tokenizer + recursive descent)

  ui/
    query-builder-modal.ts   # Main Modal subclass: state, rendering, submit/cancel
    condition-row.ts         # Single condition row renderer (field, operator, value, case toggle)
    condition-group.ts       # Nestable group renderer (AND/OR toggle, NOT, recursive children)
    tag-suggest.ts           # Tag autocomplete via MetadataCache + AbstractInputSuggest
    query-preview.ts         # Collapsible preview pane with copy button

  utils/
    editor.ts                # Detect cursor in query block, insert/replace text

test/
  __mocks__/
    obsidian.ts              # Minimal obsidian module mock for tests
  query/
    serializer.test.ts       # Serializer unit tests
    parser.test.ts           # Parser unit tests + round-trip verification
```

### Key conventions

- **`main.ts` is minimal**: only plugin lifecycle and command registration. All logic lives in other modules.
- **Data-driven config**: fields and operators are defined as arrays in `fields.ts` and `operators.ts`. Adding a new field or operator = adding one array entry.
- **Do not commit build artifacts**: never commit `node_modules/`, `main.js`, or other generated files.
- Keep the plugin small. Avoid large dependencies. Prefer browser-compatible packages.
- All CSS classes prefixed with `qb-`. Use Obsidian CSS variables for theme compatibility.

## Manifest rules (`manifest.json`)

- Must include (non-exhaustive):
  - `id` (plugin ID — currently `query-builder`)
  - `name`, `version` (SemVer `x.y.z`), `minAppVersion`, `description`
  - `isDesktopOnly` (boolean — currently `false`)
  - Optional: `author`, `authorUrl`, `fundingUrl`
- Never change `id` after release. Treat it as stable API.
- Keep `minAppVersion` accurate when using newer APIs.

## Testing

### Automated tests

- Jest + ts-jest with ESM support.
- Tests live in `test/` mirroring the `src/` structure.
- Obsidian APIs are mocked via `test/__mocks__/obsidian.ts`.
- Run with `npm test`.
- The serializer and parser are the core testable modules (pure logic, no DOM deps). UI modules depend on Obsidian APIs and are tested manually.

### Manual testing

- Copy `main.js`, `manifest.json`, `styles.css` to:
  ```
  <Vault>/.obsidian/plugins/query-builder/
  ```
- Reload Obsidian and enable the plugin in **Settings -> Community plugins**.

## Architecture

### Data model (`types.ts`)

- `QueryModel` contains a root `ConditionGroup`
- `ConditionGroup` has a `connector` (AND/OR), `negated` flag, and `children` array of `QueryNode`
- `QueryNode` is either a `Condition` or a nested `ConditionGroup`
- `Condition` specifies field, operator, value, optional property name, and case sensitivity

### Serialization flow

```
QueryModel → serializer.ts → Obsidian query string (e.g. "tag:#work -file:draft")
```

### Parsing flow

```
Obsidian query string → parser.ts (tokenizer → recursive descent) → QueryModel
```

### UI rendering

- Modal holds mutable `QueryModel` state
- On structural changes (add/remove condition, change field): clears and rebuilds DOM
- On value typing: updates model in-place without re-render
- Preview re-serializes with 200ms debounce

## Commands

| Command | ID | Description |
|---|---|---|
| Build query | `build-query` | Open query builder modal; if cursor is inside a `query` block, opens pre-populated for editing |

## Versioning & releases

- Bump `version` in `manifest.json` (SemVer) and update `versions.json` to map plugin version → minimum app version.
- Create a GitHub release whose tag exactly matches `manifest.json`'s `version`. Do not use a leading `v`.
- Attach `manifest.json`, `main.js`, and `styles.css` to the release as individual assets.

## Security, privacy, and compliance

Follow Obsidian's **Developer Policies** and **Plugin Guidelines**. In particular:

- Default to local/offline operation. Only make network requests when essential to the feature.
- No hidden telemetry. If you collect optional analytics or call third-party services, require explicit opt-in and document clearly in `README.md` and in settings.
- Never execute remote code, fetch and eval scripts, or auto-update plugin code outside of normal releases.
- Minimize scope: read/write only what's necessary inside the vault. Do not access files outside the vault.
- Register and clean up all DOM, app, and interval listeners using the provided `register*` helpers so the plugin unloads safely.

## UX & copy guidelines

- Prefer sentence case for headings, buttons, and titles.
- Use clear, action-oriented imperatives in step-by-step copy.
- Use **bold** to indicate literal UI labels. Prefer "select" for interactions.
- Use arrow notation for navigation: **Settings -> Community plugins**.
- Keep in-app strings short, consistent, and free of jargon.

## Performance

- Keep startup light. Defer heavy work until needed.
- Avoid long-running tasks during `onload`; use lazy initialization.
- Debounce/throttle expensive operations (preview updates use 200ms debounce).

## Coding conventions

- TypeScript with strict null checks and `noImplicitAny`.
- **Keep `main.ts` minimal**: only plugin lifecycle. Delegate all logic to separate modules.
- **Split large files**: if any file exceeds ~200-300 lines, break it into smaller modules.
- **Use clear module boundaries**: each file has a single, well-defined responsibility.
- Bundle everything into `main.js` (no unbundled runtime deps).
- Avoid Node/Electron APIs if you want mobile compatibility; `isDesktopOnly` is `false`.
- Prefer `async/await` over promise chains; handle errors gracefully.

## Mobile

- `isDesktopOnly` is `false` — the plugin must work on mobile.
- Condition rows use `flex-wrap` for narrow screens.
- Don't assume desktop-only behavior.

## Agent do/don't

**Do**
- Add commands with stable IDs (don't rename once released).
- Write tests for new pure-logic modules (serializer, parser, utilities).
- Use `this.register*` helpers for everything that needs cleanup.
- Keep field/operator definitions data-driven — add entries to the arrays rather than writing conditional logic.

**Don't**
- Introduce network calls without an obvious user-facing reason and documentation.
- Ship features that require cloud services without clear disclosure and explicit opt-in.
- Store or transmit vault contents unless essential and consented.
- Put logic in `main.ts` — delegate to modules.

## References

- Obsidian API documentation: https://docs.obsidian.md
- Developer policies: https://docs.obsidian.md/Developer+policies
- Plugin guidelines: https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
- Obsidian search syntax: https://help.obsidian.md/Plugins/Search
