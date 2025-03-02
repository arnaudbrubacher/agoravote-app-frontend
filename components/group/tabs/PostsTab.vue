<!-- components/group/tabs/PostsTab.vue -->
<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle>Posts</CardTitle>
      <Button @click="$emit('show-new-post')" class="flex items-center">
        <LucideIcon name="Plus" size="4" class="h-4 w-4 mr-2" />
        New Post
      </Button>
    </CardHeader>
    <CardContent>
      <!-- Posts list -->
      <div v-if="isLoadingPosts" class="text-center py-8">
        <LucideIcon name="RefreshCw" size="6" class="h-6 w-6 animate-spin inline-block" />
        <span class="ml-2">Loading posts...</span>
      </div>
      <div v-else-if="posts.length === 0" class="text-center text-muted-foreground py-8">
        No posts yet. Share something with your group!
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
import LucideIcon from '@/components/LucideIcon.vue'
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import PostCard from '~/components/shared/posts/PostCard.vue'
import { useGroupPosts } from '@/composables/useGroupPosts'

const props = defineProps({
  group: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['show-new-post', 'open-post'])

const { posts, isLoadingPosts, fetchPosts } = useGroupPosts(props.group.id)

onMounted(fetchPosts)
</script>