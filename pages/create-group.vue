<template>
  <div class="container mx-auto p-6">
    <div class="max-w-2xl mx-auto">
      <div class="flex items-center mb-6">
        <Plus class="mr-2 h-6 w-6" />
        <h1 class="text-2xl font-semibold">Create Group</h1>
      </div>

      <div class="p-6 space-y-6">
        <!-- Group Picture -->
        <div class="flex justify-center">
          <div class="relative">
            <div v-if="!form.picture" class="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center">
              <Users class="h-20 w-20 text-gray-400" />
            </div>
            <img 
              v-else
              :src="form.picture"
              alt="Group Picture Preview"
              class="w-32 h-32 rounded-full object-cover border-2 border-muted"
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              class="absolute bottom-0 right-0 h-10 w-10 rounded-full shadow-md flex items-center justify-center"
              @click="triggerFileInput"
              title="Upload Group Picture"
            >
              <Camera class="h-5 w-5" />
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
          <Label for="group-name" class="text-base font-medium">Name</Label>
          <Input 
            id="group-name"
            v-model="form.name" 
            placeholder="Enter group name (e.g., 'Book Club')"
            required
            class="text-base py-3 px-4"
          />
        </div>
        
        <!-- Group Description -->
        <div class="space-y-2">
          <Label for="group-description" class="text-base font-medium">Description</Label>
          <Textarea
            id="group-description"
            v-model="form.description"
            class="w-full text-base py-3 px-4" 
            placeholder="Describe your group (optional)"
            rows="4"
          />
        </div>
        
        <!-- Privacy Settings -->
        <div class="space-y-2">
          <Label for="is-private-toggle" class="text-base font-medium">Privacy</Label>
          <div class="flex items-center space-x-3 pt-1">
            <Switch
              id="is-private-toggle"
              :checked="form.isPrivate"
              @update:checked="form.isPrivate = $event"
            />
            <Label for="is-private-toggle" class="text-base text-muted-foreground">
              {{ form.isPrivate ? 'Private Group' : 'Public Group' }}
            </Label>
          </div>
           <p class="text-sm text-muted-foreground pt-1">
            Private groups are not visible in public search results and require an invitation or admin approval to join.
          </p>
        </div>
        
        <!-- Group Password -->
        <div class="space-y-2">
          <Label for="requires-password" class="text-base font-medium">Password Protection</Label>
          <div class="flex items-center space-x-3 pt-1">
            <Switch
              id="requires-password"
              :checked="form.requires_password"
              @update:checked="form.requires_password = $event"
            />
            <Label for="requires-password" class="text-base text-muted-foreground">
              {{ form.requires_password ? 'Password Required to Join' : 'No Password Required' }}
            </Label>
          </div>
          
          <div v-if="form.requires_password" class="space-y-3 pt-3">
            <Input 
              type="password" 
              v-model="form.password" 
              placeholder="Enter password"
              class="text-base py-3 px-4"
            />
            <Input 
              type="password" 
              v-model="form.confirmPassword" 
              placeholder="Confirm password" 
              class="text-base py-3 px-4"
            />
          </div>
        </div>

        <!-- Documents Required -->
        <div class="space-y-2">
          <Label for="requires-documents" class="text-base font-medium">Document Verification</Label>
          <div class="flex items-center space-x-3 pt-1">
            <Switch
              id="requires-documents"
              :checked="form.requires_documents"
              @update:checked="form.requires_documents = $event"
            />
            <Label for="requires-documents" class="text-base text-muted-foreground">
              {{ form.requires_documents ? 'Documents Required to Join' : 'No Documents Required' }}
            </Label>
          </div>
          
          <div v-if="form.requires_documents" class="pt-3">
            <Button 
              type="button"
              variant="outline" 
              @click="addDocument"
              class="flex items-center mb-3 text-base py-2 px-3"
            >
              <Plus class="h-5 w-5 mr-2" />
              Add Required Document Type
            </Button>
            
            <div class="space-y-3">
              <div v-for="(doc, index) in form.documents" :key="index" class="flex items-center space-x-3">
                <Input 
                  v-model="doc.name" 
                  placeholder="Document name (e.g. ID Card, Student Card)" 
                  class="text-base py-3 px-4 flex-grow"
                />
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon" 
                  @click="removeDocument(index)"
                  title="Remove this document requirement"
                  class="text-destructive hover:bg-destructive/10"
                >
                  <Trash class="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Membership Approval Setting -->
        <div class="space-y-2">
          <Label for="requires-admin-approval" class="text-base font-medium">Membership Approval</Label>
          <div class="flex items-center space-x-3 pt-1">
            <Switch
              id="requires-admin-approval-toggle"
              :checked="form.requires_admin_approval"
              @update:checked="form.requires_admin_approval = $event"
            />
            <Label for="requires-admin-approval-toggle" class="text-base text-muted-foreground">
              {{ form.requires_admin_approval ? 'Admin Approval Required' : 'Automatic Approval' }}
            </Label>
          </div>
          <p class="text-sm text-muted-foreground pt-1">
            {{ form.requires_admin_approval 
              ? 'New members must be approved by an admin before joining.' 
              : 'New members will be automatically approved if other requirements (password/documents) are met.' }}
          </p>
        </div>
      </div>
      
      <div class="flex justify-end space-x-3 mt-8 py-4 border-t">
        <Button type="button" variant="outline" @click="handleCancel" class="text-base py-3 px-6">Cancel</Button>
        <Button type="submit" :disabled="isSubmitting || !isFormValid" @click="handleSubmit" class="text-base py-3 px-6">
          <Loader2 v-if="isSubmitting" class="mr-2 h-5 w-5 animate-spin" />
          {{ isSubmitting ? 'Creating...' : 'Create Group' }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from '~/src/utils/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash, Users, Camera, Loader2 } from 'lucide-vue-next'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cloneDeep } from 'lodash'
import { useAlert } from '@/composables/useAlert'

definePageMeta({
  layout: 'app-layout',
  middleware: ['auth']
})

const router = useRouter()
const { alert, confirm } = useAlert()

const fileInput = ref(null)
const isSubmitting = ref(false)

const initialForm = {
  name: '',
  description: '',
  isPrivate: true,
  picture: null, // Will store base64 string or null
  requires_password: false,
  password: '',
  confirmPassword: '',
  requires_documents: false,
  documents: [], // Array of objects like { name: 'ID Card' }
  requires_admin_approval: true
}

const form = ref(cloneDeep(initialForm))

const isFormValid = computed(() => {
  if (!form.value.name.trim()) return false;
  if (form.value.requires_password && (!form.value.password || form.value.password !== form.value.confirmPassword)) {
    return false;
  }
  if (form.value.requires_documents && form.value.documents.some(doc => !doc.name.trim())) {
    return false;
  }
  return true;
});

const triggerFileInput = () => {
  fileInput.value.click()
}

const handlePictureUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      alert('Image too large', 'Please select an image smaller than 2MB.');
      return;
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      form.value.picture = e.target.result // base64 string
    }
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      alert('Error', 'Could not read the image file.');
    };
    reader.readAsDataURL(file)
  }
}

