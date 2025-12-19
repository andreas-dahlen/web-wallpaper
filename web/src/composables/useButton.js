import { onMounted } from 'vue'
import { useInput } from './useInput'

export function useButton(elRef, { onDown, onUp }) {
  const input = useInput()

  onMounted(() => {
    if (!elRef.value) return
    input.registerElement(elRef.value, { onDown, onUp })
  })
}
