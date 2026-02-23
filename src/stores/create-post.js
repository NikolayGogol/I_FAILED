import { defineStore } from 'pinia'

export const useCreatePostStore = defineStore('createPost', {
  state: () => ({
    stepOne: {
      selectedCategories: [],
    },
    stepTwo: {
      title: '',
      description: '',
      date: null,
      whatWentWrong: '',
      howDidItFeel: '',
      images: [],
    },
    stepThree: {
      whatILearned: '',
      keyTakeaways: '',
      whatIdDoDifferently: '',
      advice: '',
    },
    stepFour: {
      cost: '',
      recoveryTime: null,
      emotionTags: [],
      tags: [],
    },
    stepFive: {
      isAnonymous: false,
      visibility: 'Public',
      allowComments: true,
      enableTriggerWarning: false,
      scheduleDate: null,
    },
  }),
  actions: {},
})
