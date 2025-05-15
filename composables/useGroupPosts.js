import { ref } from 'vue'
import axios from '~/src/utils/axios'

export function useGroupPosts(groupId) {
  const posts = ref([])
  const isLoadingPosts = ref(true)
  const selectedPost = ref(null)


  // 1. FETCH POSTS


  // Fetch all posts for the group
  const fetchPosts = async () => {
    try {
      isLoadingPosts.value = true
      const response = await axios.get(`/groups/${groupId}/posts`)
      posts.value = response.data.posts || response.data // Handle different API response formats
      console.log("Fetched posts:", posts.value)
      return posts.value
    } catch (error) {
      console.error('Failed to fetch posts:', error)
      alert('Failed to fetch posts')
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
      
      // If we received FormData, use it directly
      let dataToSend = postData;
      
      // If we received a plain object, convert it to FormData
      if (!(postData instanceof FormData)) {
        dataToSend = new FormData();
        dataToSend.append('title', postData.title);
        dataToSend.append('content', postData.content);
        
        // Add these fields only if they're not already in the FormData
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
        // If it's already FormData, make sure groupId is included
        if (!postData.has('groupId')) {
          dataToSend.append('groupId', groupId);
        }
        
        if (!postData.has('type')) {
          dataToSend.append('type', 'group');
        }
      }
      
      console.log('Sending request to:', `/groups/${groupId}/posts`);
      
      // Create post
      const response = await axios.post(`/groups/${groupId}/posts`, dataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Post created successfully:', response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to create post:', err);
      console.error('Error response:', err.response?.data);
      alert('Failed to create post: ' + (err.response?.data?.error || err.message));
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
      
      // Extract only the fields we want to update
      const updateData = {
        title: post.title,
        content: post.content,
        isPublic: post.isPublic,
        file_url: post.file_url // Add file_url to the update data
      };
      
      console.log('Sending update data to backend:', updateData);
      
      // Call API to update post
      const response = await axios.put(`/posts/${post.id}`, updateData);
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
      alert('Failed to update post: ' + (err.response?.data?.error || err.message));
      throw err;
    }
  }
  
  // 4. DELETE A POST


  // Delete a post
  const deletePost = async (post) => {
    try {
      // Confirm before deleting
      if (!confirm('Are you sure you want to delete this post?')) return
      
      // Call API to delete the post
      await axios.delete(`/posts/${post.id}`)
      
      // Remove post from list
      const index = posts.value.findIndex(p => p.id === post.id)
      if (index !== -1) {
        posts.value.splice(index, 1)
      }
      
      // Close dialog if it was open
      if (selectedPost.value?.id === post.id) {
        selectedPost.value = null
      }
      
      alert('Post deleted successfully')
    } catch (err) {
      console.error('Failed to delete post:', err)
      alert('Failed to delete post: ' + (err.response?.data?.error || err.message))
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