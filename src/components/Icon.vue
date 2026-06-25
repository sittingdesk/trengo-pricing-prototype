<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

/**
 * Local SVG icon renderer — design.md §8.1 / §8.2.
 *
 * Drop Trengo SVGs into the project-root `svg icons/` folder. Pass either the
 * file name or the Figma name (`Icon / Phone - outline`) — matching is fuzzy:
 * case-, separator- and decoration-insensitive. Icons render with
 * `stroke="currentColor"`, so set color via Tailwind `text-*` on the parent.
 *
 * Fallback: if no local match exists, see design.md §8.2 (Figma source
 * file 6F8rU64QxDONx5YaQrxA0J, icons node 2342:64352).
 */
const props = withDefaults(
  defineProps<{
    name: string
    // DS icon sizes — design.md §3.3 (16/20/24) and §8.1 (32).
    size?: 16 | 20 | 24 | 32
    class?: string
  }>(),
  { size: 20 },
)

// Eagerly load every SVG in the root-level `svg icons/` folder as raw markup.
const rawIcons = import.meta.glob('/svg icons/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

// Normalise a name/path for fuzzy matching: lowercase, strip the `Icon /` and
// `- outline` decoration, and drop every non-alphanumeric character.
function normalize(value: string): string {
  return value
    .replace(/icon\s*\/?/i, '')
    .replace(/-?\s*outline/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

const lookup = computed(() => {
  const target = normalize(props.name)
  for (const [filePath, svg] of Object.entries(rawIcons)) {
    const fileName = filePath.split('/').pop()?.replace(/\.svg$/i, '') ?? ''
    if (normalize(fileName) === target) return svg
  }
  return null
})

const sizeClass = computed(
  () => ({ 16: 'size-4', 20: 'size-5', 24: 'size-6', 32: 'size-8' })[props.size],
)
</script>

<template>
  <span
    v-if="lookup"
    :class="cn('inline-flex shrink-0 items-center justify-center [&>svg]:size-full', sizeClass, props.class)"
    v-html="lookup"
  />
  <!-- Placeholder until a matching SVG is added to `svg icons/` -->
  <span
    v-else
    :class="cn('inline-flex shrink-0 items-center justify-center rounded-xs border border-dashed border-grey-400 text-grey-400', sizeClass, props.class)"
    :title="`Missing icon: ${name} — add it to /svg icons/`"
    aria-hidden="true"
  />
</template>
