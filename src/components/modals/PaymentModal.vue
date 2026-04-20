<script setup>
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

  function submitPayment () {
    if (props.loading) return
    emit('confirm')
  }

  function closeDialog () {
    if (props.loading) return
    emit('close')
  }
</script>

<template>
  <v-dialog max-width="500px" :model-value="dialog" persistent @update:model-value="closeDialog">
    <v-card class="pa-4 rounded-xl">
      <v-card-title class="text-center">
        <span class="text-h5 font-weight-bold">Upgrade to Premium</span>
      </v-card-title>
      <v-card-text class="text-center">
        You will be redirected to Lemon Squeezy to complete your subscription securely.
      </v-card-text>
      <div class="d-flex justify-center mt-4">
        <div class="cancel-btn" @click="closeDialog">Cancel</div>
        <div class="submit-btn ml-3" @click="submitPayment">
          <v-progress-circular
            v-if="loading"
            color="white"
            indeterminate
            size="20"
            width="2"
          />
          <span v-else>Continue to Checkout</span>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>
