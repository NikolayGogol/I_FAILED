<script setup>
  import { computed, nextTick, ref, watch } from 'vue'
  import FormTextarea from './FormTextarea.vue'
  import '@/styles/components/mention-textarea.scss'

  const props = defineProps({
    modelValue: String,
    users: Array,
  })

  const emit = defineEmits(['update:modelValue'])

  const wrapper = ref(null)
  const formTextarea = ref(null)
  const showPopover = ref(false)
  const popoverStyle = ref({})
  const searchQuery = ref('')
  const selectedIndex = ref(0)
  const displayValue = ref(props.modelValue)

  const sortedUsers = computed(() => {
    // eslint-disable-next-line
    return [...(props.users || [])].sort((a, b) => b.label.length - a.label.length)
  })

  const filteredUsers = computed(() => {
    if (!searchQuery.value) {
      return props.users
    }
    return props.users.filter(user =>
      user.label.toLowerCase().includes(searchQuery.value.toLowerCase()),
    )
  })

  watch(filteredUsers, () => {
    selectedIndex.value = 0
  })

  watch(() => props.modelValue, newValue => {
    displayValue.value = renderMentions(newValue)
  })

  function buildModelValue (text) {
    if (!text || !text.includes('@')) return text || ''
    let res = text
    for (const user of sortedUsers.value) {
      const escaped = user.label.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
      const regex = new RegExp(String.raw`(^|[^\p{L}\p{N}_])@${escaped}(?![\p{L}\p{N}_])`, 'gu')
      res = res.replace(regex, `$1@[${user.label}](${user.value})`)
    }
    return res
  }

  function onInput (value) {
    const textarea = formTextarea.value.$el.querySelector('textarea')
    const caretPos = textarea.selectionStart
    const atIndex = value.lastIndexOf('@', caretPos - 1)

    if (atIndex === -1) {
      showPopover.value = false
    } else {
      // eslint-disable-next-line unicorn/prefer-string-slice
      const query = value.substring(atIndex + 1, caretPos)
      if (/\s/.test(query)) {
        showPopover.value = false
      } else {
        searchQuery.value = query
        updatePopoverPosition()
        showPopover.value = true
      }
    }
    emit('update:modelValue', buildModelValue(value))
  }

  function onKeydown (e) {
    if (showPopover.value) {
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault()
          selectedIndex.value = (selectedIndex.value + 1) % filteredUsers.value.length

          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          selectedIndex.value = (selectedIndex.value - 1 + filteredUsers.value.length) % filteredUsers.value.length

          break
        }
        case 'Enter':
        case 'Tab': {
          e.preventDefault()
          selectUser(filteredUsers.value[selectedIndex.value])

          break
        }
        case 'Escape': {
          e.preventDefault()
          showPopover.value = false

          break
        }
      // No default
      }
    }
  }

  function onBlur () {
    setTimeout(() => {
      showPopover.value = false
    }, 200) // Delay to allow click on popover
  }

  function selectUser (user) {
    if (!user) return

    const textarea = formTextarea.value.$el.querySelector('textarea')
    const text = displayValue.value
    const caretPos = textarea.selectionStart
    const atIndex = text.lastIndexOf('@', caretPos - 1)

    const newDisplayValue
      = text.slice(0, atIndex)
        + `@${user.label} `
        + text.slice(caretPos)

    displayValue.value = newDisplayValue
    emit('update:modelValue', buildModelValue(newDisplayValue))
    showPopover.value = false

    nextTick(() => {
      const newCaretPos = atIndex + `@${user.label} `.length
      textarea.focus()
      textarea.setSelectionRange(newCaretPos, newCaretPos)
    })
  }

  function updatePopoverPosition () {
    const textarea = formTextarea.value.$el.querySelector('textarea')
    const rect = textarea.getBoundingClientRect()
    const wrapperRect = wrapper.value.getBoundingClientRect()

    popoverStyle.value = {
      top: `${rect.bottom - wrapperRect.top}px`,
      left: `${rect.left - wrapperRect.left}px`,
      width: `auto`,
    }
  }

  function renderMentions (text) {
    if (!text) return ''
    return text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1')
  }
</script>

<template>
  <div ref="wrapper" class="mention-textarea-wrapper">
    <FormTextarea
      ref="formTextarea"
      :model-value="displayValue"
      v-bind="$attrs"
      @blur="onBlur"
      @keydown="onKeydown"
      @update:model-value="onInput"
    />
    <div v-if="showPopover" class="mention-popover" :style="popoverStyle">
      <ul>
        <li
          v-for="(user, index) in filteredUsers"
          :key="user.value"
          :class="{ 'selected': index === selectedIndex }"
          @click="selectUser(user)"
        >
          <img
            alt="avatar"
            class="avatar"
            :src="user.photoURL"
          >
          <div class="d-flex flex-column">
            <p>{{ user.label }}</p>
            <p class="text-muted">@{{ user.label.replaceAll(' ', '_') }}</p>
          </div>

        </li>
        <li v-if="filteredUsers.length === 0" class="no-results">
          No users found
        </li>
      </ul>
    </div>
  </div>
</template>
