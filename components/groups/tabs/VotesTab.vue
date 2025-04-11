<!-- components/group/tabs/VotesTab.vue -->
<template>
  <Card class="mt-6">
    <CardContent class="p-6">
      <!-- Message for temporarily disabled voting functionality -->
      <!-- <div class="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
        <p class="text-amber-800">
          Voting functionality is currently under development and will be available soon.
        </p>
      </div> -->
      
      <!-- Use the shared VotesList component which handles lists of votes -->
      <VotesList
        :votes="votes"
        :loading="loading"
        :show-create-button="true"
        @create-vote="$emit('create-vote')"
        @open-vote="$emit('open-vote', $event)"
      />
    </CardContent>
  </Card>
  
  <!-- Dialogs are now handled by the parent component -->
  <!-- New Vote Dialog removed -->
  <!-- Vote Details Dialog removed -->
</template>

<script setup>
import { Card, CardContent } from '@/components/ui/card'
import VotesList from '~/components/votes/Voteslist.vue'
// Removed imports: NewVoteDialog, VoteDetailsDialog, useGroupVotes, getUserIdFromToken, axios, computed

// Receive props from parent
const props = defineProps({
  votes: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    required: true
  },
  group: { // Keep group prop if needed by VotesList or other elements here
    type: Object,
    required: true
  }
})

// Define emits
const emit = defineEmits(['create-vote', 'open-vote'])

// All local state, composable usage, and handlers related to 
// selectedVote, dialogs, submitting, deleting are removed.
// onMounted is removed as fetchVotes is handled by parent.

</script>