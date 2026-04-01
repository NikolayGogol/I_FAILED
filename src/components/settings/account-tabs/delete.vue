<script setup>
  import { ref } from 'vue'
  import { useAccountStore } from '@/stores/account'
  import '@/styles/components/settings/notify-tabs/tab.scss'

  const emit = defineEmits(['back'])
  const dialog = ref(false)
  const loading = ref(false)
  const accountStore = useAccountStore()

  async function handleDelete () {
    loading.value = true
    const success = await accountStore.deleteAccount()
    if (success) {
      dialog.value = false
    }
    loading.value = false
  }
</script>

<template>
  <div class="notify-tab">
    <div class="d-flex tab-header" @click="emit('back')">
      <v-icon class="mr-6" icon="mdi-chevron-left" />
      <span>Delete account</span>
    </div>
    <div class="title mt-7">We will delete your account </div>
    <p class="text-description mt-3">
      Lorem ipsum dolor sit amet consectetur. Enim vitae egestas id malesuada diam ut aliquet enim. Velit id nunc penatibus nibh tortor nunc eleifend fermentum sit. Suspendisse cras sit nulla nullam diam ridiculus ut varius.
    </p>
    <div class="title mt-4">What’s happening?</div>
    <p class="text-description">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aperiam deleniti doloremque non quos repudiandae. Ab doloremque dolores dolorum facere fuga inventore iste labore minima mollitia soluta. Beatae cupiditate est ipsum.</p>
    <div class="d-flex mt-4">
      <div class="bg-danger text-white px-4 py-2 rounded-lg cursor-pointer" @click="dialog = true">Delete account</div>
    </div>

    <v-dialog v-model="dialog" max-width="400px" persistent>
      <v-card class="pa-4 rounded-xl">
        <v-card-title class="text-h6 text-center text-wrap">Permanently delete your account?</v-card-title>
        <p class="text-description text-center">This action cannot be undone.</p>
        <div class="d-flex justify-center mt-4">
          <div class="cancel-btn" @click="dialog = false">Cancel</div>
          <div class="submit-btn ml-3" @click="handleDelete">
            <v-progress-circular
              v-if="loading"
              class="mr-2"
              indeterminate
              size="20"
              width="2"
            />
            <span v-else>Delete</span>
          </div>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>
