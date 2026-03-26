<route lang="json">
{
  "meta": {
    "layout": "MainLayout",
    "auth": true
  }
}
</route>
<script setup>
  import dayjs from 'dayjs'
  import relativeTime from 'dayjs/plugin/relativeTime'
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useToast } from 'vue-toastification'
  import ConfirmationModal from '@/components/ConfirmationModal.vue'
  import { getIcon } from '@/models/icons.js'
  import { useLibraryStore } from '@/stores/library.js'
  import '@/styles/pages/library.scss'
  const toast = useToast()
  //
  const libraryStore = useLibraryStore()
  const collectionList = ref([])
  dayjs.extend(relativeTime)
  const isCreateDialog = ref(false)
  const isRenameDialog = ref(false)
  const isSaving = ref(false)
  const newCollection = ref('')
  const editedCollection = ref(null)
  const postIsLoading = ref(false)
  const isDeleteDialogOpen = ref(false)
  const selectedCollection = ref(null)
  const router = useRouter()

  const selectedSort = ref('updatedAtDesc') // Default sort to match backend
  const sortOptions = [
    { label: 'Last created', value: 'createdAtDesc' },
    { label: 'Last updated', value: 'updatedAtDesc' },
    { label: 'A-Z', value: 'nameAsc' },
    { label: 'Z-A', value: 'nameDesc' },
  ]

  const selectedSortLabel = computed(() => {
    const option = sortOptions.find(opt => opt.value === selectedSort.value)
    return option ? option.label : ''
  })

  //
  onMounted(() => {
    getCollectionList()
  })

  function sortCollections (sortType) {
    selectedSort.value = sortType
    const list = [...collectionList.value]

    switch (sortType) {
      case 'createdAtDesc': {
        list.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0))
        break
      }
      case 'updatedAtDesc': {
        list.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
        break
      }
      case 'nameAsc': {
        list.sort((a, b) => a.name.localeCompare(b.name))
        break
      }
      case 'nameDesc': {
        list.sort((a, b) => b.name.localeCompare(a.name))
        break
      }
    }
    collectionList.value = list
  }

  function getCollectionList () {
    postIsLoading.value = true
    libraryStore.getCollections()
      .then(res => {
        collectionList.value = res
        // Apply the current sort after fetching, as initial fetch is by updatedAtDesc
        sortCollections(selectedSort.value)
      })
      .finally(() => {
        postIsLoading.value = false
      })
  }

  function timeAgo (time) {
    if (time?.seconds) {
      return dayjs.unix(time.seconds).fromNow()
    }
    return 'no time'
  }

  function createCollection () {
    isSaving.value = true
    libraryStore.createNewCollection(newCollection.value)
      .then(() => {
        isCreateDialog.value = false
        newCollection.value = ''
        getCollectionList()
        toast.info('New collection created')
      })
      .finally(() => {
        isSaving.value = false
      })
  }
  function openDeleteDialog (item) {
    selectedCollection.value = item
    isDeleteDialogOpen.value = true
  }

  function deleteCollection () {
    isSaving.value = true
    libraryStore.deleteCollection(selectedCollection.value.id)
      .then(() => {
        getCollectionList()
        toast.info('Collection deleted')
        isDeleteDialogOpen.value = false
      })
      .finally(() => {
        isSaving.value = false
      })
  }

  function openRenameDialog (item) {
    editedCollection.value = { ...item }
    isRenameDialog.value = true
  }

  function renameCollection () {
    isSaving.value = true
    libraryStore.updateCollection(editedCollection.value.id, { name: editedCollection.value.name })
      .then(() => {
        getCollectionList()
        toast.info('Collection renamed')
        isRenameDialog.value = false
      })
      .finally(() => {
        isSaving.value = false
      })
  }

  function openCollection (item) {
    router.push(`/library/${item.id}`)
  }
  function shareLink (item) {
    const url = `${window.location.origin}/library/${item.id}`
    navigator.clipboard.writeText(url)
      .then(() => {
        toast.info('Link copied to clipboard')
      })
  }
</script>

