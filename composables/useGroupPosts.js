import { ref } from 'vue'
// import axios from '~/src/utils/axios' // REMOVED OLD AXIOS IMPORT
import { useNuxtApp } from '#app'

export function useGroupPosts(groupId) {
  const posts = ref([])
  const isLoadingPosts = ref(true)
  const selectedPost = ref(null)

  // Helper function to get axios instance
  const getAxiosInstance = () => {
    if (process.client) {
      const { $axiosInstance } = useNuxtApp()
      if ($axiosInstance) {
        return $axiosInstance
      }
    }
    throw new Error('Axios instance not available')
  }

  // 1. FETCH POSTS


  // Fetch all posts for the group
  const fetchPosts = async () => {
    try {
      isLoadingPosts.value = true
      const axiosInstance = getAxiosInstance()
      const response = await axiosInstance.get(`/api/groups/${groupId}/posts`)
      posts.value = response.data.posts || response.data // Handle different API response formats
      console.log("Fetched posts:", posts.value)
      return posts.value
    } catch (error) {
      console.error('Failed to fetch posts:', error)
      throw error
    } finally {
      isLoadingPosts.value = false
    }
  }

  // 2. CREATE A NEW POST


  // Create a new post
  const createNewPost = async (postData) => {
    try {
      console.log('Creating new post with data:', postData);
      
      let dataToSend = postData;
      
      if (!(postData instanceof FormData)) {
        dataToSend = new FormData();
        dataToSend.append('title', postData.title);
        dataToSend.append('content', postData.content);
        
        if (!postData.has || !postData.has('type')) {
          dataToSend.append('type', 'group');
        }
        
        if (!postData.has || !postData.has('groupId')) {
          dataToSend.append('groupId', groupId);
        }
        
        if (postData.file) {
          dataToSend.append('file', postData.file);
        }
        
        if (postData.isPublic !== undefined) {
          dataToSend.append('isPublic', postData.isPublic);
        }
      } else {
        if (!postData.has('groupId')) {
          dataToSend.append('groupId', groupId);
        }
        
        if (!postData.has('type')) {
          dataToSend.append('type', 'group');
        }
      }
      
      console.log('Sending request to:', `/api/groups/${groupId}/posts`);
      
      const axiosInstance = getAxiosInstance()
      const response = await axiosInstance.post(`/api/groups/${groupId}/posts`, dataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Post created successfully:', response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to create post:', err);
      console.error('Error response:', err.response?.data);
      throw err;
    }
  }

  // Handle post creation success
  const handlePostCreated = (newPost) => {
    // Add new post to the list
    posts.value.unshift(newPost)
  }

  // Open post details
  const openPostDetails = (post) => {
    selectedPost.value = post
  }

  // 3. EDIT A POST


  // Edit a post
  const editPost = async (post) => {
    try {
      console.log('Updating post with data:', post);
      
      const updateData = {
        title: post.title,
        content: post.content,
        isPublic: post.isPublic,
        file_url: post.file_url
      };
      
      console.log('Sending update data to backend:', updateData);
      
      const axiosInstance = getAxiosInstance()
      const response = await axiosInstance.put(`/api/posts/${post.id}`, updateData);
      console.log('Post updated successfully:', response.data);
      
      // Update post in the list
      const index = posts.value.findIndex(p => p.id === post.id);
      if (index !== -1) {
        posts.value[index] = response.data;
      }
      
      return response.data;
    } catch (err) {
      console.error('Failed to update post:', err);
      console.error('Error response:', err.response?.data);
      throw err;
    }
  }
  
  // 4. DELETE A POST


  // Delete a post
  const deletePost = async (post) => {
    try {
      // Call API to delete the post
      const axiosInstance = getAxiosInstance()
      await axiosInstance.delete(`/api/posts/${post.id}`)
      
      // Remove post from list
      const index = posts.value.findIndex(p => p.id === post.id)
      if (index !== -1) {
        posts.value.splice(index, 1)
      }
      
      // Close dialog if it was open
      if (selectedPost.value?.id === post.id) {
        selectedPost.value = null
      }
    } catch (err) {
      console.error('Failed to delete post:', err)
      throw err
    }
  }

  return {
    posts,
    isLoadingPosts,
    selectedPost,
    fetchPosts,
    createNewPost,
    handlePostCreated,
    openPostDetails,
    editPost,
    deletePost
  }
}