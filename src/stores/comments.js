import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { deleteObject, getDownloadURL, getStorage, ref as storageRef, uploadBytes } from 'firebase/storage'
import { defineStore } from 'pinia'
import { db } from '@/firebase.js'
import { useSinglePostStore } from '@/stores/single-post/single-post.js'
import { useUserStore } from '@/stores/user.js'

// Firestore collection name from environment variables
const comments_collection = import.meta.env.VITE_COMMENTS

/**
 * Extracts user mentions from a given text.
 * @param {string} text - The text to parse for mentions.
 * @returns {Array<object>} - An array of mention objects, each with displayName and uid.
 */
function extractMentions (text) {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g
  const mentions = []
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    const displayName = match[1]
    let uid = match[2]
    if (uid) {
      uid = uid.replace(/[()]/g, '').trim()
    }

    mentions.push({
      displayName,
      uid,
    })
  }
  return mentions
}

export const useCommentsStore = defineStore('comments', {
  actions: {
    /**
     * Uploads an image for a comment to Firebase Storage.
     * @param {File} imageFile - The image file to upload.
     * @returns {Promise<string>} - The download URL of the uploaded image.
     */
    async uploadCommentImage (imageFile) {
      const storage = getStorage()
      const storagePath = `comment-images/${Date.now()}_${imageFile.name}`
      const imageRef = storageRef(storage, storagePath)
      await uploadBytes(imageRef, imageFile)
      return await getDownloadURL(imageRef)
    },

    /**
     * Deletes a comment image from Firebase Storage.
     * @param {string} imageUrl - The URL of the image to delete.
     */
    async deleteCommentImage (imageUrl) {
      if (!imageUrl) {
        return
      }
      const storage = getStorage()
      try {
        const imageRef = storageRef(storage, imageUrl)
        await deleteObject(imageRef)
      } catch (error) {
        // It's okay if the object doesn't exist.
        if (error.code !== 'storage/object-not-found') {
          console.error('Error deleting image:', error)
        }
      }
    },

    /**
     * Recursively deletes a comment and all its replies, including associated images.
     * @param {string} commentId - The ID of the root comment to delete.
     */
    async deleteCommentAndReplies (commentId) {
      const batch = writeBatch(db)
      const commentsToDelete = []

      // Recursive function to find all replies
      const findReplies = async id => {
        commentsToDelete.push(id)
        const q = query(collection(db, comments_collection), where('parentId', '==', id))
        const querySnapshot = await getDocs(q)
        const replies = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        for (const reply of replies) {
          await findReplies(reply.id)
        }
      }

      await findReplies(commentId)

      // Delete all found comments and their images
      for (const id of commentsToDelete) {
        const commentRef = doc(db, comments_collection, id)
        const commentSnap = await getDoc(commentRef)
        if (commentSnap.exists()) {
          const commentData = commentSnap.data()
          if (commentData.imageUrl) {
            await this.deleteCommentImage(commentData.imageUrl)
          }
          batch.delete(commentRef)
        }
      }

      await batch.commit()
    },

    /**
     * Adds a new comment to a post.
     * @param {string} postId - The ID of the post.
     * @param {object} user - The user object of the commenter.
     * @param {string} text - The comment text.
     * @param {string|null} imageUrl - The URL of the attached image, if any.
     * @returns {Promise<string>} - The ID of the newly created comment.
     */
    async addComment (postId, user, text, imageUrl = null) {
      const singlePostStore = useSinglePostStore()
      const post = await singlePostStore.getPostById(postId)

      if (!post || post === 'Post not found.') {
        throw new Error('Post not found for comment notification.')
      }

      const newCommentData = {
        postId,
        parentId: null,
        user: {
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL,
        },
        text,
        imageUrl,
        likes: [],
        createdAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, comments_collection), newCommentData)
      const commentId = docRef.id

      await singlePostStore.saveCommentAction(post, { id: commentId, text })

      // Handle mentions
      const mentions = extractMentions(text)
      if (mentions.length > 0) {
        const userStore = useUserStore()
        for (const mention of mentions) {
          if (mention.uid && mention.uid !== user.uid) {
            const mentionedUser = await userStore.getUserById(String(mention.uid).trim())
            if (mentionedUser) {
              const fullMentionedUser = { ...mentionedUser, uid: String(mention.uid).trim() }
              await singlePostStore.saveMentionAction(post, { id: commentId, text }, fullMentionedUser, user)
              await singlePostStore.sendMentionEmail(post, { id: commentId, text }, fullMentionedUser, user)
              await singlePostStore.sendMentionPush(post, fullMentionedUser)
            }
          }
        }
      }

      return commentId
    },

    /**
     * Updates an existing comment.
     * @param {string} commentId - The ID of the comment to update.
     * @param {string} newText - The new text for the comment.
     * @param {object} user - The user object of the person updating the comment.
     * @param {string|null|undefined} imageUrl - The new image URL, null to remove, or undefined to leave unchanged.
     */
    async updateComment (commentId, newText, user, imageUrl) {
      const commentRef = doc(db, comments_collection, commentId)
      const updateData = {
        text: newText,
        updatedAt: serverTimestamp(),
      }

      if (imageUrl !== undefined) {
        updateData.imageUrl = imageUrl
      }

      await updateDoc(commentRef, updateData)

      const commentSnap = await getDoc(commentRef)
      if (!commentSnap.exists()) {
        throw new Error('Comment not found after update.')
      }
      const comment = { id: commentSnap.id, ...commentSnap.data() }

      const singlePostStore = useSinglePostStore()
      const post = await singlePostStore.getPostById(comment.postId)
      if (!post || post === 'Post not found.') {
        throw new Error('Post not found for comment notification.')
      }

      // Handle mentions in the updated text
      const mentions = extractMentions(newText)
      if (mentions.length > 0) {
        const userStore = useUserStore()
        for (const mention of mentions) {
          if (mention.uid && mention.uid !== user.uid) {
            const mentionedUser = await userStore.getUserById(String(mention.uid).trim())
            if (mentionedUser) {
              const fullMentionedUser = { ...mentionedUser, uid: String(mention.uid).trim() }
              await singlePostStore.saveMentionAction(post, comment, fullMentionedUser, user)
              await singlePostStore.sendMentionEmail(post, comment, fullMentionedUser, user)
              await singlePostStore.sendMentionPush(post, fullMentionedUser)
            }
          }
        }
      }
    },

    /**
     * Adds a reply to a comment.
     * @param {string} postId - The ID of the post.
     * @param {string} parentId - The ID of the parent comment.
     * @param {object} user - The user object of the replier.
     * @param {string} text - The reply text.
     * @param {string|null} imageUrl - The URL of the attached image, if any.
     * @returns {Promise<string>} - The ID of the newly created reply.
     */
    async addReply (postId, parentId, user, text, imageUrl = null) {
      const singlePostStore = useSinglePostStore()
      const post = await singlePostStore.getPostById(postId)

      if (!post || post === 'Post not found.') {
        throw new Error('Post not found for reply notification.')
      }

      const newReplyData = {
        postId,
        parentId,
        user: {
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL,
        },
        text,
        imageUrl,
        likes: [],
        createdAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, comments_collection), newReplyData)
      const commentId = docRef.id // Reply is also a comment in the collection

      // Handle mentions
      const mentions = extractMentions(text)
      if (mentions.length > 0) {
        const userStore = useUserStore()
        for (const mention of mentions) {
          if (mention.uid && mention.uid !== user.uid) {
            const mentionedUser = await userStore.getUserById(String(mention.uid).trim())
            if (mentionedUser) {
              const fullMentionedUser = { ...mentionedUser, uid: String(mention.uid).trim() }
              await singlePostStore.saveMentionAction(post, { id: commentId, text }, fullMentionedUser, user)
              await singlePostStore.sendMentionEmail(post, { id: commentId, text }, fullMentionedUser, user)
              await singlePostStore.sendMentionPush(post, fullMentionedUser)
            }
          }
        }
      }
      return commentId
    },

    /**
     * Toggles a like on a comment.
     * @param {string} commentId - The ID of the comment.
     * @param {string} userId - The ID of the user toggling the like.
     * @param {boolean} isLiked - The current like status.
     */
    async toggleCommentLike (commentId, userId, isLiked) {
      const docRef = doc(db, comments_collection, commentId)
      await updateDoc(docRef, {
        likes: isLiked ? arrayRemove(userId) : arrayUnion(userId),
      })
    },

    /**
     * Fetches all comments for a given post.
     * @param {string} postId - The ID of the post.
     * @returns {Promise<Array<object>>} - An array of comment objects.
     */
    async getComments (postId) {
      try {
        const q = query(
          collection(db, comments_collection),
          where('postId', '==', postId),
          orderBy('createdAt', 'desc'),
        )
        const querySnapshot = await getDocs(q)
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      } catch (error) {
        console.error('Error getting comments:', error)
        return []
      }
    },
  },
})
