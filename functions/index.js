const logger = require('firebase-functions/logger')
// 1. Імпортуємо setGlobalOptions
const { setGlobalOptions } = require('firebase-functions/v2')
const { onRequest } = require('firebase-functions/v2/https')

// 2. Налаштовуємо глобальні опції для ВСІХ функцій у цьому файлі
// invoker: 'public' автоматично додає роль allUsers при деплої
setGlobalOptions({
  region: 'us-central1', // краще вказати регіон явно
  invoker: 'public',
})

exports.helloWorld = onRequest({ cors: true }, (request, response) => {
  console.log(2)
  logger.info('Hello logs!', { structuredData: true })
  response.json({
    message: 'Hello from Firebase!',
    timestamp: new Date().toISOString(),
    query: request.query,
  })
})

// Будь-яка наступна функція також буде публічною автоматично
exports.anotherFunction = onRequest({ cors: true }, (req, res) => {
  res.send('I am also public thanks to global options!')
})
