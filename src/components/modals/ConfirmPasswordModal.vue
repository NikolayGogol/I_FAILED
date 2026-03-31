<script setup>
  import { ref } from 'vue'
  import { useToast } from 'vue-toastification'

  const emit = defineEmits(['confirm', 'close'])
  const props = defineProps({
    dialog: {
      type: Boolean,
      required: true,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  })

  const password = ref('')
  const toast = useToast()

  function confirmPassword () {
    if (!password.value) {
      toast.error('Please enter your password.')
      return
    }
    emit('confirm', password.value)
  }

  function closeDialog () {
    if (props.loading) return
    password.value = ''
    emit('close')
  }
</script>

<template>
  <v-dialog max-width="500px" :model-value="dialog" persistent @update:model-value="closeDialog">
    <v-card class="rounded-xl pa-4">
      <v-card-title class="text-center">
        <span class="text-h5">Confirm Your Identity</span>
      </v-card-title>
      <v-card-text>
        <p class="text-description text-center">For your security, please enter your password to confirm this change.</p>
        <form-input
          v-model="password"
          autofocus
          label="Password"
          type="password"
          @keyup.enter="confirmPassword"
        />
      </v-card-text>
      <div class="d-flex justify-center">
        <div class="cancel-btn" @click="closeDialog">Cancel</div>
        <div class="submit-btn ml-5" @click="confirmPassword">
          <v-progress-circular
            v-if="loading"
            color="white"
            indeterminate
            size="20"
            width="2"
          />
          <template v-else class="">Confirm</template>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>
