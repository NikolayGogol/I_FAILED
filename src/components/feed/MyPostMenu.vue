<script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useToast } from 'vue-toastification'
  import { usePostStore } from '@/stores/profile/post.js'

  const props = defineProps({
    post: {
      type: Object,
      required: true,
    },
  })
  const emit = defineEmits(['refresh'])
  const router = useRouter()
  const toast = useToast()
  const postStore = usePostStore()
  const showDeleteDialog = ref(false)
  const isDeleting = ref(false)

  /**
   * Navigates to the edit post page.
   */
  function editPost () {
    router.push(`/edit-post/${props.post.id}`)
  }

  /**
   * Confirms and deletes the post.
   */
  async function confirmDelete () {
    isDeleting.value = true
    const success = await postStore.deletePost(props.post.id)
    if (success) {
      toast.info('Post deleted')
      showDeleteDialog.value = false
      emit('refresh')
    } else {
      toast.error('Failed to delete post')
    }
    isDeleting.value = false
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
            <div class="submit-btn" :disabled="isDeleting" @click="confirmDelete">
              <v-progress-circular
                v-if="isDeleting"
                class="mr-2"
                indeterminate
                size="20"
                width="2"
              />
              <span v-else>Delete</span>
            </div>
          </v-col>
        </v-row>
      </div>
    </v-dialog>
  </div>
</template>
