<template>
  <div class="fixed inset-0 bg-background/80 backdrop-blur-sm">
    <div class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
      <div class="flex flex-col space-y-4">
        <header class="flex justify-between items-center">
          <h2 class="text-lg font-semibold">Join Group</h2>
          <Button variant="ghost" size="icon" @click="$emit('close')">
            <Icon name="heroicons:x-mark" class="h-4 w-4" />
          </Button>
        </header>

        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- Group Details -->
          <div class="space-y-6">
            <div class="space-y-1">
              <Label class="text-sm text-muted-foreground">Name</Label>
              <p class="text-lg font-medium">{{ group.name }}</p>
            </div>

            <div class="space-y-1">
              <Label class="text-sm text-muted-foreground">Description</Label>
              <p class="text-lg font-medium">{{ group.description }}</p>
            </div>

            <div class="space-y-1">
              <Label class="text-sm text-muted-foreground">Privacy</Label>
              <p class="text-lg font-medium">{{ group.isPrivate ? 'Private' : 'Public' }}</p>
            </div>

            <div class="space-y-1">
              <Label class="text-sm text-muted-foreground">Group ID</Label>
              <p class="text-lg font-medium">{{ group.id }}</p>
            </div>

            <form @submit.prevent="handleSubmit" class="space-y-6">
              <!-- Group Password -->
              <div v-if="group.requiresPassword" class="space-y-1">
                <Label class="text-sm text-muted-foreground" for="password">Password</Label>
                <Input id="password" type="password" v-model="form.password" required />
              </div>

              <!-- Documents Required -->
              <div v-if="group.documents && group.documents.length" class="space-y-4">
                <div class="space-y-1">
                  <Label class="text-sm text-muted-foreground">Documents Required for Admission</Label>
                </div>
                <div v-for="(doc, index) in group.documents" :key="index" class="space-y-1">
                  <Label class="text-sm text-muted-foreground" :for="'document-' + index">{{ doc.name }}</Label>
                  <div class="flex items-center space-x-2">
                    <input 
                      :id="'document-' + index" 
                      type="file" 
                      class="hidden" 
                      @change="handleDocumentChange(index, $event)" 
                      ref="fileInputs"
                    />
                    <Button variant="outline" @click="triggerFileInput(index)">Upload</Button>
                    <span v-if="form.documents[index]">{{ form.documents[index].name }}</span>
                  </div>
                </div>
              </div>

              <!-- Form Actions -->
              <div class="flex justify-end space-x-2">
                <Button type="button" variant="outline" @click="$emit('close')">Cancel</Button>
                <Button type="submit" :disabled="isSubmitting">
                  {{ isSubmitting ? 'Submitting...' : 'Submit' }}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import Button from '@/components/ui/button/Button.vue'
import Input from '@/components/ui/input/Input.vue'
import Label from '@/components/ui/label/Label.vue'
import Icon from '@/components/Icon.vue'

const props = defineProps({
  group: {
    type: Object,
    required: true
  }
})

const isSubmitting = ref(false)
const fileInputs = ref([])

const form = ref({
  password: '',
  documents: []
})

// Initialize form fields based on group requirements
watch(() => props.group, (newGroup) => {
  form.value.password = ''
  form.value.documents = newGroup.documents ? newGroup.documents.map(() => null) : []
}, { immediate: true })

const handleDocumentChange = (index, event) => {
  form.value.documents[index] = event.target.files[0]
}

const triggerFileInput = (index) => {
  fileInputs.value[index].click()
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    const admissionData = {
      password: form.value.password,
      documents: form.value.documents
    }
    await emit('submit', admissionData)
  } catch (error) {
    console.error('Failed to submit admission form:', error)
  } finally {
    isSubmitting.value = false
  }
}

defineEmits(['close', 'submit'])
</script>