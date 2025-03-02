<!-- filepath: /Users/arnaudbrubacher/Desktop/-AGORA/CODE/agoravote-app-frontend/components/dashboard/UserPostsTab.vue -->
<template>
  <Card>
    <CardHeader class="flex justify-between">
      <CardTitle>Your Posts</CardTitle>
      <Button @click="$emit('show-new-post')">
        <Icon name="heroicons:plus" class="h-4 w-4 mr-2" />
        New Post
      </Button>
    </CardHeader>
    <CardContent>
      <!-- Posts list -->
      <div v-if="isLoadingPosts" class="text-center py-8">
        <Icon name="heroicons:arrow-path" class="h-6 w-6 animate-spin inline-block" />
        <span class="ml-2">Loading posts...</span>
      </div>
      <div v-else-if="posts.length === 0" class="text-center text-muted-foreground py-8">
        No personal posts yet. Share something with your community!
      </div>
      <div v-else class="space-y-4">
        <PostCard 
          v-for="post in posts" 
          :key="post.id" 
          :post="post" 
          @click="$emit('open-post', post)"
        />
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import PostCard from '@/components/dashboard/UserPostCard.vue'
import { useUserPosts } from '@/composables/useUserPosts'

const emit = defineEmits(['show-new-post', 'open-post'])

const { posts, isLoadingPosts, fetchPosts } = useUserPosts()

onMounted(fetchPosts)
</script>