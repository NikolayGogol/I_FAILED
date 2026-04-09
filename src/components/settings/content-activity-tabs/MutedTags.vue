<script setup>
  import { onMounted, ref } from 'vue'
  import { useToast } from 'vue-toastification'
  import { useMutedTagsStore } from '@/stores/mutedTags.js'
  import { usePopularTagsStore } from '@/stores/popular-tags.js'

  const mutedTagsStore = useMutedTagsStore()
  const emit = defineEmits(['back'])
  const tagsList = ref([])
  const isLoading = ref(true)
  const popularTagsStore = usePopularTagsStore()
  const toast = useToast()
  //
  onMounted(() => {
    getData()
  })
  function getData () {
    mutedTagsStore.getMutedTags()
      .then(res => {
        tagsList.value = res || []
      })
      .finally(() => {
        isLoading.value = false
      })
  }
  async function handleInterestToggle (tag) {
    const result = await popularTagsStore.toggleInterestInTag(tag)
    if (result.success) {
      toast.info(result.message)
      getData()
    } else {
      toast.error(result.message)
    }
  }

</script>

<template>
  <div class="notify-tab muted-tags">
    <div class="d-flex tab-header" @click="emit('back')">
      <v-icon class="mr-6" icon="mdi-chevron-left" />
      <span>Muted tags</span>
    </div>
    <v-progress-linear v-if="isLoading" class="mt-9" color="primary" indeterminate />
    <div v-else class="mt-6">
      <template v-if="tagsList.length > 0">
        <ul>
          <li v-for="(tag, index) in tagsList" :key="index">
            <div class="d-flex align-center justify-space-between w-100">
              <p class="text-decoration-underline">#{{ tag }}</p>
              <div class="cancel-btn" @click="handleInterestToggle(tag)">Unmute</div>
            </div>
          </li>
        </ul>
      </template>
      <div v-else class="d-flex justify-center mt-6">No muted tags</div>
    </div>
  </div>
</template>
