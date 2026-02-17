import axios from 'axios'
import { useToast } from 'vue-toastification'

const toast = useToast()

const api = axios.create({
  baseURL: import.meta.env.VITE_FIREBASE_BASE_URL || 'https://us-central1-ifailed-69373.cloudfunctions.net',
})

api.interceptors.request.use(
  config => {
    // Тут можна додати токен авторизації, якщо потрібно
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
  error => {
    const message = error.response?.data?.message || error.message || 'An error occurred'
    toast.error(message)
    return Promise.reject(error)
  },
)

export default api
