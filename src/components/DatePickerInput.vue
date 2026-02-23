<script setup>
  import { computed, ref } from 'vue'
  import { useDate } from 'vuetify'
  import '@/styles/components/form-input.scss'

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
  })

  const emit = defineEmits(['update:modelValue'])

  const menu = ref(false)
  const date = ref(props.modelValue ? new Date(props.modelValue) : null)
  const adapter = useDate()

  const formattedDate = computed(() => {
    if (!date.value) return ''
    return adapter.format(date.value, 'keyboardDate')
  })

  function updateDate (newDate) {
    date.value = newDate
    emit('update:modelValue', newDate)
    menu.value = false
  }
</script>

<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    content-class="date-picker-menu"
    location="bottom start"
    min-width="auto"
  >
    <template #activator="{ props: menuProps }">
      <v-text-field
        v-bind="menuProps"
        append-inner-icon="mdi-calendar-blank-outline"
        class="form-field"
        density="comfortable"
        hide-details="auto"
        :label="label"
        :model-value="formattedDate"
        :placeholder="placeholder"
        readonly
        variant="outlined"
      />
    </template>
    <v-date-picker
      v-model="date"
      color="primary"
      @update:model-value="updateDate"
    />
  </v-menu>
</template>

<style scoped>
/* Inherit styles from form-input if needed, or rely on global styles */
</style>
