import { ref } from 'vue'
import axios from '~/src/utils/axios'

export function useUserPosts() {
  const posts = ref([])
  const isLoadingPosts = ref(true)
  const selectedPost = ref(null)

  // Fetch all posts for the user
  const fetchPosts = async () => {
    try {
      isLoadingPosts.value = true
      const response = await axios.get('/users/me/posts')
      posts.value = response.data.posts || response.data || []
      return posts.value
    } catch (error) {
      console.error('Failed to fetch user posts:', error)
      return []
    } finally {
      isLoadingPosts.value = false
    }
  }

  // Create a new post
  const createNewPost = async (postData) => {
    try {
      // Handle FormData or plain object
      let dataToSend = postData
      
      if (!(postData instanceof FormData)) {
        dataToSend = new FormData()
        dataToSend.append('title', postData.title)
        dataToSend.append('content', postData.content)
        dataToSend.append('isPublic', postData.isPublic)
        
        if (postData.file) {
          dataToSend.append('file', postData.file)
        }
      }
      
      // Create post
      const response = await axios.post('/users/me/posts', dataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      return response.data
    } catch (error) {
      console.error('Failed to create post:', error)
      throw error
    }
  }

  // Handle post creation success
  const handlePostCreated = (newPost) => {
    // Add to the beginning of the list
    posts.value.unshift(newPost)
  }

  // Edit a post
  const editPost = async (post) => {
    try {
      const response = await axios.put(`/posts/${post.id}`, post)
      
      // Update post in the list
      const index = posts.value.findIndex(p => p.id === post.id)
      if (index !== -1) {
        posts.value[index] = response.data
      }
      
      return response.data
    } catch (error) {
      console.error('Failed to update post:', error)
      throw error
    }
  }

  // Delete a post
  const deletePost = async (post) => {
    try {
      await axios.delete(`/posts/${post.id}`)
      
      // Remove post from list
      const index = posts.value.findIndex(p => p.id === post.id)
      if (index !== -1) {
        posts.value.splice(index, 1)
      }
      
      // Reset selectedPost if needed
      if (selectedPost.value?.id === post.id) {
        selectedPost.value = null
      }
      
      return true
    } catch (error) {
      console.error('Failed to delete post:', error)
      throw error
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
    isLoadingPosts,
    selectedPost,
    fetchPosts,
    createNewPost,
    handlePostCreated,
    editPost,
    deletePost,
    toggleLike
  }
}