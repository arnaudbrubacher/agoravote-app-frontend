<!-- components/group/tabs/VotesTab.vue -->
<template>
  <Card class="mt-6">
    <CardContent class="p-6">
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
import VotesList from '~/components/votes/VotesList.vue'
import NewVoteDialog from '~/components/votes/NewVoteDialog.vue'
import VoteDetailsDialog from '~/components/votes/VoteDetailsDialog.vue'
import { useGroupVotes } from '@/composables/useGroupVotes'
import { getUserIdFromToken } from '~/src/utils/auth'

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

const { votes, isLoadingVotes, fetchVotes, createVote, submitVote, deleteVote } = useGroupVotes(props.group.id)

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
    await createVote(voteData)
    showNewVoteDialog.value = false
    await fetchVotes() // Refresh the votes list
  } catch (error) {
    console.error('Failed to create vote:', error)
  }
}

const handleSubmitVote = async (voteData) => {
  if (!selectedVote.value) return
  
  try {
    await submitVote(selectedVote.value.id, voteData)
    selectedVote.value = null
    await fetchVotes() // Refresh the votes list
  } catch (error) {
    console.error('Failed to submit vote:', error)
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