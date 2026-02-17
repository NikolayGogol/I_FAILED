<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" md="4" sm="8">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>Login</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form>
              <v-text-field
                label="Login"
                name="login"
                prepend-icon="mdi-account"
                type="text"
              />

              <v-text-field
                id="password"
                label="Password"
                name="password"
                prepend-icon="mdi-lock"
                type="password"
              />
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="primary" to="/register">Register</v-btn>
            <v-btn color="primary" to="/forgot-password">Forgot Password</v-btn>
            <v-btn color="primary">Login</v-btn>
          </v-card-actions>
          <v-divider />
          <v-card-actions class="justify-center pa-4">
            <v-btn
              color="error"
              :loading="authStore.loading"
              prepend-icon="mdi-google"
              variant="outlined"
              @click="handleGoogleSignIn"
            >
              Sign in with Google
            </v-btn>
          </v-card-actions>
          <v-divider />
          <v-card-actions class="justify-center pa-4">
            <v-btn
              color="secondary"
              variant="outlined"
              @click="testCloudFunction"
            >
              Test Cloud Function
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'

  const router = useRouter()
  const authStore = useAuthStore()

  async function handleGoogleSignIn () {
    await authStore.signInWithGoogle()
    if (authStore.user) {
      router.push('/')
    }
  }

  async function testCloudFunction () {
    try {
      // Note: 'helloWorld' is an onRequest function, so we should fetch it via URL.
      // However, if you want to call it via SDK, it should be an onCall function.
      // For this example, we'll just fetch the URL.
      // Replace with your actual function URL or use onCall if you change the function type.

      // Assuming you want to test the 'helloWorld' function we created earlier:
      const baseUrl = import.meta.env.VITE_FIREBASE_BASE_URL || 'https://us-central1-ifailed-69373.cloudfunctions.net'
      const response = await fetch(`${baseUrl}/helloWorld`)
      const data = await response.json()
      console.log('Cloud Function response:', data)
      alert(JSON.stringify(data))
    } catch (error) {
      console.error('Error calling Cloud Function:', error)
      alert('Error calling Cloud Function')
    }
  }
</script>
