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
        <div class="grid gap-4 py-4">
          <!-- Title Input -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="title" class="text-right">Title</Label>
            <Input id="title" v-model="formData.title" class="col-span-3" />
          </div>
          <!-- Question Input -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="question" class="text-right">Question</Label>
            <Input id="question" v-model="formData.question" class="col-span-3" />
          </div>
          <!-- Choices Input -->
          <div class="grid grid-cols-4 items-start gap-4">
            <Label class="text-right pt-2">Choices</Label>
            <div class="col-span-3 space-y-2">
              <div v-for="(choice, index) in formData.choices" :key="index" class="flex items-center gap-2">
                <Input v-model="choice.text" placeholder="Enter choice text" />
                <Button variant="ghost" size="icon" @click="removeChoice(index)" :disabled="formData.choices.length <= 2">
                  <LucideIcon name="Trash" class="h-4 w-4" />
                </Button>
              </div>
              <Button type="button" variant="outline" size="sm" @click="addChoice">Add Choice</Button>
            </div>
          </div>
          <!-- Settings Section -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right">Settings</Label>
            <div class="col-span-3 space-y-2">
              <div class="flex items-center space-x-2">
                <Switch id="isSecret" v-model:checked="formData.isSecret" />
                <Label for="isSecret">Secret Ballot (using ElectionGuard)</Label>
              </div>
            </div>
          </div>
          <!-- Start Time Input -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="startTime" class="text-right">Start Time</Label>
            <Input id="startTime" type="datetime-local" v-model="formData.startTime" class="col-span-3" />
          </div>
          <!-- End Time Input -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="endTime" class="text-right">End Time</Label>
            <Input id="endTime" type="datetime-local" v-model="formData.endTime" class="col-span-3" />
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
import { Switch } from '@/components/ui/switch'

const props = defineProps({ group: Object })
const emit = defineEmits(['close', 'submit'])

const formData = ref({
  title: '',
  question: '',
  choices: [
    { text: '' },
    { text: '' }
  ],
  isSecret: true,
  startTime: '',
  endTime: ''
})

function addChoice() {
  formData.value.choices.push({ text: '' })
}

function removeChoice(index) {
  if (formData.value.choices.length > 2) {
    formData.value.choices.splice(index, 1)
  }
}

function handleSubmit() {
  // Basic validation
  if (!formData.value.title || !formData.value.question || !formData.value.startTime || !formData.value.endTime) {
    alert('Please fill in Title, Question, Start Time, and End Time.')
    return
  }
  if (formData.value.choices.length < 2 || formData.value.choices.some(c => !c.text)) {
    alert('Please provide at least two choices with text.')
    return
  }
  
  // Format data for submission (min/max removed)
  const submissionData = {
      ...formData.value,
      choices: formData.value.choices.filter(c => c.text.trim() !== '') // Ensure choices aren't just whitespace
  };

  emit('submit', submissionData)
}
</script>