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
            
            <form @submit.prevent="handleSubmit" class="space-y-6">
              <!-- Group Password -->
              <div v-if="passwordRequired" class="space-y-1">
                <Label class="text-sm text-muted-foreground" for="password">Password</Label>
                <Input id="password" type="password" v-model="form.password" required :class="{ 'border-red-500': passwordError }" />
                <p v-if="passwordError" class="text-sm text-red-500 mt-1">{{ passwordError }}</p>
              </div>

              <!-- Document Requirements -->
              <div v-if="documentsRequired" class="space-y-4">
                <div class="space-y-1">
                  <Label class="text-sm font-medium">Required Documents</Label>
                  <p class="text-sm text-muted-foreground">The following documents are required to join this group:</p>
                </div>
                
                <div v-for="(doc, index) in requiredDocuments" :key="index" class="p-3 border rounded-md space-y-3">
                  <div class="flex justify-between items-start">
                    <div>
                      <h4 class="text-sm font-medium">{{ doc.name }}</h4>
                      <p v-if="doc.description" class="text-xs text-muted-foreground">{{ doc.description }}</p>
                    </div>
                    <div v-if="documentFiles[index]" class="flex items-center space-x-1">
                      <LucideIcon 
                        :name="getFileIcon(documentFiles[index].type)" 
                        size="4" 
                        class="h-4 w-4 text-primary" 
                      />
                      <span class="text-xs text-muted-foreground">{{ formatFileSize(documentFiles[index].size) }}</span>
                    </div>
                  </div>
                  
                  <!-- File Upload Area -->
                  <div 
                    class="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                    :class="{ 'border-primary bg-primary/5': isDragging[index], 'border-green-500 bg-green-50': documentFiles[index] }"
                    @click="() => triggerFileInput(index)"
                    @dragover.prevent="() => setDragging(index, true)"
                    @dragleave.prevent="() => setDragging(index, false)"
                    @drop.prevent="(event) => handleFileDrop(event, index)"
                  >
                    <div v-if="!documentFiles[index]" class="space-y-1">
                      <LucideIcon name="Upload" size="4" class="h-4 w-4 mx-auto text-muted-foreground" />
                      <p class="text-xs text-muted-foreground">
                        Drag and drop or click to select a file
                      </p>
                    </div>
                    <div v-else class="space-y-1">
                      <div class="flex items-center justify-center">
                        <span class="text-xs font-medium truncate max-w-[200px]">
                          {{ documentFiles[index].name }}
                        </span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          @click.stop="() => removeFile(index)"
                          class="ml-2 h-6 w-6 p-0"
                        >
                          <LucideIcon name="X" size="3" class="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <!-- File Input (hidden) -->
                  <input 
                    :ref="el => { if (el) fileInputs[index] = el }"
                    type="file" 
                    class="hidden" 
                    @change="(event) => handleFileChange(event, index)"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  
                  <!-- Error Message -->
                  <p v-if="documentErrors[index]" class="text-xs text-red-500 mt-1">
                    {{ documentErrors[index] }}
                  </p>
                </div>
              </div>

              <!-- Admin Approval Notice -->
              <div v-if="adminApprovalRequired" class="text-sm text-amber-600 mt-2">
                <span class="flex items-center">
                  <LucideIcon name="Info" size="4" class="h-4 w-4 mr-1" />
                  Note: Your membership will require admin approval before it is activated.
                </span>
              </div>

              <!-- No Requirements Message -->
              <div v-if="!passwordRequired && !documentsRequired" class="space-y-1">
                <div class="text-sm text-muted-foreground">
                  This group has no special admission requirements.
                </div>
              </div>

              <!-- Form Actions -->
              <div class="flex justify-end space-x-2">
                <Button type="button" variant="outline" @click="$emit('close')">Cancel</Button>
                <Button 
                  type="submit" 
                  :disabled="isSubmitting || !isFormValid"
                >
                  <LucideIcon v-if="isSubmitting" name="Loader2" size="4" class="h-4 w-4 mr-1 animate-spin" />
                  {{ isSubmitting ? 'Submitting...' : (group.isInvitation ? 'Accept' : 'Join') }}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Reusable Alert Dialog -->
  <ActionAlertDialog
    :open="isOpen"
    :title="title"
    :message="message"
    :action-text="actionText"
    :cancel-text="cancelText"
    :show-cancel="showCancel"
    @update:open="isOpen = $event"
    @action="handleAction"
    @cancel="handleCancel"
  />
