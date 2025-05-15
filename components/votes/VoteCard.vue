<!-- components/group/cards/VoteCard.vue -->
<template>
  <div class="p-4 border rounded-lg cursor-pointer hover:bg-muted/50" @click="$emit('click')">
    <div class="flex justify-between items-start">
      <div>
        <h3 class="font-semibold">{{ vote.title }}</h3>
        <p class="text-muted-foreground">{{ vote.question }}</p>
        <div class="mt-2 text-sm space-y-1">
          <span class="flex items-center">
            <LucideIcon name="Calendar" size="4" class="h-4 w-4 mr-1" />
            {{ formatDateShort(vote.start_time) }} - {{ formatDateShort(vote.end_time) }}
          </span>
          <span class="flex items-center text-muted-foreground">
            <LucideIcon name="User" size="4" class="h-4 w-4 mr-1" />
            Created by {{ vote.creator_username || 'Unknown' }}
          </span>
        </div>
      </div>
      <div>
        <span v-if="isVoteActive(vote)" class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
          Active
        </span>
        <span v-else-if="isVoteUpcoming(vote)" class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          Upcoming
        </span>
        <span v-else class="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
          Ended
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import LucideIcon from '@/components/LucideIcon.vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  vote: {
    type: Object,
    required: true
  }
})

defineEmits(['click'])

// Helper functions for vote status
const isVoteActive = (vote) => {
  const now = new Date()
  return new Date(vote.start_time) <= now && new Date(vote.end_time) >= now
}

const isVoteUpcoming = (vote) => {
  const now = new Date()
  return new Date(vote.start_time) > now
}

// Format date for display
const formatDateShort = (dateStr) => {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date)
}
</script>