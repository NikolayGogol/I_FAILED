<script setup>
  import { onMounted, ref } from 'vue'
  import PostCard from '@/components/feed/PostCard.vue'
  import { useHiddenPostsStore } from '@/stores/hidden-posts'
  //
  const emit = defineEmits(['back'])
  const hiddenPostsStore = useHiddenPostsStore()
  const isLoading = ref(false)
  const posts = ref([])
  //
  onMounted(() => {
    getData()
  })
  //
  function getData () {
    isLoading.value = true
    hiddenPostsStore.getHiddenPosts()
      .then(res => {
        posts.value = res || []
      })
      .finally(() => {
        isLoading.value = false
      })
  }
</script>

<template>
  <div class="notify-tab">
    <div class="d-flex tab-header" @click="emit('back')">
      <v-icon class="mr-6" icon="mdi-chevron-left" />
      <span>Hidden posts</span>
    </div>
    <v-progress-linear v-if="isLoading" class="mt-9" color="primary" indeterminate />
    <div v-else class="mt-6">
      <template v-if="posts.length > 0">
        <PostCard
          v-for="post in posts"
          :key="post.id"
          :enable-muted="true"
          :post="post"
        />
      </template>
      <div v-else class="d-flex justify-center mt-6">No hidden posts</div>
    </div>
  </div>
</template>
