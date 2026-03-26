<script setup>
  import { storeToRefs } from 'pinia'
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
    <p class="text-description">Lorem ipsum dolor sit amet, consectetur adipisicing elit. A cum dicta doloribus error modi! A at consequatur ex ipsa officiis, possimus, praesentium, quaerat recusandae repudiandae vero vitae voluptatibus. Ullam, voluptas?</p>
    <div class="title mt-6">Related to you and your posts</div>
    <ul>
      <li
        v-for="item in switches"
        :key="item.label"
        class="cursor-default"
      >
        <span>{{ item.label }}</span>
        <v-switch
          v-model="item.state"
          color="primary"
          hide-details
        />
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">

</style>
