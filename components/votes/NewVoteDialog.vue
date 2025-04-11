<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Create New Vote</DialogTitle>
        <DialogDescription>
          Set up a new vote for your group
        </DialogDescription>
      </DialogHeader>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Vote Title -->
        <div>
          <Label for="title">Title</Label>
          <Input 
            id="title"
            v-model="formData.title"
            placeholder="Vote title" 
            required
          />
        </div>
        
        <!-- Vote Question -->
        <div>
          <Label for="question">Question</Label>
          <Textarea 
            id="question"
            v-model="formData.question"
            placeholder="What are you asking the group to vote on?"
            required
          />
        </div>
        
        <!-- Vote Choices -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <Label>Choices</Label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              @click="addChoice"
            >
              <LucideIcon name="Plus" size="4" class="h-4 w-4 mr-1" />
              Add Choice
            </Button>
          </div>
          
          <div v-for="(choice, index) in formData.choices" :key="index" class="flex items-center space-x-2 mb-2">
            <Input 
              v-model="choice.text"
              placeholder="Choice option"
              class="flex-grow"
            />
            <Button 
              type="button" 
              variant="ghost" 
              size="icon"
              @click="removeChoice(index)"
              v-if="formData.choices.length > 2"
            >
              <LucideIcon name="Trash" size="4" class="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <!-- Vote Settings -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Vote Type -->
          <div>
            <Label>Vote Type</Label>
            <div class="flex items-center space-x-2 mt-2">
              <Checkbox id="isSecret" v-model="formData.isSecret" />
              <Label for="isSecret">Secret ballot (votes are anonymous)</Label>
            </div>
          </div>
          <!-- Empty div to maintain grid layout if needed -->
          <div></div> 
        </div>
        
        <!-- Vote Schedule -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label for="startTime">Start Time</Label>
            <Input 
              id="startTime"
              v-model="formData.startTime"
              type="datetime-local"
              required
            />
          </div>
          <div>
            <Label for="endTime">End Time</Label>
            <Input 
              id="endTime"
              v-model="formData.endTime"
              type="datetime-local"
              required
            />
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" @click="$emit('close')">
            Cancel
          </Button>
          <Button type="submit">
            Create Vote
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import LucideIcon from '@/components/LucideIcon.vue'
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'

defineProps({
  group: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'submit'])

const formData = ref({
  title: '',
  question: '',
  choices: [
    { text: '' },
    { text: '' }
  ],
  isSecret: true,
  startTime: formatDateForInput(new Date()),
  endTime: formatDateForInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // Default to 1 week later
})

function formatDateForInput(date) {
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
    .toISOString()
    .substring(0, 16)
}

function addChoice() {
  formData.value.choices.push({ text: '' })
}

function removeChoice(index) {
  formData.value.choices.splice(index, 1)
}

function handleSubmit() {
  // Filter out any empty choices
  const validChoices = formData.value.choices.filter(choice => choice.text.trim() !== '')
  
  if (validChoices.length < 2) {
    alert('Please provide at least 2 valid choices')
    return
  }
  
  const startTime = new Date(formData.value.startTime)
  const endTime = new Date(formData.value.endTime)
  
  if (startTime >= endTime) {
    alert('End time must be after start time')
    return
  }
  
  const voteData = {
    ...formData.value,
    choices: validChoices
  }
  
  emit('submit', voteData)
}
</script>