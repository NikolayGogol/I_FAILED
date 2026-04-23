<route lang="json">
{
  "meta": {
    "layout": "MainLayout"
  }
}
</route>

<script setup>
  // =================================================================================================
  // Imports
  // =================================================================================================
  import { storeToRefs } from 'pinia'
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from 'vue-toastification'
  import PostCard from '@/components/feed/PostCard.vue'
  import AboutAccountModal from '@/components/profile/AboutAccountModal.vue'
  import Activity from '@/components/profile/Activity.vue'
  import UserCard from '@/components/profile/UserCard.vue'
  import { useAuthStore } from '@/stores/auth.js'
  import { usePostMenuStore } from '@/stores/profile/post-menu.js'
  import { useProfileStore } from '@/stores/profile/profile.js'
  import { useUserInfoStore } from '@/stores/user-info.js'
  import '@/styles/pages/profile.scss'

  // =================================================================================================
  // Stores & Hooks
  // =================================================================================================
  const userInfoStore = useUserInfoStore()
  const authStore = useAuthStore()
  const profileStore = useProfileStore()
  const postMenuStore = usePostMenuStore()
  const route = useRoute()
  const router = useRouter()
  const toast = useToast()
  const isMobileAction = ref(false)
  // =================================================================================================
  // State
  // =================================================================================================
  const { posts, loading, error, user, userActivity } = storeToRefs(userInfoStore)
  const { user: authUser } = storeToRefs(authStore)
  const activeTabIndex = ref(0)
  const userId = computed(() => route.params.id)
  const aboutDialog = ref(false)

  // =================================================================================================
  // Computed Properties
  // =================================================================================================
  // Filter out anonymous posts from the user's activity
  const filteredActivity = computed(() => {
    if (!userActivity.value) return null
    const filteredPosts = posts.value.filter(post => !post.isAnonymous)
    return {
      ...userActivity.value,
      posts: filteredPosts.length,
    }
  })

  // Check if the currently viewed profile belongs to the authenticated user
  const isCurrentUser = computed(() => authUser.value?.uid === userId.value)

  // Check if the authenticated user is following the currently viewed user
  const isFollowing = computed(() => {
    return authUser.value?.following?.includes(userId.value)
  })

  const isBlocked = computed(() => {
    if (!authStore.user || !authStore.user.blockedUsers) return false
    return authStore.user.blockedUsers.includes(userId.value)
  })

  // =================================================================================================
  // Functions
  // =================================================================================================
  // Toggle the follow state for the currently viewed user
  async function toggleFollow () {
    if (!authStore.user) {
      await router.push('/login')
      return
    }

    if (isFollowing.value) {
      await profileStore.unfollowUser(userId.value)
      toast.info(`Unfollowed ${user.value.displayName}`)
    } else {
      const success = await profileStore.followUser(userId.value)
      if (success === false) {
        toast.error(`Failed to follow ${user.value.displayName}`)
      } else {
        toast.info(`Followed ${user.value.displayName}`)
      }
    }
    await userInfoStore.fetchUser(userId.value)
  }

  // Copy the user's profile link to the clipboard
  function copyProfileLink () {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied to clipboard')
    })
  }

  // Placeholder for blocking a user
  async function toggleBlockUser () {
    if (!authStore.user) {
      await router.push('/login')
      return
    }

    if (isBlocked.value) {
      const success = await postMenuStore.unblockUser(userId.value)
      if (success) {
        toast.info(`Unblocked ${user.value.displayName}`)
      } else {
        toast.error(`Failed to unblock ${user.value.displayName}`)
      }
    } else {
      const success = await postMenuStore.blockUser(userId.value)
      if (success) {
        toast.info(`Blocked ${user.value.displayName}`)
      } else {
        toast.error(`Failed to block ${user.value.displayName}`)
      }
    }
  }

  // Open the "About this account-tabs" dialog
  function aboutAccount () {
    aboutDialog.value = true
    isMobileAction.value = false
  }

  // =================================================================================================
  // Lifecycle Hooks
  // =================================================================================================
  // Fetch user data when the component is mounted
  onMounted(() => {
    if (userId.value) {
      userInfoStore.fetchUser(userId.value)
        .then(res => {
          smartRedirect(res.isPrivate)
        })
      userInfoStore.fetchUserPosts(userId.value)
      userInfoStore.fetchUserActivity(userId.value)
    }
  })

  // Watch for changes in the route params and refetch user data
  watch(() => route.params.id, id => {
    userInfoStore.fetchUser(id)
      .then(res => {
        smartRedirect(res.isPrivate)
      })
    userInfoStore.fetchUserPosts(id)
    userInfoStore.fetchUserActivity(id)
  })

  function smartRedirect (isPrivate) {
    if (!authUser.value.uid && isPrivate) {
      router.push('/')
    } else if (isPrivate && !isFollowing.value) {
      router.push('/')
    }
  }
  // =================================================================================================
  // Tab Navigation
  // =================================================================================================
  const tabsList = [
    {
      label: 'Posts',
    },
    {
      label: 'Activity',
    },
  ]

  function selectTab (tab, index) {
    activeTabIndex.value = index
  }
