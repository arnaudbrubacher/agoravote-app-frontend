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

          <!-- Results Section for Closed or Decrypted Votes -->
          <div v-if="vote.status === 'closed' || vote.status === 'decrypted'" class="mt-6 pt-4 border-t">
            <h4 class="font-medium mb-4">Results</h4>
            
            <div v-if="vote.status === 'closed'" class="text-sm text-muted-foreground">
              Vote is closed. Results need to be tallied and decrypted.
            </div>

            <div v-else-if="vote.status === 'decrypted'" class="space-y-4">
              <!-- TODO: Parse and display plaintext_tally_results -->
              <p class="text-sm text-green-600 font-medium">Results have been decrypted.</p>
              <p class="text-xs text-muted-foreground">Displaying the decrypted results requires parsing the tally data. (To be implemented)</p>
              
              <!-- Placeholder for parsed results - adapt when structure is known -->
              <!--
              <p class="text-sm text-muted-foreground">
                Total votes cast: {{ getTotalVotesFromDecrypted() }}
              </p>

              <div v-for="choice in getChoicesFromDecrypted()" :key="choice.text" class="space-y-2">
                 ...
              </div>
              -->
            </div>
          </div>
        </div>
      </div>
      
      <!-- Bottom Action Buttons -->
      <div class="border-t pt-4 flex justify-start space-x-2">
        <Button v-if="canDelete" variant="destructive" size="sm" @click="confirmDelete">
          <LucideIcon name="Trash" size="4" class="h-4 w-4 mr-1" />
          Delete
        </Button>
        <Button v-if="canEndEarly" variant="secondary" size="sm" @click="confirmEndEarly">
          <LucideIcon name="TimerOff" size="4" class="h-4 w-4 mr-1" />
          End Vote Early
        </Button>
        <Button v-if="canTally" variant="default" size="sm" @click="confirmTally">
          <LucideIcon name="ListChecks" size="4" class="h-4 w-4 mr-1" />
          Tally & Decrypt
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
    'clear-spoiled-details',
    'end-vote',
    'tally-decrypt'
])

const canEndEarly = computed(() => {
  return props.vote.status === 'open' && props.currentUserId === props.vote.creator_id;
})

const canDelete = computed(() => {
  return (
    props.currentUserId === props.vote.creator_id || 
    !props.vote.creator_id
  )
})

const canTally = computed(() => {
  return props.vote.status === 'closed' && props.currentUserId === props.vote.creator_id;
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
  if (confirm(`Are you sure you want to end this vote early: "${props.vote.title}"? This will close the vote immediately.`)) {
    console.log(`[VoteDetailsDialog] Emitting end-vote event for vote ID: ${props.vote.id}`);
    emit('end-vote', props.vote.id);
  }
}

const confirmTally = () => {
  if (confirm(`Are you sure you want to tally and decrypt the results for "${props.vote.title}"? This uses the ElectionGuard process.`)) {
    console.log(`[VoteDetailsDialog] Emitting tally-decrypt event for vote ID: ${props.vote.id}`);
    emit('tally-decrypt', props.vote.id);
  }
};

const confirmDelete = () => {
  if (confirm(`Are you sure you want to delete this vote: "${props.vote.title}"?`)) {
    emit('delete', props.vote.id)
  }
}
</script>