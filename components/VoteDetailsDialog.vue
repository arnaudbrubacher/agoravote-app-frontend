<template>
  <div class="fixed inset-0 bg-background/80 backdrop-blur-sm">
    <div class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background shadow-lg duration-200 sm:rounded-lg">
      <div class="flex flex-col h-[90vh]">
        <header class="flex justify-between items-center p-6 border-b">
          <h2 class="text-lg font-semibold">Vote Details</h2>
          <Button variant="ghost" size="icon" @click="$emit('close')">
            <Icon name="heroicons:x-mark" class="h-4 w-4" />
          </Button>
        </header>

        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- Vote Details -->
          <div class="space-y-6">
            <div class="space-y-1">
              <Label class="text-sm text-muted-foreground">Title</Label>
              <p class="text-lg font-medium">{{ vote.title }}</p>
            </div>

            <div class="space-y-1">
              <Label class="text-sm text-muted-foreground">Question</Label>
              <p class="text-lg font-medium">{{ vote.question }}</p>
            </div>

            <div class="space-y-1">
              <Label class="text-sm text-muted-foreground">Choices</Label>
              <ul class="space-y-2">
                <li v-for="choice in vote.choices" :key="choice.text" class="text-base p-2 border rounded">
                  {{ choice.text }}
                </li>
              </ul>
            </div>

            <div v-if="vote.allowWriteIn" class="space-y-1">
              <p class="text-sm text-muted-foreground">Members can write in their own answer</p>
            </div>

            <div class="space-y-1">
              <Label class="text-sm text-muted-foreground">Voting Options</Label>
              <p class="text-base">
                Members must select between {{ vote.minChoices }} and {{ vote.maxChoices }} choices
              </p>
            </div>

            <!-- Voting Section for Open Votes -->
            <div v-if="vote.status === 'Open'" class="mt-8 pt-6 border-t">
              <h3 class="text-lg font-semibold mb-4">Cast Your Vote</h3>
              <form @submit.prevent="submitVote" class="space-y-4">
                <div class="space-y-2">
                  <div v-for="choice in vote.choices" :key="choice.text" class="flex items-center">
                    <input
                      type="checkbox"
                      :id="choice.text"
                      v-model="selectedChoices"
                      :value="choice.text"
                      class="mr-2"
                      :disabled="!canSelectMore && !selectedChoices.includes(choice.text)"
                    />
                    <label :for="choice.text">{{ choice.text }}</label>
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
                    :disabled="!isValidVote"
                  >
                    Submit Vote
                  </Button>
                </div>
              </form>
            </div>

            <!-- Results Section for Closed Votes -->
            <div v-if="vote.status === 'Closed'" class="mt-8 pt-6 border-t">
              <h3 class="text-lg font-semibold mb-4">Results</h3>
              
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

        <footer class="p-6 border-t">
          <div class="flex justify-end">
            <Button @click="$emit('close')">Close</Button>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const props = defineProps({
  vote: {
    type: Object,
    required: true
  }
})

const selectedChoices = ref([])
const writeInAnswer = ref('')

const canSelectMore = computed(() => {
  return selectedChoices.value.length < props.vote.maxChoices
})

const isValidVote = computed(() => {
  const numChoices = selectedChoices.value.length
  return numChoices >= props.vote.minChoices && 
         numChoices <= props.vote.maxChoices &&
         (!props.vote.allowWriteIn || !writeInAnswer.value || selectedChoices.value.length > 0)
})

const submitVote = () => {
  if (!isValidVote.value) return

  const voteData = {
    choices: selectedChoices.value,
    writeInAnswer: writeInAnswer.value
  }

  emit('submit-vote', voteData)
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString()
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

defineEmits(['close', 'submit-vote'])
</script>