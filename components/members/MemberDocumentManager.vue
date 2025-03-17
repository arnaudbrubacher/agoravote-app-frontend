<!-- components/members/MemberDocumentManager.vue -->
<template>
  <div class="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
    <div class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
      <div class="flex flex-col space-y-4">
        <header class="flex justify-between items-center">
          <h2 class="text-lg font-semibold">
            {{ 
              isApprovedGroup 
                ? (currentDocument ? 'Manage Document' : (props.requiresDocuments ? 'Upload Required Document' : 'View Document')) 
                : (currentDocument ? 'Review Document' : 'Upload Required Document') 
            }}
          </h2>
          <Button variant="ghost" size="icon" @click="$emit('close')">
            <LucideIcon name="X" size="4" class="h-4 w-4" />
          </Button>
        </header>

        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- Group Info -->
          <div class="space-y-1 border-b pb-4">
            <h3 class="font-medium">{{ group.name }}</h3>
            <p class="text-sm text-muted-foreground">{{ group.description }}</p>
            <div class="flex items-center space-x-2 mt-2">
              <span 
                class="text-xs px-2 py-1 rounded-full"
                :class="statusClass"
              >
                {{ statusText }}
              </span>
            </div>
          </div>

          <!-- Loading state -->
          <div v-if="loading" class="flex justify-center items-center py-6">
            <LucideIcon name="RefreshCw" size="6" class="h-6 w-6 animate-spin text-primary" />
            <span class="ml-2">Loading document...</span>
          </div>

          <!-- Current Document Section -->
          <div v-else class="space-y-4">
            <h3 class="text-md font-medium">Your Submitted Document</h3>
            
            <!-- No documents state -->
            <div v-if="!currentDocument" class="text-center py-4 text-muted-foreground border rounded-md p-4">
              <span>No document submitted yet</span>
            </div>
            
            <!-- Current document display -->
            <div v-else class="border rounded-md p-4">
              <div class="flex justify-between items-center mb-2">
                <h3 class="font-medium">{{ currentDocument.name || 'Your Document' }}</h3>
                <div class="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    @click="downloadDocument(currentDocument)"
                  >
                    <LucideIcon name="Download" size="4" class="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    @click="viewDocument(currentDocument)"
                  >
                    <LucideIcon name="Eye" size="4" class="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>
              <p v-if="currentDocument.description" class="text-sm text-muted-foreground">{{ currentDocument.description }}</p>
              <div class="mt-2 text-sm text-muted-foreground">
                <div class="flex items-center space-x-2">
                  <LucideIcon 
                    :name="getFileIcon(currentDocument.document_file_type || currentDocument.type)" 
                    size="4" 
                    class="h-4 w-4" 
                  />
                  <span>{{ currentDocument.document_file_name || currentDocument.filename || 'Unknown file' }}</span>
                </div>
                <div v-if="currentDocument.document_file_size || currentDocument.size" class="mt-1">
                  Size: {{ formatFileSize(currentDocument.document_file_size || currentDocument.size) }}
                </div>
                <div v-if="currentDocument.document_uploaded_at || currentDocument.uploaded_at" class="mt-1">
                  Uploaded: {{ formatDate(currentDocument.document_uploaded_at || currentDocument.uploaded_at) }}
                </div>
              </div>
            </div>
            
            <!-- Update Document Section -->
            <div v-if="currentDocument || props.requiresDocuments" class="space-y-4 mt-6">
              <h3 class="text-md font-medium">{{ currentDocument ? 'Replace Document' : 'Upload Document' }}</h3>
              
              <div 
                class="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                :class="{ 'border-primary bg-primary/5': isDragging, 'border-green-500 bg-green-50': newDocumentFile }"
                @click="triggerFileInput"
                @dragover.prevent="() => isDragging = true"
                @dragleave.prevent="() => isDragging = false"
                @drop.prevent="handleFileDrop"
              >
                <div v-if="!newDocumentFile" class="space-y-1">
                  <LucideIcon name="Upload" size="6" class="h-6 w-6 mx-auto text-muted-foreground" />
                  <p class="text-sm text-muted-foreground">
                    Drag and drop or click to select a new document
                  </p>
                </div>
                <div v-else class="space-y-1">
                  <div class="flex items-center justify-center">
                    <LucideIcon 
                      :name="getFileIcon(newDocumentFile.type)" 
                      size="6" 
                      class="h-6 w-6 text-primary" 
                    />
                    <span class="ml-2 font-medium truncate max-w-[200px]">
                      {{ newDocumentFile.name }}
                    </span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      @click.stop="removeFile"
                      class="ml-2 h-6 w-6 p-0"
                    >
                      <LucideIcon name="X" size="3" class="h-3 w-3" />
                    </Button>
                  </div>
                  <p class="text-xs text-muted-foreground">
                    {{ formatFileSize(newDocumentFile.size) }}
                  </p>
                </div>
              </div>
              
              <!-- File Input (hidden) -->
              <input 
                ref="fileInput"
                type="file" 
                class="hidden" 
                @change="handleFileChange"
                accept="image/*,.pdf,.doc,.docx"
              />
              
              <!-- Error Message -->
              <p v-if="documentError" class="text-xs text-red-500 mt-1">
                {{ documentError }}
              </p>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" @click="$emit('close')">Cancel</Button>
          <Button 
            v-if="currentDocument || props.requiresDocuments"
            variant="default" 
            :disabled="!newDocumentFile || isSubmitting"
            @click="uploadDocument"
          >
            <LucideIcon v-if="isSubmitting" name="Loader2" size="4" class="h-4 w-4 mr-1 animate-spin" />
            <LucideIcon v-else name="Upload" size="4" class="h-4 w-4 mr-1" />
            {{ isSubmitting ? 'Uploading...' : (currentDocument ? 'Replace Document' : 'Upload Document') }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import LucideIcon from '@/components/LucideIcon.vue'
import { Button } from '@/components/ui/button'
import axios from '~/src/utils/axios'

const props = defineProps({
  group: {
    type: Object,
    required: true
  },
  requiresDocuments: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'document-updated'])

const loading = ref(true)
const currentDocument = ref(null)
const isDragging = ref(false)
const newDocumentFile = ref(null)
const documentError = ref('')
const isSubmitting = ref(false)
const fileInput = ref(null)

// Computed properties for status display
const statusClass = computed(() => {
  if (!props.group.membership) return 'bg-gray-100 text-gray-800';
  
  const status = props.group.membership.status;
  if (status === 'pending') return 'bg-amber-100 text-amber-800';
  if (status === 'approved') return 'bg-green-100 text-green-800';
  if (status === 'rejected') return 'bg-red-100 text-red-800';
  
  return 'bg-gray-100 text-gray-800';
})

const statusText = computed(() => {
  if (!props.group.membership) return 'Unknown Status';
  
  const status = props.group.membership.status;
  if (status === 'pending') {
    if (props.group.membership.invitation_accepted) {
      return 'Awaiting Admin Approval';
    } else {
      return 'Invitation Pending';
    }
  }
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  
  return 'Unknown Status';
})

// Add this computed property after the other computed properties
const isApprovedGroup = computed(() => {
  if (!props.group.membership) return false;
  return props.group.membership.status === 'approved';
})

// Fetch the current document when the component is mounted
onMounted(async () => {
  await fetchCurrentDocument();
})

// Fetch the current document from the API
const fetchCurrentDocument = async () => {
  loading.value = true;
  console.log('Fetching current document for group:', props.group.name);
  
  try {
    // Check if the group has a membership with document fields
    if (props.group.membership) {
      console.log('Group has membership:', props.group.membership);
      
      // Check if invitation has been accepted but no document is found
      if (props.group.membership.invitation_accepted === true) {
        console.log('Invitation has been accepted, checking for documents');
      }
      
      // Check for direct document fields (camelCase, snake_case, PascalCase)
      const documentUrl = 
        props.group.membership.DocumentFileURL || 
        props.group.membership.document_file_url ||
        props.group.membership.documentFileURL ||
        props.group.membership.document_url ||
        props.group.membership.documentUrl;
      
      if (documentUrl) {
        // Create a document object from the direct fields
        currentDocument.value = {
          name: props.group.membership.DocumentFileName || 
                props.group.membership.document_file_name || 
                props.group.membership.documentFileName || 
                'Your Document',
          document_file_url: documentUrl,
          document_file_name: props.group.membership.DocumentFileName || 
                             props.group.membership.document_file_name || 
                             props.group.membership.documentFileName,
          document_file_type: props.group.membership.DocumentFileType || 
                             props.group.membership.document_file_type || 
                             props.group.membership.documentFileType,
          document_file_size: props.group.membership.DocumentFileSize || 
                             props.group.membership.document_file_size || 
                             props.group.membership.documentFileSize,
          document_uploaded_at: props.group.membership.DocumentUploadedAt || 
                               props.group.membership.document_uploaded_at || 
                               props.group.membership.documentUploadedAt
        };
        
        console.log('Found document in membership fields:', currentDocument.value);
      } 
      // Check for legacy documents_submitted field
      else if (props.group.membership.documents_submitted) {
        let documents = props.group.membership.documents_submitted;
        console.log('Found documents_submitted:', documents);
        
        // If it's a string (JSON), parse it
        if (typeof documents === 'string') {
          try {
            documents = JSON.parse(documents);
            console.log('Parsed documents_submitted:', documents);
          } catch (e) {
            console.error('Error parsing documents_submitted:', e);
            documents = [];
          }
        }
        
        // If we have documents, use the first one
        if (Array.isArray(documents) && documents.length > 0 && documents[0].url) {
          const doc = documents[0];
          currentDocument.value = {
            name: doc.name || 'Your Document',
            document_file_url: doc.url,
            document_file_name: doc.filename || doc.name,
            document_file_type: doc.type,
            document_file_size: doc.size,
            document_uploaded_at: doc.uploaded_at
          };
          
          console.log('Found document in documents_submitted:', currentDocument.value);
        }
      }
      // Check for documents field
      else if (props.group.membership.documents) {
        let documents = props.group.membership.documents;
        console.log('Found documents field:', documents);
        
        // If it's a string (JSON), parse it
        if (typeof documents === 'string') {
          try {
            documents = JSON.parse(documents);
            console.log('Parsed documents field:', documents);
          } catch (e) {
            console.error('Error parsing documents field:', e);
            documents = [];
          }
        }
        
        // If we have documents, use the first one
        if (Array.isArray(documents) && documents.length > 0 && documents[0].url) {
          const doc = documents[0];
          currentDocument.value = {
            name: doc.name || 'Your Document',
            document_file_url: doc.url,
            document_file_name: doc.filename || doc.name,
            document_file_type: doc.type,
            document_file_size: doc.size,
            document_uploaded_at: doc.uploaded_at
          };
          
          console.log('Found document in documents field:', currentDocument.value);
        }
      }
    }
    
    // If we still don't have a document, fetch from API
    if (!currentDocument.value) {
      console.log('No document found in membership, fetching from API');
      
      // Fetch the document from the API
      const response = await axios.get(`/groups/${props.group.id}/members/documents`);
      console.log('API response:', response.data);
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        currentDocument.value = response.data[0];
        console.log('Document fetched from API:', currentDocument.value);
      } else {
        currentDocument.value = null;
        console.log('No documents returned from API');
      }
    }
  } catch (error) {
    console.error('Failed to fetch document:', error);
    currentDocument.value = null;
  } finally {
    loading.value = false;
  }
}

