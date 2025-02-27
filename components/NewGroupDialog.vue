<template>
  <div class="fixed inset-0 bg-background/80 backdrop-blur-sm">
    <div class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
      <div class="flex flex-col space-y-4">
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-semibold">Create New Group</h2>
          <Button variant="ghost" size="icon" @click="$emit('close')">
            <XIcon class="h-4 w-4" />
          </Button>
        </div>
        
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Group Picture -->
          <div class="flex justify-center mb-8">
            <div class="relative">
              <div v-if="!form.picture" class="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center">
                <UserGroupIcon class="h-16 w-16 text-gray-400" />
              </div>
              <img 
                v-else
                :src="form.picture" 
                alt="Group Picture"
                class="w-28 h-28 rounded-full object-cover border"
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                class="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-md"
                @click="triggerFileInput"
              >
                <CameraIcon class="h-4 w-4" />
              </Button>
              <input 
                type="file" 
                ref="fileInput" 
                class="hidden"
                accept="image/*" 
                @change="handlePictureUpload" 
              />
            </div>
          </div>
          
          <!-- Group Name -->
          <div class="space-y-2">
            <Label for="group-name">Group Name</Label>
            <Input 
              id="group-name"
              v-model="form.name" 
              placeholder="Enter group name"
              required
            />
          </div>
          
          <!-- Group Description -->
          <div class="space-y-2">
            <Label for="group-description">Description</Label>
            <textarea
              id="group-description"
              v-model="form.description"
              class="w-full px-3 py-2 border rounded-md h-24"
              placeholder="Enter group description"
            ></textarea>
          </div>
          
          <!-- Privacy Settings -->
          <div class="space-y-2">
            <Label>Privacy</Label>
            <div class="flex space-x-4">
              <label class="flex items-center space-x-2">
                <input 
                  type="radio" 
                  v-model="form.isPrivate" 
                  :value="true"
                />
                <span>Private Group</span>
              </label>
              <label class="flex items-center space-x-2">
                <input 
                  type="radio" 
                  v-model="form.isPrivate" 
                  :value="false"
                />
                <span>Public Group</span>
              </label>
            </div>
          </div>
          
          <!-- Documents Required -->
          <div class="space-y-4">
            <div class="space-y-2">
              <Label>Documents Required from Users to Join</Label>
              <p class="text-sm text-muted-foreground">
                Members must submit these documents to join your group
              </p>
            </div>
            
            <Button 
              type="button"
              variant="outline" 
              @click="addDocument"
              class="flex items-center"
            >
              <PlusIcon class="h-4 w-4 mr-1" />
              Add Required Document
            </Button>
            
            <div v-if="form.documents.length" class="space-y-2">
              <div v-for="(doc, index) in form.documents" :key="index" class="flex items-center space-x-2">
                <Input 
                  v-model="doc.name" 
                  placeholder="Document name (e.g. ID Card, Student Card)" 
                />
                <Button 
                  type="button"
                  variant="destructive" 
                  size="icon" 
                  @click="removeDocument(index)"
                  title="Remove this document requirement"
                >
                  <TrashIcon class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div class="flex justify-end space-x-2">
            <Button type="button" variant="outline" @click="$emit('close')">Cancel</Button>
            <Button type="submit" :disabled="isSubmitting">
              {{ isSubmitting ? 'Creating...' : 'Create Group' }}
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from '~/src/utils/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { XIcon, UserGroupIcon, CameraIcon, TrashIcon, PlusIcon } from '@heroicons/vue/outline'

const emit = defineEmits(['close', 'group-created'])

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
  try {
    isSubmitting.value = true
    
    // Convert documents to the format expected by the backend
    const requiredDocuments = form.value.documents.map(doc => ({
      name: doc.name,
      required: true
    }))
    
    // Create form data to send to API
    const groupData = {
      name: form.value.name,
      description: form.value.description,
      is_private: form.value.isPrivate,
      picture: form.value.picture,
      required_documents: requiredDocuments // Use the correct field name
    }
    
    console.log('Sending group data:', JSON.stringify(groupData))
    
    // Make API call to create group
    const response = await axios.post('/groups', groupData)
    
    // Emit success event with new group
    emit('group-created', response.data)
    
    console.log('Group created:', response.data)
  } catch (error) {
    console.error('Failed to create group:', error)
    // Handle error (could add error state and display)
  } finally {
    isSubmitting.value = false
  }
}
</script>