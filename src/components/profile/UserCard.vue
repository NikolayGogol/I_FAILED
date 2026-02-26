<script setup>
  import { storeToRefs } from 'pinia'
  import { computed, ref } from 'vue'
  import { useToast } from 'vue-toastification'
  import { useAuthStore } from '@/stores/auth.js'
  import { useProfileStore } from '@/stores/profile.js'
  import '@/styles/components/profile/user-card.scss'

  const authStore = useAuthStore()
  const profileStore = useProfileStore()
  const toast = useToast()

  const { user } = storeToRefs(authStore)
  const { loading } = storeToRefs(profileStore)

  const editDialog = ref(false)
  const newDisplayName = ref('')
  const newPhotoFile = ref(null)
  const photoPreviewUrl = ref(null)

  const displayName = computed(() => user.value?.displayName || 'User')
  const email = computed(() => user.value?.email || '')
  const photoURL = computed(() => user.value?.photoURL)
  const initials = computed(() => {
    const name = displayName.value
    if (!name) return 'U'
    const parts = name.split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + (parts[1]?.charAt(0) || '')).toUpperCase()
  })
  const joinDate = computed(() => {
    if (user.value?.metadata?.creationTime) {
      return new Date(user.value.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
    return 'Unknown'
  })

  function openEditDialog () {
    newDisplayName.value = displayName.value
    photoPreviewUrl.value = photoURL.value
    newPhotoFile.value = null
    editDialog.value = true
  }

  function onFileChange (event) {
    const file = event.target.files[0]
    if (file) {
      newPhotoFile.value = file
      const reader = new FileReader()
      reader.onload = e => {
        photoPreviewUrl.value = e.target.result
      }
      reader.readAsDataURL(file)
    }
  }

  async function handleUpdateProfile () {
    try {
      await profileStore.updateUserProfile({
        displayName: newDisplayName.value,
        photoFile: newPhotoFile.value,
      })
      toast.success('Profile updated successfully!')
      editDialog.value = false
    } catch (error) {
      toast.error('Failed to update profile.')
    }
  }
</script>

<template>
  <div class="user-card">
    <div class="user-card-header">
      <div class="user-avatar">
        <v-img
          v-if="photoURL"
          alt="Profile"
          cover
          :src="photoURL"
        />
        <span v-else>{{ initials }}</span>
      </div>

      <div class="user-main-info">
        <div class="user-name-row">
          <h2>{{ displayName }}</h2>
          <button class="edit-profile-btn" @click="openEditDialog">Edit profile</button>
        </div>
        <p class="user-email">{{ email }}</p>
        <p class="user-bio">Entrepreneur learning from startup failures. Sharing my journey to help others.</p>

        <div class="user-meta">
          <span class="join-date">Joined {{ joinDate }}</span>
        </div>

        <div class="user-stats">
          <span><strong>2</strong> followers</span>
          <span><strong>2</strong> following</span>
        </div>

        <div class="user-badge">
          Failure Age: 24.5 years
        </div>
      </div>
    </div>

    <hr class="user-card-divider">

    <div class="user-activity-footer">
      <div class="activity-stat">
        <span class="stat-value">12</span>
        <span class="stat-label">Posts</span>
      </div>
      <div class="activity-stat">
        <span class="stat-value">45</span>
        <span class="stat-label">Comments</span>
      </div>
      <div class="activity-stat">
        <span class="stat-value">156</span>
        <span class="stat-label">Reactions Received</span>
      </div>
      <div class="activity-stat">
        <span class="stat-value">89</span>
        <span class="stat-label">Reactions Given</span>
      </div>
    </div>

    <!-- Edit Profile Dialog -->
    <v-dialog v-model="editDialog" max-width="500px">
      <v-card class="edit-profile-dialog">
        <v-card-title>Edit Profile</v-card-title>
        <v-card-text>
          <div class="edit-avatar-section">
            <div class="edit-avatar">
              <v-img
                v-if="photoPreviewUrl"
                alt="Profile Preview"
                cover
                :src="photoPreviewUrl"
              />
              <span v-else>{{ initials }}</span>
            </div>
            <input
              id="photo-upload"
              accept="image/*"
              hidden
              type="file"
              @change="onFileChange"
            >
            <label class="upload-btn" for="photo-upload">
              Change Photo
            </label>
          </div>

          <v-text-field
            v-model="newDisplayName"
            density="comfortable"
            label="Display Name"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="editDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :loading="loading"
            variant="tonal"
            @click="handleUpdateProfile"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
