<script setup>
  import dayjs from 'dayjs'
  import { storeToRefs } from 'pinia'
  import { computed, onMounted, ref } from 'vue'
  import { useToast } from 'vue-toastification'
  import FormTextarea from '@/components/FormTextarea.vue'
  import { useAuthStore } from '@/stores/auth.js'
  import { useProfileStore } from '@/stores/profile.js'
  import '@/styles/components/profile/user-card.scss'

  const props = defineProps({
    user: {
      type: Object,
      default: null,
    },
    activity: {
      type: Object,
      default: null,
    },
  })

  const authStore = useAuthStore()
  const profileStore = useProfileStore()
  const toast = useToast()

  const { user: authUser } = storeToRefs(authStore)
  const { userActivity: profileActivity } = storeToRefs(profileStore)

  const editDialog = ref(false)
  const newDisplayName = ref('')
  const newBio = ref('')
  const newPhotoFile = ref(null)
  const photoPreviewUrl = ref(null)

  const displayUser = computed(() => props.user || authUser.value)
  const displayActivity = computed(() => props.activity || profileActivity.value)

  const isCurrentUser = computed(() => {
    if (!authUser.value || !displayUser.value) return false
    const authId = authUser.value.uid
    const displayId = displayUser.value.id || displayUser.value.uid
    return authId === displayId
  })

  const displayName = computed(() => displayUser.value?.displayName || 'User')
  const photoURL = computed(() => displayUser.value?.photoURL)
  const initials = computed(() => {
    const name = displayName.value
    if (!name) return 'U'
    const parts = name.split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + (parts[1]?.charAt(0) || '')).toUpperCase()
  })
  const joinDate = computed(() => {
    if (displayUser.value?.createdAt) {
      const seconds = displayUser.value.createdAt.seconds
      if (seconds) {
        return dayjs.unix(seconds).format('MMMM YYYY')
      }
      return dayjs(displayUser.value.createdAt).format('MMMM YYYY')
    }
    return 'Unknown'
  })

  const followersCount = computed(() => displayUser.value?.followers?.length || 0)
  const followingCount = computed(() => displayUser.value?.following?.length || 0)

  onMounted(() => {
    if (!props.user && authUser.value?.uid) {
      profileStore.fetchUserActivity(authUser.value.uid)
    }
  })

  function openEditDialog () {
    newDisplayName.value = displayName.value
    newBio.value = displayUser.value?.bio || ''
    photoPreviewUrl.value = photoURL.value
    newPhotoFile.value = null
    editDialog.value = true
  }

  function onFileChange (event) {
    const file = event.target.files[0]
    if (file) {
      newPhotoFile.value = file
      const reader = new FileReader()
      reader.addEventListener('load', e => {
        photoPreviewUrl.value = e.target.result
      })
      reader.readAsDataURL(file)
    }
  }

  async function handleUpdateProfile () {
    try {
      await profileStore.updateUserProfile({
        displayName: newDisplayName.value,
        photoFile: newPhotoFile.value,
        bio: newBio.value,
      })
      toast.success('Profile updated successfully!')
      editDialog.value = false
    } catch {
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

      <div class="user-main-info w-100">
        <div class="user-name-row align-center justify-between">
          <h2>{{ displayName }}</h2>
          <button v-if="isCurrentUser" class="cancel-btn" @click="openEditDialog">Edit profile</button>
          <slot name="profile-actions" />
        </div>
        <p class="user-email">@{{ displayName.replaceAll(' ', '_') }}</p>
        <p class="user-bio">{{ displayUser?.bio || 'Entrepreneur learning from startup failures. Sharing my journey to help others.' }}</p>
        <div class="user-meta d-flex align-center">
          <v-icon class="mr-1" icon="mdi-calendar-blank-outline" />
          <span class="join-date">Joined {{ joinDate }}</span>
        </div>

        <div class="user-stats">
          <span><strong>{{ followersCount }}</strong> followers</span>
          <span><strong>{{ followingCount }}</strong> following</span>
        </div>

        <div class="user-badge">
          Failure Age: 24.5 years
        </div>
      </div>
    </div>

    <hr class="user-card-divider">

    <div class="user-activity-footer">
      <div class="activity-stat">
        <v-icon icon="mdi-file-outline" />
        <span class="stat-value">{{ displayActivity.posts }}</span>
        <span class="stat-label">Posts</span>
      </div>
      <div class="activity-stat">
        <v-icon icon="mdi-comment-outline" />
        <span class="stat-value">{{ displayActivity.comments }}</span>
        <span class="stat-label">Comments</span>
      </div>
      <div class="activity-stat">
        <v-icon icon="mdi-heart-outline" />
        <span class="stat-value">{{ displayActivity.reactionsReceived }}</span>
        <span class="stat-label">Reactions Received</span>
      </div>
      <div class="activity-stat">
        <v-icon icon="mdi-heart-outline" />
        <span class="stat-value">{{ displayActivity.reactionsGiven }}</span>
        <span class="stat-label">Reactions Given</span>
      </div>
    </div>

    <!-- Edit Profile Dialog -->
    <v-dialog v-model="editDialog" max-width="500px">
      <v-card class="edit-profile-dialog">
        <div class="d-flex justify-end">
          <v-icon class="cursor-pointer" icon="mdi-close" @click="editDialog = false" />
        </div>
        <v-card-title class="text-center">Edit Profile</v-card-title>
        <v-card-text>
          <div class="edit-avatar-section position-relative">
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
              <v-icon icon="mdi-camera-outline" />
            </label>
          </div>

          <form-input
            v-model="newDisplayName"
            density="comfortable"
            hide-details
            label="Display Name"
            variant="outlined"
          />
          <div class="mt-2">
            <form-textarea
              v-model="newBio"
              auto-grow
              density="comfortable"
              hide-details
              label="Bio"
              rows="3"
              variant="outlined"
            />
          </div>
        </v-card-text>
        <v-row class="mt-1 px-4">
          <v-col>
            <div class="cancel-btn" @click="editDialog = false">Cancel</div>
          </v-col>
          <v-col>
            <div
              class="submit-btn"
              @click="handleUpdateProfile"
            >
              Save
            </div>
          </v-col>
        </v-row>
      </v-card>
    </v-dialog>
  </div>
</template>
