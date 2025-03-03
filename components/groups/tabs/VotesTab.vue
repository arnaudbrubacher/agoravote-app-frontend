<!-- components/group/tabs/VotesTab.vue -->
<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle>Votes</CardTitle>
      <Button @click="$emit('show-new-vote')" class="flex items-center">
        <LucideIcon name="Plus" size="4" class="h-4 w-4 mr-2" />
        New Vote
      </Button>
    </CardHeader>
    <CardContent>
      <!-- Votes list -->
      <div v-if="isLoadingVotes" class="text-center py-8">
        <LucideIcon name="RefreshCw" size="6" class="h-6 w-6 animate-spin inline-block" />
        <span class="ml-2">Loading votes...</span>
      </div>
      <div v-else-if="votes.length === 0" class="text-center text-muted-foreground py-8">
        No votes yet. Create a vote for your group to decide on something!
      </div>
      <div v-else class="space-y-4">
        <VoteCard 
          v-for="vote in votes" 
          :key="vote.id" 
          :vote="vote" 
          @click="openVoteDetails(vote)"
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
import VoteCard from '~/components/votes/VoteCard.vue'
import { useGroupVotes } from '@/composables/useGroupVotes'

const props = defineProps({
  group: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['show-new-vote', 'open-vote'])

const { votes, isLoadingVotes, fetchVotes } = useGroupVotes(props.group.id)

const openVoteDetails = (vote) => {
  const now = new Date()
  const startTime = new Date(vote.start_time)
  const endTime = new Date(vote.end_time)
  
  let status = 'Upcoming'
  if (now >= startTime && now <= endTime) {
    status = 'Open'
  } else if (now > endTime) {
    status = 'Closed'
  }
  
  emit('open-vote', {
    ...vote,
    status
  })
}

onMounted(fetchVotes)
</script>