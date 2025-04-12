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
            Members can write in their own answer
          </div>

          <!-- Voting Section for Open Votes -->
          <div v-if="vote.status === 'open'" class="mt-6 pt-4 border-t">
            <!-- Show this if user has already voted -->
            <div v-if="hasUserVoted" class="space-y-3 text-center p-4 bg-green-50 border border-green-200 rounded-md">
              <LucideIcon name="CheckCircle" class="mx-auto h-10 w-10 text-green-500" />
              <p class="font-medium text-green-800">You have already voted in this election.</p>
              <p class="text-sm text-muted-foreground">Your ballot tracking hash is:</p>
              <code class="block text-sm font-mono bg-gray-100 p-2 rounded break-all">{{ userTrackerHash }}</code>
              <p class="text-xs text-muted-foreground pt-2">
                You can use this hash later to verify your vote was included in the final tally (verification feature coming soon).
              </p>
            </div>

            <!-- Show voting form if user hasn't voted -->
            <form v-else @submit.prevent="submitVote" class="space-y-4">
              <RadioGroup v-model="selectedEgChoiceId" class="space-y-2">
                <div v-for="(choice, index) in vote.choices" :key="choice.id || choice.text" class="flex items-center space-x-2">
                   <RadioGroupItem 
                     :id="`choice-${vote.id}-${index}`" 
                     :value="getEgSelectionId(vote.id, index)"
                     :disabled="!vote.can_vote" 
                   />
                  <Label :for="`choice-${vote.id}-${index}`">{{ choice.text }}</Label>
                </div>
              </RadioGroup>

              <div v-if="vote.allowWriteIn" class="space-y-2">
                <Label>Write-in Answer</Label>
                <Input v-model="writeInAnswer" placeholder="Enter your answer" />
              </div>

              <div class="flex justify-end">
                <Button
                  type="submit"
                  :disabled="!vote.can_vote || !isValidVote"
                >
                  <LucideIcon v-if="isSubmitting" name="RefreshCw" size="4" class="h-4 w-4 mr-2 animate-spin" />
                  Submit Vote
                </Button>
              </div>
            </form>
          </div>

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
      <div class="border-t pt-4 flex justify-start">
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
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
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
  }
})

const emit = defineEmits(['close', 'submit-vote', 'delete'])

// State management
const selectedEgChoiceId = ref(null)
const writeInAnswer = ref('')
const isSubmitting = ref(false)

// Helper to construct EG Selection Object ID consistent with backend manifest generation
const getEgSelectionId = (voteId, index) => {
  // Assumes sequence order starts at 1, matching backend logic
  return `selection-${voteId}-${index + 1}`;
};

// Computed properties
const canDelete = computed(() => {
  return (
    props.currentUserId === props.vote.creator_id || 
    !props.vote.creator_id
  )
})

const hasUserVoted = computed(() => {
  return !!props.userTrackerHash;
});

const isValidVote = computed(() => {
  return !!selectedEgChoiceId.value;
})

// Methods
const confirmDelete = () => {
  if (confirm(`Are you sure you want to delete this vote: "${props.vote.title}"?`)) {
    emit('delete', props.vote.id)
  }
}

const submitVote = async () => {
  if (!isValidVote.value) return
  
  isSubmitting.value = true
  
  try {
    // Emit the selected EG Choice ID
    const voteData = {
      selectedEgChoiceId: selectedEgChoiceId.value 
    }
    console.log("[VoteDetailsDialog] Emitting submit-vote with payload:", voteData);
    emit('submit-vote', voteData)
  } catch (error) {
    console.error('Failed to submit vote:', error)
     // Stop spinner even if emit fails locally (less likely)
    isSubmitting.value = false; 
  } 
  // Do not set submitting to false here if emit triggers async parent handler
  // Parent handler should ideally notify back on completion/error
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
</script>