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

          <div class="text-sm">
            <span class="text-muted-foreground">Selection:</span> 
            Members must select between {{ vote.minChoices }} and {{ vote.maxChoices }} choices
          </div>

          <!-- Voting Section for Open Votes -->
          <div v-if="vote.status === 'Open'" class="mt-6 pt-4 border-t">
            <h4 class="font-medium mb-4">Cast Your Vote</h4>
            <form @submit.prevent="submitVote" class="space-y-4">
              <div class="space-y-2">
                <div v-for="choice in vote.choices" :key="choice.text" class="flex items-center space-x-2">
                  <Checkbox
                    :id="choice.text"
                    v-model:checked="selectedChoices"
                    :value="choice.text"
                    :disabled="!vote.can_vote || (!canSelectMore && !selectedChoices.includes(choice.text))"
                  />
                  <Label :for="choice.text">{{ choice.text }}</Label>
                </div>
              </div>

              <div v-if="vote.allowWriteIn" class="space-y-2">
                <Label>Write-in Answer</Label>
                <Input v-model="writeInAnswer" placeholder="Enter your answer" />
              </div>

              <p class="text-sm text-muted-foreground">
                Select {{ vote.minChoices === vote.maxChoices ? vote.minChoices : `${vote.minChoices}-${vote.maxChoices}` }} 
                {{ vote.maxChoices === 1 ? 'option' : 'options' }}
              </p>

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
import { Checkbox } from '@/components/ui/checkbox'
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
  }
})

const emit = defineEmits(['close', 'submit-vote', 'delete'])

// State management
const selectedChoices = ref([])
const writeInAnswer = ref('')
const isSubmitting = ref(false)

// Computed properties
const canDelete = computed(() => {
  return (
    props.currentUserId === props.vote.creator_id || 
    !props.vote.creator_id
  )
})

const canSelectMore = computed(() => {
  return selectedChoices.value.length < props.vote.maxChoices
})

const isValidVote = computed(() => {
  const numChoices = selectedChoices.value.length
  return numChoices >= props.vote.minChoices && 
         numChoices <= props.vote.maxChoices &&
         (!props.vote.allowWriteIn || !writeInAnswer.value || selectedChoices.value.length > 0)
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
    const voteData = {
      choices: selectedChoices.value,
      writeInAnswer: writeInAnswer.value
    }

    emit('submit-vote', voteData)
  } catch (error) {
    console.error('Failed to submit vote:', error)
  } finally {
    isSubmitting.value = false
  }
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