<route lang="json">
{
  "meta": {
    "layout": "MainLayout",
    "auth": true
  }
}
</route>
<script setup>
  import { onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import CreatePost from '@/pages/create-post.vue'
  import { useCreatePostStore } from '@/stores/create-post.js'
  import { useSinglePostStore } from '@/stores/single-post/single-post.js'
  //
  const route = useRoute()
  const singlePostStore = useSinglePostStore()
  const createPostStore = useCreatePostStore()
  //
  onMounted(() => {
    const id = route.params.id
    if (id) {
      singlePostStore.getPostById(id)
        .then(res => {
          console.log(res)
          createPostStore.title = res.title
          createPostStore.whatHappened = res.whatHappened
          createPostStore.selectedCategories = res.selectedCategories
          createPostStore.isAnonymous = res.isAnonymous
          createPostStore.visibility = res.visibility
          createPostStore.allowComments = res.allowComments
          createPostStore.enableTriggerWarning = res.enableTriggerWarning
          createPostStore.scheduledAt = res.scheduledAt
          createPostStore.images = res.images
          createPostStore.whatWentWrong = res.whatWentWrong
          createPostStore.howDidItFeel = res.howDidItFeel
          createPostStore.whenHappened = new Date(res.whenHappened.nanoseconds)
          createPostStore.emotionTags = res.emotionTags
          createPostStore.tags = res.tags
          if (res.enableTriggerWarning) {
            createPostStore.triggerTags = res.triggerTags
          }
        })
    }
  })
</script>

<template>
  <CreatePost />
</template>

<style scoped lang="scss">

</style>
