import { ref } from 'vue'
import axios from '~/src/utils/axios'

export function useUserPosts(userId = null) {
  const posts = ref([])
  const loading = ref(false)
  const error = ref(null)
  const selectedPost = ref(null)

  // Fetch posts for current user or specified user
  const fetchPosts = async (specificUserId = null) => {
    try {
      loading.value = true
      error.value = null
      
      // Determine which user's posts to fetch
      const targetUserId = specificUserId || userId || 'me'
      const endpoint = targetUserId === 'me' 
        ? '/users/me/posts' 
        : `/users/${targetUserId}/posts`
      
      const response = await axios.get(endpoint)
      posts.value = response.data.posts || response.data || []
      return posts.value
    } catch (err) {
      console.error('Failed to fetch posts:', err)
      error.value = err.response?.data?.error || 'Failed to load posts'
      posts.value = []
    } finally {
      loading.value = false
    }
  }

  // Create a new post
  const createNewPost = async (postData) => {
    try {
      // If we received FormData, use it directly
      let dataToSend = postData
      
      // If we received a plain object, convert it to FormData
      if (!(postData instanceof FormData)) {
        dataToSend = new FormData()
        dataToSend.append('title', postData.title)
        dataToSend.append('content', postData.content)
        
        if (postData.file) {
          dataToSend.append('file', postData.file)
        }
      }
      
      const response = await axios.post(`/users/me/posts`, dataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      return response.data
    } catch (err) {
      console.error('Failed to create post:', err)
      throw err
    }
  }

  // Add a new post to the list
  const handlePostCreated = (newPost) => {
    posts.value = [newPost, ...posts.value]
  }

  // Edit an existing post
  const editPost = async (post) => {
    try {
      const response = await axios.put(`/posts/${post.id}`, post)
      const updatedPost = response.data
      
      // Update the post in the list
      const index = posts.value.findIndex(p => p.id === updatedPost.id)
      if (index !== -1) {
        posts.value[index] = updatedPost
      }
      
      return updatedPost
    } catch (err) {
      console.error('Failed to edit post:', err)
      throw err
    }
  }

  // Delete a post
  const deletePost = async (post) => {
    try {
      await axios.delete(`/posts/${post.id}`)
      
      // Remove the post from the list
      posts.value = posts.value.filter(p => p.id !== post.id)
      
      // Reset selectedPost if needed
      if (selectedPost.value?.id === post.id) {
        selectedPost.value = null
      }
      
      return true
    } catch (err) {
      console.error('Failed to delete post:', err)
      throw err
    }
  }

  // Toggle like on a post
  const toggleLike = async (post) => {
    try {
      const response = await axios.post(`/posts/${post.id}/like`)
      
      // Update post likes in the list
      const index = posts.value.findIndex(p => p.id === post.id)
      if (index !== -1 && response.data.likes) {
        posts.value[index].likes = response.data.likes
      }
      
      return response.data
    } catch (error) {
      console.error('Failed to toggle like:', error)
      throw error
    }
  }

  return {
    posts,
    loading,
    error,
    selectedPost,
    fetchPosts,
    createNewPost,
    handlePostCreated,
    editPost,
    deletePost,
    toggleLike
  }
}