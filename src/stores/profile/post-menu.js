import { defineStore } from 'pinia'
import { useFeedStore } from '@/stores/feed.js'
import { useWhoToFollowStore } from '@/stores/who-to-follow.js'

export const usePostMenuStore = defineStore('postMenu', {
  actions: {
    async mutePost (postId) {
      const feedStore = useFeedStore()
      return await feedStore.mutePost(postId)
    },

    async unmutePost (postId) {
      const feedStore = useFeedStore()
      return await feedStore.unmutePost(postId)
    },

    async followUser (userId) {
      const whoToFollowStore = useWhoToFollowStore()
      return await whoToFollowStore.followUser(userId)
    },

    async unfollowUser (userId) {
      const whoToFollowStore = useWhoToFollowStore()
      return await whoToFollowStore.unfollowUser(userId)
    },

    async blockUser (userId) {
      const whoToFollowStore = useWhoToFollowStore()
      return await whoToFollowStore.blockUser(userId)
    },

    async unblockUser (userId) {
      const whoToFollowStore = useWhoToFollowStore()
      return await whoToFollowStore.unblockUser(userId)
    },
  },
})
