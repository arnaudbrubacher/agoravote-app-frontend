<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="w-full max-w-3xl flex flex-col h-[80vh]">
      <DialogHeader>
        <DialogTitle>Create New Group</DialogTitle>
      </DialogHeader>

      <ScrollArea class="flex-1" maxHeight="calc(80vh - 140px)">
        <div class="p-6 pt-0 space-y-6">
          <!-- Group Picture -->
          <div class="flex justify-center mb-8 pb-4">
            <div class="relative">
              <div v-if="!form.picture" class="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center">
                <Users class="h-16 w-16 text-gray-400" />
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
                <Camera class="h-4 w-4" />
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
          <div class="space-y-2 pb-3">
            <Label for="group-name" class="text-sm font-medium">Name</Label>
            <Input 
              id="group-name"
              v-model="form.name" 
              placeholder="Enter group name"
              required
            />
          </div>
          
          <!-- Group Description -->
          <div class="space-y-2 pb-3">
            <Label for="group-description" class="text-sm font-medium">Description</Label>
            <Textarea
              id="group-description"
              v-model="form.description"
              class="w-full"
              placeholder="Enter group description"
            />
          </div>
          
          <!-- Privacy Settings -->
          <div class="space-y-2 pb-3">
            <Label for="is-private-toggle" class="text-sm font-medium">Privacy</Label>
            <div class="flex items-center space-x-2">
              <Switch
                id="is-private-toggle"
                v-model="form.isPrivate"
              />
              <Label for="is-private-toggle" class="text-sm text-muted-foreground">
                {{ form.isPrivate ? 'Private Group' : 'Public Group' }}
              </Label>
            </div>
          </div>
          
          <!-- Group Password -->
          <div class="space-y-2 pb-3">
            <Label for="requires-password" class="text-sm font-medium">Password</Label>
           <div class="flex items-center space-x-2">
              <Switch
                id="requires-password"
                v-model="form.requires_password"
              />
              <Label for="requires-password" class="text-sm text-muted-foreground">
                {{ form.requires_password ? 'Password Required' : 'No Password Required' }}
              </Label>
            </div>
            
            <div class="space-y-2 mt-2">
              <Input 
                type="password" 
                v-model="form.password" 
                placeholder="Enter password" 
                :disabled="!form.requires_password"
                :class="{ 'opacity-50': !form.requires_password }"
              />
              <Input 
                type="password" 
                v-model="form.confirmPassword" 
                placeholder="Confirm password" 
                :disabled="!form.requires_password"
                :class="{ 'opacity-50': !form.requires_password }"
              />
            </div>
          </div>

          <!-- Documents Required -->
          <div class="space-y-2 pb-3">
            <Label for="requires-documents" class="text-sm font-medium">Documents</Label>
            <div class="flex items-center space-x-2">
              <Switch
                id="requires-documents"
                v-model="form.requires_documents"
              />
              <Label for="requires-documents" class="text-sm text-muted-foreground">
                {{ form.requires_documents ? 'Documents Required' : 'No Documents Required' }}
              </Label>
            </div>
            
            <div class="mt-2">
              <Button 
                type="button"
                variant="outline" 
                @click="addDocument"
                class="flex items-center mb-2"
                :disabled="!form.requires_documents"
                :class="{ 'opacity-50': !form.requires_documents }"
              >
                <Plus class="h-4 w-4 mr-1" />
                Add Required Document
              </Button>
              
              <div class="space-y-2">
                <div v-for="(doc, index) in form.documents" :key="index" class="flex items-center space-x-2">
                  <Input 
                    v-model="doc.name" 
                    placeholder="Document name (e.g. ID Card, Student Card)" 
                    :disabled="!form.requires_documents"
                    :class="{ 'opacity-50': !form.requires_documents }"
                  />
                  <Button 
                    type="button"
                    variant="destructive" 
                    size="icon" 
                    @click="removeDocument(index)"
                    title="Remove this document requirement"
                    :disabled="!form.requires_documents"
                    :class="{ 'opacity-50': !form.requires_documents }"
                  >
                    <Trash class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Membership Approval Setting -->
          <div class="space-y-2 pb-3">
            <Label for="requires-admin-approval" class="text-sm font-medium">Membership Approval</Label>
            <div class="flex items-center space-x-2">
              <Switch
                id="requires-admin-approval-toggle"
                v-model="form.requires_admin_approval"
              />
              <Label for="requires-admin-approval-toggle" class="text-sm text-muted-foreground">
                {{ form.requires_admin_approval ? 'Admin approval required' : 'Automatic approval' }}
              </Label>
            </div>
            
            <div class="space-y-2 mt-2">
              <div class="h-10 flex items-center">
                <p class="text-sm text-muted-foreground">
                  {{ form.requires_admin_approval 
                    ? 'New members must be approved by an admin before joining.' 
                    : 'New members will be automatically approved when they join.' }}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter class="pt-2">
          <Button type="button" variant="outline" @click="handleCancel">Cancel</Button>
          <Button type="submit" :disabled="isSubmitting" @click="handleSubmit">
            {{ isSubmitting ? 'Creating...' : 'Create Group' }}
          </Button>
        </DialogFooter>
      </ScrollArea>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import axios from '~/src/utils/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash, Users, Camera } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cloneDeep } from 'lodash'

