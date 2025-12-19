import { onMounted } from 'vue'
import { input } from './inputEngine'

export function useButton(elRef, { onDown, onUp }) {

  onMounted(() => {
    if (!elRef.value) return
    input.registerElement(elRef.value, { onDown, onUp })
  })
}
