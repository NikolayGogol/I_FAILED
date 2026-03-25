import { defineStore } from 'pinia';
import api from '@/axios.js';
import { useAuthStore } from '@/stores/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase.js';

const USER_COLLECTION = import.meta.env.VITE_USERS_COLLECTION;

/**
 * Store for the "Latest" feed tab.
 */
export const useLatestStore = defineStore('latest', {
  state: () => ({
    posts: [],
    lastVisible: null,
    hasMore: true,
    loading: false,
    userCache: {},
    currentFilters: null,
  }),
  getters: {
    /**
     * Filters posts based on client-side rules, like "not interested" tags.
     * @param {object} state - The store's state.
     * @returns {Array} The filtered posts.
     */
    filteredPosts(state) {
      const authStore = useAuthStore();
      const notInterestedTags = authStore.user?.notInterestedTags || [];

      return state.posts.filter(post => {
        return !notInterestedTags.some(tag => post.tags?.includes(tag));
      });
    },
  },
  actions: {
    /**
     * Applies filters and refreshes the posts list.
     * @param {object} filters - The filters to apply.
     */
    applyPostFilters(filters) {
        this.currentFilters = filters;
        this.fetchPosts({ refresh: true });
    },
    /**
     * Fetches posts for the "Latest" feed with pagination.
     * @param {object} options - The options for fetching posts.
     * @param {number} options.pageSize - The number of posts to fetch.
     * @param {boolean} options.refresh - Whether to refresh the posts list.
     */
    async fetchPosts({ pageSize = 10, refresh = false } = {}) {
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
        const payload = {
          tab: 'latest',
          pageSize,
          cursor: this.lastVisible,
          filters: this.currentFilters,
        };

        const response = await api.post('posts/feed', payload);
        const { posts: backendPosts = [], nextCursorDocId = null, hasMore: hasMoreFromBackend = false } = response.data || {};

        this.lastVisible = nextCursorDocId;
        this.hasMore = hasMoreFromBackend;

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

        const newPosts = backendPosts.map(post => {
          if (post.uid && !post.isAnonymous) {
            post.user = { ...post.user, ...this.userCache[post.uid] };
          }
          return post;
        });

        this.posts.push(...newPosts);
      } catch (error) {
        console.error('Error fetching latest posts:', error);
        this.hasMore = false;
      } finally {
        this.loading = false;
      }
    },
  },
});
