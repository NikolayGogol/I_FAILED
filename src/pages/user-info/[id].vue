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
  import { onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import PostCard from '@/components/feed/PostCard.vue'
  import Activity from '@/components/profile/Activity.vue'
  import UserCard from '@/components/profile/UserCard.vue'
  import { useUserInfoStore } from '@/stores/user-info.js'
  import '@/styles/pages/profile.scss'

  const userInfoStore = useUserInfoStore()
  const route = useRoute()

  const { posts, loading, error, user, userActivity } = storeToRefs(userInfoStore)
  const activeTabIndex = ref(0)
  const userId = route.params.id

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
</script>

<template>
  <div class="profile-page">
    <section class="profile-main">
      <UserCard :activity="userActivity" :user="user" />

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
  </div>
</template>
