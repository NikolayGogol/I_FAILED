<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { usePostStore } from '@/stores/post'

const props = defineProps({
  post: {
    type: Object,
    required: true,
  },
})

const router = useRouter()
const toast = useToast()
const postStore = usePostStore()
const showDeleteDialog = ref(false)

function editPost() {
  router.push(`/edit-post/${props.post.id}`)
}

async function confirmDelete() {
  const success = await postStore.deletePost(props.post.id)
  if (success) {
    toast.success('Post deleted')
    showDeleteDialog.value = false
  } else {
    toast.error('Failed to delete post')
  }
}
</script>

<template>
  <div>
    <v-menu open-on-hover>
      <template #activator="{ props: menuProps }">
        <v-btn icon size="small" v-bind="menuProps" variant="text">
          <v-icon>mdi-dots-horizontal</v-icon>
        </v-btn>
      </template>
      <v-list class="rounded-xl elevation-1">
        <v-list-item class="cursor-pointer" @click="editPost">
          <v-icon class="mr-2">mdi-pencil-outline</v-icon>
          Edit
        </v-list-item>
        <v-list-item class="cursor-pointer text-danger" @click="showDeleteDialog = true">
          <v-icon class="mr-2">mdi-delete-outline</v-icon>
          Delete
        </v-list-item>
      </v-list>
    </v-menu>
    <v-dialog v-model="showDeleteDialog" max-width="480">
      <div class="bg-white rounded-lg py-6 px-6">
        <h6 class="text-h6 text-center">Delete Post?</h6>
        <p class="text-description mt-3">
          This action cannot be undone. Are you sure you want to delete this post?
        </p>
        <v-row class="mt-3">
          <v-col>
            <div class="cancel-btn" @click="showDeleteDialog = false">Cancel</div>
          </v-col>
          <v-col>
            <div class="submit-btn" @click="confirmDelete">Delete</div>
          </v-col>
        </v-row>
      </div>
    </v-dialog>
  </div>
</template>