<template>
  <div class="library-page">
    <v-dialog v-model="isCreateDialog" class="collection-dialog" max-width="520">
      <v-card class="pa-7 rounded-xl position-relative">
        <v-icon
          class="close-icon"
          icon="mdi-close"
          @click="isCreateDialog = false"
        />
        <v-card-title class="text-center py-0">Create collection</v-card-title>
        <form-input
          v-model="newCollection"
          class="mt-6"
          placeholder="Big Failures"
        />
        <div class="d-flex justify-center">
          <div
            class="submit-btn"
            :class="{'opacity-60 pointer-events-none': !newCollection}"
            @click="createCollection"
          >
            <v-progress-circular
              v-if="isSaving"
              class="mr-2"
              indeterminate
              size="20"
              width="2"
            />
            <span v-else>Create</span>
          </div>
        </div>
      </v-card>
    </v-dialog>
    <v-dialog v-model="isRenameDialog" class="collection-dialog" max-width="520">
      <v-card class="pa-7 rounded-xl position-relative">
        <v-icon
          class="close-icon"
          icon="mdi-close"
          @click="isRenameDialog = false"
        />
        <v-card-title class="text-center py-0">Rename collection</v-card-title>
        <form-input
          v-if="editedCollection"
          v-model="editedCollection.name"
          class="mt-6"
          placeholder="Big Failures"
        />
        <div class="d-flex justify-center">
          <div
            class="submit-btn"
            :class="{'opacity-60 pointer-events-none': !editedCollection.name}"
            @click="renameCollection"
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
        </div>
      </v-card>
    </v-dialog>
    <confirmation-modal
      :loading="isSaving"
      message="Are you sure you want to delete this collection?"
      :show="isDeleteDialogOpen"
      title="Delete Collection"
      @cancel="isDeleteDialogOpen = false"
      @confirm="deleteCollection"
    />
    <div class="page-header d-flex align-center justify-space-between">
      <h2>Saved Library</h2>
      <button @click="isCreateDialog = true">Create collection</button>
    </div>
    <div class="header-panel d-flex align-center justify-space-between">
      <p class="text-description">{{ collectionList.length }} Collections</p>
      <v-menu color="primary" location="bottom right" open-on-hover>
        <template #activator="{ props }">
          <div class="d-flex align-center cursor-pointer" v-bind="props">
            <div class="bg-secondary d-flex align-center justify-center pa-2 rounded-circle" v-html="getIcon('filter', 20, 20)" />
          </div>
        </template>
        <v-list class="rounded-xl elevation-1">
          <v-list-item
            v-for="option in sortOptions"
            :key="option.value"
            :class="{ 'v-list-item--active': selectedSort === option.value }"
            @click="sortCollections(option.value)"
          >
            <v-list-item-title>{{ option.label }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
    <p v-if="postIsLoading" class="mt-10 text-center">Loading...</p>
    <template v-else>
      <ul v-if="collectionList.length > 0" class="collection-list">
        <li v-for="item in collectionList" :key="item.id">
          <div class="d-flex align-center justify-space-between">
            <p class="name hover-underline" @click="openCollection(item)">{{ item.name }}</p>
            <v-menu color="primary" open-on-hover>
              <template #activator="{ props: menuProps }">
                <v-btn icon size="small" v-bind="menuProps" variant="text">
                  <v-icon>mdi-dots-horizontal</v-icon>
                </v-btn>
              </template>
              <v-list class="rounded-xl elevation-1">
                <v-list-item class="cursor-pointer drop-item" @click="openRenameDialog(item)">
                  <div class="mr-2 d-flex" v-html="getIcon('pencil')" />
                  <p>Rename collection</p>
                </v-list-item>
                <v-list-item class="cursor-pointer drop-item" @click="shareLink(item)">
                  <div class="mr-2 d-flex" v-html="getIcon('share')" />
                  <p>Share link</p>
                </v-list-item>
                <v-list-item class="cursor-pointer drop-item text-danger" @click="openDeleteDialog(item)">
                  <div class="mr-2 d-flex" v-html="getIcon('trash')" />
                  <p>Delete</p>
                </v-list-item>
              </v-list>

            </v-menu>
          </div>
          <div class="d-flex align-center justify-space-between">
            <p class="text-description">{{ item.counter }} posts</p>
            <p class="text-description"> {{ timeAgo(item.updatedAt) }}</p>
          </div>

        </li>
      </ul>
      <div v-else class="no-content">
        <img alt="You don’t have any library yet" src="../../assets/library/Frame192.png">
        <h4 class="text-description">You don’t have any library yet</h4>
        <p>Create your first collection</p>
      </div>
    </template>
  </div>
</template>
