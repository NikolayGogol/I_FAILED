<script setup>
  import { computed, onMounted, ref } from 'vue'
  import { useToast } from 'vue-toastification'
  import { useAuthStore } from '@/stores/auth'
  import { usePopularTagsStore } from '@/stores/popular-tags'
  import '@/styles/components/sidebars/popular-tags.scss'

  const popularTagsStore = usePopularTagsStore()
  const authStore = useAuthStore()
  const toast = useToast()

  const footerLink = [
    {
      label: 'Terms of Service',
      path: '#',
    },
    {
      label: 'Privacy Policy',
      path: '#',
    },
    {
      label: 'Accessibility',
      path: '#',
    },
    {
      label: 'Cookie Policy',
      path: '#',
    },
    {
      label: 'Ads',
      path: '#',
    },
    {
      label: 'More',
      path: '#',
    },
  ]

  const displayLimit = ref(4)

  // Computed property to get the tags to display based on the display limit
  const visibleTags = computed(() => {
    return popularTagsStore.allTags.slice(0, displayLimit.value)
  })

  // Computed property to check if there are more tags to show
  const hasMoreTags = computed(() => {
    return popularTagsStore.allTags.length > displayLimit.value
  })

  // Function to increase the display limit of tags
  function showMoreTags () {
    displayLimit.value += 5
  }

  /**
   * Toggles the user's interest in a tag.
   * @param {string} tag - The tag to toggle interest in.
   */
  async function handleInterestToggle (tag) {
    const result = await popularTagsStore.toggleInterestInTag(tag)
    if (result.success) {
      toast.info(result.message)
    } else {
      toast.error(result.message)
    }
  }

  /**
   * Toggles following a tag for the current user.
   * @param {string} tag - The tag to follow or unfollow.
   */
  async function handleFollowTag (tag) {
    const result = await popularTagsStore.followTag(tag)
    if (result.success) {
      if (result.following) {
        toast.success(result.message)
      } else {
        toast.info(result.message)
      }
    } else {
      toast.error(result.message)
    }
  }

  /**
   * Checks if the current user is following a tag.
   * @param {string} tag - The tag to check.
   * @returns {boolean} True if the user is following the tag, false otherwise.
   */
  function isFollowing (tag) {
    return authStore.user?.followedTags?.includes(tag)
  }

  /**
   * Checks if the current user is not interested in a tag.
   * @param {string} tag - The tag to check.
   * @returns {boolean} True if the user is not interested in the tag, false otherwise.
   */
  function isNotInterested (tag) {
    return authStore.user?.notInterestedTags?.includes(tag)
  }

  // Fetch popular tags when the component is mounted
  onMounted(() => {
    popularTagsStore.getPopularTags()
  })
</script>

<template>
  <section class="right-card popular-card">
    <header class="right-card-header">
      <h3 class="font-weight-semibold">Popular now</h3>
    </header>
    <div
      v-for="tag in visibleTags"
      :key="tag"
      class="popular-row"
    >
      <span
        class="popular-tag"
        :class="[
          {'text-primary': isFollowing(tag)},
          {'text-warning': isNotInterested(tag)},
        ]"
      >#{{ tag }}</span>
      <v-spacer />
      <v-menu open-on-hover>
        <template #activator="{ props }">
          <v-btn icon size="small" variant="text" v-bind="props">
            <v-icon>mdi-dots-horizontal</v-icon>
          </v-btn>
        </template>
        <v-list class="rounded-xl elevation-1">
          <v-list-item class="cursor-pointer" @click="handleInterestToggle(tag)">
            <v-list-item-title>
              <v-icon :icon="isNotInterested(tag) ? 'mdi-emoticon-happy-outline' : 'mdi-emoticon-sad-outline'" />
              {{ isNotInterested(tag) ? 'Interested in this topic' : 'Not interested in this topic' }}
            </v-list-item-title>
          </v-list-item>
          <v-list-item class="cursor-pointer" @click="handleFollowTag(tag)">
            <v-list-item-title v-if="isFollowing(tag)">
              <v-icon icon="mdi-minus" />
              Unfollow tag
            </v-list-item-title>
            <v-list-item-title v-else>
              <v-icon icon="mdi-plus" />
              Follow tag
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <!-- Show More Button -->
    <div v-if="hasMoreTags" class="mt-2">
      <div
        class="text-decoration-underline px-0 font-weight-semibold cursor-pointer"
        style="font-size: 14px;"
        @click="showMoreTags"
      >
        Show more
      </div>
    </div>
  </section>
  <div class="footer-link py-2">
    <div v-for="(nav, index) in footerLink" :key="index" class="px-2 py-1">
      <router-link :to="nav.path">{{ nav.label }}</router-link>
    </div>
  </div>
</template>
