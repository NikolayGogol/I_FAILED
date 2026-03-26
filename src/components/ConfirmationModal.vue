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
          <div
            class="cancel-btn"
            :class="{'opacity-60 pointer-events-none': loading}"
            @click="$emit('cancel')"
          >
            Cancel
          </div>
        </v-col>
        <v-col>
          <div
            class="submit-btn"
            :class="{'opacity-60 pointer-events-none': loading}"
            @click="$emit('confirm')"
          >
            <v-progress-circular
              v-if="loading"
              class="mr-2"
              indeterminate
              size="20"
              width="2"
            />
            <span v-else>Confirm</span>
          </div>
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
    loading: {
      type: Boolean,
      default: false,
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
