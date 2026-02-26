import axios from 'axios'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'

const toast = useToast()

const api = axios.create({
  baseURL: import.meta.env.VITE_FIREBASE_BASE_URL || 'http://127.0.0.1:5001/ifailed-69373/us-central1/api',
})

api.interceptors.request.use(
  config => {
    // ADDING THIS LINE TO DEBUG THE URL
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
      // The interceptor already shows a toast on error, which is good.
    }

    throw error
  },
)

export default api
