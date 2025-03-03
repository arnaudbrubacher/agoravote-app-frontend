<!-- components/group/tabs/PostsTab.vue -->
<template>
  <Card class="mt-6">
    <CardContent class="p-6">
      <!-- Use the shared PostCard component which handles lists of posts -->
      <UserPostsList
        :posts="posts"
        :loading="isLoadingPosts"
        :is-current-user="false"
        :show-create-button="true"
        @open-post="$emit('open-post', $event)"
      />
    </CardContent>
  </Card>
</template>

<script setup>
import LucideIcon from '@/components/LucideIcon.vue'
import { ref, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import UserPostsList from '~/components/posts/PostCard.vue'
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