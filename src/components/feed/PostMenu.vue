<script setup>
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useToast } from 'vue-toastification'
  import { useDisplay } from 'vuetify/framework'
  import { getIcon } from '@/models/icons.js'
  import { useAuthStore } from '@/stores/auth.js'
  import { usePostMenuStore } from '@/stores/post-menu.js'
  import '@/styles/components/feed/post-menu.scss'
  const { smAndDown } = useDisplay()

  const props = defineProps({
    post: {
      type: Object,
      required: true,
    },
  })

  const authStore = useAuthStore()
  const postMenuStore = usePostMenuStore()
  const router = useRouter()
  const toast = useToast()
  const mobileDrawer = ref(false)
  const showBlockDialog = ref(false)
  const isBlocking = ref(false)

  const isFollowing = computed(() => {
    if (!authStore.user || !authStore.user.following) return false
    return authStore.user.following.includes(props.post.uid)
  })

  const isBlocked = computed(() => {
    if (!authStore.user || !authStore.user.blockedUsers) return false
    return authStore.user.blockedUsers.includes(props.post.uid)
  })

  async function handleMutePost () {
    if (!authStore.user) {
      await router.push('/login')
      return
    }
    const success = await postMenuStore.mutePost(props.post.id)
    if (success) {
      toast.info('Post muted')
    } else {
      toast.error('Failed to mute post')
    }
  }

  async function handleFollow () {
    if (!authStore.user) {
      await router.push('/login')
      return
    }
    const userId = props.post.uid
    const userName = props.post.user.displayName

    if (isFollowing.value) {
      const success = await postMenuStore.unfollowUser(userId)
      if (success) {
        toast.info(`Unfollowed ${userName}`)
      } else {
        toast.error(`Failed to unfollow ${userName}`)
      }
    } else {
      const success = await postMenuStore.followUser(userId)
      if (success) {
        toast.info(`Following ${userName}`)
      } else {
        toast.error(`Failed to follow ${userName}`)
      }
    }
  }

  function handleBlock () {
    showBlockDialog.value = true
  }

  async function confirmBlock () {
    if (!authStore.user) {
      await router.push('/login')
      return
    }
    isBlocking.value = true
    const userId = props.post.uid
    const userName = props.post.user.displayName

    const success = await postMenuStore.blockUser(userId)
    if (success) {
      toast.info('User blocked, and you will no longer see their posts')
      showBlockDialog.value = false
    } else {
      toast.error(`Failed to block ${userName}`)
    }
    isBlocking.value = false
  }

  async function handleUnblock () {
    if (!authStore.user) {
      await router.push('/login')
      return
    }
    const userId = props.post.uid
    const userName = props.post.user.displayName

    const success = await postMenuStore.unblockUser(userId)
    if (success) {
      toast.info(`Unblocked ${userName}`)
    } else {
      toast.error(`Failed to unblock ${userName}`)
    }
  }
</script>

<template>
  <div v-if="!smAndDown">
    <v-menu v-if="!post?.isAnonymous" open-on-hover>
      <template #activator="{ props: menuProps }">
        <v-btn icon size="small" v-bind="menuProps" variant="text">
          <v-icon>mdi-dots-horizontal</v-icon>
        </v-btn>
      </template>
      <v-list class="rounded-xl elevation-1">
        <v-list-item class="cursor-pointer" @click="handleMutePost">
          <div class="mr-2" v-html="getIcon('mute')" />
          Hide this post
        </v-list-item>

        <template v-if="!isBlocked">
          <v-list-item class="cursor-pointer" @click="handleFollow">
            <v-icon class="mr-2" :icon="isFollowing ? 'mdi-account-minus-outline' : 'mdi-account-plus-outline'" />
            {{ isFollowing ? 'Unfollow' : 'Follow' }} @{{ post.user.displayName.replaceAll(' ', '_') }}
          </v-list-item>
          <v-list-item class="cursor-pointer text-danger" @click="handleBlock">
            <v-icon class="mr-2" icon="mdi-block-helper" />
            Block this user
          </v-list-item>
        </template>

        <template v-else>
          <v-list-item class="cursor-pointer text-danger" @click="handleUnblock">
            <v-icon class="mr-2" icon="mdi-account-off-outline" />
            Unblock this user
          </v-list-item>
        </template>
      </v-list>
    </v-menu>
  </div>
  <div v-else>
    <v-btn
      v-if="!post?.isAnonymous"
      icon
      size="small"
      variant="text"
      @click="mobileDrawer = true"
    >
      <v-icon>mdi-dots-horizontal</v-icon>
    </v-btn>
  </div>
  <MobileSlide v-model="mobileDrawer">
    <v-list class="rounded-lg">
      <v-list-item class="cursor-pointer" @click="handleMutePost">
        <v-icon class="mr-2" icon="mdi-volume-off" />
        Hide this post
      </v-list-item>

      <template v-if="!isBlocked">
        <v-list-item class="cursor-pointer" @click="handleFollow">
          <v-icon class="mr-2" :icon="isFollowing ? 'mdi-account-minus-outline' : 'mdi-account-plus-outline'" />
          {{ isFollowing ? 'Unfollow' : 'Follow' }} @{{ post.user.displayName.replaceAll(' ', '_') }}
        </v-list-item>
        <v-list-item class="cursor-pointer text-danger" @click="handleBlock">
          <v-icon class="mr-2" icon="mdi-block-helper" />
          Block this user
        </v-list-item>
      </template>

      <template v-else>
        <v-list-item class="cursor-pointer text-danger" @click="handleUnblock">
          <v-icon class="mr-2" icon="mdi-account-off-outline" />
          Unblock this user
        </v-list-item>
      </template>
    </v-list>
  </MobileSlide>
  <v-dialog v-model="showBlockDialog" max-width="480">
    <div class="bg-white rounded-lg py-6 px-6">
      <h6 class="text-h6 text-center">Block @{{ post.user.displayName }}?</h6>
      <p class="text-description mt-3">
        They will be able to see your public posts, but will no longer be able to engage with them.
        @{{ post.user.displayName }} will also not be able to follow or message you, and you will not see
        notifications from them.
      </p>
      <v-row class="mt-3">
        <v-col>
          <div class="cancel-btn" @click="showBlockDialog = false">Cancel</div>
        </v-col>
        <v-col>
          <div class="submit-btn" :disabled="isBlocking" @click="confirmBlock">
            <v-progress-circular
              v-if="isBlocking"
              class="mr-2"
              indeterminate
              size="20"
              width="2"
            />
            <span v-else>Block</span>
          </div>
        </v-col>
      </v-row>
    </div>
  </v-dialog>
</template>
<style scoped lang="scss">
:deep(.v-list-item__content) {
  display: flex;
  align-items: center;
}
</style>
