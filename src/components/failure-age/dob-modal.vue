<script setup>
  import dayjs from 'dayjs'
  import { doc, updateDoc } from 'firebase/firestore'
  import { computed, ref, watch } from 'vue'
  import { useToast } from 'vue-toastification'
  import { db } from '@/firebase.js'
  import { useAuthStore } from '@/stores/auth.js'

  const props = defineProps({
    modelValue: {
      type: Boolean,
      required: true,
    },
  })
  const authStore = useAuthStore()

  const emit = defineEmits(['update:modelValue', 'dob-updated'])

  const selectedDob = ref(null)
  const dateMenu = ref(false)
  const toast = useToast()

  const showDialog = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value),
  })

  // Computed property to format the date for display in the text field
  const formattedDob = computed(() => {
    if (selectedDob.value) {
      // Assuming selectedDob is a Date object or a string that dayjs can parse
      return dayjs(selectedDob.value).format('MM/DD/YYYY')
    }
    return ''
  })

  async function saveDob () {
    if (selectedDob.value) {
      try {
        const formatDob = dayjs(selectedDob.value).format('MM/DD/YYYY')
        const userDocRef = doc(db, import.meta.env.VITE_USERS_COLLECTION, authStore.user.uid)
        await updateDoc(userDocRef, {
          dob: formatDob,
        })
        toast.success('Date of Birth updated successfully!')
        emit('dob-updated')
        showDialog.value = false
      } catch (error) {
        toast.error('Failed to update Date of Birth.')
        console.error('Error updating DOB:', error)
      }
    }
  }

  watch(() => authStore.user, newUser => {
    if (newUser && newUser.dob) {
      selectedDob.value = newUser.dob
    }
  }, { immediate: true })

</script>

<template>
  <v-dialog v-model="showDialog" max-width="400px" persistent>
    <v-card class="pa-4 rounded-xl">
      <v-card-title class="text-h5 text-center">Enter Your Date of Birth</v-card-title>
      <v-card-text class="pt-0">
        <p class="mb-4 text-description text-center">Please enter your date of birth to ensure the correct functionality of this page.</p>
        <v-menu
          v-model="dateMenu"
          :close-on-content-click="false"
          min-width="auto"
          offset-y
          transition="scale-transition"
        >
          <template #activator="{ props }">
            <form-input
              v-bind="props"
              hide-details
              label="Date of Birth"
              :model-value="formattedDob"
              placeholder="MM/DD/YYYY"
              prepend-inner-icon="mdi-calendar"
              readonly
            />
          </template>
          <v-date-picker
            v-model="selectedDob"
            color="primary"
            :max="dayjs().format('YYYY-MM-DD')"
            @update:model-value="dateMenu = false"
          />
        </v-menu>
      </v-card-text>
      <div class="d-flex justify-center">
        <div
          class="cancel-btn mr-4"
          @click="showDialog = false"
        >Cancel</div>
        <div
          class="submit-btn"
          :class="{'pointer-events-none opacity-60': !selectedDob}"
          @click="saveDob"
        >Save</div>
      </div>
    </v-card>
  </v-dialog>
</template>
