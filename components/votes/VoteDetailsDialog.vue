<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ vote.title }}</DialogTitle>
        <DialogDescription>
          {{ vote.status }} vote · {{ formatDate(vote.start_time) }} - {{ formatDate(vote.end_time) }}
        </DialogDescription>
      </DialogHeader>
      
      <div class="py-4">
        <!-- Vote Details -->
        <div class="space-y-4">
          <div class="prose max-w-none">
            <h4 class="font-medium">Question</h4>
            <p>{{ vote.question }}</p>
          </div>
          
          <div v-if="vote.allowWriteIn" class="text-sm text-muted-foreground">
            Write-ins are allowed for this vote.
          </div>

          <!-- Ballot Section (Handles Voting/Encryption/Casting/Spoiling/Status) -->
           <BallotForm
              v-if="vote.status === 'open'"
              :vote="vote"
              :can-vote="vote.can_vote"
              :user-tracker-hash="userTrackerHash"
              :encrypted-ballot-data="encryptedBallotData"
              :is-encrypting="isEncrypting"
              :is-submitting="isSubmitting"
              :spoiled-selection-details="spoiledSelectionDetails"
              @encrypt-vote="handleEncryptVote"
              @cast-vote="handleCastVote"
              @spoil-vote="handleSpoilVote"
              @clear-spoiled-details="handleClearSpoiledDetails"
            />

          <!-- Results Section for Closed Votes -->
          <div v-if="vote.status === 'Closed'" class="mt-6 pt-4 border-t">
            <h4 class="font-medium mb-4">Results</h4>
            
            <div class="space-y-4">
              <p class="text-sm text-muted-foreground">
                Total votes cast: {{ getTotalVotes() }}
              </p>

              <div v-for="choice in vote.choices" :key="choice.text" class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span>{{ choice.text }}</span>
                  <span>{{ getVoteCount(choice) }} votes ({{ getVotePercentage(choice) }}%)</span>
                </div>
                <div class="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-primary" 
                    :style="{ width: `${getVotePercentage(choice)}%` }"
                  ></div>
                </div>
              </div>

              <div v-if="vote.allowWriteIn && vote.writeInResponses?.length" class="mt-4">
                <h4 class="font-medium mb-2">Write-in Responses:</h4>
                <ul class="space-y-1">
                  <li v-for="response in vote.writeInResponses" :key="response.text" class="text-sm">
                    {{ response.text }} ({{ response.count }} votes)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Bottom Action Button -->
      <div class="border-t pt-4 flex justify-start" v-if="canDelete">
        <Button variant="destructive" size="sm" @click="confirmDelete">
          <LucideIcon name="Trash" size="4" class="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import LucideIcon from '@/components/LucideIcon.vue'
import BallotForm from '@/components/votes/BallotForm.vue'
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

const props = defineProps({
  vote: {
    type: Object,
    required: true
  },
  currentUserId: {
    type: String,
    default: ''
  },
  userTrackerHash: {
    type: String,
    default: null
  },
  encryptedBallotData: {
    type: Object,
    default: null
  },
  isEncrypting: {
    type: Boolean,
    default: false
  },
  isSubmitting: {
    type: Boolean,
    default: false
  },
  spoiledSelectionDetails: {
    type: Object,
    default: null
  }
})

const emit = defineEmits([
    'close',
    'delete',
    'encrypt-vote',
    'cast-vote',
    'spoil-vote',
    // 'update:encryptedBallotData',
    'clear-spoiled-details'
])

const canDelete = computed(() => {
  return (
    props.currentUserId === props.vote.creator_id || 
    !props.vote.creator_id
  )
})

const handleEncryptVote = (payload) => {
  console.log("[VoteDetailsDialog] Relaying encrypt-vote event with payload:", payload);
  emit('encrypt-vote', payload);
}

const handleCastVote = (payload) => {
  console.log("[VoteDetailsDialog] Relaying cast-vote event with payload:", payload);
  emit('cast-vote', payload);
}

const handleSpoilVote = (payload) => {
  console.log("[VoteDetailsDialog] Relaying spoil-vote event with payload:", payload);
  emit('spoil-vote', payload);
}

const handleClearSpoiledDetails = () => {
    console.log("[VoteDetailsDialog] Relaying clear-spoiled-details event");
    emit('clear-spoiled-details');
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date)
}

const getTotalVotes = () => {
  const choiceVotes = props.vote.choices.reduce((sum, choice) => sum + (choice.votes || 0), 0)
  const writeInVotes = props.vote.writeInResponses?.reduce((sum, response) => sum + response.count, 0) || 0
  return choiceVotes + writeInVotes
}

const getVoteCount = (choice) => {
  return choice.votes || 0
}

const getVotePercentage = (choice) => {
  const total = getTotalVotes()
  if (total === 0) return 0
  return Math.round((getVoteCount(choice) / total) * 100)
}

const confirmDelete = () => {
  if (confirm(`Are you sure you want to delete this vote: "${props.vote.title}"?`)) {
    emit('delete', props.vote.id)
  }
}
</script>