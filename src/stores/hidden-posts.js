import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/auth.js'
import { useSinglePostStore } from '@/stores/single-post/single-post.js'
import { useUserStore } from '@/stores/user.js'

export const useHiddenPostsStore = defineStore('hiddenPosts', {
  state: () => ({
    posts: [],
  }),
  actions: {
    async getHiddenPosts () {
      const auth = useAuthStore()
      const userStore = useUserStore()
      const singlePost = useSinglePostStore()

      const userInfo = await userStore.getUserById(auth.user.uid)
      if (!userInfo) {
        console.warn('User info not found')
        this.posts = []
        return
      }

      if (!userInfo.mutedPosts || userInfo.mutedPosts.length === 0) {
        console.warn('No hidden posts')
        this.posts = []
        return
      }

      const postPromises = userInfo.mutedPosts.map(async id => {
        const res = await singlePost.getPostById(id)
        if (res && typeof res === 'object' && res.id) {
          res.user = await userStore.getUserById(res.uid)
          if (res.user) {
            return res
          }
        }
        return null
      })

      const posts = await Promise.all(postPromises)

      this.posts = posts.filter(post => post !== null)
      return this.posts
    },
  },
})
