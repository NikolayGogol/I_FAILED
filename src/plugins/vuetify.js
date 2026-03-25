/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Composables
import { createVuetify } from 'vuetify'
// Styles
import '@mdi/font/css/materialdesignicons.css'

import 'vuetify/styles'
const myCustomTheme = {
  dark: false,
  colors: {
    'primary': '#D65A1F',
    'secondary': '#F9EAD5',
    'danger': '#C8372B',
    'warning': '#6E240F',
    'orange-accent-1': '#F9EAD5',
    'grey-darken-4': '#454541',
    'grey-darken-3': '#1C1C1B',
  },
}
// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'myCustomTheme',
    themes: {
      myCustomTheme,
    },
  },
})
