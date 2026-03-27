/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Composables
import { createApp } from 'vue'

import Toast, { POSITION } from 'vue-toastification'

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'
// Styles
import 'unfonts.css'
import 'vue-toastification/dist/index.css'

const app = createApp(App)

const toastOptions = {
  position: POSITION.BOTTOM_CENTER,
}

registerPlugins(app)
app.use(Toast, toastOptions)

app.mount('#app')

// Register Firebase Messaging Service Worker
if ('serviceWorker' in navigator) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }

  const firebaseConfigParams = new URLSearchParams(firebaseConfig).toString()

  navigator.serviceWorker
    .register(`/firebase-messaging-sw.js?${firebaseConfigParams}`)
    .then(registration => {
      console.log('Service Worker registered with scope:', registration.scope)
    })
    .catch(error => {
      console.error('Service Worker registration failed:', error)
    })
}
