importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js', 'https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js')

const params = new URL(location).searchParams

const firebaseConfig = {
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  storageBucket: params.get('storageBucket'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
}

// Only initialize if we have the config from URL parameters
if (firebaseConfig.apiKey) {
  firebase.initializeApp(firebaseConfig)

  const messaging = firebase.messaging()

  messaging.onBackgroundMessage(payload => {
    console.log('[firebase-messaging-sw.js] Received background message', payload)
    const notificationTitle = payload.notification?.title || payload.data?.title || 'Нове сповіщення'
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || '',
      icon: '/Logo.png',
    }

    self.registration.showNotification(notificationTitle, notificationOptions)
  })
}