</template>

<script setup>
import LucideIcon from '@/components/LucideIcon.vue'
import { ref, watch, onMounted, computed } from 'vue'
import Button from '@/components/ui/button/Button.vue'
import Input from '@/components/ui/input/Input.vue'
import Label from '@/components/ui/label/Label.vue'
import { useAlertDialog } from '@/composables/useAlertDialog'
import ActionAlertDialog from '@/components/shared/ActionAlertDialog.vue'
import { useNuxtApp } from '#app'

const { $axiosInstance } = useNuxtApp()

const props = defineProps({
  group: {
    type: Object,
    required: true
  },
  invitationToken: {
    type: String,
    default: null
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

// Computed property to check if admin approval is required
const adminApprovalRequired = computed(() => {
  // Check for both camelCase and snake_case versions
  return props.group.requiresAdminApproval === true || props.group.requires_admin_approval === true
})

// Computed property to handle document requirements
const documentsRequired = computed(() => {
  // Check if the group requires documents
  const requiresDocuments = props.group.requiresDocuments === true || 
                            props.group.requires_documents === true ||
                            props.group.documents_are_required === true;
  
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
  const docs = props.group.requiredDocuments || props.group.required_documents;

  if (typeof docs === 'string') {
    try {
      return JSON.parse(docs);
    } catch (e) {
      console.error('Error parsing required documents string:', e);
      return [];
    }
  }
  return Array.isArray(docs) ? docs : [];
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
const documentFiles = ref([])
const documentErrors = ref([])
const isDragging = ref([])
const uploadedDocuments = ref([])

// Initialize the alert dialog system
const { 
  isOpen, 
  title, 
  message, 
  actionText, 
  cancelText, 
  showCancel, 
  showAlert, 
  showConfirm, 
  handleAction, 
  handleCancel 
} = useAlertDialog()

// Computed property to check if the form is valid
const isFormValid = computed(() => {
  // Check password if required
  if (passwordRequired.value && !form.value.password) {
    return false
  }
  
  // Check documents if required
  if (documentsRequired.value) {
    // Make sure all required documents have files
    for (let i = 0; i < requiredDocuments.value.length; i++) {
      if (!documentFiles.value[i]) {
        return false
      }
    }
  }
  
  return true
})

const form = ref({
  password: '',
})

// Initialize form fields based on group requirements
watch(() => props.group, (newGroup) => {
  form.value.password = ''
  
  // Initialize document arrays based on required documents
  if (documentsRequired.value) {
    const docCount = requiredDocuments.value.length
    documentFiles.value = Array(docCount).fill(null)
    documentErrors.value = Array(docCount).fill('')
    isDragging.value = Array(docCount).fill(false)
    uploadedDocuments.value = Array(docCount).fill(null)
  } else {
    documentFiles.value = []
    documentErrors.value = []
    isDragging.value = []
    uploadedDocuments.value = []
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

// File handling functions
const triggerFileInput = (index) => {
  if (fileInputs.value[index]) {
    fileInputs.value[index].click()
  }
}

const setDragging = (index, value) => {
  isDragging.value[index] = value
}

const handleFileChange = (event, index) => {
  const file = event.target.files[0]
  if (file) {
    validateAndSetFile(file, index)
  }
}

const handleFileDrop = (event, index) => {
  isDragging.value[index] = false
  const file = event.dataTransfer.files[0]
  if (file) {
    validateAndSetFile(file, index)
  }
}

const validateAndSetFile = (file, index) => {
  documentErrors.value[index] = ''
  
  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    documentErrors.value[index] = 'File is too large. Maximum size is 10MB.'
    return
  }
  
  // Check file type
  const allowedTypes = [
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
  
  if (!allowedTypes.includes(file.type)) {
    documentErrors.value[index] = 'File type not supported. Please upload an image, PDF, or DOC file.'
    return
  }
  
  // Set the file
  documentFiles.value[index] = file
}

const removeFile = (index) => {
  documentFiles.value[index] = null
  documentErrors.value[index] = ''
  uploadedDocuments.value[index] = null
  
  // Reset the file input
  if (fileInputs.value[index]) {
    fileInputs.value[index].value = ''
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

// Upload a single document
const uploadDocument = async (file, docInfo, index) => {
  try {
    console.log('GroupAdmissionForm - Uploading document:', {
      file: file.name,
      docInfo,
      index
    })
    
    // Create form data
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', docInfo.name)
    formData.append('description', docInfo.description || '')
    
    // Log the form data for debugging
    console.log('GroupAdmissionForm - Form data:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      documentName: docInfo.name,
      documentDescription: docInfo.description || '',
      groupId: props.group.id
    })
    
    // Use the correct document upload endpoint based on the backend routes
    console.log(`GroupAdmissionForm - Uploading to endpoint: /api/groups/${props.group.id}/members/documents`)
    
    const response = await $axiosInstance.post(`/api/groups/${props.group.id}/members/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    console.log('GroupAdmissionForm - Document upload response:', response.data)
    
    // Store the uploaded document data
    uploadedDocuments.value[index] = response.data
    return response.data
  } catch (err) {
    console.error(`Failed to upload document ${index}:`, err)
    console.error('Error response:', err.response?.data)
    console.error('Error status:', err.response?.status)
    documentErrors.value[index] = err.response?.data?.error || 'Failed to upload document'
    throw err
  }
}

const handleSubmit = async () => {
  isSubmitting.value = true
  passwordError.value = ''
  // Clear document errors at the start of submission
  if (documentsRequired.value) {
    documentErrors.value = Array(requiredDocuments.value.length).fill('')
  }

  try {
    // Validate form
    if (!isFormValid.value) {
      if (passwordRequired.value && !form.value.password) {
        passwordError.value = 'Password is required'
      }
      if (documentsRequired.value) {
        for (let i = 0; i < requiredDocuments.value.length; i++) {
          if (!documentFiles.value[i]) {
            documentErrors.value[i] = 'Document is required'
          }
        }
      }
      throw new Error('Please provide all required information')
    }

    let documentsUploadedSuccessfully = true // Assume success unless proven otherwise
    let documentUploadResults = []
    let documentUploadErrors = []

    // Prepare payload for the final accept/join call
    const finalPayload = {};
    if (passwordRequired.value) {
        finalPayload.password = form.value.password;
    }
    // Include the invitation token if it was passed
    if (props.invitationToken) {
        finalPayload.invitation_token = props.invitationToken;
        console.log("Including invitation_token in final payload:", props.invitationToken);
    }

    // --- Step 1: Upload Documents if Required ---
    if (documentsRequired.value) {
      console.log('GroupAdmissionForm - Starting document upload process')
      for (let i = 0; i < documentFiles.value.length; i++) {
        const file = documentFiles.value[i]
        // isFormValid should prevent this, but double-check
        if (!file) {
          documentErrors.value[i] = 'Document is required'
          documentsUploadedSuccessfully = false
          continue // Skip upload if file is missing
        }
        
        const docInfo = requiredDocuments.value[i] || { name: `Document ${i + 1}` }
        
        try {
          console.log(`GroupAdmissionForm - Uploading document ${i}: ${docInfo.name}`)
          const result = await uploadDocument(file, docInfo, i)
          console.log(`GroupAdmissionForm - Document ${i} upload result:`, result)
          documentUploadResults.push(result)
        } catch (err) {
          console.error(`Error uploading document ${i}:`, err)
          documentsUploadedSuccessfully = false
          // Error message is set within uploadDocument
          documentUploadErrors.push({ index: i, name: docInfo.name, error: err.response?.data?.error || err.message })
        }
      }

      if (!documentsUploadedSuccessfully) {
        throw new Error('Failed to upload one or more required documents. Please check errors and try again.')
      }
      console.log('GroupAdmissionForm - All required documents uploaded successfully.')
    }

    // --- Step 2: Finalize Membership (Accept/Join) ---
    let finalApiResponse = null
    let finalStatus = 'unknown' // Keep track of status for non-token flows

    // Check if this is a token-based invitation or a regular group join
    if (props.invitationToken) {
      // *** TOKEN-BASED INVITATION: Use accept-invitation endpoint ***
      console.log(`GroupAdmissionForm - Handling token-based invitation for group ${props.group.id} with token ${props.invitationToken}`);
      console.log(`GroupAdmissionForm - Calling /api/member/accept-invitation endpoint`);
      
      try {
        // For token-based invitations, we only need to send the token
        // Documents are already uploaded, password is already validated
        finalApiResponse = await $axiosInstance.post('/api/member/accept-invitation', { 
          token: props.invitationToken 
        });
        finalStatus = finalApiResponse.data?.status || 'approved';
        console.log(`GroupAdmissionForm - /api/member/accept-invitation call successful. Status: ${finalStatus}`);
      } catch (tokenError) {
        if (tokenError.response?.status === 400 && tokenError.response?.data?.error?.includes('password')) {
          console.error("Incorrect password submitted.", tokenError.response.data.error);
          passwordError.value = tokenError.response.data.error;
          isSubmitting.value = false;
          return;
        } else if (tokenError.response?.status === 403) {
          showAlert('Already a Member', `You are already an active member of ${props.group.name} or this invitation is no longer valid.`);
          emit('close');
          window.dispatchEvent(new CustomEvent('group-data-updated'))
          return;
        } else {
          throw tokenError;
        }
      }
    } else {
      // *** REGULAR GROUP JOIN: Use existing join logic ***
      console.log(`GroupAdmissionForm - Handling non-token join/acceptance for group ${props.group.id}`);
      
      // For groups with requirements (password, documents, admin approval), use the join endpoint
      // The backend join endpoint handles all the logic for requirements
      console.log(`GroupAdmissionForm - Calling /api/groups/:id/join endpoint for group ${props.group.id}`);
      try {
        finalApiResponse = await $axiosInstance.post(`/api/groups/${props.group.id}/join`, finalPayload);
        finalStatus = finalApiResponse.data?.status || (adminApprovalRequired.value || documentsRequired.value ? 'pending' : 'approved');
        console.log(`GroupAdmissionForm - /api/groups/:id/join call successful. Status: ${finalStatus}`);
      } catch (joinError) {
         if (joinError.response?.status === 400 && joinError.response?.data?.error?.includes('password')) {
          console.error("Incorrect password submitted.", joinError.response.data.error);
          passwordError.value = joinError.response.data.error;
          isSubmitting.value = false;
          return;
        } else if (joinError.response?.status === 403 && joinError.response?.data?.error?.includes('already an active member')) {
          showAlert('Already a Member', `You are already an active member of ${props.group.name}.`);
          emit('close');
          window.dispatchEvent(new CustomEvent('group-data-updated'))
          return;
        } else {
          throw joinError;
        }
      }
    }

    // --- Step 3: Handle Success ---
    window.dispatchEvent(new CustomEvent('group-data-updated'))

    let successMessage = ''
    // Determine the success message based *only* on the finalStatus from the API response
    if (finalStatus === 'pending') {
      successMessage = `Your request to join ${props.group.name} has been submitted. Waiting for admin review.`
      if (documentsRequired.value) successMessage += ' Required documents have been uploaded.'
    } else if (finalStatus === 'approved') {
      successMessage = `Successfully joined ${props.group.name}`
      if (documentsRequired.value) successMessage += ' and uploaded required documents'
      successMessage += '!'
    } else {
      // Fallback for unknown or unexpected status
      successMessage = `Membership process completed for ${props.group.name}. Status: ${finalStatus}. Your status will update shortly.`
      console.warn(`Unexpected final status received: ${finalStatus}`)
    }

    showAlert('Success', successMessage)
    emit('close') // Close the form first
    emit('submit', { status: finalStatus, handledMessage: true }) // Notify parent about the outcome

  } catch (error) {
    console.error('Failed to submit admission form:', error)
    // Use error message from step 1 or 2 if available, otherwise use generic error
    const errorMessage = error.message || error.response?.data?.error || 'Failed to submit form'
    // Avoid alerting specific password error again if already set in UI
    if (!passwordError.value) {
       showAlert('Error', errorMessage)
    }
  } finally {
    isSubmitting.value = false
  }
}

const emit = defineEmits(['close', 'submit'])
</script>