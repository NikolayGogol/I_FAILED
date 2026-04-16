<script setup>
  import { storeToRefs } from 'pinia'
  import { onMounted, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { categories } from '@/models/categories.js'
  import { getIcon } from '@/models/icons.js'
  import { backgroundColors } from '@/models/no-data.js'
  import { useDiscoverStore } from '@/stores/explore/discover.js'
  import { useForYouStore } from '@/stores/feed/forYou.js'

  const store = useForYouStore()
  const { filteredPosts: posts, loading } = storeToRefs(store)
  const discoverStore = useDiscoverStore()
  const peopleRead = ref('')
  const similarPosts = ref([])
  const similarList = ref([])
  const browseList = ref([])
  const loading1 = ref(true)
  const loading2 = ref(true)
  const router = useRouter()
  onMounted(async () => {
    store.fetchPosts({ pageSize: 3, refresh: true })
    const simPost = await discoverStore.fetchSimilarPost()
    similarPosts.value = simPost
    const arr = simPost.map(cat => {
      return {
        id: cat.categoryId,
        label: cat.categoryLabel,
      }
    })
    similarList.value = await discoverStore.countPostByCategory(arr)
    loading1.value = false
    const filteredCategories = categories.filter(el => !arr.some(cat => cat.id === el.id))
    browseList.value = await discoverStore.countPostByCategory(filteredCategories)
    loading2.value = false
  })

  function getRandomColor () {
    const randomIndex = Math.floor(Math.random() * backgroundColors.length)
    return backgroundColors[randomIndex]
  }

  function getInitials (name) {
    if (!name) return ''
    const parts = name.split(' ')
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase()
    }
    return (parts[0].charAt(0) + (parts[1]?.charAt(0) || '')).toUpperCase()
  }

  watch(() => posts.value, val => {
    const text = val.map(el => el.selectedCategories[0].label)
    peopleRead.value = [...new Set(text)].join(', ')
  })
  function goToCategory (item) {
    router.push({ path: '/explore/category', query: {
      id: item.id,
      label: item.label,
      counter: item.count,
    } })
  }
</script>

<template>
  <div class="tab tab-discover">
    <div class="d-flex align-center justify-space-between">
      <h2>Similar to What You've Read</h2>
      <p class="text-description cursor-pointer" @click="$router.push('/explore/similar')">See all</p>
    </div>
    <div class="posts-container">
      <div v-for="post in posts" :key="post.id" class="post">
        <div class="d-flex align-center">
          <div class="d-block ml-6 w-100">
            <div class="d-flex">
              <v-img
                v-if="post.user?.photoURL"
                :alt="post.user?.displayName"
                class="user-avatar"
                cover
                :src="post.user?.photoURL"
              />
              <div v-else class="avatar" :style="{ backgroundColor: getRandomColor() }">
                {{ getInitials(post.user.displayName) }}
              </div>
              <div class="user-info ml-4 w-100">
                <div class="d-flex align-center justify-space-between w-100">
                  <div class="d-flex align-center">
                    <p>{{ post.user.displayName }}</p>
                  </div>
                  <div class="tag">{{ post.selectedCategories[0].label }}</div>
                </div>
              </div>
            </div>
            <div class="title">{{ post.title }}</div>
            <div class="d-flex footer-panel">
              <div class="d-flex">
                <div class="d-flex mr-2" v-html="getIcon('mark', 20, 20)" />
                <span>{{ post.bookmarks || 0 }} saves</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
    <v-progress-linear v-if="loading" class="mt-9" color="primary" indeterminate />
    <h2 class="my-6">People who read "{{ peopleRead }}" failures also viewed</h2>
    <v-progress-linear v-if="loading1" class="mt-9" color="primary" indeterminate />
    <div v-else-if="!loading1 && similarList.length > 0" class="similar-posts">
      <ul>
        <li
          v-for="item in similarList"
          :key="item.id"
          class="d-flex align-center justify-space-between cursor-pointer"
          @click="goToCategory(item)"
        >
          <div class="d-flex">
            <div class="d-flex icon mr-4" v-html="getIcon('clipboard')" />
            <div class="d-block">
              <div class="title font-weight-semibold">{{ item.label }}</div>
              <div class="text-description">{{ item.count || 0 }} stories</div>
            </div>
          </div>
          <v-icon icon="mdi-chevron-right" />
        </li>
      </ul>
    </div>
    <div v-else class="text-center my-10">Nothing to show</div>
    <h2 class="my-6">Browse by Category</h2>
    <v-progress-linear v-if="loading2" class="mt-9" color="primary" indeterminate />
    <v-row v-else-if="!loading2 && browseList.length > 0">
      <v-col v-for="cat in browseList" :key="cat.id" sm="4">
        <div class="d-flex browse-block flex-column align-center cursor-pointer" @click="goToCategory(cat)">
          <div class="icon d-flex mb-4" v-html="getIcon(cat.id)" />
          <h4 class="mb-2">{{ cat.label }}</h4>
          <p class="text-description">{{ cat.count }} posts</p>
        </div>
      </v-col>
    </v-row>
    <div v-else class="text-center my-10">Nothing to show</div>
  </div>
</template>
