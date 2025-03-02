<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Create New Post</DialogTitle>
        <DialogDescription>
          Share information with your group
        </DialogDescription>
      </DialogHeader>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Post Title -->
        <div>
          <Label for="title">Title</Label>
          <Input 
            id="title"
            v-model="formData.title"
            placeholder="Post title" 
            required
          />
        </div>
        
        <!-- Post Content -->
        <div>
          <Label for="content">Content</Label>
          <Textarea 
            id="content"
            v-model="formData.content"
            placeholder="What would you like to share with the group?"
            class="min-h-[120px]"
            required
          />
        </div>
        
        <!-- File Upload (optional) -->
        <div>
          <Label for="file" class="block mb-2">Attachment (Optional)</Label>
          <div class="border-2 border-dashed border-gray-300 rounded-md p-4">
            <div v-if="!formData.file" class="text-center">
              <LucideIcon name="FileUp" size="8" class="h-8 w-8 mx-auto text-muted-foreground" />
              <p class="text-sm text-muted-foreground mt-2">Click to upload or drag and drop</p>
              <input 
                type="file" 
                id="file"
                class="opacity-0 absolute inset-0 w-full h-full cursor-pointer" 
                @change="handleFileUpload"
              />
            </div>
            <div v-else class="flex items-center justify-between">
              <div class="flex items-center">
                <LucideIcon name="File" size="6" class="h-6 w-6 mr-2 text-primary" />
                <span class="text-sm truncate max-w-[200px]">{{ formData.file.name }}</span>
              </div>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                @click="formData.file = null"
              >
                <LucideIcon name="X" size="4" class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" @click="$emit('close')">
            Cancel
          </Button>
          <Button type="submit" :disabled="isSubmitting">
            <LucideIcon v-if="isSubmitting" name="RefreshCw" size="4" class="h-4 w-4 mr-2 animate-spin" />
            Create Post
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import LucideIcon from '@/components/LucideIcon.vue'
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  content: '',
  file: null
})

const isSubmitting = ref(false)

function handleFileUpload(event) {
  const file = event.target.files[0]
  if (file) {
    formData.value.file = file
  }
}

async function handleSubmit() {
  isSubmitting.value = true
  
  try {
    const postData = new FormData()
    postData.append('title', formData.value.title)
    postData.append('content', formData.value.content)
    postData.append('type', 'group')
    postData.append('groupId', props.group.id)
    
    if (formData.value.file) {
      postData.append('file', formData.value.file)
    }
    
    emit('submit', postData)
  } catch (error) {
    console.error('Error creating post:', error)
    alert('Failed to create post')
  } finally {
    isSubmitting.value = false
  }
}
</script>