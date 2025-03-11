<template>
  <div class="fixed inset-0 bg-background/80 backdrop-blur-sm">
    <div class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
      <div class="flex flex-col space-y-4">
        <header class="flex justify-between items-center">
          <h2 class="text-lg font-semibold">{{ group.isInvitation ? 'Accept Invitation' : 'Join Group' }}</h2>
          <Button variant="ghost" size="icon" @click="$emit('close')">
            <LucideIcon name="X" size="4" class="h-4 w-4" />
          </Button>
        </header>

        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- Section 1: Group Details -->
          <div class="space-y-4 border-b pb-4">
            
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
            
            <!-- File inputs outside the form -->
            <div v-if="documentsRequired" class="space-y-4 mb-4">
              <div class="space-y-1">
                <Label class="text-sm font-medium">Required Documents</Label>
                <p class="text-sm text-muted-foreground">The following documents are required to join this group:</p>
              </div>
              <div v-for="(doc, index) in requiredDocuments" :key="index" class="p-3 border rounded-md space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <Label class="text-sm font-medium" :for="'document-' + index">{{ doc.name }}</Label>
                  </div>
                  <div class="flex items-center gap-2">
                    <span v-if="form.documents[index]" class="text-sm text-green-600 truncate max-w-[150px]">
                      {{ form.documents[index].name }}
                    </span>
                    <span v-else class="text-sm text-muted-foreground">No file selected</span>
                    <Button type="button" variant="outline" size="sm" @click="(event) => triggerFileInput(index, event)">
                      {{ form.documents[index] ? 'Replace' : 'Upload' }}
                    </Button>
                  </div>
                </div>
                
                <p v-if="doc.description" class="text-sm text-muted-foreground">{{ doc.description }}</p>
                
                <input 
                  :id="'document-' + index" 
                  type="file" 
                  class="hidden" 
                  @change="handleDocumentChange(index, $event)" 
                  ref="fileInputs"
                  accept="image/*,.pdf,.doc,.docx"
                />
              </div>
            </div>
            
            <form @submit.prevent="handleSubmit" class="space-y-6">
              <!-- Group Password -->
              <div v-if="passwordRequired" class="space-y-1">
                <Label class="text-sm text-muted-foreground" for="password">Password</Label>
                <Input id="password" type="password" v-model="form.password" required :class="{ 'border-red-500': passwordError }" />
                <p v-if="passwordError" class="text-sm text-red-500 mt-1">{{ passwordError }}</p>
              </div>

              <!-- No Requirements Message -->
              <div v-if="!passwordRequired && !documentsRequired" class="text-sm text-muted-foreground">
                This group has no special admission requirements.
              </div>

              <!-- Form Actions -->
              <div class="flex justify-end space-x-2">
                <Button type="button" variant="outline" @click="$emit('close')">Cancel</Button>
                <Button type="submit" :disabled="isSubmitting">
                  {{ isSubmitting ? 'Submitting...' : (group.isInvitation ? 'Accept' : 'Join') }}
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

// Computed property to handle document requirements
const documentsRequired = computed(() => {
  // Check if the group requires documents
  const requiresDocuments = props.group.requiresDocuments === true || props.group.requires_documents === true;
  
  // If the group doesn't require documents, return false immediately
  if (!requiresDocuments) {
    console.log('Group does not require documents (requiresDocuments flag is false)');
    return false;
  }
  
  // Check if there are any required documents
  let hasRequiredDocuments = false;
  
  // Check both camelCase and snake_case versions
  if (props.group.requiredDocuments || props.group.required_documents) {
    const documents = props.group.requiredDocuments || props.group.required_documents;
    
    // If it's a string (JSON), parse it
    if (typeof documents === 'string') {
      try {
        const parsedDocs = JSON.parse(documents);
        // Check if it's an empty array
        if (Array.isArray(parsedDocs) && parsedDocs.length === 0) {
          console.log('Group has empty requiredDocuments array');
          return false;
        }
        hasRequiredDocuments = Array.isArray(parsedDocs) && parsedDocs.length > 0;
      } catch (e) {
        console.error('Error parsing required documents:', e);
      }
    } 
    // If it's already an array
    else if (Array.isArray(documents)) {
      if (documents.length === 0) {
        console.log('Group has empty requiredDocuments array');
        return false;
      }
      hasRequiredDocuments = documents.length > 0;
    }
  }
  
  console.log('Group documents required:', hasRequiredDocuments);
  return requiresDocuments && hasRequiredDocuments;
})

