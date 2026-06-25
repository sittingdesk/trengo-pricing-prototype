# Pricing — prototyping workspace

Vue 3 + shadcn-vue + Tailwind v4 (TypeScript). Used to turn Figma designs and
Claude-authored context `.md` files into engineer-ready prototypes.

## Non-negotiable rules

1. **`design.md` is the source of truth for design tokens.** Colors, type
   scale, spacing, radius, shadows and focus rings all live in
   `src/assets/index.css` (`@theme` + shadcn semantic vars), translated from
   `design.md`. Use the tokens — `bg-grey-900`, `text-leaf-500`, `rounded-pill`,
   `shadow-300`, `text-ds-sm`, etc. **Never hard-code a raw hex, px font-size, or
   magic-number spacing when a token exists.**
2. **shadcn-vue governs component structure & behaviour.** Build UI from
   shadcn-vue components (`src/components/ui/*`). Add new ones with
   `npx shadcn-vue@latest add <name>`. This is the Vue port — never React
   shadcn/ui.
3. **Tailwind v4, CSS-first.** Config lives in `@theme` inside
   `src/assets/index.css`. There is **no `tailwind.config.js`** — don't add one.
   Note: Tailwind's JIT only generates classes written as complete literal
   strings. Never build class names dynamically (`` `bg-grey-${n}` ``) — list the
   full class, or add it via `@source inline(...)`.
4. **No inline mock data.** Sample/demo data goes in `src/data/`, never inlined
   into components.
5. **When in doubt, ask.** If a Figma design conflicts with `design.md` or
   shadcn conventions, or a needed token is missing from `design.md`, **stop and
   ask** — don't invent a value.

## Buttons

Per `design.md` §7.5 the default button is **dark (Grey-900)** via the
`--button` token, even though brand `--primary` is **Leaf**. Variants:
`default` (dark), `primary` (Leaf), `destructive` (Error/500 end-call),
`outline`, `ghost`, `secondary`, `link`.

## Icons

Local SVGs in `svg icons/` rendered through `src/components/Icon.vue`
(`<Icon name="phone" :size="20" class="text-grey-700" />`). Matching is fuzzy
against the Figma name. See `svg icons/README.md` and `design.md` §8.2 for the
sourcing workflow and Figma fallback.

## Build & share (no server)

The build produces a **single self-contained `dist/index.html`** — all JS, CSS
and fonts inlined (via `vite-plugin-singlefile` + `base: './'`). It opens by
double-click (`file://`), works offline, and is the artifact to share with
colleagues — just send `dist/index.html`.

```bash
npm run build    # type-check (vue-tsc) + bundle → dist/index.html
npm run dev      # optional: live dev server while iterating locally
```

After editing, re-run `npm run build` and reshare `dist/index.html`.
