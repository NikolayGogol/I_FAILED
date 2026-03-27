import { defineStore } from 'pinia'
import { reactive, watch } from 'vue'
import { db, doc, getDoc, setDoc } from '@/firebase'
import { useAuthStore } from '@/stores/auth'

const USER_COLLECTION = import.meta.env.VITE_USERS_COLLECTION

export const usePushSettingsStore = defineStore('pushSettings', () => {
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

  async function loadSettings () {
    if (!authStore.user) {
      return
    }

    const userRef = doc(db, USER_COLLECTION, authStore.user.uid)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const settings = userDoc.data().settings?.notify?.push
      if (settings && settings.switches) {
        for (const loadedSwitch of settings.switches) {
          const localSwitch = switches.find(s => s.label === loadedSwitch.label)
          if (localSwitch) {
            Object.assign(localSwitch, loadedSwitch)
          }
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
          push: {
            switches: JSON.parse(JSON.stringify(switches)),
          },
        },
      },
    }
    await setDoc(userRef, settings, { merge: true })
  }

  watch(switches, saveSettings, { deep: true })

  // Load settings when the store is initialized
  loadSettings()

  return {
    switches,
    loadSettings,
  }
})