// Computed property to get the required documents array
const requiredDocuments = computed(() => {
  // Get the documents from either camelCase or snake_case property
  const documents = props.group.requiredDocuments || props.group.required_documents;
  
  // If no documents, return empty array
  if (!documents) return [];
  
  let parsedDocs = [];
  
  // If it's a string (JSON), parse it
  if (typeof documents === 'string') {
    try {
      parsedDocs = JSON.parse(documents);
    } catch (e) {
      console.error('Error parsing required documents:', e);
      return [];
    }
  }
  // If it's already an array, use it
  else if (Array.isArray(documents)) {
    parsedDocs = documents;
  }
  // If it's neither, return empty array
  else {
    return [];
  }
  
  // Normalize the documents to ensure each has name and description
  return parsedDocs.map(doc => {
    // If doc is a string, treat it as the name
    if (typeof doc === 'string') {
      return { name: doc, description: '' };
    }
    // If doc is an object, ensure it has name and description properties
    else if (typeof doc === 'object' && doc !== null) {
      return {
        name: doc.name || 'Unnamed Document',
        description: doc.description || ''
      };
    }
    // Default fallback
    return { name: 'Document', description: '' };
  });
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
  
  // Initialize documents array based on required documents
  if (documentsRequired.value) {
    form.value.documents = requiredDocuments.value.map(() => null)
  } else {
    form.value.documents = []
  }
  
  // Log group data for debugging
  console.log('Group data received:', newGroup)
  console.log('Password required:', passwordRequired.value)
  console.log('Documents required:', documentsRequired.value)
  console.log('Required documents:', requiredDocuments.value)
}, { immediate: true })

// Dispatch a custom event to close the DashboardSidebar when the component mounts
onMounted(() => {
  // Dispatch a custom event to close the DashboardSidebar
  window.dispatchEvent(new CustomEvent('close-dashboard-sidebar'))
})

const handleDocumentChange = (index, event) => {
  // Prevent default behavior to ensure it doesn't trigger form submission
  event.preventDefault();
  
  // Store the file in the form data
  form.value.documents[index] = event.target.files[0];
  
  // Log for debugging
  console.log(`Document ${index} selected:`, event.target.files[0]?.name);
}

const triggerFileInput = (index, event) => {
  // Prevent any form submission
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  // Click the file input
  if (fileInputs.value && fileInputs.value[index]) {
    fileInputs.value[index].click();
  }
}

const handleSubmit = async () => {
  isSubmitting.value = true
  passwordError.value = ''
  
  try {
    // Prepare documents data
    let documentsData = []
    
    if (documentsRequired.value && form.value.documents.length > 0) {
      // For each document, create an object with name and data
      documentsData = form.value.documents.map((file, index) => {
        if (!file) return null
        
        const docInfo = requiredDocuments.value[index] || { name: `Document ${index + 1}` }
        
        return {
          name: docInfo.name,
          description: docInfo.description || '',
          fileName: file.name,
          fileType: file.type,
          // In a real implementation, you would upload the file to a server
          // and store the URL or file ID here. For now, we'll just indicate
          // that a file was provided.
          data: `File provided: ${file.name}`
        }
      }).filter(doc => doc !== null)
    }
    
    // Create the admission data object based on what's required
    let admissionData = {};
    
    // Only include password if it's required and provided
    if (passwordRequired.value && form.value.password) {
      admissionData.password = form.value.password;
    }
    
    // Only include documents if they're required and provided
    if (documentsRequired.value && documentsData.length > 0) {
      admissionData.documents = documentsData;
    }
    
    // If no data was provided but requirements exist, show an error
    if ((passwordRequired.value && !form.value.password) || 
        (documentsRequired.value && documentsData.length === 0)) {
      throw new Error('Please provide all required information');
    }
    
    // Log the admission data for debugging
    console.log('GroupAdmissionForm - Submitting admission data:', JSON.stringify(admissionData));
    console.log('GroupAdmissionForm - Password provided:', !!form.value.password);
    console.log('GroupAdmissionForm - Documents provided:', documentsData.length);
    console.log('GroupAdmissionForm - Group:', props.group);
    
    // Emit the submit event with the admission data
    emit('submit', admissionData)
  } catch (error) {
    console.error('Failed to submit admission form:', error)
    alert(error.message || 'Failed to submit form')
  } finally {
    isSubmitting.value = false
  }
}

const emit = defineEmits(['close', 'submit'])
</script>