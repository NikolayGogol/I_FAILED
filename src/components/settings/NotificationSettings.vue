<script setup>
  import { ref } from 'vue'
  import DoNotDisturb from '@/components/settings/notify-tabs/DoNotDisturb.vue'
  import Email from '@/components/settings/notify-tabs/Email.vue'
  import Push from '@/components/settings/notify-tabs/Push.vue'
  import { getIcon } from '@/models/icons.js'
  import '@/styles/components/settings/notifications.scss'

  const list = [
    {
      label: 'Email notifications',
      icon: getIcon('letter', 20, 20),
      id: 0,
    },
    {
      label: 'Push notifications',
      icon: getIcon('bell', 20, 20),
      id: 1,
    },
    {
      label: 'Do not disturb',
      icon: getIcon('mute', 20, 20),
      id: 2,
    },
  ]
  const activeTab = ref(null)
  //
  function selectTab (tab) {
    activeTab.value = tab
  }
</script>
<template>
  <div class="settings-section">
    <ul v-if="!activeTab">
      <li
        v-for="item in list"
        :key="item.label"
        @click="selectTab(item)"
      >
        <div class="d-flex">
          <div class="icon d-flex mr-4" v-html="item.icon" />
          <span>{{ item.label }}</span>
        </div>
        <v-icon icon="mdi-chevron-right" />
      </li>
    </ul>
    <Email v-if="activeTab?.id === 0" @back="activeTab = null" />
    <Push v-if="activeTab?.id === 1" @back="activeTab = null" />
    <DoNotDisturb v-if="activeTab?.id === 2" @back="activeTab = null" />
  </div>
</template>
