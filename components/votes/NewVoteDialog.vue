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
          <div class="grid grid-cols-4 items-start gap-4">
            <Label for="question" class="text-right pt-2">Question</Label>
            <Textarea 
              id="question" 
              v-model="formData.question" 
              class="col-span-3" 
              rows="2" 
              placeholder="Enter your question"
            />
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
          <Button type="submit" :disabled="isCreatingVote"> 
            <span v-if="isCreatingVote">Creating Vote...</span>
            <span v-else>Create Vote</span>
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>

  <!-- Alert Dialog for Validation Messages -->
  <AlertDialog :open="isAlertOpen" @update:open="isAlertOpen = $event">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ alertTitle }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ alertMessage }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogAction @click="isAlertOpen = false">OK</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup>
import LucideIcon from '@/components/LucideIcon.vue'
import { ref, onMounted } from 'vue'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const props = defineProps({
  group: Object,
  isCreatingVote: {
    type: Boolean,
    default: false
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
  startTime: '',
  endTime: ''
})

// State for AlertDialog
const isAlertOpen = ref(false)
const alertTitle = ref('')
const alertMessage = ref('')

function showAlert(title, message) {
  alertTitle.value = title
  alertMessage.value = message
  isAlertOpen.value = true
}

onMounted(() => {
  const now = new Date();
  // Adjust for local timezone offset
  const timezoneOffset = now.getTimezoneOffset() * 60000; // Offset in milliseconds
  const localNow = new Date(now.getTime() - timezoneOffset);
  
  // Format for datetime-local input (YYYY-MM-DDTHH:mm)
  const startTimeISO = localNow.toISOString().slice(0, 16);
  
  // Calculate end time (24 hours later)
  const endTime = new Date(localNow.getTime() + 24 * 60 * 60 * 1000);
  const endTimeISO = endTime.toISOString().slice(0, 16);

  formData.value.startTime = startTimeISO;
  formData.value.endTime = endTimeISO;
});

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
    showAlert('Missing Information', 'Please fill in Title, Question, Start Time, and End Time.')
    return
  }
  if (formData.value.choices.length < 2 || formData.value.choices.some(c => !c.text)) {
    showAlert('Invalid Choices', 'Please provide at least two choices with text.')
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