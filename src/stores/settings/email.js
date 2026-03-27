import { defineStore } from 'pinia'
import { reactive, ref, watch } from 'vue'
import { db, doc, getDoc, setDoc } from '@/firebase'
import { useAuthStore } from '@/stores/auth'

const USER_COLLECTION = import.meta.env.VITE_USERS_COLLECTION

export const useEmailSettingsStore = defineStore('emailSettings', () => {
  const authStore = useAuthStore()

  const switches = reactive([
    {
      label: 'Likes',
      state: false,
      value: 0,
    },
    {
      label: 'Comments',
      state: false,
      value: 1,
    },
    {
      label: 'Mentions',
      state: false,
      value: 2,
    },
    {
      label: 'New followers',
      state: false,
      value: 3,
    },
  ])
  const selectedRadio = ref(null)

  async function loadSettings () {
    if (!authStore.user) {
      return
    }

    const userRef = doc(db, USER_COLLECTION, authStore.user.uid)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const settings = userDoc.data().settings?.notify?.email
      if (settings) {
        if (settings.switches) {
          for (const loadedSwitch of settings.switches) {
            const localSwitch = switches.find(s => s.label === loadedSwitch.label)
            if (localSwitch) {
              Object.assign(localSwitch, loadedSwitch)
            }
          }
        }
        if (settings.selectedRadio) {
          selectedRadio.value = settings.selectedRadio
        }
      }
    }
  }

  async function saveSettings () {
    if (!authStore.user) {
      return
    }
    const userRef = doc(db, USER_COLLECTION, authStore.user.uid)
    const settings = {
      settings: {
        notify: {
          email: {
            switches: JSON.parse(JSON.stringify(switches)),
            selectedRadio: selectedRadio.value,
          },
        },
      },
    }
    await setDoc(userRef, settings, { merge: true })
  }

  watch(switches, saveSettings, { deep: true })
  watch(selectedRadio, saveSettings)

  // Load settings when the store is initialized
  loadSettings()

  return {
    switches,
    selectedRadio,
    loadSettings,
  }
})
