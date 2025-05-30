<template>
  <div class="space-y-4">
    <!-- Header with title and optional create button -->
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-medium">Posts</h3>
      <div v-if="showCreateButton">
        <TooltipProvider v-if="createButtonDisabled">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button 
                variant="outline" 
                size="sm"
                :disabled="createButtonDisabled"
                @click="!createButtonDisabled && $emit('create-post')"
              >
                <Plus class="h-4 w-4" />
                <Newspaper class="h-4 w-4 mr-1" />
                New Post
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{{ disabledTooltipMessage || 'Only group administrators can create posts in this group' }}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button 
          v-else
          variant="outline" 
          size="sm"
          @click="$emit('create-post')"
        >
          <Plus class="h-4 w-4" />
          <Newspaper class="h-4 w-4 mr-1" />
          New Post
        </Button>
      </div>
    </div>
    
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-6">
      <LucideIcon name="RefreshCw" size="6" class="h-6 w-6 animate-spin text-primary" />
      <span class="ml-2">Loading posts...</span>
    </div>
    
    <!-- No posts state -->
    <div v-else-if="!posts || posts.length === 0" class="text-center py-8 text-muted-foreground">
      <template v-if="isGroup">
        This group doesn't have any posts yet.
      </template>
      <template v-else>
        {{ isCurrentUser ? "You haven't posted anything yet." : "This user hasn't posted anything yet." }}
      </template>
    </div>
    
    <!-- Posts list -->
    <div v-else class="space-y-4">
      <PostCard
        v-for="post in posts"
        :key="post.id"
        :post="post"
        @click="$emit('open-post', post)"
        @delete="$emit('delete-post', post)"
      />
    </div>
  </div>
</template>

<script setup>
import { Plus, Newspaper } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import LucideIcon from '@/components/LucideIcon.vue'
import PostCard from '~/components/posts/PostCard.vue'

const props = defineProps({
  posts: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  isCurrentUser: {
    type: Boolean,
    default: false
  },
  isGroup: {
    type: Boolean,
    default: false
  },
  showCreateButton: {
    type: Boolean,
    default: false
  },
  createButtonDisabled: {
    type: Boolean,
    default: false
  },
  disabledTooltipMessage: {
    type: String,
    default: ''
  }
})

defineEmits(['create-post', 'open-post', 'delete-post'])
</script>