const emit = defineEmits(['close', 'group-created'])

const fileInput = ref(null)
const isSubmitting = ref(false)

// Initial empty form
const initialForm = {
  name: '',
  description: '',
  isPrivate: true,
  picture: null,
  requires_password: false,
  password: '',
  confirmPassword: '',
  requires_documents: false,
  documents: [],
  requires_admin_approval: true // Default to requiring admin approval
}

// Create the form ref with initial values
const form = ref(cloneDeep(initialForm))

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
    
    // Validate password if required
    if (form.value.requires_password) {
      if (!form.value.password) {
        alert('Please enter a password')
        isSubmitting.value = false
        return
      }
      
      if (form.value.password !== form.value.confirmPassword) {
        alert('Passwords do not match')
        isSubmitting.value = false
        return
      }
      
      console.log('Password validation passed:', {
        requires_password: form.value.requires_password,
        password_length: form.value.password.length
      })
    } else {
      // Clear password fields if password is not required
      // This only affects password fields, not documents
      form.value.password = '';
      form.value.confirmPassword = '';
    }
    
    // Convert documents to the format expected by the backend
    let requiredDocuments = []
    if (form.value.requires_documents && form.value.documents.length > 0) {
      requiredDocuments = form.value.documents.map(doc => doc.name)
      console.log('Required documents array:', requiredDocuments)
    } else if (!form.value.requires_documents) {
      // Clear documents if documents are not required
      // This only affects documents, not password fields
      form.value.documents = [];
      requiredDocuments = [];
    }
    
    // Create form data to send to API
    const groupData = {
      name: form.value.name,
      description: form.value.description,
      is_private: form.value.isPrivate,
      picture: form.value.picture,
      requires_password: form.value.requires_password,
      password: form.value.requires_password ? form.value.password : '',
      requires_documents: form.value.requires_documents,
      required_documents: JSON.stringify(requiredDocuments),
      requires_admin_approval: form.value.requires_admin_approval
    }
    
    // Log the exact data being sent (without the picture for brevity)
    const logData = { ...groupData }
    if (logData.picture) {
      logData.picture = '[Picture data omitted for brevity]'
    }
    console.log('Sending group data:', JSON.stringify(logData, null, 2))
    
    // Make API call to create group
    const response = await axios.post('/groups', groupData)
    
    // Emit success event with new group
    emit('group-created', response.data)
    
    console.log('Group created:', response.data)
  } catch (error) {
    console.error('Failed to create group:', error)
    console.error('Error response:', error.response?.data)
    alert('Failed to create group: ' + (error.response?.data?.error || 'Unknown error'))
  } finally {
    isSubmitting.value = false
  }
}

// Reset form to initial state
const resetForm = () => {
  form.value = cloneDeep(initialForm)
  console.log('Form reset to initial values')
}

// Cancel button handler
const handleCancel = () => {
  resetForm()
  emit('close')
}

// Add watchers to log toggle changes without affecting other fields
watch(() => form.value.requires_password, (newValue) => {
  console.log('Password requirement toggled locally:', newValue)
})

watch(() => form.value.requires_documents, (newValue) => {
  console.log('Document requirement toggled locally:', newValue)
})

watch(() => form.value.requires_admin_approval, (newValue) => {
  console.log('Admin approval requirement toggled locally:', newValue)
})
</script>