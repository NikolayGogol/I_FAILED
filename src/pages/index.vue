<template>
  <v-container>
    <v-row v-if="authStore.user">
      <v-col cols="12">
        <h1>Welcome, {{ authStore.user?.displayName || 'User' }}!</h1>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <p>
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Adipisci aliquam amet aperiam cumque dolorem et harum
          illo, in incidunt molestiae non pariatur perferendis quae quisquam sed unde velit, voluptate voluptates.
        </p>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-btn v-if="authStore.user" color="error" @click="handleLogout">
          Logout
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()
  const router = useRouter()

  async function handleLogout () {
    await authStore.logout()
    router.push('/login')
  }
</script>
