<template>
  <v-dialog
    max-width="400"
    :model-value="show"
    @update:model-value="$emit('update:show', $event)"
  >
    <v-card class="logout-dialog-card py-6">
      <v-card-title class="text-center">{{ title }}</v-card-title>
      <v-card-text class="text-center pt-0">
        {{ message }}
      </v-card-text>
      <v-row class="px-6">
        <v-col>
          <div class="cancel-btn" @click="$emit('cancel')">Cancel</div>
        </v-col>
        <v-col>
          <div
            class="submit-btn"
            @click="$emit('confirm')"
          >Confirm</div>
        </v-col>
      </v-row>
    </v-card>
  </v-dialog>
</template>

<script setup>
  defineProps({
    show: {
      type: Boolean,
      required: true,
    },
    title: {
      type: String,
      default: 'Confirm Action',
    },
    message: {
      type: String,
      default: 'Are you sure you want to perform this action?',
    },
    confirmText: {
      type: String,
      default: 'Confirm',
    },
    confirmColor: {
      type: String,
      default: 'red',
    },
  })

  defineEmits(['update:show', 'confirm', 'cancel'])
</script>
