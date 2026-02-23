import { categories, emotionTags, recoveryTimeOptions } from '@/models/categories.js'

const { faker } = await import('https://esm.sh/@faker-js/faker')

export function fakeStepOne () {
  const count = faker.number.int({ min: 1, max: categories.length })
  return getRandomElsFromArr(categories, count)
}

function getRandomElsFromArr (arr, count) {
  const shuffled = [...arr].toSorted(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

export function fakeStepTwo () {
  return {
    title: faker.lorem.words(10),
    description: generateRichHtml(3),
    date: new Date(),
    whatWentWrong: generateRichHtml(4),
    howDidItFeel: generateRichHtml(1),
    images: [],
  }
}

function generateRichHtml (paragraphsCount = 2) {
  const result = []

  for (let i = 0; i < paragraphsCount; i++) {
    result.push(`<p><strong>${faker.lorem.sentence()}</strong></p>`)
    const sentence = faker.lorem.sentence()
    const italicWord = `<em>${faker.lorem.word()}</em>`
    result.push(`<p>${sentence.replace(' ', ` ${italicWord} `)}</p>`)
    const listItems = Array.from({ length: 3 }, () => `<li>${faker.lorem.words(3)}</li>`).join('')
    result.push(`<ul>${listItems}</ul>`)
    result.push(`<p><a href="#">${faker.lorem.words(2)}</a> — ${faker.lorem.sentence()}</p>`)
  }

  return result.join('\n')
}

export function fakeStepThree () {
  return {
    whatILearned: faker.lorem.words(10),
    keyTakeaways: generateRichHtml(2),
    whatIdDoDifferently: generateRichHtml(2),
    advice: generateRichHtml(2),
  }
}

export function fakeStepFour () {
  const countRecovery = faker.number.int({ min: 0, max: recoveryTimeOptions.length })
  const countEmotion = faker.number.int({ min: 1, max: emotionTags.length })

  return {
    cost: faker.finance.amount(),
    recoveryTime: recoveryTimeOptions[countRecovery],
    emotionTags: getRandomElsFromArr(emotionTags, countEmotion),
    tags: [
      faker.lorem.word(),
      faker.lorem.word(),
      faker.lorem.word(),
      faker.lorem.word(),
      faker.lorem.word(),
      faker.lorem.word(),
    ],
  }
}
