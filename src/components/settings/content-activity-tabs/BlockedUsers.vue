<script setup>
  import { onMounted } from 'vue'
  import { useBlockedUsersStore } from '@/stores/blocked-users.js'

  const emit = defineEmits(['back'])
  const blockedUsersStore = useBlockedUsersStore()

  onMounted(() => {
    blockedUsersStore.getBlockedUsers()
      .then(res => {
        console.log(res)
      })
  })
</script>

<template>
  <div class="notify-tab">
    <div class="d-flex tab-header" @click="emit('back')">
      <v-icon class="mr-6" icon="mdi-chevron-left" />
      <span>Blocked users</span>
    </div>
    <p class="text-description">When you block someone, they won't be able to see your posts, follow you, or message you. You also won't see notifications from them.
      <a class="text-primary font-weight-semibold" href="#">Learn more</a></p>
  </div>
</template>
