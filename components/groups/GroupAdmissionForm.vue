<template>
  <div class="fixed inset-0 bg-background/80 backdrop-blur-sm">
    <div class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
      <div class="flex flex-col space-y-4">
        <header class="flex justify-between items-center">
          <h2 class="text-lg font-semibold">Join Group</h2>
          <Button variant="ghost" size="icon" @click="$emit('close')">
            <LucideIcon name="X" size="4" class="h-4 w-4" />
          </Button>
        </header>

        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- Section 1: Group Details -->
          <div class="space-y-4 border-b pb-4">
            <h3 class="text-md font-medium">Group Information</h3>
            
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
          </div>

          <!-- Section 2: Admission Requirements -->
          <div class="space-y-4">
            <h3 class="text-md font-medium">Admission Requirements</h3>
            
            <form @submit.prevent="handleSubmit" class="space-y-6">
              <!-- Group Password -->
              <div v-if="passwordRequired" class="space-y-1">
                <Label class="text-sm text-muted-foreground" for="password">Password</Label>
                <Input id="password" type="password" v-model="form.password" required :class="{ 'border-red-500': passwordError }" />
                <p v-if="passwordError" class="text-sm text-red-500 mt-1">{{ passwordError }}</p>
              </div>

              <!-- Documents Required -->
              <div v-if="group.documents && group.documents.length" class="space-y-4">
                <div class="space-y-1">
                  <Label class="text-sm text-muted-foreground">Required Documents</Label>
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

              <!-- No Requirements Message -->
              <div v-if="!passwordRequired && (!group.documents || !group.documents.length)" class="text-sm text-muted-foreground">
                This group has no special admission requirements.
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
import LucideIcon from '@/components/LucideIcon.vue'
import { ref, watch, onMounted, computed } from 'vue'
import Button from '@/components/ui/button/Button.vue'
import Input from '@/components/ui/input/Input.vue'
import Label from '@/components/ui/label/Label.vue'
import Icon from '@/components/Icon.vue'
import axios from '~/src/utils/axios'

const props = defineProps({
  group: {
    type: Object,
    required: true
  },
  error: {
    type: String,
    default: ''
  }
})

// Computed property to handle both camelCase and snake_case versions of requiresPassword
const passwordRequired = computed(() => {
  // Check for both camelCase and snake_case versions
  return props.group.requiresPassword === true || props.group.requires_password === true
})

// Watch for error changes to update the passwordError
watch(() => props.error, (newError) => {
  if (newError && passwordRequired.value) {
    passwordError.value = newError
  } else {
    passwordError.value = ''
  }
})

const isSubmitting = ref(false)
const fileInputs = ref([])
const passwordError = ref('')

const form = ref({
  password: '',
  documents: []
})

// Initialize form fields based on group requirements
watch(() => props.group, (newGroup) => {
  form.value.password = ''
  form.value.documents = newGroup.documents ? newGroup.documents.map(() => null) : []
  
  // Log group data for debugging
  console.log('Group data received:', newGroup)
  console.log('Password required:', passwordRequired.value)
}, { immediate: true })

// Dispatch a custom event to close the DashboardSidebar when the component mounts
onMounted(() => {
  // Dispatch a custom event to close the DashboardSidebar
  window.dispatchEvent(new CustomEvent('close-dashboard-sidebar'))
})

const handleDocumentChange = (index, event) => {
  form.value.documents[index] = event.target.files[0]
}

const triggerFileInput = (index) => {
  fileInputs.value[index].click()
}

const handleSubmit = async () => {
  isSubmitting.value = true
  passwordError.value = ''
  
  try {
    const admissionData = {
      password: form.value.password,
      documents: form.value.documents
    }
    
    // Emit the submit event with the admission data
    // The parent component (FindGroupDialog) will handle the API call
    // and any errors that might occur
    emit('submit', admissionData)
  } catch (error) {
    console.error('Failed to submit admission form:', error)
  } finally {
    isSubmitting.value = false
  }
}

const emit = defineEmits(['close', 'submit'])
</script>