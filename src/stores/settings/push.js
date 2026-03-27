import { defineStore } from 'pinia'
import { reactive, watch } from 'vue'
import { db, doc, getDoc, getToken, messaging, onMessage, setDoc } from '@/firebase'
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

    // Check if any switch is on and request permission if needed
    if (switches.some(s => s.state)) {
      await requestPushPermission()
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

    // If any switch is turned on, request permission and save token
    if (switches.some(s => s.state)) {
      const token = await requestPushPermission()
      if (token) {
        settings.fcmToken = token // save FCM token to user doc
      }
    } else {
      // if all are off, you might want to remove token from db, but keeping it is fine too
      settings.fcmToken = null
    }

    await setDoc(userRef, settings, { merge: true })
  }

  async function requestPushPermission () {
    if (!messaging) {
      console.error('Firebase Messaging is not initialized.')
      return null
    }

    try {
      // 1. Request permission from the user
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        console.log('Notification permission was not granted.')
        return null
      }

      // 2. Get the active service worker registration.
      console.log('Waiting for service worker to be ready...')
      const registration = await navigator.serviceWorker.ready
      console.log('Service worker is ready:', registration)

      if (!registration.pushManager) {
        console.error('PushManager is not available in the current service worker registration.')
        return null
      }

      // 3. Get the token.
      console.log('Attempting to get FCM token with VAPID key and registration...')
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      })

      if (token) {
        setupMessageListener()
        return token
      } else {
        console.log('Could not get registration token. Check your VAPID key and service worker.')
        return null
      }
    } catch (error) {
      console.error('An error occurred while retrieving token:', error)
      return null
    }
  }

  function setupMessageListener () {
    if (!messaging) {
      return
    }

    onMessage(messaging, payload => {
      console.log('Message received while app is in foreground:', payload)
      const notificationType = payload.data?.type

      // Map incoming type to a local switch to check if we should display it
      let shouldShow = false

      switch (notificationType) {
        case 'like': {
          shouldShow = switches[0].state
          break
        }
        case 'comment': {
          shouldShow = switches[1].state
          break
        }
        case 'mention': {
          shouldShow = switches[2].state
          break
        }
        case 'follower': {
          shouldShow = switches[3].state
          break
        }
      }

      if (shouldShow && payload.notification && Notification.permission === 'granted') {
        new Notification(payload.notification.title, { body: payload.notification.body })
      }
    })
  }

  watch(switches, saveSettings, { deep: true })

  // Load settings when the store is initialized
  loadSettings()

  return {
    switches,
    loadSettings,
    requestPushPermission,
  }
})
