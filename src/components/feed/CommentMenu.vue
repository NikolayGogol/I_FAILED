<template>
  <v-menu class="comment-menu-wrapper">
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        icon="mdi-dots-horizontal"
        size="small"
        variant="text"
      />
    </template>
    <v-list color="primary">
      <v-list-item v-if="isOwnComment" @click="emit('edit')">
        <v-list-item-title class="d-flex align-items-center">
          <div class="mr-3 pencil-icon" v-html="getIcon('pencil')" />
          Edit comment
        </v-list-item-title>
      </v-list-item>
      <v-list-item @click="emit('copy-link')">
        <v-list-item-title class="d-flex align-items-center">
          <div class="mr-3" v-html="getIcon('copy')" />
          Copy Link
        </v-list-item-title>
      </v-list-item>
      <v-list-item v-if="isOwnComment" @click="emit('delete')">
        <v-list-item-title class="d-flex align-items-center text-danger">
          <div class="mr-3" v-html="getIcon('trash')" />
          Delete comment
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
  import { computed } from 'vue'
  import { getIcon } from '@/models/icons.js'
  import { useAuthStore } from '@/stores/auth'
  import '@/styles/components/comment-menu.scss'

  const props = defineProps({
    comment: {
      type: Object,
      required: true,
    },
  })

  const emit = defineEmits(['edit', 'delete', 'copy-link'])

  const authStore = useAuthStore()

  const isOwnComment = computed(() => {
    return authStore.user?.uid === props.comment.user?.uid
  })
</script>
