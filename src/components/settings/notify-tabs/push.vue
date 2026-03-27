<script setup>
  import { computed } from 'vue'
  import { usePushSettingsStore } from '@/stores/settings/push.js'
  import '@/styles/components/settings/notify-tabs/tab.scss'
  import {storeToRefs} from "pinia";
  //
  const { switches } = storeToRefs(usePushSettingsStore())
  const emit = defineEmits(['back'])

  const allSwitch = computed({
    get: () => switches.value.length > 0 && switches.value.every(item => item.state),
    set: val => {
      for (const item of switches.value) {
        item.state = val
      }
    },
  })
</script>

<template>
  <div class="notify-tab">
    <div class="d-flex tab-header" @click="emit('back')">
      <v-icon class="mr-6" icon="mdi-chevron-left" />
      <span>Push notifications</span>
    </div>
    <ul class="mt-3">
      <li class="cursor-default all-item px-5">
        <span>All</span>
        <v-switch
          v-model="allSwitch"
          color="primary"
          density="comfortable"
          hide-details
        />
      </li>
      <li
        v-for="item in switches"
        :key="item.label"
        class="cursor-default px-5"
      >
        <span>{{ item.label }}</span>
        <v-switch
          v-model="item.state"
          color="primary"
          density="comfortable"
          hide-details
        />
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">

</style>