const addDocument = () => {
  if (form.value.documents.length < 5) { // Limit number of document types
    form.value.documents.push({ name: '' })
  }
}

const removeDocument = (index) => {
  form.value.documents.splice(index, 1)
}

const handleSubmit = async () => {
  if (!isFormValid.value) {
    alert('Validation Error', 'Please check the form for errors. Group name is required, and passwords must match if enabled.');
    return;
  }

  isSubmitting.value = true
  try {
    let requiredDocumentsArray = []
    if (form.value.requires_documents && form.value.documents.length > 0) {
      requiredDocumentsArray = form.value.documents.filter(doc => doc.name.trim() !== '').map(doc => doc.name)
       if (requiredDocumentsArray.length === 0 && form.value.requires_documents) {
         alert('Validation Error', 'If documents are required, please specify at least one document name.');
         isSubmitting.value = false;
         return;
       }
    }
    
    const groupData = {
      name: form.value.name.trim(),
      description: form.value.description.trim(),
      is_private: form.value.isPrivate,
      picture: form.value.picture, // send base64 string or null
      requires_password: form.value.requires_password,
      password: form.value.requires_password ? form.value.password : '',
      requires_documents: form.value.requires_documents,
      required_documents: JSON.stringify(requiredDocumentsArray), // Send as JSON string array
      requires_admin_approval: form.value.requires_admin_approval
    }

    const response = await axios.post('/groups', groupData)
    
    alert('Success', `Group "${response.data.name}" created successfully!`)
    
    // Dispatch event so sidebar can refresh
    window.dispatchEvent(new CustomEvent('group-data-updated'));

    // Navigate to the new group page
    router.push(`/group/${response.data.id}`)

  } catch (error) {
    console.error('Failed to create group:', error)
    alert('Error Creating Group', error.response?.data?.error || 'An unexpected error occurred.')
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = async () => {
  const confirmed = await confirm(
    'Discard Changes?',
    'Are you sure you want to discard the changes and go back?',
    { actionText: 'Discard', cancelText: 'Keep Editing' }
  );
  if (confirmed) {
    router.back() // Or router.push('/dashboard') or another default page
  }
}

// Watchers to clear dependent fields when toggles are switched off
watch(() => form.value.requires_password, (newValue) => {
  if (!newValue) {
    form.value.password = ''
    form.value.confirmPassword = ''
  }
})

watch(() => form.value.requires_documents, (newValue) => {
  if (!newValue) {
    form.value.documents = []
  }
})

</script>

<style scoped>
/* Add any page-specific styles if needed */
</style> 