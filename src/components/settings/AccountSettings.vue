<script setup>
  import { ref } from 'vue'
  import Info from '@/components/settings/account-tabs/Info.vue'
  import { getIcon } from '@/models/icons.js'
  //
  const list = [
    {
      label: 'Account information',
      icon: getIcon('account', 20, 20),
      id: 0,
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
    <Info v-if="activeTab?.id === 0" @back="activeTab = null" />
  </div>
</template>
