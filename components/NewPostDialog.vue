<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="w-full max-w-3xl">
      <DialogHeader>
        <DialogTitle>Create New Post</DialogTitle>
        <DialogDescription>
          Share your thoughts with the group.
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-6 p-6 pt-0">
        <div class="space-y-2">
          <Label for="title">Title</Label>
          <Input id="title" v-model="form.title" required />
        </div>

        <div class="space-y-2">
          <Label for="content">Content</Label>
          <textarea
            id="content"
            v-model="form.content"
            rows="4"
            class="w-full rounded-md border bg-transparent px-3 py-2"
            required
          ></textarea>
        </div>

        <div class="space-y-2">
          <Label>Attachment</Label>
          <div class="flex items-center space-x-2">
            <Button 
              type="button"
              variant="outline"
              @click="triggerFileInput"
            >
              <Icon name="heroicons:document-arrow-up" class="h-4 w-4 mr-2" />
              Upload File
            </Button>
            <span v-if="form.file" class="text-sm">
              {{ form.file.name }}
            </span>
            <input
              type="file"
              ref="fileInput"
              class="hidden"
              @change="handleFileUpload"
            />
          </div>
        </div>
        
        <DialogFooter class="pt-6 border-t mt-auto">
          <Button variant="outline" type="button" @click="$emit('close')" :disabled="isSubmitting">Cancel</Button>
          <Button type="submit" :disabled="isSubmitting">
            <span v-if="isSubmitting" class="mr-2">
              <Icon name="heroicons:arrow-path" class="h-4 w-4 animate-spin" />
            </span>
            Create Post
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icon } from '@iconify/vue'
import axios from '~/src/utils/axios'
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
const isSubmitting = ref(false)
const fileInput = ref(null)

const form = ref({
  title: '',
  content: '',
  file: null
})

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    form.value.file = file
  }
}

const handleSubmit = async () => {
  if (!form.value.title.trim() || !form.value.content.trim()) return
  
  try {
    isSubmitting.value = true
    
    // Create FormData to handle the file upload
    const formData = new FormData()
    formData.append('title', form.value.title)
    formData.append('content', form.value.content)
    formData.append('group_id', props.group.id)
    
    if (form.value.file) {
      formData.append('file', form.value.file)
    }
    
    // Send request to create post
    const response = await axios.post(`/groups/${props.group.id}/posts`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    // Emit events on success
    emit('submit', response.data)
    emit('close')
    
  } catch (error) {
    console.error('Failed to create post:', error)
    // Here you could add error handling/notification
  } finally {
    isSubmitting.value = false
  }
}
</script>