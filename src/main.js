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
