<route lang="json">
{
"meta": {
"layout": "MainLayout",
"auth": true
}
}
</route>

<script setup>
  import { storeToRefs } from 'pinia'
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { useToast } from 'vue-toastification'
  import PostCard from '@/components/feed/PostCard.vue'
  import AboutAccountModal from '@/components/profile/AboutAccountModal.vue'
  import Activity from '@/components/profile/Activity.vue'
  import UserCard from '@/components/profile/UserCard.vue'
  import { useAuthStore } from '@/stores/auth.js'
  import { useProfileStore } from '@/stores/profile.js'
  import { useUserInfoStore } from '@/stores/user-info.js'
  import '@/styles/pages/profile.scss'

  const userInfoStore = useUserInfoStore()
  const authStore = useAuthStore()
  const profileStore = useProfileStore()
  const route = useRoute()
  const toast = useToast()

  const { posts, loading, error, user, userActivity } = storeToRefs(userInfoStore)
  const { user: authUser } = storeToRefs(authStore)
  const activeTabIndex = ref(0)
  const userId = route.params.id
  const aboutDialog = ref(false)

  const isCurrentUser = computed(() => authUser.value?.uid === userId)
  const isFollowing = computed(() => {
    return authUser.value?.following?.includes(userId)
  })

  async function toggleFollow () {
    await (isFollowing.value ? profileStore.unfollowUser(userId) : profileStore.followUser(userId))
    await userInfoStore.fetchUser(userId)
    toast.info(isFollowing.value ? `Followed ${user.value.displayName}` : `Unfollowed ${user.value.displayName}`)
  }

  function copyProfileLink () {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied to clipboard')
    })
  }

  function blockUser () {
    toast.info('Block user functionality coming soon')
  }

  function aboutAccount () {
    aboutDialog.value = true
  }

  onMounted(() => {
    if (userId) {
      userInfoStore.fetchUser(userId)
      userInfoStore.fetchUserPosts(userId)
      userInfoStore.fetchUserActivity(userId)
    }
  })

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

  watch(() => route.params.id, id => {
    userInfoStore.fetchUser(id)
    userInfoStore.fetchUserPosts(id)
    userInfoStore.fetchUserActivity(id)
  })
</script>

<template>
  <div class="profile-page">
    <section class="profile-main">
      <UserCard :activity="userActivity" :user="user">
        <template #profile-actions>
          <div class="d-flex align-center">
            <button
              v-if="!isCurrentUser"
              class="cancel-btn mr-2"
              @click="toggleFollow"
            >
              {{ isFollowing ? 'Unfollow' : 'Follow' }}
            </button>

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
                <v-list-item v-if="!isCurrentUser" class="text-error" @click="blockUser">
                  <v-list-item-title>
                    <v-icon class="mr-2" icon="mdi-block-helper" />
                    Block this user
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </template>
      </UserCard>

      <div class="content-feed">
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
        <activity v-if="activeTabIndex === 1" :user-id="userId" />
      </div>
    </section>
    <AboutAccountModal v-model="aboutDialog" :user="user" />
  </div>
</template>
