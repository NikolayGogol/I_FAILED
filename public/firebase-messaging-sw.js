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
    const notificationTitle = payload.notification?.title || payload.data?.title

    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || '',
      icon: '/Logo.png',
      data: {
        url: payload.data?.url, // Pass the URL to the notification
      },
    }
    self.registration.showNotification(notificationTitle, notificationOptions)
  })

  self.addEventListener('notificationclick', event => {
    event.notification.close() // Close the notification

    const urlToOpen = event.notification.data?.url
    if (urlToOpen) {
      event.waitUntil(

        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
          // Check if a window is already open and focus it.
          for (const client of windowClients) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus()
            }
          }
          // If no window is open, open a new one.
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen)
          }
        }),
      )
    }
  })
}
