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
    minutesGridStep: {
      type: Number,
      default: 1,
    },
    minutesIncrement: {
      type: Number,
      default: 1,
    },
  })

  const emit = defineEmits(['update:modelValue'])

  const date = computed({
    get: () => props.modelValue,
    set: val => emit('update:modelValue', val),
  })
  function handleDateUpdate (modelData) {
    if (!modelData) return

    const d = new Date(modelData)
    const minutes = d.getMinutes()
    const roundedMinutes = Math.round(minutes / 10) * 10
    d.setMinutes(roundedMinutes)
    d.setSeconds(0)
    emit('update:modelValue', d)
  }
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
      :minutes-grid-step="minutesGridStep"
      :minutes-increment="minutesIncrement"
      :placeholder="placeholder"
      :time-config="{
        enableTimePicker: enableTime,
        minutesIncrement,
        minutesGridStep
      }"
      @update:model-value="handleDateUpdate"
    >
      <template #input-icon>
        <v-icon class="input-icon" icon="mdi-calendar-blank-outline" size="small" />
      </template>
    </VueDatePicker>
  </div>
</template>
