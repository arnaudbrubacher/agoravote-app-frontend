<template>
  <div class="fixed inset-0 bg-background/80 backdrop-blur-sm">
    <div class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
      <div class="flex flex-col space-y-4">
        <header class="flex justify-between items-center">
          <h2 class="text-lg font-semibold">Create New Group</h2>
          <Button variant="ghost" size="icon" @click="$emit('close')">
            <Icon name="heroicons:x-mark" class="h-4 w-4" />
          </Button>
        </header>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Group Picture -->
          <div class="flex flex-col items-center space-y-2">
            <div class="relative">
              <div v-if="form.picture" class="w-32 h-32">
                <img 
                  :src="form.picture" 
                  alt="Group picture"
                  class="w-full h-full rounded-lg object-cover"
                />
              </div>
              <div v-else class="w-32 h-32 bg-muted rounded-lg flex items-center justify-center">
                <Icon name="heroicons:user-group" class="w-16 h-16 text-muted-foreground" />
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                class="absolute -bottom-2 -right-2"
                @click="triggerFileInput"
              >
                <Icon name="heroicons:pencil" class="h-4 w-4" />
              </Button>
              <input 
                type="file"
                ref="fileInput"
                class="hidden"
                accept="image/*"
                @change="handlePictureUpload"
              />
            </div>
            <span class="text-sm text-muted-foreground">Group Picture</span>
          </div>

          <!-- Group Name -->
          <div class="space-y-2">
            <Label for="name">Group Name</Label>
            <Input id="name" v-model="form.name" required />
          </div>

          <!-- Group Description -->
          <div class="space-y-2">
            <Label for="description">Description</Label>
            <Input id="description" v-model="form.description" />
          </div>

          <!-- Group Privacy -->
          <div class="space-y-2">
            <Label>Privacy</Label>
            <div class="flex space-x-2">
              <Button 
                type="button"
                :variant="form.isPrivate ? 'default' : 'outline'"
                @click="form.isPrivate = true"
              >
                Private
              </Button>
              <Button 
                type="button"
                :variant="!form.isPrivate ? 'default' : 'outline'"
                @click="form.isPrivate = false"
              >
                Public
              </Button>
            </div>
          </div>

          <!-- Group Password -->
          <div class="space-y-2">
            <Label>
              <input type="checkbox" v-model="form.requiresPassword" />
              Admission requires a password
            </Label>
            <Input 
              type="password" 
              v-model="form.password" 
              placeholder="Enter password" 
              :disabled="!form.requiresPassword"
            />
            <Input 
              type="password" 
              v-model="form.confirmPassword" 
              placeholder="Confirm password" 
              :disabled="!form.requiresPassword"
            />
          </div>

          <!-- Documents Required -->
          <div class="space-y-2">
            <Label>Documents Required</Label>
            <div v-for="(document, index) in form.documents" :key="index" class="flex space-x-2 items-center">
              <Input 
                v-model="document.name" 
                placeholder="Document name" 
                class="flex-1"
              />
              <Button 
                variant="destructive" 
                size="icon" 
                @click="removeDocument(index)"
              >
                <Icon name="heroicons:trash" class="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" @click="addDocument">Add Document</Button>
          </div>

          <!-- Form Actions -->
          <div class="flex justify-end space-x-2">
            <Button type="button" variant="outline" @click="$emit('close')">Cancel</Button>
            <Button 
              type="submit" 
              :disabled="isSubmitting || !form.name.trim() || (form.requiresPassword && form.password !== form.confirmPassword)"
            >
              {{ isSubmitting ? 'Creating...' : 'Create Group' }}
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const fileInput = ref(null)
const isSubmitting = ref(false)

const form = ref({
  name: '',
  description: '',
  isPrivate: true,
  picture: null,
  requiresPassword: false,
  password: '',
  confirmPassword: '',
  documents: []
})

const triggerFileInput = () => {
  fileInput.value.click()
}

const handlePictureUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      form.value.picture = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const addDocument = () => {
  form.value.documents.push({ name: '' })
}

const removeDocument = (index) => {
  form.value.documents.splice(index, 1)
}

const handleSubmit = async () => {
  if (!form.value.name.trim() || (form.requiresPassword && form.password !== form.confirmPassword)) return
  
  isSubmitting.value = true
  try {
    await emit('submit', { ...form.value })
    form.value = {
      name: '',
      description: '',
      isPrivate: true,
      picture: null,
      requiresPassword: false,
      password: '',
      confirmPassword: '',
      documents: []
    }
    emit('close')
  } catch (error) {
    console.error('Failed to create group:', error)
  } finally {
    isSubmitting.value = false
  }
}

defineEmits(['close', 'submit'])
</script>