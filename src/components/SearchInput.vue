<script setup>
  import dayjs from 'dayjs'
  import { storeToRefs } from 'pinia'
  import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import FormInput from '@/components/FormInput.vue'
  import { useSearchStore } from '@/stores/search'
  import '@/styles/components/SearchInput.scss'

  const router = useRouter()
  const searchStore = useSearchStore()
  const { search, results, loading, opened, error, hasSearchParams } = storeToRefs(searchStore)

  const debounceMs = 350
  const timerId = ref(null)
  const searchContainer = ref(null)
  let isJustFocused = false

  // Computed property to determine if the dropdown should be visible
  const dropdownVisible = computed(() => opened.value && hasSearchParams.value)

  /**
   * Triggers a search after a debounce period.
   */
  function triggerSearch () {
    if (timerId.value) {
      clearTimeout(timerId.value)
    }
    timerId.value = setTimeout(async () => {
      await searchStore.searchPosts()
      if (!opened.value) {
        searchStore.setOpened(true)
      }
    }, debounceMs)
  }

  /**
   * Opens the search dropdown.
   */
  function openDropdown () {
    isJustFocused = true
    searchStore.setOpened(true)
    nextTick(() => {
      isJustFocused = false
    })
  }

  /**
   * Closes the search dropdown.
   */
  function closeDropdown () {
    searchStore.setOpened(false)
  }

  /**
   * Navigates to a post and closes the dropdown.
   * @param {string} postId - The ID of the post to open.
   */
  function openPost (postId) {
    if (!postId) {
      return
    }
    router.push(`/post/${postId}`)
    closeDropdown()
  }

  /**
   * Formats a timestamp into a relative time string.
   * @param {object} time - The timestamp to format.
   * @returns {string} The formatted time string.
   */
  function formatDate (time) {
    if (time?._seconds) {
      return dayjs.unix(time._seconds).fromNow()
    }
    if (time?.seconds) {
      return dayjs.unix(time.seconds).fromNow()
    }
    return ''
  }

  /**
   * Handles clicks outside the search container to close the dropdown.
   * @param {Event} event - The click event.
   */
  function handleClickOutside (event) {
    if (isJustFocused) {
      return
    }
    if (searchContainer.value && !searchContainer.value.contains(event.target)) {
      closeDropdown()
    }
  }

  // Watch for changes in the search query and trigger a search
  watch(
    () => search.value,
    () => {
      if (!hasSearchParams.value) {
        searchStore.resetResults()
        return
      }
      triggerSearch()
    },
  )

  // Add and remove the click outside listener
  onMounted(() => {
    document.addEventListener('click', handleClickOutside)
  })

  onBeforeUnmount(() => {
    if (timerId.value) {
      clearTimeout(timerId.value)
    }
    document.removeEventListener('click', handleClickOutside)
  })
</script>

<template>
  <div ref="searchContainer" class="profile-search">
    <FormInput
      v-model="search"
      autocomplete="off"
      density="compact"
      hide-details
      placeholder="Search posts (title, content, category, tags, user...)"
      prepend-inner-icon="mdi-magnify"
      variant="outlined"
      @focus="openDropdown"
    />

    <div v-if="dropdownVisible" class="search-dropdown">
      <div v-if="loading" class="search-state">Searching...</div>
      <div v-else-if="error" class="search-state search-error">{{ error }}</div>
      <ul v-else-if="results.length > 0" class="search-results">
        <li
          v-for="post in results"
          :key="post.id"
          class="search-item"
          @click="openPost(post.id)"
        >
          <div class="search-item__title">{{ post.title || 'Untitled post' }}</div>
          <div class="search-item__meta">
            <span>{{ post.user?.displayName || post.uid || 'Unknown user' }}</span>
            <span>{{ formatDate(post.createdAt) }}</span>
          </div>
          <div class="search-item__excerpt" v-html="post.whatHappened || ''" />
        </li>
      </ul>
      <div v-else class="search-state">No results found</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.search-item__excerpt {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
