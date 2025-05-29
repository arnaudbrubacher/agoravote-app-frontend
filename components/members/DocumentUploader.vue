<!-- components/members/DocumentUploader.vue -->
<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-md font-medium">{{ title || 'Upload Document' }}</h3>
      <Button v-if="showCloseButton" variant="ghost" size="sm" @click="$emit('close')">
        <LucideIcon name="X" size="4" class="h-4 w-4" />
      </Button>
    </div>
    
    <div class="space-y-2">
      <Label v-if="description" class="text-sm text-muted-foreground">{{ description }}</Label>
      
      <!-- Document Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Document Name -->
        <div class="space-y-1">
          <Label for="document-name">Document Name</Label>
          <Input 
            id="document-name" 
            v-model="form.name" 
            placeholder="e.g., ID Card, Proof of Address"
            required
          />
        </div>
        
        <!-- Document Description -->
        <div class="space-y-1">
          <Label for="document-description">Description (Optional)</Label>
          <Textarea 
            id="document-description" 
            v-model="form.description" 
            placeholder="Brief description of the document"
            rows="2"
          />
        </div>
        
        <!-- File Upload -->
        <div class="space-y-1">
          <Label for="document-file">File</Label>
          <div 
            class="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            @click="triggerFileInput"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleFileDrop"
            :class="{ 'border-primary bg-primary/5': isDragging }"
          >
            <div v-if="!form.file" class="space-y-2">
              <LucideIcon name="Upload" size="6" class="h-6 w-6 mx-auto text-muted-foreground" />
              <p class="text-sm text-muted-foreground">
                Drag and drop your file here, or click to select
              </p>
              <p class="text-xs text-muted-foreground">
                Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)
              </p>
            </div>
            <div v-else class="space-y-2">
              <div class="flex items-center justify-center space-x-2">
                <LucideIcon 
                  :name="getFileIcon(form.file.type)" 
                  size="6" 
                  class="h-6 w-6 text-primary" 
                />
                <span class="text-sm font-medium truncate max-w-[200px]">
                  {{ form.file.name }}
                </span>
              </div>
              <p class="text-xs text-muted-foreground">
                {{ formatFileSize(form.file.size) }} - Click to change
              </p>
            </div>
          </div>
          <input 
            ref="fileInput"
            id="document-file" 
            type="file" 
            class="hidden" 
            @change="handleFileChange"
            accept="image/*,.pdf,.doc,.docx"
          />
        </div>
        
        <!-- Error Message -->
        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
        
        <!-- Form Actions -->
        <div class="flex justify-end space-x-2 pt-2">
          <Button v-if="showCancelButton" type="button" variant="outline" @click="$emit('cancel')">
            Cancel
          </Button>
          <Button 
            type="submit" 
            :disabled="isSubmitting || !form.file"
            :class="{ 'opacity-50 cursor-not-allowed': isSubmitting || !form.file }"
          >
            <LucideIcon v-if="isSubmitting" name="Loader2" size="4" class="h-4 w-4 mr-1 animate-spin" />
            {{ submitButtonText || 'Upload' }}
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import LucideIcon from '@/components/LucideIcon.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import axios from '~/src/utils/axios'

const props = defineProps({
  title: {
    type: String,
    default: 'Upload Document'
  },
  description: {
    type: String,
    default: ''
  },
  groupId: {
    type: String,
    required: true
  },
  showCancelButton: {
    type: Boolean,
    default: true
  },
  showCloseButton: {
    type: Boolean,
    default: false
  },
  submitButtonText: {
    type: String,
    default: 'Upload'
  }
})

const emit = defineEmits(['upload-success', 'upload-error', 'cancel', 'close'])

const fileInput = ref(null)
const isDragging = ref(false)
const isSubmitting = ref(false)
const error = ref('')

const form = ref({
  name: '',
  description: '',
  file: null
})

// Trigger the file input click
const triggerFileInput = () => {
  fileInput.value.click()
}

// Handle file selection
const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      error.value = 'File is too large. Maximum size is 10MB.'
      return
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      error.value = 'File type not supported. Please upload an image, PDF, or DOC file.'
      return
    }
    
    form.value.file = file
    error.value = ''
  }
}

// Handle file drop
const handleFileDrop = (event) => {
  isDragging.value = false
  const file = event.dataTransfer.files[0]
  if (file) {
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      error.value = 'File is too large. Maximum size is 10MB.'
      return
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      error.value = 'File type not supported. Please upload an image, PDF, or DOC file.'
      return
    }
    
    form.value.file = file
    error.value = ''
  }
}

// Get appropriate icon based on file type
const getFileIcon = (fileType) => {
  if (fileType.startsWith('image/')) return 'Image'
  if (fileType === 'application/pdf') return 'FileText'
  if (fileType.includes('word') || fileType.includes('doc')) return 'FileText'
  return 'File'
}

// Format file size
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' bytes'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// Handle form submission
const handleSubmit = async () => {
  if (!form.value.file) {
    error.value = 'Please select a file to upload'
    return
  }
  
  isSubmitting.value = true
  error.value = ''
  
  try {
    // Create form data
    const formData = new FormData()
    formData.append('file', form.value.file)
    formData.append('name', form.value.name)
    formData.append('description', form.value.description || '')
    
    // Upload the document
    const response = await axios.post(`/api/groups/${props.groupId}/members/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    // Emit success event with the response data
    emit('upload-success', response.data)
    
    // Reset the form
    form.value = {
      name: '',
      description: '',
      file: null
    }
    
    // Reset the file input
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  } catch (err) {
    console.error('Failed to upload document:', err)
    error.value = err.response?.data?.error || 'Failed to upload document'
    emit('upload-error', err)
  } finally {
    isSubmitting.value = false
  }
}
</script> 