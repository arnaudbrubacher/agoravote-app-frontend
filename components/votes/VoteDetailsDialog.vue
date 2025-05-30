<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ vote.title }}</DialogTitle>
        <DialogDescription>
          {{ vote.status || 'Loading...' }} vote · {{ formatDate(vote.start_time) }} - {{ formatDate(vote.end_time) }}
          <div class="mt-1 flex items-center text-sm">
            <LucideIcon name="User" size="4" class="h-4 w-4 mr-1" />
            Created by {{ vote.creator_username || 'Unknown' }}
          </div>
        </DialogDescription>
      </DialogHeader>
      
      <div class="py-4 min-h-[200px]">
        <!-- Loading State -->
        <div v-if="isLoadingDetails" class="flex justify-center items-center h-full">
          <LoadingSpinner />
          <span class="ml-2">Loading vote details...</span>
        </div>

        <!-- Content when not loading -->
        <div v-else>
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

            <!-- Results Section for Closed or Decrypted Votes -->
            <div v-else-if="vote.status === 'closed' || vote.status === 'decrypted'" class="mt-6 pt-4 border-t">
              <h4 class="font-medium mb-4">Results</h4>
              
              <div v-if="vote.status === 'closed'" class="text-sm text-muted-foreground">
                Vote is closed. Results need to be tallied and decrypted.
              </div>

              <!-- Decrypted Results Display -->
              <div v-else-if="vote.status === 'decrypted'" class="space-y-4">
                <div v-if="parsedTallyResults">
                  <ElectionResults :results="parsedTallyResults" :vote="vote" />
                </div>
                <div v-else>
                   <p class="text-sm text-red-600 font-medium">Results decrypted, but could not be parsed.</p>
                   <p class="text-xs text-muted-foreground">Check the console or backend logs for details.</p>
                   <pre v-if="vote.plaintext_tally_results" class="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">{{ vote.plaintext_tally_results }}</pre>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Action Buttons (only show when not loading details) -->
          <div class="border-t pt-4 flex justify-start space-x-2 mt-4">
            <Button v-if="canDelete" variant="destructive" size="sm" @click="confirmDelete" :disabled="isDeletingVote">
              <Loader2 v-if="isDeletingVote" class="mr-2 h-4 w-4 animate-spin" />
              <LucideIcon v-else name="Trash" size="4" class="h-4 w-4 mr-1" />
              {{ isDeletingVote ? 'Deleting...' : 'Delete' }}
            </Button>
            <Button v-if="canEndEarly" variant="outline" size="sm" @click="confirmEndEarly">
              <LucideIcon name="TimerOff" size="4" class="h-4 w-4 mr-1" />
              End Vote Early
            </Button>
            <Button v-if="canTally" variant="default" size="sm" @click="confirmTally">
              <LucideIcon name="ListChecks" size="4" class="h-4 w-4 mr-1" />
              Tally & Decrypt
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import LucideIcon from '@/components/LucideIcon.vue'
import BallotForm from '@/components/votes/BallotForm.vue'
import ElectionResults from '@/components/votes/ElectionResults.vue'
import LoadingSpinner from '@/components/utils/LoadingSpinner.vue'
import { ref, computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'
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
  },
  isLoadingDetails: { 
    type: Boolean,
    default: false
  },
  isDeletingVote: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
    'close',
    'delete',
    'encrypt-vote',
    'cast-vote',
    'spoil-vote',
    // 'update:encryptedBallotData',
    'clear-spoiled-details',
    'end-vote',
    'tally-decrypt'
])

const canEndEarly = computed(() => {
  // Only show "End Vote Early" if:
  // 1. Vote status is 'open' 
  // 2. User is the creator
  // 3. Current time is before the vote's end time (voting period hasn't naturally ended)
  const now = new Date();
  const voteEndTime = new Date(props.vote.end_time);
  const votingTimeHasEnded = now >= voteEndTime;
  
  return props.vote.status === 'open' && 
         props.currentUserId === props.vote.creator_id && 
         !votingTimeHasEnded;
})

const canDelete = computed(() => {
  return (
    props.currentUserId === props.vote.creator_id || 
    !props.vote.creator_id
  )
})

const canTally = computed(() => {
  // Show "Tally & Decrypt" if:
  // 1. Vote status is 'closed' OR voting time has naturally ended (even if status is still 'open')
  // 2. User is the creator
  const now = new Date();
  const voteEndTime = new Date(props.vote.end_time);
  const votingTimeHasEnded = now >= voteEndTime;
  
  return (props.vote.status === 'closed' || votingTimeHasEnded) && 
         props.currentUserId === props.vote.creator_id;
});

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

const confirmEndEarly = () => {
  // Remove the confirmation here - it's handled by the parent component
  // if (confirm(`Are you sure you want to end this vote early: ...`)) { 
    console.log(`[VoteDetailsDialog] Emitting end-vote event for vote ID: ${props.vote.id}`);
    emit('end-vote', props.vote.id);
  // }
}

const confirmTally = () => {
  // Remove the confirmation here - it's handled by the parent component
  // if (confirm(`Are you sure you want to tally and decrypt the results for ...`)) { 
    console.log(`[VoteDetailsDialog] Emitting tally-decrypt event for vote ID: ${props.vote.id}`);
    emit('tally-decrypt', props.vote.id);
  // }
};

const confirmDelete = () => {
  // Remove the confirmation here - it's handled by the parent component
  // if (confirm(`Are you sure you want to delete this vote: "${props.vote.title}"?`)) { 
    emit('delete', props.vote.id)
  // }
}

// Computed property to handle results (which might be string or object from backend)
const parsedTallyResults = computed(() => {
  const resultsData = props.vote?.plaintext_tally_results;
  
  if (!resultsData) {
    console.log("[VoteDetailsDialog] plaintext_tally_results is missing or null.");
    return null;
  }

  // Case 1: It's already an object (likely parsed by backend for GET /votes/{id})
  if (typeof resultsData === 'object' && resultsData !== null) {
      console.log("[VoteDetailsDialog] Using pre-parsed results object:", resultsData);
      return resultsData;
  }

  // Case 2: It's a string (potentially double-encoded)
  if (typeof resultsData === 'string') {
      console.log("[VoteDetailsDialog] Attempting to parse results string:", resultsData);
      try {
          let parsed = JSON.parse(resultsData);
          // Handle potential double-encoding
          if (typeof parsed === 'string') {
              console.warn("[VoteDetailsDialog] Detected potentially double-encoded JSON string. Attempting second parse.");
              parsed = JSON.parse(parsed);
          }
          // Ensure the final result is a non-null object
          if (typeof parsed === 'object' && parsed !== null) {
              return parsed;
          } else {
              console.error("[VoteDetailsDialog] Parsed string result is not a valid object:", parsed);
              return null;
          }
      } catch (e) {
          console.error("[VoteDetailsDialog] Failed to parse plaintext_tally_results JSON string:", e);
          console.error("[VoteDetailsDialog] Raw results string:", resultsData);
          return null;
      }
  }

  // Fallback: Unexpected type
  console.error("[VoteDetailsDialog] Unexpected type for plaintext_tally_results:", typeof resultsData);
  return null;
});
</script>