<script setup>
  import { onMounted, ref } from 'vue'
  import { useToast } from 'vue-toastification'
  import { useLibraryStore } from '@/stores/library.js'
  import { usePostCardStore } from '@/stores/post-card.js'
  import '@/styles/components/feed/add-collection-dialog.scss'
  //
  const props = defineProps({
    post: {
      required: true,
      type: Object,
    },
  })
  const emit = defineEmits(['post-saved', 'cancel'])
  //
  const isNewField = ref(false)
  const newField = ref('')
  const libraryStore = useLibraryStore()
  const postCardStore = usePostCardStore()
  const toast = useToast()
  const items = ref([])
  const selectedCollection = ref(null)
  const isSaving = ref(false)
  //
  onMounted(() => {
    getCollections()
  })
  function getCollections () {
    libraryStore.getCollections()
      .then(res => {
        items.value = res
      })
  }
  function createCollection () {
    libraryStore.createNewCollection(newField.value)
      .then(() => {
        getCollections()
        isNewField.value = false
        newField.value = ''
      })
  }
  async function saveToCollection () {
    if (isSaving.value) return
    isSaving.value = true
    try {
      const params = {
        post: props.post,
        selectedCollection: selectedCollection.value,
      }
      await libraryStore.saveToCollection(params)
      const result = await postCardStore.toggleBookmark({
        postId: props.post.id,
        bookmarked: true,
      })
      if (result.success) {
        toast.info('Post bookmarked!')
      } else {
        toast.error('Failed to update bookmark')
      }
      emit('post-saved')
    } catch (error) {
      console.error('Failed to save to collection:', error)
      toast.error('Failed to save post to collection.')
    } finally {
      isSaving.value = false
    }
  }
</script>

<template>
  <v-card class="pa-4 rounded-lg">
    <v-card-title class="text-center py-0">Save to collection</v-card-title>
    <v-card-subtitle class="text-center">Choose an existing collection or create new one</v-card-subtitle>
    <div class="card-content mt-6">
      <div v-if="!isNewField" class="item" @click="isNewField = true">
        <v-icon icon="mdi-plus" />
        <p class="cursor-pointer">Create new collection</p>
      </div>
      <div v-else class="d-flex align-center">
        <form-input
          v-model="newField"
          label="Name"
          placeholder="Name"
        />
        <div
          class="submit-btn ml-4"
          :class="{'opacity-60 pointer-events-none': !newField}"
          @click="createCollection"
        >Create
        </div>
      </div>
      <v-radio-group v-model="selectedCollection" color="primary">
        <div
          v-for="item in items"
          :key="item.id"
          class="item py-3 px-2 mt-2"
        >
          <div class="d-flex flex-column align-start">
            <v-radio
              density="compact"
              hide-details
              :label="item.name"
              :value="item"
            />
            <div class="counter ml-8">{{ item.counter }} posts</div>
          </div>
        </div>
      </v-radio-group>
      <div class="v-row">
        <v-col>
          <div class="cancel-btn" @click="emit('cancel')">Cancel</div>
        </v-col>
        <v-col>
          <div
            class="submit-btn h-auto"
            :class="{'opacity-60 pointer-events-none': !selectedCollection || isSaving}"
            @click="saveToCollection"
          >
            <v-progress-circular
              v-if="isSaving"
              class="mr-2"
              indeterminate
              size="20"
              width="2"
            />
            <span v-else>Save</span>
          </div>
        </v-col>
      </div>
    </div>
  </v-card>

</template>

<style scoped lang="scss">

</style>
