<template>
  <div class="settings-section">
    <h2>Privacy & Visibility</h2>
    <div class="setting-item">
      <label>Profile Visibility</label>
      <select>
        <option>Public</option>
        <option>Private</option>
      </select>
    </div>
    <div class="setting-item">
      <label>Search Engine Indexing</label>
      <input checked type="checkbox">
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/components/settings/privacy.scss';
</style>
