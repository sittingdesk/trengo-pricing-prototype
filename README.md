# Trengo Pricing — Prototype

Vue 3 + shadcn-vue + Tailwind v4 (TypeScript) prototyping workspace.
Design tokens come from [`design.md`](./design.md); see [`CLAUDE.md`](./CLAUDE.md)
for the working rules.

## Build a shareable file (no server needed)

```bash
npm install
npm run build
```

This produces a single self-contained **`dist/index.html`** — all JS, CSS and
fonts inlined. Double-click it to open (no `localhost`), and share that one file
with colleagues.

## Iterate locally (optional)

```bash
npm run dev      # Vite dev server with hot reload
```
