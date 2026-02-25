<script setup>
  import { VueDatePicker } from '@vuepic/vue-datepicker'
  import { computed } from 'vue'
  import '@vuepic/vue-datepicker/dist/main.css'
  import '@/styles/components/date-picker.scss'

  const props = defineProps({
    modelValue: {
      type: [String, Date, Number],
      default: null,
    },
    label: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: 'Select date',
    },
    enableTime: {
      type: Boolean,
      default: true,
    },
    maxDate: {
      type: Date,
      default: null,
    },
    minDate: {
      type: Date,
      default: null,
    },
  })

  const emit = defineEmits(['update:modelValue'])

  const date = computed({
    get: () => props.modelValue,
    set: val => emit('update:modelValue', val),
  })
</script>

<template>
  <div class="date-picker-wrapper">
    <label v-if="label" class="label">{{ label }}</label>
    <VueDatePicker
      v-model="date"
      auto-apply
      :clearable="false"
      :format="enableTime ? 'MM/dd/yyyy HH:mm' : 'MM/dd/yyyy'"
      input-class-name="dp-custom-input"
      :max-date="maxDate"
      :min-date="minDate"
      :placeholder="placeholder"
      :time-config="{ enableTimePicker: enableTime }"
    >
      <template #input-icon>
        <v-icon class="input-icon" icon="mdi-calendar-blank-outline" size="small" />
      </template>
    </VueDatePicker>
  </div>
</template>
