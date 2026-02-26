<route lang="json">
{
  "meta": {
    "layout": "MainMinLayout",
    "auth": true
  }
}
</route>

<script setup>
  import { computed, ref } from 'vue'
  import AccountSettings from '@/components/settings/AccountSettings.vue'
  import ContentSettings from '@/components/settings/ContentSettings.vue'
  import HelpSettings from '@/components/settings/HelpSettings.vue'
  import NotificationSettings from '@/components/settings/NotificationSettings.vue'
  import PremiumSettings from '@/components/settings/PremiumSettings.vue'
  import PrivacySettings from '@/components/settings/PrivacySettings.vue'
  import SecuritySettings from '@/components/settings/SecuritySettings.vue'
  import '@/styles/pages/settings.scss'

  const currentTabId = ref('account')

  const tabs = [
    { id: 'account', label: 'Account', icon: '👤', component: AccountSettings },
    { id: 'privacy', label: 'Privacy & Visibility', icon: '🔒', component: PrivacySettings },
    { id: 'notifications', label: 'Notifications', icon: '🔔', component: NotificationSettings },
    { id: 'content', label: 'Content & Activity', icon: '📝', component: ContentSettings },
    { id: 'security', label: 'Data & Security', icon: '🛡️', component: SecuritySettings },
    { id: 'premium', label: 'Premium', icon: '💎', component: PremiumSettings },
    { id: 'help', label: 'Help & About', icon: 'ℹ️', component: HelpSettings },
  ]

  const currentComponent = computed(() => {
    const tab = tabs.find(t => t.id === currentTabId.value)
    return tab ? tab.component : AccountSettings
  })
</script>

<template>
  <div class="settings-page">
    <h1 class="settings-title">Settings</h1>

    <div class="settings-wrapper">
      <aside class="settings-sidebar">
        <ul class="settings-menu">
          <li
            v-for="tab in tabs"
            :key="tab.id"
            class="menu-item"
            :class="{ active: currentTabId === tab.id }"
            @click="currentTabId = tab.id"
          >
            <span class="icon">{{ tab.icon }}</span> {{ tab.label }}
          </li>
        </ul>
      </aside>

      <main class="settings-content">
        <component :is="currentComponent" />
      </main>
    </div>
  </div>
</template>

<style scoped>

</style>
