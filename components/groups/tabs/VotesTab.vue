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
        :loading="isLoadingVotes"
        :show-create-button="true"
        @create-vote="showNewVoteDialog = true"
        @open-vote="openVoteDetails"
      />
    </CardContent>
  </Card>
  
  <!-- New Vote Dialog -->
  <NewVoteDialog
    v-if="showNewVoteDialog"
    :group="group"
    @close="showNewVoteDialog = false"
    @submit="handleCreateVote"
  />
  
  <!-- Vote Details Dialog -->
  <VoteDetailsDialog
    v-if="selectedVote"
    :vote="selectedVote"
    :current-user-id="currentUserId"
    @close="selectedVote = null"
    @submit-vote="handleSubmitVote"
    @delete="handleDeleteVote"
  />
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import VotesList from '~/components/votes/Voteslist.vue'
import NewVoteDialog from '~/components/votes/NewVoteDialog.vue'
import VoteDetailsDialog from '~/components/votes/VoteDetailsDialog.vue'
import { useGroupVotes } from '@/composables/useGroupVotes'
import { getUserIdFromToken } from '~/src/utils/auth'
import axios from '~/src/utils/axios'

const props = defineProps({
  group: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['show-new-vote', 'open-vote'])

// Get current user ID from token
const currentUserId = computed(() => {
  if (process.client) {
    return getUserIdFromToken() || ''
  }
  return ''
})

const { votes, isLoadingVotes, fetchVotes, createNewVote, handleVoteSubmit, deleteVote } = useGroupVotes(props.group.id)

const showNewVoteDialog = ref(false)
const selectedVote = ref(null)

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
  
  selectedVote.value = {
    ...vote,
    status
  }
}

const handleCreateVote = async (voteData) => {
  try {
    console.log('Creating vote with data:', voteData);
    await createNewVote(voteData);
    showNewVoteDialog.value = false;
    await fetchVotes(); // Refresh the votes list
  } catch (error) {
    console.error('Failed to create vote:', error);
    console.error('Error response:', error.response?.data);
    alert('Failed to create vote: ' + (error.response?.data?.error || error.message));
  }
}

const handleSubmitVote = async (voteData) => {
  if (!selectedVote.value) return
  
  try {
    console.log('Submitting vote with data:', voteData);
    await handleVoteSubmit(voteData);
    selectedVote.value = null;
    await fetchVotes(); // Refresh the votes list
  } catch (error) {
    console.error('Failed to submit vote:', error);
    console.error('Error response:', error.response?.data);
    alert('Failed to submit vote: ' + (error.response?.data?.error || error.message));
  }
}

const handleDeleteVote = async (voteId) => {
  try {
    await deleteVote(voteId)
    selectedVote.value = null
    await fetchVotes() // Refresh the votes list
  } catch (error) {
    console.error('Failed to delete vote:', error)
  }
}

onMounted(fetchVotes)
</script>