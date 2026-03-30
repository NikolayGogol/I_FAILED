<script setup>
  import { VueDatePicker } from '@vuepic/vue-datepicker'
  import { storeToRefs } from 'pinia'
  import { reactive, ref, watch } from 'vue'
  import { useDoNotDisturbStore } from '@/stores/settings/do-not-disturb'
  import '@vuepic/vue-datepicker/dist/main.css'
  import '@/styles/components/date-picker.scss'

  const emit = defineEmits(['back'])
  const doNotDisturbStore = useDoNotDisturbStore()
  const { doNotDisturb } = storeToRefs(doNotDisturbStore)
  const isLoading = ref(false)

  async function save () {
    if (isLoading.value) return
    isLoading.value = true
    try {
      await doNotDisturbStore.setDoNotDisturb(doNotDisturb.value.from, doNotDisturb.value.to)
    } catch (error) {
      console.error(error)
    } finally {
      isLoading.value = false
    }
  }

  function handleClear () {
    doNotDisturb.value.to = null
  }
</script>

<template>
  <div class="notify-tab">
    <div class="d-flex tab-header" @click="emit('back')">
      <v-icon class="mr-6" icon="mdi-chevron-left" />
      <span>Do not disturb</span>
    </div>
    <p class="text-description mt-6">Select specific time range and we won’t send you notifications during this time</p>
    <div class="d-flex align-center mt-2">
      <div class="picker-wrapper">
        <VueDatePicker
          v-model="doNotDisturb.from"
          clearable
          placeholder="From"
          time-picker
          @cleared="handleClear"
        />
      </div>
      <span class="mx-2 separator">-</span>
      <div class="picker-wrapper">
        <VueDatePicker
          v-model="doNotDisturb.to"
          :class="{'pointer-events-none opacity-60': !doNotDisturb.from}"
          clearable
          :min-time="doNotDisturb.from"
          placeholder="To"
          time-picker
        />
      </div>
    </div>
    <div class="d-flex justify-center mt-6">
      <div class="submit-btn" @click="save">
        <v-progress-circular
          v-if="isLoading"
          color="white"
          indeterminate
          size="20"
          width="2"
        />
        <span v-else>Save</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
</style>
