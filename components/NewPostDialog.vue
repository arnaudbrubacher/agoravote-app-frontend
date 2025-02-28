<template>
  <div class="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
    <div class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background shadow-lg duration-200 sm:rounded-lg">
      <div class="flex flex-col h-[90vh]">
        <header class="flex justify-between items-center p-6 border-b">
          <h2 class="text-lg font-semibold">Create New Post</h2>
          <Button variant="ghost" size="icon" @click="$emit('close')">
            <Icon name="heroicons:x-mark" class="h-4 w-4" />
          </Button>
        </header>

        <div class="flex-1 overflow-y-auto p-6">
          <form @submit.prevent="handleSubmit" class="space-y-6">
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
            
            <footer class="pt-6 border-t mt-auto">
              <div class="flex justify-end space-x-2">
                <Button variant="outline" type="button" @click="$emit('close')" :disabled="isSubmitting">Cancel</Button>
                <Button type="submit" :disabled="isSubmitting">
                  <span v-if="isSubmitting" class="mr-2">
                    <Icon name="heroicons:arrow-path" class="h-4 w-4 animate-spin" />
                  </span>
                  Create Post
                </Button>
              </div>
            </footer>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icon } from '@iconify/vue' // Using @iconify/vue as in your group page
import axios from '~/src/utils/axios'

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
    
    // Log FormData (for debugging)
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }
    
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