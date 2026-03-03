<script setup>
  import { computed, ref } from 'vue'
  import '@/styles/components/form-autocomplete.scss'

  const props = defineProps({
    options: {
      required: false,
      type: Array,
      default: () => [],
    },
    modelValue: {
      type: Array,
      default: () => [],
    },
    placeholder: {
      type: String,
      default: 'Add tag',
    },
  })

  const emit = defineEmits(['update:modelValue'])

  const text = ref('')
  const showSuggestions = ref(false)
  const inputRef = ref(null)

  const filteredOptions = computed(() => {
    if (!text.value) return []
    const lowerText = text.value.toLowerCase()
    return props.options.filter(opt =>
      opt.toLowerCase().includes(lowerText)
      && !props.modelValue.includes(opt),
    )
  })

  function addTag (tag) {
    const val = tag ? tag.trim() : text.value.trim()
    if (val && !props.modelValue.includes(val)) {
      const newTags = [...props.modelValue, val]
      emit('update:modelValue', newTags)
    }
    text.value = ''
    showSuggestions.value = false
  }

  function removeTag (index) {
    const newTags = [...props.modelValue]
    newTags.splice(index, 1)
    emit('update:modelValue', newTags)
  }

  function selectTag (tag) {
    addTag(tag)
    inputRef.value?.focus() // Keep focus on the input
  }

  function onInput () {
    showSuggestions.value = true
  }

  function onBlur () {
    // Hide suggestions when the input loses focus
    showSuggestions.value = false
  }
</script>

<template>
  <div class="form-autocomplete">
    <div class="tags-input-wrapper" @click="inputRef?.focus()">
      <div class="d-flex align-center gap-4">
        <input
          ref="inputRef"
          v-model="text"
          class="autocomplete-input w-100"
          :placeholder="placeholder"
          type="text"
          @blur="onBlur"
          @focus="showSuggestions = true"
          @input="onInput"
          @keydown.enter.prevent="addTag()"
        >
        <div
          class="cancel-btn add-btn"
          :class="{'pointer-events-none opacity-60': !text}"
          @click="addTag()"
        >Add</div>
      </div>
      <p class="form-hint my-2">Suggested from popular tags</p>

    </div>
    <ul v-if="showSuggestions && filteredOptions.length > 0" class="suggestion-list">
      <li
        v-for="tag in filteredOptions"
        :key="tag"
        class="suggestion-item"
        @mousedown.prevent="selectTag(tag)"
      >
        {{ tag }}
      </li>
    </ul>
    <div v-if="modelValue.length > 0" class="selected-tags-list ga-2 mt-3">
      <div v-for="(tag, index) in modelValue" :key="tag" class="tag-chip py-1 px-2">
        {{ tag }}
        <span class="remove-tag cursor-pointer" @click="removeTag(index)">×</span>
      </div>
    </div>
  </div>
</template>
