<script setup>
  import { onMounted, ref } from 'vue'
  import { useToast } from 'vue-toastification'
  import { backgroundColors } from '@/models/no-data.js'
  import { useBlockedUsersStore } from '@/stores/blocked-users.js'
  import { usePostMenuStore } from '@/stores/profile/post-menu.js'
  import { transformUsername } from '@/utils/transform-username.js'

  const emit = defineEmits(['back'])
  const blockedUsersStore = useBlockedUsersStore()
  const postMenuStore = usePostMenuStore()
  const toast = useToast()

  const isLoading = ref(true)
  const userList = ref([])
  const unblockingUserId = ref(null)

  onMounted(() => {
    blockedUsersStore.getBlockedUsers()
      .then(res => {
        userList.value = res || []
      })
      .finally(() => {
        isLoading.value = false
      })
  })

  async function unblock (userId) {
    unblockingUserId.value = userId
    const success = await postMenuStore.unblockUser(userId)
    if (success) {
      // Remove user from the local list
      const index = userList.value.findIndex(u => u.id === userId)
      if (index !== -1) {
        userList.value.splice(index, 1)
      }
      toast.info('User unblocked')
    } else {
      toast.error('Failed to unblock user')
    }
    unblockingUserId.value = null
  }

  function getInitials (name) {
    if (!name) return ''
    const parts = name.split(' ')
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase()
    }
    return (parts[0].charAt(0) + (parts[1]?.charAt(0) || '')).toUpperCase()
  }

  function getRandomColor () {
    const randomIndex = Math.floor(Math.random() * backgroundColors.length)
    return backgroundColors[randomIndex]
  }
</script>

<template>
  <div class="notify-tab blocked-users-tab">
    <div class="d-flex tab-header" @click="emit('back')">
      <v-icon class="mr-6" icon="mdi-chevron-left" />
      <span>Blocked users</span>
    </div>
    <p class="text-description">When you block someone, they won't be able to see your posts, follow you, or message you. You also won't see notifications from them.
      <a class="text-primary font-weight-semibold" href="#">Learn more</a></p>
    <v-progress-linear v-if="isLoading" class="mt-9" color="primary" indeterminate />
    <div v-else class="user-list mt-6">
      <template v-if="userList.length > 0">
        <ul>
          <li v-for="user in userList" :key="user.id" class="flex-column align-start">
            <div class="d-flex justify-space-between w-100">
              <div class="d-flex">
                <div class="avatar mr-3">
                  <v-img v-if="user.photoURL" :alt="user.displayName" :src="user.photoURL" />
                  <div v-else class="name-initials" :style="{ backgroundColor: getRandomColor() }">{{ getInitials(user.displayName) }}</div>
                </div>
                <div class="user-info">
                  <p class="user-name">{{ user.displayName }}</p>
                  <p class="text-description fs-12">{{ transformUsername(user.userName, user.displayName) }}</p>
                </div>
              </div>
              <div
                class="cancel-btn"
                @click="unblock(user.id)"
              >
                <v-progress-circular
                  v-if="unblockingUserId === user.id"
                  color="primary"
                  indeterminate
                  size="20"
                  width="2"
                />
                <span v-else>Unmute</span>
              </div>
            </div>
            <p class="fs-12 mt-2">Cloud computing expert. Sharing insights on data security.</p>
          </li>
        </ul>
      </template>
      <div v-else class="d-flex justify-center mt-6">No Blocked users</div>
    </div>
  </div>
</template>
