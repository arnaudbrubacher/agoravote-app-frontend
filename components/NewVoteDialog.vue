<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="w-full max-w-3xl">
      <DialogHeader>
        <DialogTitle>Create New Vote</DialogTitle>
        <DialogDescription>
          Set up a new vote for your group members.
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-6 p-6 pt-0">
        <div class="space-y-2">
          <Label for="title">Title</Label>
          <Input id="title" v-model="form.title" required />
        </div>

        <div class="space-y-2">
          <Label for="question">Question</Label>
          <Input id="question" v-model="form.question" required />
        </div>

        <div class="space-y-2">
          <Label>Choices</Label>
          <div v-for="(choice, index) in form.choices" :key="index" class="flex space-x-2">
            <Input v-model="choice.text" placeholder="Choice" required />
            <Button 
              v-if="index > 1"
              type="button" 
              variant="destructive" 
              size="icon"
              @click="removeChoice(index)"
            >
              <Icon name="heroicons:trash" class="h-4 w-4" />
            </Button>
          </div>
          <Button 
            type="button"
            variant="outline" 
            class="w-full mt-2"
            @click="addChoice"
          >
            Add Choice
          </Button>
        </div>

        <div class="flex items-center space-x-2">
          <input
            type="checkbox"
            id="allowWriteIn"
            v-model="form.allowWriteIn"
            class="h-4 w-4 rounded border-input"
          />
          <Label for="allowWriteIn">Allow members to write in their own answer</Label>
        </div>

        <div class="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isSecret"
            v-model="form.isSecret"
            class="h-4 w-4 rounded border-input"
          />
          <Label for="isSecret">Secret Vote</Label>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label>Minimum Choices</Label>
            <Input 
              type="number" 
              v-model="form.minChoices" 
              min="1" 
              :max="form.maxChoices"
              required 
            />
          </div>
          <div class="space-y-2">
            <Label>Maximum Choices</Label>
            <Input 
              type="number" 
              v-model="form.maxChoices" 
              :min="form.minChoices"
              :max="form.choices.length"
              required 
            />
          </div>
          <p class="col-span-2 text-sm text-muted-foreground mt-1">
            Set how many options each member must select when voting.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="startTime">Start Time</Label>
            <Input type="datetime-local" id="startTime" v-model="form.startTime" required />
          </div>
          <div class="space-y-2">
            <Label for="endTime">End Time</Label>
            <Input type="datetime-local" id="endTime" v-model="form.endTime" required />
          </div>
        </div>

        <DialogFooter class="pt-6 border-t mt-auto">
          <Button variant="outline" type="button" @click="$emit('close')">Cancel</Button>
          <Button type="submit">Create Vote</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icon } from '@iconify/vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

const props = defineProps({
  group: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'submit'])

function formatDateForInput(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

const today = new Date()
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)

const form = ref({
  title: '',
  question: '',
  choices: [
    { text: '' },
    { text: '' }
  ],
  allowWriteIn: false,
  isSecret: false,
  minChoices: 1,
  maxChoices: 1,
  startTime: formatDateForInput(today),
  endTime: formatDateForInput(tomorrow)
})

const addChoice = () => {
  form.value.choices.push({ text: '' })
}

const removeChoice = (index) => {
  form.value.choices.splice(index, 1)
}

const handleSubmit = () => {
  emit('submit', { ...form.value })
}

watch(() => form.value.choices.length, (newLength) => {
  if (form.value.maxChoices > newLength) {
    form.value.maxChoices = newLength
  }
})
</script>