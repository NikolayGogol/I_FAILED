<template>
  <div>
    <label v-if="$attrs.label" class="label">{{ $attrs.label }}</label>
    <v-text-field
      class="form-field"
      v-bind="filteredAttrs"
      :model-value="modelValue"
      :type="isPassword ? (showPassword ? 'text' : 'password') : $attrs.type || 'text'"
      @update:model-value="emit('update:modelValue', $event)"
    >
      <template v-if="isPassword" #append-inner>
        <v-btn
          icon
          size="small"
          variant="text"
          @click="showPassword = !showPassword"
        >
          <v-icon>{{ showPassword ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
        </v-btn>
      </template>
    </v-text-field>
  </div>
</template>

<script setup>
  import { computed, ref, useAttrs } from 'vue'
  import '@/styles/components/form-input.scss'

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

  const showPassword = ref(false)

  const isPassword = computed(() => attrs.type === 'password')

  // We have a custom <label> element, so we don't want to pass the 'label'
  // prop to v-text-field, which would render its own label.
  const filteredAttrs = computed(() => {
    const newAttrs = { ...attrs }
    delete newAttrs.label
    return newAttrs
  })
</script>
