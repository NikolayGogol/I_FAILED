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
  import { getIcon } from '@/models/icons.js'
  import '@/styles/pages/settings.scss'

  const currentTabId = ref('account')

  const tabs = [
    {
      id: 'account',
      label: 'Account',
      icon: getIcon('account', 20, 20),
      component: AccountSettings,
    },
    {
      id: 'privacy',
      label: 'Privacy & Visibility',
      icon: getIcon('lock', 20, 20),
      component: PrivacySettings,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: getIcon('bell', 20, 20),
      component: NotificationSettings,
    },
    {
      id: 'content',
      label: 'Content & Activity',
      icon: getIcon('content', 20, 20),
      component: ContentSettings,
    },
    {
      id: 'security',
      label: 'Data & Security',
      icon: getIcon('protect', 20, 20),
      component: SecuritySettings,
    },
    {
      id: 'premium',
      label: 'Premium',
      icon: getIcon('premium', 20, 20),
      component: PremiumSettings,
    },
    {
      id: 'help',
      label: 'Help & About',
      icon: getIcon('help', 20, 20),
      component: HelpSettings,
    },
  ]

  const currentComponent = computed(() => {
    const tab = tabs.find(t => t.id === currentTabId.value)
    return tab ? tab.component : AccountSettings
  })
</script>

<template>
  <div class="settings-page">
    <div class="settings-title">
      <v-icon class="cursor-pointer" icon="mdi-arrow-left" @click="$router.go(-1)" />
      <h1 class="font-weight-bold text-grey-darken-3 ml-3 ml-sm-0">Settings</h1>
    </div>
    <div class="settings-wrapper">
      <v-row>
        <v-col sm="4">
          <aside class="settings-sidebar">
            <ul class="settings-menu">
              <li
                v-for="tab in tabs"
                :key="tab.id"
                class="menu-item d-flex align-center"
                :class="{ active: currentTabId === tab.id }"
                @click="currentTabId = tab.id"
              >
                <div class="icon d-flex mr-2" v-html="tab.icon" />
                {{ tab.label }}
              </li>
            </ul>
          </aside>
        </v-col>
        <v-col class="border-left" sm="8">
          <main class="settings-content">
            <component :is="currentComponent" />
          </main>
        </v-col>
      </v-row>

    </div>
  </div>
</template>

<style scoped>

</style>
