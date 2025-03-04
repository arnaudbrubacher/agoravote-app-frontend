<!-- components/group/tabs/PostsTab.vue -->
<template>
  <Card class="mt-6">
    <CardContent class="p-6">
      <!-- Use the shared PostsList component which handles lists of posts -->
      <PostsList
        :posts="posts"
        :loading="isLoadingPosts"
        :is-current-user="false"
        :show-create-button="true"
        @create-post="showNewPostDialog = true"
        @open-post="openPostDetails"
      />
    </CardContent>
  </Card>
  
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
import { Card, CardContent } from '@/components/ui/card'
import PostsList from '~/components/posts/Postslist.vue'
import NewPostDialog from '~/components/posts/NewPostDialog.vue'
import PostDetailsDialog from '~/components/posts/PostDetailsDialog.vue'
import { useGroupPosts } from '@/composables/useGroupPosts'
import { getUserIdFromToken } from '~/src/utils/auth'
import axios from '~/src/utils/axios'

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

const { posts, isLoadingPosts, fetchPosts, createNewPost, editPost, deletePost } = useGroupPosts(props.group.id)

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