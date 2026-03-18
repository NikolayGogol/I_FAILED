<script setup>
// =================================================================================================
// Imports
// =================================================================================================
  import dayjs from 'dayjs'
  import { storeToRefs } from 'pinia'
  import { computed, onMounted, ref } from 'vue'
  import { useToast } from 'vue-toastification'
  import FormTextarea from '@/components/FormTextarea.vue'
  import { getIcon } from '@/models/icons.js'
  import { useAuthStore } from '@/stores/auth.js'
  import { useProfileStore } from '@/stores/profile.js'
  import '@/styles/components/profile/user-card.scss'

  // =================================================================================================
  // Props
  // =================================================================================================
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

  // =================================================================================================
  // Stores & Hooks
  // =================================================================================================
  const authStore = useAuthStore()
  const profileStore = useProfileStore()
  const toast = useToast()

  // =================================================================================================
  // State
  // =================================================================================================
  const { user: authUser } = storeToRefs(authStore)
  const { userActivity: profileActivity } = storeToRefs(profileStore)
  const editDialog = ref(false)
  const newDisplayName = ref('')
  const newBio = ref('')
  const newPhotoFile = ref(null)
  const photoPreviewUrl = ref(null)

  // =================================================================================================
  // Computed Properties
  // =================================================================================================
  // Determine which user to display (either from props or the authenticated user)
  const displayUser = computed(() => props.user || authUser.value)
  // Determine which activity to display (either from props or the authenticated user's activity)
  const displayActivity = computed(() => props.activity || profileActivity.value)

  // Check if the displayed user is the currently authenticated user
  const isCurrentUser = computed(() => {
    if (!authUser.value || !displayUser.value) return false
    const authId = authUser.value.uid
    const displayId = displayUser.value.id || displayUser.value.uid
    return authId === displayId
  })

  // Get the display name of the user
  const displayName = computed(() => displayUser.value?.displayName || 'User')
  // Get the photo URL of the user
  const photoURL = computed(() => displayUser.value?.photoURL)
  // Get the initials of the user for the avatar fallback
  const initials = computed(() => {
    const name = displayName.value
    if (!name) return 'U'
    const parts = name.split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + (parts[1]?.charAt(0) || '')).toUpperCase()
  })
  // Format the join date of the user
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

  // Get the number of followers
  const followersCount = computed(() => displayUser.value?.followers?.length || 0)
  // Get the number of users the user is following
  const followingCount = computed(() => displayUser.value?.following?.length || 0)

  // =================================================================================================
  // Lifecycle Hooks
  // =================================================================================================
  // Fetch user activity if no user is passed as a prop
  onMounted(() => {
    if (!props.user && authUser.value?.uid) {
      profileStore.fetchUserActivity(authUser.value.uid)
    }
  })

  // =================================================================================================
  // Functions
  // =================================================================================================
  // Open the edit profile dialog
  function openEditDialog () {
    newDisplayName.value = displayName.value
    newBio.value = displayUser.value?.bio || ''
    photoPreviewUrl.value = photoURL.value
    newPhotoFile.value = null
    editDialog.value = true
  }

  // Handle the file change event for the photo upload
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

  // Handle the profile update
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
    <div class="user-card-header d-none d-sm-flex">
      <!-- User avatar -->
      <div class="user-avatar">
        <v-img
          v-if="photoURL"
          alt="Profile"
          class="h-100"
          cover
          :src="photoURL"
        />
        <span v-else>{{ initials }}</span>
      </div>

      <div class="user-main-info w-100">
        <!-- User name and edit button -->
        <div class="user-name-row align-center justify-between">
          <h2>{{ displayName }}</h2>
          <div class="d-flex">
            <button v-if="isCurrentUser" class="cancel-btn" @click="openEditDialog">Edit profile</button>
          </div>
          <slot name="profile-actions" />
        </div>
        <!-- User handle -->
        <p class="user-email">@{{ displayName.replaceAll(' ', '_') }}</p>
        <!-- User bio -->
        <p class="user-bio">{{
          displayUser?.bio || 'Entrepreneur learning from startup failures. Sharing my journey to help others.'
        }}</p>
        <!-- User meta data -->
        <div class="user-meta d-flex align-center">
          <v-icon class="mr-1" icon="mdi-calendar-blank-outline" />
          <span class="join-date">Joined {{ joinDate }}</span>
        </div>

        <!-- User stats -->
        <div class="user-stats">
          <span><strong>{{ followersCount }}</strong> followers</span>
          <span><strong>{{ followingCount }}</strong> following</span>
        </div>

        <!-- User badge -->
        <div class="user-badge">
          Failure Age: 24.5 years
        </div>
      </div>
    </div>

    <hr class="user-card-divider d-none d-sm-flex">
    <div class="mobile-view d-sm-none mb-4">
      <div class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <div class="user-avatar mr-3">
            <v-img
              v-if="photoURL"
              alt="Profile"
              class="h-100"
              cover
              :src="photoURL"
            />
            <span v-else>{{ initials }}</span>
          </div>
          <div class="user-name-row">
            <h2>{{ displayName }}</h2>
            <p class="user-email">@{{ displayName.replaceAll(' ', '_') }}</p>
          </div>
        </div>
        <div
          v-if="isCurrentUser"
          class="border pa-2 rounded-lg d-flex align-center justify-center"
          @click="openEditDialog"
          v-html="getIcon('pencil')"
        />
        <slot name="dropdown-actions" />
      </div>
      <p class="user-bio mt-2">{{
        displayUser?.bio || 'Entrepreneur learning from startup failures. Sharing my journey to help others.'
      }}</p>
      <div class="user-meta d-flex align-center my-3">
        <v-icon class="mr-1" icon="mdi-calendar-blank-outline" />
        <span class="join-date">Joined {{ joinDate }}</span>
      </div>
      <div class="user-stats">
        <span><strong>{{ followersCount }}</strong> followers</span>
        <span class="ml-3"><strong>{{ followingCount }}</strong> following</span>
      </div>
      <slot name="follow-action" />
    </div>
    <!-- User activity stats -->
    <div v-if="displayActivity" class="user-activity-footer">
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
        <span class="stat-label d-none d-sm-block">Reactions Received</span>
        <span class="stat-label d-sm-none">Received</span>
      </div>
      <div class="activity-stat">
        <v-icon icon="mdi-heart-outline" />
        <span class="stat-value">{{ displayActivity.reactionsGiven }}</span>
        <span class="stat-label d-none d-sm-block">Reactions Given</span>
        <span class="stat-label d-sm-none"> Given</span>
      </div>
    </div>

    <!-- Edit Profile Dialog -->
    <v-dialog v-model="editDialog" class="d-none d-sm-block" max-width="500px">
      <v-card class="edit-profile-dialog">
        <div class="d-flex justify-end">
          <v-icon class="cursor-pointer" icon="mdi-close" @click="editDialog = false" />
        </div>
        <v-card-title class="text-center">Edit Profile</v-card-title>
        <v-card-text>
          <!-- Avatar editing section -->
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

          <!-- Form inputs for display name and bio -->
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
        <!-- Dialog actions -->
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
    <MobileSlide v-model="editDialog" class="d-sm-none">
      <v-card class="edit-profile-dialog elevation-0">
        <div class="d-flex justify-end">
          <v-icon class="cursor-pointer" icon="mdi-close" @click="editDialog = false" />
        </div>
        <v-card-title class="text-center">Edit Profile</v-card-title>
        <v-card-text>
          <!-- Avatar editing section -->
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

          <!-- Form inputs for display name and bio -->
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
        <!-- Dialog actions -->
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
    </MobileSlide>
  </div>
</template>
