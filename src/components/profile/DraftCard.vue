<script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import ConfirmationModal from '@/components/ConfirmationModal.vue'
  import { useEditDraftStore } from '@/stores/edit-draft.js'
  import { useProfileStore } from '@/stores/profile/profile.js'
  import { timeTransformAgo } from '@/utils/time.js'
  import { formatNumber } from '@/utils/format-number.js'
  import '@/styles/components/profile/draft-card.scss'
  const router = useRouter()
  const props = defineProps({
    card: {
      required: true,
      type: Object,
    },
  })
  const editDraftStore = useEditDraftStore()
  const profileStore = useProfileStore()

  const showDeleteModal = ref(false)
  const isDeleting = ref(false)

  function editDraft () {
    const id = props.card.id
    router.push(`/edit-draft/${id}`)
  }

  async function confirmDelete () {
    isDeleting.value = true
    const { success } = await editDraftStore.deleteDraft(props.card.id)
    isDeleting.value = false
    if (success) {
      showDeleteModal.value = false
      profileStore.drafts = profileStore.drafts.filter(d => d.id !== props.card.id)
    }
  }
</script>

<template>
  <div v-if="card" class="draft-card">
    <div class="draft-card-left">
      <span class="draft-category">{{ card.selectedCategories[0]?.label }}</span>
      <h3 class="draft-title">{{ card.title }}</h3>
      <div class="draft-meta">
        <div v-if="card.lessonLearned" class="meta-item">
          <span class="meta-icon">💰</span>
          <span class="meta-text">Cost: {{ formatNumber(card.lessonLearned?.cost || 0) }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-icon">⏱️</span>
          <span class="meta-text">Recovery: {{ card.lessonLearned.recoveryTime?.title }}</span>
        </div>
      </div>
    </div>
    <div class="draft-card-right">
      <div class="draft-actions">
        <button class="btn-edit" @click="editDraft">Edit</button>
        <button class="btn-delete" @click="showDeleteModal = true">Delete</button>
      </div>
      <span class="draft-date">{{ timeTransformAgo(card.createdAt) }}</span>
    </div>

    <ConfirmationModal
      v-model:show="showDeleteModal"
      :loading="isDeleting"
      message="Are you sure you want to delete this draft? This action cannot be undone."
      title="Delete Draft"
      @cancel="showDeleteModal = false"
      @confirm="confirmDelete"
    />
  </div>
</template>