</script>

<template>
  <div class="profile-page">
    <section class="profile-main">
      <!-- User information card -->
      <UserCard :activity="filteredActivity" :user="user">
        <template #profile-actions>
          <div class="d-flex align-center">
            <!-- Follow/Unfollow button -->
            <button
              v-if="!isCurrentUser"
              class="cancel-btn mr-2"
              @click="toggleFollow"
            >
              {{ isFollowing ? 'Unfollow' : 'Follow' }}
            </button>

            <!-- More options menu -->
            <v-menu location="bottom end" open-on-hover>
              <template #activator="{ props }">
                <v-btn
                  class="border rounded-lg"
                  icon="mdi-dots-horizontal"
                  size="small"
                  variant="text"
                  v-bind="props"
                />
              </template>
              <v-list>
                <v-list-item @click="aboutAccount">
                  <v-list-item-title>
                    <v-icon class="mr-2" icon="mdi-information-outline" />
                    About this account
                  </v-list-item-title>
                </v-list-item>
                <v-list-item @click="copyProfileLink">
                  <v-list-item-title>
                    <v-icon class="mr-2" icon="mdi-paperclip" />
                    Copy link to profile
                  </v-list-item-title>
                </v-list-item>
                <v-list-item v-if="!isCurrentUser" class="text-error" @click="toggleBlockUser">
                  <v-list-item-title>
                    <v-icon class="mr-2" icon="mdi-block-helper" />
                    {{ isBlocked ? 'Unblock this user' : 'Block this user' }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </template>
        <template #follow-action>
          <button
            v-if="!isCurrentUser"
            class="cancel-btn mt-3 mr-2 w-50"
            @click="toggleFollow"
          >
            {{ isFollowing ? 'Unfollow' : 'Follow' }}
          </button>
        </template>
        <template #dropdown-actions>
          <v-btn
            class="border rounded-lg"
            icon="mdi-dots-horizontal"
            size="small"
            variant="text"
            @click="isMobileAction = true"
          />
        </template>
      </UserCard>

      <!-- User's content feed -->
      <div class="content-feed">
        <!-- Tabs for posts and activity -->
        <nav class="user-tabs">
          <button
            v-for="(item, index) in tabsList"
            :key="item.label"
            class="tab-item"
            :class="{ active: activeTabIndex === index }"
            @click="selectTab(item, index)"
          >{{ item.label }} <span v-if="!index">({{ posts?.length }})</span>
          </button>
        </nav>
        <!-- Posts tab content -->
        <template v-if="activeTabIndex === 0">
          <div v-if="loading" class="text-center py-10">
            <v-progress-circular color="primary" indeterminate />
          </div>
          <div v-else-if="error" class="text-center py-10 text-error">
            {{ error }}
          </div>
          <div v-else-if="posts.length === 0" class="text-center py-10 text-medium-emphasis">
            This user hasn't posted anything yet.
          </div>
          <div v-else class="profile-posts">
            <PostCard
              v-for="post in posts"
              :key="post.id"
              :post="post"
            />
          </div>
        </template>
        <!-- Activity tab content -->
        <activity v-if="activeTabIndex === 1" :user-id="userId" />
      </div>
    </section>
    <!-- "About this account-tabs" modal -->
    <AboutAccountModal v-model="aboutDialog" :user="user" />
    <MobileSlide v-model="isMobileAction">
      <v-list>
        <v-list-item @click="aboutAccount">
          <v-list-item-title>
            <v-icon class="mr-2" icon="mdi-information-outline" />
            About this account
          </v-list-item-title>
        </v-list-item>
        <v-list-item @click="copyProfileLink">
          <v-list-item-title>
            <v-icon class="mr-2" icon="mdi-paperclip" />
            Copy link to profile
          </v-list-item-title>
        </v-list-item>
        <v-list-item v-if="!isCurrentUser" class="text-error" @click="toggleBlockUser">
          <v-list-item-title>
            <v-icon class="mr-2" icon="mdi-block-helper" />
            {{ isBlocked ? 'Unblock this user' : 'Block this user' }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </MobileSlide>
  </div>
</template>
