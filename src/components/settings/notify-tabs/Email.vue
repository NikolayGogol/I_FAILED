<script setup>
  import { storeToRefs } from 'pinia'
  import { computed } from 'vue'
  import { useEmailSettingsStore } from '@/stores/settings/email'
  import '@/styles/components/settings/notify-tabs/tab.scss'
  //
  const emit = defineEmits(['back'])
  const radios = [
    {
      label: 'Daily',
      value: 'daily',
    },
    {
      label: 'Weekly',
      value: 'weekly',
    },
    {
      label: 'Never',
      value: 'never',
    },
  ]
  const emailSettingsStore = useEmailSettingsStore()
  const { switches, selectedRadio } = storeToRefs(emailSettingsStore)

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
      <span>Email notifications</span>
    </div>
    <div class="title mt-10">Email digest notifications</div>
    <v-radio-group
      v-model="selectedRadio"
      class="mt-4"
      color="primary"
      hide-details
    >
      <v-radio
        v-for="radio in radios"
        :key="radio.value"
        :label="radio.label"
        :value="radio.value"
      />
    </v-radio-group>
    <p class="text-description">
      Stay updated your way. Choose to receive a summary every day, once a week, or not at all.
    </p>
    <div class="title mt-6">Related to you and your posts</div>
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
