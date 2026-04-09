<script setup>
  import { ref } from 'vue'
  import BlockedUsers from '@/components/settings/content-activity-tabs/BlockedUsers.vue'
  import HiddenPosts from '@/components/settings/content-activity-tabs/HiddenPosts.vue'
  import MutedTags from '@/components/settings/content-activity-tabs/MutedTags.vue'
  import { getIcon } from '@/models/icons.js'
  import '@/styles/components/settings/content.scss'
  const list = [
    {
      label: 'Hidden posts',
      icon: getIcon('eye', 20, 20),
      id: 0,
    },
    {
      label: 'Muted users',
      icon: getIcon('mute', 20, 20),
      id: 1,
    },
    {
      label: 'Muted tags',
      icon: getIcon('dies', 20, 20),
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
    <HiddenPosts v-if="activeTab?.id === 0" @back="activeTab = null" />
    <BlockedUsers v-if="activeTab?.id === 1" @back="activeTab = null" />
    <MutedTags v-if="activeTab?.id === 2" @back="activeTab = null" />
  </div>
</template>
