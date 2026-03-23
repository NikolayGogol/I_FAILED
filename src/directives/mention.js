import { createApp, nextTick } from 'vue'
import MentionPopover from '@/components/MentionPopover.vue'

export const mention = {
  async mounted (el, binding) {
    await nextTick() // Wait for the child components to render their DOM

    const { users } = binding.value
    let popoverInstance = null
    let popoverNode = null
    const textarea = el.querySelector('textarea')

    if (!textarea) {
      console.error('Textarea element not found within the v-mention directive.')
      return
    }

    const showPopover = () => {
      if (popoverInstance) {
        return
      }

      const position = getCaretPosition(textarea)
      popoverNode = document.createElement('div')
      document.body.append(popoverNode)

      popoverInstance = createApp(MentionPopover, {
        show: true,
        position: { top: position.top + 20, left: position.left },
        users,
        onSelect: user => {
          const text = textarea.value
          const atIndex = text.lastIndexOf('@')
          if (atIndex === -1) {
            return
          }

          const newText = `${text.slice(0, atIndex)}@[${user.label}](${user.value}) `
          textarea.value = newText
          textarea.dispatchEvent(new Event('input', { bubbles: true }))
          hidePopover()
          textarea.focus()
        },
      }).mount(popoverNode)
    }

    const hidePopover = () => {
      if (popoverInstance) {
        popoverInstance.$el.remove()
        popoverInstance = null
      }
    }

    const onKeydown = e => {
      if (e.key === '@') {
        showPopover()
      } else if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        hidePopover()
      }
    }

    const onBlur = () => {
      // Delay hiding to allow for click events in the popover
      setTimeout(hidePopover, 200)
    }

    textarea.addEventListener('keydown', onKeydown)
    textarea.addEventListener('blur', onBlur)

    // Save handlers to remove them in unmounted
    el._mentionHandlers = { onKeydown, onBlur }
  },
  unmounted (el) {
    const textarea = el.querySelector('textarea')
    if (textarea && el._mentionHandlers) {
      textarea.removeEventListener('keydown', el._mentionHandlers.onKeydown)
      textarea.removeEventListener('blur', el._mentionHandlers.onBlur)
    }
  },
}

function getCaretPosition (element) {
  const rect = element.getBoundingClientRect()
  const style = window.getComputedStyle(element)
  const lineHeight = Number.parseFloat(style.lineHeight)
  const paddingTop = Number.parseFloat(style.paddingTop)
  const selection = element.selectionStart
  const text = element.value.slice(0, selection)
  const line = text.split('\n').length - 1
  const lastLine = text.split('\n').pop()

  // Create a temporary span to measure the width of the text on the current line
  const span = document.createElement('span')
  span.style.font = style.font
  span.style.visibility = 'hidden'
  span.style.position = 'absolute'
  span.style.whiteSpace = 'pre'
  span.textContent = lastLine
  document.body.append(span)
  const textWidth = span.getBoundingClientRect().width
  span.remove()

  return {
    top: rect.top + window.scrollY + (line * lineHeight) + paddingTop,
    left: rect.left + window.scrollX + textWidth,
  }
}
