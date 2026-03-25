import { defineStore } from 'pinia';
import api from '@/axios.js';
import { useAuthStore } from '@/stores/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase.js';

const USER_COLLECTION = import.meta.env.VITE_USERS_COLLECTION;

/**
 * Store for the "For You" feed tab.
 */
export const useForYouStore = defineStore('forYou', {
  state: () => ({
    posts: [],
    lastVisible: null,
    hasMore: true,
    loading: false,
    userCache: {},
  }),
  getters: {
    /**
     * Filters posts based on client-side rules, like "not interested" tags and own posts.
     * @param {object} state - The store's state.
     * @returns {Array} The filtered posts.
     */
    filteredPosts(state) {
      const authStore = useAuthStore();
      if (!authStore.user) {
        return state.posts; // Return all posts if user is not logged in
      }

      const notInterestedTags = authStore.user.notInterestedTags || [];
      const currentUserId = authStore.user.uid;

      return state.posts.filter(post => {
        // Exclude user's own posts
        if (post.uid === currentUserId) {
          return false;
        }
        // Exclude posts with tags the user is not interested in
        if (post.tags && post.tags.some(tag => notInterestedTags.includes(tag))) {
          return false;
        }
        return true;
      });
    },
  },
  actions: {
    /**
     * Fetches posts for the "For You" feed with pagination.
     * @param {object} options - The options for fetching posts.
     * @param {number} options.pageSize - The number of posts to fetch.
     * @param {boolean} options.refresh - Whether to refresh the posts list.
     */
    async fetchPosts({ pageSize = 10, refresh = false } = {}) {
      const authStore = useAuthStore();

      if (refresh) {
        this.posts = [];
        this.lastVisible = null;
        this.hasMore = true;
        this.loading = false;
      }

      if (this.loading || !this.hasMore) {
        return;
      }

      this.loading = true;

      try {
        // Prepare payload for the API request
        const payload = {
          tab: 'for-you',
          pageSize,
          cursor: this.lastVisible,
          followedUsers: authStore.user?.following || [],
          followedTags: authStore.user?.followedTags || [],
        };

        const response = await api.post('posts/feed', payload);
        const { posts: backendPosts = [], nextCursorDocId = null, hasMore: hasMoreFromBackend = false } = response.data || {};

        this.lastVisible = nextCursorDocId;
        this.hasMore = hasMoreFromBackend;

        // Cache user data to avoid repeated fetches
        const userUidsToFetch = new Set();
        for (const post of backendPosts) {
          if (post.uid && !post.isAnonymous && !this.userCache[post.uid]) {
            userUidsToFetch.add(post.uid);
          }
        }

        if (userUidsToFetch.size > 0) {
          await Promise.all(
            Array.from(userUidsToFetch).map(async uid => {
              try {
                const userRef = doc(db, USER_COLLECTION, uid);
                const userSnap = await getDoc(userRef);
                this.userCache[uid] = userSnap.exists() ? { ...userSnap.data(), uid } : { uid };
              } catch {
                this.userCache[uid] = { uid };
              }
            })
          );
        }

        // Map backend posts to include cached user data
        const newPosts = backendPosts.map(post => {
          if (post.uid && !post.isAnonymous) {
            post.user = { ...post.user, ...this.userCache[post.uid] };
          }
          return post;
        });

        this.posts.push(...newPosts);
      } catch (error) {
        console.error('Error fetching "For You" posts:', error);
        this.hasMore = false;
      } finally {
        this.loading = false;
      }
    },
  },
});
