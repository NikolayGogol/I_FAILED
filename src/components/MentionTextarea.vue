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

  watch(() => props.modelValue, (newValue) => {
    displayValue.value = renderMentions(newValue)
  })

  function onInput (value) {
    const textarea = formTextarea.value.$el.querySelector('textarea')
    const caretPos = textarea.selectionStart
    const atIndex = value.lastIndexOf('@', caretPos - 1)

    if (atIndex === -1) {
      showPopover.value = false
    } else {
      const query = value.substring(atIndex + 1, caretPos)
      if (/\s/.test(query)) {
        showPopover.value = false
      } else {
        searchQuery.value = query
        updatePopoverPosition()
        showPopover.value = true
      }
    }
    emit('update:modelValue', value)
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

    const newDisplayValue =
      text.slice(0, atIndex) +
      `@${user.label} ` +
      text.slice(caretPos)

    const newModelValue =
      props.modelValue.slice(0, atIndex) +
      `@[${user.label}](${user.value}) ` +
      props.modelValue.slice(caretPos)

    displayValue.value = newDisplayValue
    emit('update:modelValue', newModelValue)
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
      width: `${rect.width}px`,
    }
  }

  function renderMentions(text) {
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
          <span>{{ user.label }}</span>
        </li>
        <li v-if="filteredUsers.length === 0" class="no-results">
          No users found
        </li>
      </ul>
    </div>
  </div>
</template>
