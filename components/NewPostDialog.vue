<template>
  <div class="fixed inset-0 bg-background/80 backdrop-blur-sm">
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
                  Upload File
                </Button>
                <span v-if="form.file" class="text-sm">
                  {{ form.file.name }}
                </span>
              </div>
              <input
                type="file"
                ref="fileInput"
                class="hidden"
                @change="handleFileUpload"
              />
            </div>
          </form>
        </div>

        <footer class="p-6 border-t">
          <div class="flex justify-end space-x-2">
            <Button variant="outline" @click="$emit('close')">Cancel</Button>
            <Button @click="handleSubmit">Create Post</Button>
          </div>
        </footer>
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

const handleSubmit = () => {
  if (!form.value.title.trim() || !form.value.content.trim()) return
  
  $emit('submit', {
    title: form.value.title,
    content: form.value.content,
    file: form.value.file
  })
}

defineEmits(['close', 'submit'])
</script>