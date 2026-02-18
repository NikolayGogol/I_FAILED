import axios from 'axios'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'

const toast = useToast()

const api = axios.create({
  baseURL: import.meta.env.VITE_FIREBASE_BASE_URL || 'https://us-central1-ifailed-69373.cloudfunctions.net/api',
})

api.interceptors.request.use(
  config => {
    return config
  },
  error => {
    toast.error('Request error: ' + error.message)
    return Promise.reject(error)
  },
)

api.interceptors.response.use(
  response => {
    return response
  },
  async error => {
    const message = error.response?.data?.message || error.message || 'An error occurred'

    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore()
      toast.error('Session expired. Please login again.')
      await authStore.logout()
    } else {
      toast.error(message)
    }

    throw error
  },
)

export default api
