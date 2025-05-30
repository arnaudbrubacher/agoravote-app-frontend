<!-- components/group/tabs/PostsTab.vue -->
<template>
  <div class="mt-6 p-6">
    <!-- Use the shared PostsList component which handles lists of posts -->
    <PostsList
      :posts="posts"
      :loading="isLoadingPosts"
      :is-current-user="false"
      :is-group="true"
      :show-create-button="true"
      :create-button-disabled="!canCreatePosts"
      :disabled-tooltip-message="postCreationTooltip"
      @create-post="showNewPostDialog = true"
      @open-post="openPostDetails"
    />
  </div>
  
  <!-- New Post Dialog -->
  <NewPostDialog
    v-if="showNewPostDialog"
    @close="showNewPostDialog = false"
    @submit="handleCreatePost"
  />
  
  <!-- Post Details Dialog -->
  <PostDetailsDialog
    v-if="selectedPost"
    :post="selectedPost"
    :current-user-id="currentUserId"
    @close="selectedPost = null"
    @edit="handleEditPost"
    @delete="handleDeletePost"
    @refresh="fetchPosts"
  />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PostsList from '~/components/posts/Postslist.vue'
import NewPostDialog from '~/components/posts/NewPostDialog.vue'
import PostDetailsDialog from '~/components/posts/PostDetailsDialog.vue'
import { useGroupPosts } from '@/composables/useGroupPosts'
import { getUserIdFromToken } from '~/src/utils/auth'
import { useNuxtApp } from '#app'

const props = defineProps({
  group: {
    type: Object,
    required: true
  },
  currentUser: {
    type: Object,
    default: () => ({})
  }
})

const { $axiosInstance } = useNuxtApp()

// Get current user ID from token or from props
const currentUserId = computed(() => {
  if (props.currentUser?.id) {
    return props.currentUser.id
  }
  
  if (process.client) {
    return getUserIdFromToken() || ''
  }
  return ''
})

// Check if current user is admin of the group
const isCurrentUserAdmin = computed(() => {
  if (!props.group?.members || !currentUserId.value) return false
  
  const currentMember = props.group.members.find(member => 
    member.user_id === currentUserId.value || member.id === currentUserId.value
  )
  
  return currentMember?.role === 'admin'
})

// Check if user can create posts based on permissions
const canCreatePosts = computed(() => {
  // If user is admin, they can always create posts
  if (isCurrentUserAdmin.value) {
    return true
  }
  
  // If user is not admin, check group permissions
  const permissions = props.group?.permissions
  if (!permissions) {
    // Default to false if no permissions are set
    return false
  }
  
  // Allow non-admin post creation if permission is enabled
  return permissions.allowNonAdminCreatePosts === true
})

// Tooltip message for disabled post creation button
const postCreationTooltip = computed(() => {
  if (canCreatePosts.value) return ''
  
  if (isCurrentUserAdmin.value) {
    return 'Post creation is currently disabled'
  }
  
  const permissions = props.group?.permissions
  if (permissions?.allowNonAdminCreatePosts === false) {
    return 'Group administrators have disabled post creation for non-admin members'
  }
  
  return 'Only group administrators can create posts in this group'
})

// Pass $axiosInstance to the composable
const { posts, isLoadingPosts, fetchPosts, createNewPost, editPost, deletePost } = useGroupPosts(props.group.id, $axiosInstance)

const showNewPostDialog = ref(false)
const selectedPost = ref(null)

const openPostDetails = (post) => {
  selectedPost.value = post
}

const handleCreatePost = async (postData) => {
  try {
    console.log('Creating post with data:', postData);
    // Use the createNewPost function from the composable
    const newPost = await createNewPost(postData);
    console.log('Post created successfully:', newPost);
    showNewPostDialog.value = false; // Close the dialog
    await fetchPosts(); // Refresh the posts list
  } catch (error) {
    console.error('Failed to create post:', error);
    console.error('Error response:', error.response?.data);
    alert('Failed to create post: ' + (error.response?.data?.error || error.message));
  }
}

const handleEditPost = async (updatedPost) => {
  try {
    await editPost(updatedPost)
    selectedPost.value = null
    await fetchPosts() // Refresh the posts list
  } catch (error) {
    console.error('Failed to update post:', error)
  }
}

const handleDeletePost = async (post) => {
     try {
       await deletePost(post); // Use the composable's function
     } catch (error) {
       console.error('Failed to delete post:', error);
       alert('Failed to delete post');
     }
   }

   
onMounted(fetchPosts)
</script>