<template>
  <div class="w-100 form-custom-textarea">
    <label v-if="$attrs.label" class="label">{{ $attrs.label }}</label>
    <v-textarea
      class="form-field"
      v-bind="filteredAttrs"
      :model-value="modelValue"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </div>
</template>

<script setup>
  import { computed, useAttrs } from 'vue'
  import '@/styles/components/form-custom-textarea.scss'
  defineOptions({
    inheritAttrs: false,
  })

  defineProps({
    modelValue: {
      type: String,
      required: true,
    },
  })

  const emit = defineEmits(['update:modelValue'])
  const attrs = useAttrs()

  // We have a custom <label> element, so we don't want to pass the 'label'
  // prop to v-textarea, which would render its own label.
  const filteredAttrs = computed(() => {
    const newAttrs = { ...attrs }
    delete newAttrs.label
    return newAttrs
  })
</script>
