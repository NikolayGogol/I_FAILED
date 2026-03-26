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
  import { nextTick, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useToast } from 'vue-toastification'
  import ConfirmationModal from '@/components/ConfirmationModal.vue'
  import PostCard from '@/components/feed/PostCard.vue' // Переконайтеся, що імпорт правильний
  import { getIcon } from '@/models/icons.js'
  import { useLibraryStore } from '@/stores/library.js'
  import '@/styles/pages/library.scss'

  dayjs.extend(relativeTime)

  const toast = useToast()
  const libraryStore = useLibraryStore()
  const router = useRouter()

  // State
  const collectionList = ref([])
  const isCreateDialog = ref(false)
  const isRenameDialog = ref(false)
  const isSaving = ref(false)
  const newCollection = ref('')
  const editedCollection = ref(null)
  const postIsLoading = ref(false)
  const isDeleteDialogOpen = ref(false)
  const isExporting = ref(false)
  const selectedCollection = ref(null)
  const exportingPosts = ref([])
  const selectedSort = ref('updatedAtDesc')

  const sortOptions = [
    { label: 'Last created', value: 'createdAtDesc' },
    { label: 'Last updated', value: 'updatedAtDesc' },
    { label: 'A-Z', value: 'nameAsc' },
    { label: 'Z-A', value: 'nameDesc' },
  ]

  onMounted(() => {
    getCollectionList()
    addScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js')
  })

  // Logic
  function addScript (url) {
    if (document.querySelector(`script[src="${url}"]`)) return
    const script = document.createElement('script')
    script.src = url
    document.head.append(script)
  }

  function getCollectionList () {
    postIsLoading.value = true
    libraryStore.getCollections()
      .then(res => {
        collectionList.value = res
        sortCollections(selectedSort.value)
      })
      .finally(() => {
        postIsLoading.value = false
      })
  }

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

  async function exportToPDF (item) {
    if (isExporting.value) return
    isExporting.value = true
    const body = document.querySelector('html')
    body.style.overflow = 'hidden'
    try {
      const res = await libraryStore.getPostFromCollection(item.id)
      if (!res || res.length === 0) {
        toast.error('Collection is empty')
        return
      }
      exportingPosts.value = res

      await nextTick()

      // Add a small delay to ensure all content (especially images) is rendered
      await new Promise(resolve => setTimeout(resolve, 1500))

      const exportWrapper = document.querySelector('#exporting-wrapper')

      const opt = {
        margin: 0.5,
        filename: `${item.name}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          width: 725,
        },
        jsPDF: {
          unit: 'in',
          format: 'letter',
          orientation: 'portrait',
        },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'],
        },
      }
      html2pdf().from(exportWrapper).set(opt).save().then(() => {
        toast.success('PDF generated')
        isExporting.value = false
        exportingPosts.value = []
        body.style.overflow = 'visible'
      }).catch(error => {
        console.error('PDF Export Error:', error)
        toast.error('Failed to generate PDF')
      })
    } catch (error) {
      console.error('PDF Export Error:', error)
      toast.error('Failed to generate PDF')
    }
  }

  // Handlers (Rename, Delete, Create...)
  function createCollection () {
    if (!newCollection.value) return
    isSaving.value = true
    libraryStore.createNewCollection(newCollection.value)
      .then(() => {
        isCreateDialog.value = false
        newCollection.value = ''
        getCollectionList()
        toast.info('New collection created')
      })
      .finally(() => isSaving.value = false)
  }

  function deleteCollection () {
    isSaving.value = true
    libraryStore.deleteCollection(selectedCollection.value.id)
      .then(() => {
        getCollectionList()
        toast.info('Collection deleted')
        isDeleteDialogOpen.value = false
      })
      .finally(() => isSaving.value = false)
  }

  function renameCollection () {
    isSaving.value = true
    libraryStore.updateCollection(editedCollection.value.id, { name: editedCollection.value.name })
      .then(() => {
        getCollectionList()
        toast.info('Collection renamed')
        isRenameDialog.value = false
      })
      .finally(() => isSaving.value = false)
  }

  function openDeleteDialog (item) {
    selectedCollection.value = item
    isDeleteDialogOpen.value = true
  }

  function openRenameDialog (item) {
    editedCollection.value = { ...item }
    isRenameDialog.value = true
  }

  const openCollection = item => router.push(`/library/${item.id}`)
  const timeAgo = time => time?.seconds ? dayjs.unix(time.seconds).fromNow() : 'no time'

  function shareLink (item) {
    navigator.clipboard.writeText(`${window.location.origin}/library/${item.id}`)
    toast.info('Link copied')
  }
</script>

<template>
  <div class="library-page">
    <div v-if="isExporting" class="overlay">
      <h3 class="mb-5">Generating PDF</h3>
      <v-progress-linear color="primary" indeterminate />
    </div>
    <div v-if="isExporting" id="exporting-wrapper">
      <div v-for="post in exportingPosts" :key="post.id" class="post-card-export">
        <PostCard :post="post" />
      </div>
    </div>

    <v-dialog v-model="isCreateDialog" class="collection-dialog" max-width="520">
      <v-card class="pa-7 rounded-xl">
        <v-btn
          class="position-absolute right-0 top-0 m-2"
          icon="mdi-close"
          variant="text"
          @click="isCreateDialog = false"
        />
        <v-card-title class="text-center">Create collection</v-card-title>
        <v-text-field v-model="newCollection" class="mt-4" label="Collection Name" variant="outlined" />
        <v-btn block color="primary" :loading="isSaving" @click="createCollection">Create</v-btn>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isRenameDialog" class="collection-dialog" max-width="520">
      <v-card v-if="editedCollection" class="pa-7 rounded-xl">
        <v-btn
          class="position-absolute right-0 top-0 m-2"
          icon="mdi-close"
          variant="text"
          @click="isRenameDialog = false"
        />
        <v-card-title class="text-center">Rename collection</v-card-title>
        <v-text-field v-model="editedCollection.name" class="mt-4" label="Name" variant="outlined" />
        <v-btn block color="primary" :loading="isSaving" @click="renameCollection">Save</v-btn>
      </v-card>
    </v-dialog>

    <confirmation-modal
      :loading="isSaving"
      message="Delete this collection?"
      :show="isDeleteDialogOpen"
      @cancel="isDeleteDialogOpen = false"
      @confirm="deleteCollection"
    />

    <div class="page-header d-flex align-center justify-space-between mb-6">
      <h2>Saved Library</h2>
      <button @click="isCreateDialog = true">Create collection</button>
    </div>

    <div class="header-panel d-flex align-center justify-space-between mb-4">
      <p class="text-grey">{{ collectionList.length }} Collections</p>
      <v-menu location="bottom end" open-on-hover>
        <template #activator="{ props }">
          <div class="d-flex align-center cursor-pointer" v-bind="props">
            <div
              class="bg-secondary d-flex align-center justify-center pa-2 rounded-circle"
              v-html="getIcon('filter', 20, 20)"
            />
          </div>
        </template>
        <v-list class="rounded-xl elevation-1" color="primary">
          <v-list-item
            v-for="opt in sortOptions"
            :key="opt.value"
            :active="selectedSort === opt.value"
            @click="sortCollections(opt.value)"
          >
            {{ opt.label }}
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <v-progress-linear v-if="postIsLoading" color="primary" indeterminate />

    <template v-else>
      <ul v-if="collectionList.length > 0" class="collection-list">
        <li v-for="item in collectionList" :key="item.id" class="collection-item">
          <div class="d-flex align-center justify-space-between">
            <p class="name" @click="openCollection(item)">{{ item.name }}</p>
            <v-menu location="bottom end" open-on-hover>
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  density="compact"
                  icon="mdi-dots-horizontal"
                  variant="text"
                />
              </template>
              <v-list class="rounded-xl" color="primary" width="200">
                <v-list-item @click="openRenameDialog(item)">
                  <template #prepend>
                    <div class="mr-2" v-html="getIcon('pencil', 18, 18)" />
                  </template>
                  Rename
                </v-list-item>
                <v-list-item @click="shareLink(item)">
                  <template #prepend>
                    <div class="mr-2" v-html="getIcon('share', 18, 18)" />
                  </template>
                  Share
                </v-list-item>
                <v-list-item @click="exportToPDF(item)">
                  <template #prepend>
                    <div class="mr-2" v-html="getIcon('export', 18, 18)" />
                  </template>
                  Export PDF
                </v-list-item>
                <v-divider />
                <v-list-item base-color="error" @click="openDeleteDialog(item)">
                  <template #prepend>
                    <div class="mr-2" v-html="getIcon('trash', 18, 18)" />
                  </template>
                  Delete
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
          <div class="d-flex justify-space-between text-caption text-grey">
            <span>{{ item.counter }} posts</span>
            <span>{{ timeAgo(item.updatedAt) }}</span>
          </div>
        </li>
      </ul>
      <div v-else class="text-center py-10">
        <v-img class="mx-auto mb-4" src="@/assets/library/Frame192.png" width="200" />
        <p class="text-grey">You don’t have any library yet</p>
      </div>
    </template>
  </div>
</template>
