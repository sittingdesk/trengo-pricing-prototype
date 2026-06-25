import { nextTick, onMounted, ref, type ShallowRef } from 'vue'

/**
 * Edge-fade shadows for a scroll region. Pass the scrolling element's template
 * ref (from `useTemplateRef`) and bind `@scroll="update"`. `atTop`/`atBottom`
 * drive top/bottom fade overlays — a fade shows only when content is hidden in
 * that direction. Call `update()` after the content changes.
 */
export function useScrollShadows(scrollEl: Readonly<ShallowRef<HTMLElement | null>>) {
  const atTop = ref(true)
  const atBottom = ref(false)

  function update() {
    const el = scrollEl.value
    if (!el) return
    atTop.value = el.scrollTop <= 1
    atBottom.value = el.scrollTop + el.clientHeight >= el.scrollHeight - 1
  }

  onMounted(() => {
    nextTick(update)
    window.setTimeout(update, 150)
  })

  return { atTop, atBottom, update }
}
