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
          createPostStore.title = res.title
          createPostStore.whatHappened = res.whatHappened
          createPostStore.selectedCategories = res.selectedCategories
          createPostStore.isAnonymous = res.isAnonymous
          createPostStore.visibility = res.visibility
          createPostStore.allowComments = res.allowComments
          createPostStore.enableTriggerWarning = res.enableTriggerWarning
          // UI controls this via DatePicker => expects a JS Date (or null).
          const toJsDate = value => {
            if (!value) return null
            if (value instanceof Date) return value
            if (typeof value?.toDate === 'function') return value.toDate()
            if (typeof value?.seconds === 'number') {
              const secondsMs = value.seconds * 1000
              const nanosMs = (value.nanoseconds ?? 0) / 1e6
              return new Date(secondsMs + nanosMs)
            }
            const d = new Date(value)
            return Number.isNaN(d.getTime()) ? null : d
          }

          createPostStore.scheduleDate = toJsDate(res.scheduledAt)
          createPostStore.scheduledAt = res.scheduledAt
          // `UploadFile` preview understands `File` objects or an object with `url`.
          // Firestore returns `{ thumb: stringUrl, full: stringUrl, name }`,
          // so we add `url` for preview without touching the stored values.
          createPostStore.images = (res.images || []).map(img => {
            if (typeof img === 'string') return img
            if (!img || typeof img !== 'object') return img

            const thumbUrl = img.thumb
            const fullUrl = img.full

            return {
              ...img,
              url: thumbUrl || fullUrl,
            }
          })
          createPostStore.whatWentWrong = res.whatWentWrong
          createPostStore.howDidItFeel = res.howDidItFeel
          createPostStore.whenHappened = toJsDate(res.whenHappened)
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
