<template>
  <v-text-field
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    class="form-field"
    density="comfortable"
    hide-details="auto"
    :label="label"
    :placeholder="placeholder"
    :required="required"
    :type="isPassword ? (showPassword ? 'text' : 'password') : type"
    variant="outlined"
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
</template>

<script setup>
import { ref, computed } from 'vue'
import '@/styles/components/form-input.scss'

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'text',
  },
  required: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const showPassword = ref(false)

const isPassword = computed(() => props.type === 'password')
</script>
