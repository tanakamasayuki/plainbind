# PlainBind.js

> 📘 Looking for the Japanese version? See [README.ja.md](README.ja.md).

PlainBind.js is a tiny template/data-binding helper that lets you turn plain HTML
documents into data-aware pages by only using `data-*` attributes plus JSON.
Drop a single script tag on the page and the markup becomes actionable—no build
step, no framework runtime, and no designer-unfriendly syntax.

> ⚠︎ The library implementation is work-in-progress.  
> This document captures the public contract we intend to ship on npm so that
> consumers can rely on a stable API once the first release is published.

---

## Installation

PlainBind.js stays framework-agnostic. You can start with a simple script tag
and later move to npm if you need bundler integration.

```html
<!-- CDN / local bundle once published -->
<script src="https://cdn.jsdelivr.net/npm/plainbind@latest/dist/plainbind.min.js"></script>
```

```bash
npm install plainbind

# usage in bundlers
import "plainbind";
```

The default build auto-runs as soon as it loads. No global config is required.

---

## Quick Start

```html
<h1 data-bind="title"></h1>

<ul>
  <li data-repeat="user in users" data-class-when="user.active:active">
    <span data-bind="user.name"></span>
    <span data-bind="user.age" data-format="number"></span>
  </li>
  <li data-empty="users">データがありません</li>
</ul>

<script id="plainbind-data" type="application/json">
{
  "title": "ユーザー一覧",
  "users": [
    { "name": "田中", "age": 25, "active": true },
    { "name": "佐藤", "age": 30, "active": false }
  ]
}
</script>

<script src="plainbind.js"></script>
```

1. PlainBind searches for JSON in `<script id="plainbind-data">`.
2. It parses the document once, resolves data attributes, and mutates the DOM.
3. When rendering completes, `PlainBind.ready(cb)` and the
   `plainbind:ready` event fire with the context payload.

---

## Data Loading

PlainBind tries data sources in this order:

1. Inline `<script id="plainbind-data" type="application/json">`
2. `{currentHtmlFile}.json` over `fetch` (e.g. `index.html` → `index.html.json`)

You can extend the loader in future versions via hooks (see Roadmap). Failed
requests resolve to an empty object—callers should handle `ctx.data` accordingly.

---

## Available Directives

| Attribute           | Purpose                                            |
| ------------------- | -------------------------------------------------- |
| `data-bind`         | Inject plain text after escaping                   |
| `data-bind-html`    | Inject HTML (you control sanitization)             |
| `data-bind-attr-*`  | Bind to arbitrary attributes                       |
| `data-show`         | Show element if truthy                             |
| `data-hide`         | Hide element if truthy                             |
| `data-repeat`       | Repeat children for each item                      |
| `data-empty`        | Display fallback block when collection is empty    |
| `data-class-when`   | Toggle multiple classes via `expr:class` pairs     |
| `data-format`       | Apply registered formatter before binding          |
| `data-placeholder`  | Substitute text when bound value is empty          |
| `data-link`         | Shorthand for `href` assignment on anchors         |

### Built-in formatters

- `number` : `toLocaleString` with digit grouping
- `currency` : Yen display (`¥` + `toLocaleString("ja-JP")`)
- `date` : `YYYY/MM/DD`
- `datetime` : `YYYY/MM/DD HH:mm`
- `uppercase` / `lowercase` : casing helpers
- `trim` : trim whitespace
- `truncate[:len]` : cut to 100 chars (or given length) with `...`
- `json` : `JSON.stringify` (debug)

### Example

```html
<li data-repeat="item in products">
  <img data-bind-attr-src="item.image" data-placeholder="no-image.png">
  <span data-bind="item.name" data-format="uppercase"></span>
  <span data-bind="item.price" data-format="currency"></span>
</li>
<li data-empty="products">商品がありません</li>
```

---

## Data Lookup Rules

- Dot notation: `user.profile.name`
- Array index: `users[0].name`
- Variables defined via `data-repeat="item in items"` are scoped to the
  repeated block. Parent scopes remain readable.
- Missing lookups resolve to an empty string for text bindings and remove the
  target attribute for `data-bind-attr-*`.

---

## JavaScript API

### `PlainBind.ready(callback)`

Registers a callback that runs after the initial pass finishes. The callback
receives `{ data, root, version }`.

```js
PlainBind.ready(({ data }) => {
  console.log("Rendered with", data);
});
```

### `PlainBind.registerFormatter(name, fn)`

Adds a formatter available via `data-format="name"`. Formatters receive the raw
value and the full context object.

```js
PlainBind.registerFormatter("currency", (value) => {
  return "¥" + Number(value || 0).toLocaleString("ja-JP");
});
```

Formatters should be synchronous in v1. Throwing errors leaves the original
value untouched.

---

## Events

PlainBind fires a custom event once rendering completes:

```js
document.addEventListener("plainbind:ready", (event) => {
  console.log("PlainBind finished", event.detail);
});
```

`event.detail` mirrors the object passed to `PlainBind.ready`.

---

## Browser Support

| Feature            | Support target                |
| ------------------ | ----------------------------- |
| DOMParser / fetch  | Evergreen browsers            |
| ES Modules         | Optional (UMD build ships)    |
| IE11               | Not supported without polyfill |

A legacy build or polyfill guide can be added later if demand appears.

---

## Roadmap / Open Questions

- Re-render or partial hydration hooks for dynamic updates.
- Extensible data loaders beyond inline JSON / `*.json`.
- Stronger sanitization helpers for `data-bind-html`.
- Dev helper warnings in development builds.

---

## Contributing

1. Fork and clone this repo.
2. Run tests once they exist (`npm test` placeholder).
3. Open PRs against `main`. Please attach before/after screenshots for UI demos.

---

## Release (npm)

1. Update version: `npm version patch` (or `minor`/`major`).
2. Build artifacts: `npm run build`.
3. Inspect package contents: `npm pack --dry-run` (should include dist/ and READMEs).
4. Publish: `npm publish --access public` (if not scoped).
5. Push git changes and tag: `git push && git push --tags`.

---

## License

PlainBind.js is available under the MIT License. See `LICENSE` for details.
