import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db, doc, getDoc, setDoc } from '@/firebase'
import { useAuthStore } from '@/stores/auth'

const USER_COLLECTION = import.meta.env.VITE_USERS_COLLECTION

export const useDoNotDisturbStore = defineStore('do-not-disturb', () => {
  const authStore = useAuthStore()

  const doNotDisturb = ref({
    from: null,
    to: null,
    timezone: null,
  })

  async function loadSettings () {
    if (!authStore.user?.uid) {
      return
    }

    const userRef = doc(db, USER_COLLECTION, authStore.user.uid)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const settings = userDoc.data().settings?.notify?.doNotDisturb
      if (settings) {
        doNotDisturb.value = settings
      }
    }
  }

  async function setDoNotDisturb (from, to) {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const plainFrom = from ? { hours: from.hours, minutes: from.minutes } : null
    const plainTo = to ? { hours: to.hours, minutes: to.minutes } : null

    const newSettings = { from: plainFrom, to: plainTo, timezone }
    doNotDisturb.value = newSettings

    if (authStore.user?.uid) {
      const userDocRef = doc(db, USER_COLLECTION, authStore.user.uid)
      await setDoc(userDocRef, {
        settings: {
          notify: {
            doNotDisturb: newSettings,
          },
        },
      }, { merge: true })
    }
  }

  // Load settings on store initialization
  loadSettings()

  return {
    doNotDisturb,
    setDoNotDisturb,
    loadSettings,
  }
})
