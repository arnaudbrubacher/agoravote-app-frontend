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

const props = defineProps({
  group: {
    type: Object,
    required: true
  }
})

// Get current user ID from token
const currentUserId = computed(() => {
  if (process.client) {
    return getUserIdFromToken() || ''
  }
  return ''
})

const { posts, isLoadingPosts, fetchPosts, createPost, updatePost, deletePost } = useGroupPosts(props.group.id)

const showNewPostDialog = ref(false)
const selectedPost = ref(null)

const openPostDetails = (post) => {
  selectedPost.value = post
}

const handleCreatePost = async (postData) => {
  try {
    await createPost(postData)
    showNewPostDialog.value = false
    await fetchPosts() // Refresh the posts list
  } catch (error) {
    console.error('Failed to create post:', error)
  }
}

const handleEditPost = async (updatedPost) => {
  try {
    await updatePost(updatedPost.id, updatedPost)
    selectedPost.value = null
    await fetchPosts() // Refresh the posts list
  } catch (error) {
    console.error('Failed to update post:', error)
  }
}

const handleDeletePost = async (post) => {
  try {
    await deletePost(post.id)
    selectedPost.value = null
    await fetchPosts() // Refresh the posts list
  } catch (error) {
    console.error('Failed to delete post:', error)
  }
}

onMounted(fetchPosts)
</script>