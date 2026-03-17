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
  function handleDateUpdate (modelData) {
    if (!modelData) return

    const d = new Date(modelData)
    // Round to nearest 10 minutes only if there is a minutes value
    // to prevent restricting future minute selections if we just clicked a date.
    // Actually, VueDatePicker handles minute stepping. We just need to make sure
    // we are passing the values correctly without overwriting them unintentionally.
    // If the component has `minutes-increment="10"`, it does the rounding for us in the UI.
    d.setSeconds(0)
    d.setMilliseconds(0)
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
      :placeholder="placeholder"
      :time-config="{
        enableTimePicker: enableTime,
      }"
      :minutes-increment="10"
      @update:model-value="handleDateUpdate"
    >
      <template #input-icon>
        <v-icon class="input-icon" icon="mdi-calendar-blank-outline" size="small" />
      </template>
    </VueDatePicker>
  </div>
</template>
