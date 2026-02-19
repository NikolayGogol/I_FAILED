<template>
  <div class="settings-section">
    <h2>Notifications</h2>
    <div class="setting-item">
      <label>Email Notifications</label>
      <input type="checkbox" checked />
    </div>
    <div class="setting-item">
      <label>Push Notifications</label>
      <input type="checkbox" />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/components/settings/notifications.scss';
</style>