// File handling functions
const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
}

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    validateAndSetFile(file);
  }
}

const handleFileDrop = (event) => {
  isDragging.value = false;
  const file = event.dataTransfer.files[0];
  if (file) {
    validateAndSetFile(file);
  }
}

const validateAndSetFile = (file) => {
  documentError.value = '';
  
  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    documentError.value = 'File is too large. Maximum size is 10MB.';
    return;
  }
  
  // Check file type
  const allowedTypes = [
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    documentError.value = 'File type not supported. Please upload an image, PDF, or DOC file.';
    return;
  }
  
  // Set the file
  newDocumentFile.value = file;
}

const removeFile = () => {
  newDocumentFile.value = null;
  documentError.value = '';
  
  // Reset the file input
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

// Upload the new document
const uploadDocument = async () => {
  if (!newDocumentFile.value) {
    documentError.value = 'Please select a file to upload.';
    return;
  }
  
  isSubmitting.value = true;
  
  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', newDocumentFile.value);
    
    // Upload the document
    const response = await axios.post(`/groups/${props.group.id}/members/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    // Update the current document
    currentDocument.value = response.data;
    
    // Reset the form
    newDocumentFile.value = null;
    
    // Show success message
    alert('Document updated successfully!');
    
    // Emit event to notify parent component
    emit('document-updated', response.data);
    
    // Close the dialog
    emit('close');
  } catch (error) {
    console.error('Failed to upload document:', error);
    documentError.value = error.response?.data?.error || 'Failed to upload document. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
}

// Download the document
const downloadDocument = (doc) => {
  const url = doc.document_file_url || doc.url;
  if (!url) {
    alert('Document URL not available');
    return;
  }
  
  // Create a temporary link and trigger download
  const link = document.createElement('a');
  link.href = url.startsWith('http') ? url : `${window.location.origin}${url}`;
  link.target = '_blank';
  link.download = doc.document_file_name || doc.filename || 'document';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// View the document
const viewDocument = (doc) => {
  const url = doc.document_file_url || doc.url;
  if (!url) {
    alert('Document URL not available');
    return;
  }
  
  // Open in a new tab
  window.open(url.startsWith('http') ? url : `${window.location.origin}${url}`, '_blank');
}

// Helper functions
const getFileIcon = (fileType) => {
  if (!fileType) return 'File';
  
  if (fileType.includes('image')) return 'Image';
  if (fileType.includes('pdf')) return 'FileText';
  if (fileType.includes('word') || fileType.includes('doc')) return 'FileText';
  if (fileType.includes('excel') || fileType.includes('sheet')) return 'FileSpreadsheet';
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'FilePresentation';
  
  return 'File';
}

const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown size';
  
  if (bytes < 1024) return bytes + ' bytes';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date';
  
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}
</script> 