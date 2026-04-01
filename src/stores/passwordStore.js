import { defineStore } from 'pinia'
import { ref } from 'vue'
import { auth, EmailAuthProvider, reauthenticateWithCredential } from '@/firebase' // Додано імпорти Firebase
import { useAuthStore } from './auth' // Додано імпорт authStore

export const usePasswordStore = defineStore('password', () => {
  const currentPassword = ref('')
  const newPassword = ref('')
  const confirmPassword = ref('')
  const isLoading = ref(false)
  const error = ref(null)
  const successMessage = ref(null)

  async function changePassword () {
    const authStore = useAuthStore() // Отримуємо екземпляр authStore
    isLoading.value = true
    error.value = null
    successMessage.value = null

    if (newPassword.value !== confirmPassword.value) {
      error.value = 'New password and confirm password do not match.'
      isLoading.value = false
      return
    }

    // Перевірка, чи користувач увійшов
    if (!auth.currentUser) {
      error.value = 'No user is currently logged in.'
      isLoading.value = false
      return
    }

    try {
      // Крок 1: Повторна автентифікація користувача
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword.value)
      await reauthenticateWithCredential(auth.currentUser, credential)

      // Крок 2: Оновлення пароля через authStore
      await authStore.updateUserPassword(newPassword.value)

      successMessage.value = 'Password changed successfully!'
      // Очистити форму
      currentPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
    } catch (err) {
      // Обробка помилок Firebase
      error.value = authStore.getErrorMessage(err.code) || 'Failed to change password. Please check your current password.'
    } finally {
      isLoading.value = false
    }
  }

  return {
    currentPassword,
    newPassword,
    confirmPassword,
    isLoading,
    error,
    successMessage,
    changePassword,
  }
})
