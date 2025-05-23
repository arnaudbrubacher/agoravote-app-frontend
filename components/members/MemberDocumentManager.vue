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
            
            <!-- Update Document Section - Always show -->
            <div class="space-y-4 mt-6">
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
import { useNuxtApp } from '#app'

const { $axiosInstance } = useNuxtApp()

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
    // Ensure we have a group ID and member ID (user ID) to fetch the document
    // The specific endpoint might vary based on your API design.
    // This assumes an endpoint like /groups/{groupId}/members/{memberId}/document
    // or that the document info is part of the group.membership object.

    // If the document URL or ID is directly on the membership object:
    if (props.group.membership && (props.group.membership.document_url || props.group.membership.document_id)) {
      // This part might need adjustment based on how you actually get the document details.
      // For now, let's assume the backend might provide the document details directly 
      // or we need to fetch it if only an ID is present.
      // If the full document object is already in group.membership.document, use it.
      if (props.group.membership.document) {
         currentDocument.value = props.group.membership.document;
         console.log('Document found directly in membership object:', currentDocument.value);
      } else {
        // Example: Fetch by document ID if available
        // const documentId = props.group.membership.document_id;
        // if (documentId) {
        //   const response = await $axiosInstance.get(`/documents/${documentId}`);
        //   currentDocument.value = response.data;
        // } else {
        //   currentDocument.value = null; // Or handle as needed if no ID
        // }
        // For this example, let's assume the backend will provide sufficient info
        // or we might need a specific endpoint to fetch the member's document for a group.
        // THIS IS A PLACEHOLDER - replace with your actual logic for fetching document by ID or URL
        // currentDocument.value = { name: "Placeholder Document", type: "application/pdf", size: 12345, uploaded_at: new Date().toISOString(), url: props.group.membership.document_url };
         
        // More realistic: an endpoint to get the member's specific document for this group
        // This requires knowing the member's ID (often current user's ID in this context if it's their own document manager)
        // and the group ID.
        // Let's assume your API provides an endpoint like this.
        // The actual member ID might come from a user store or another prop.
        // For simplicity, if your backend links documents to the membership record, you might not need a separate fetch here
        // if all details are already in `props.group.membership` or a sub-object like `props.group.membership.submitted_document`

        // Attempt to fetch from a specific endpoint if one exists
        // This is a guess, replace with your actual endpoint
        // We need the member ID (current user ID if they are managing their own docs)
        // For this example, let's assume the backend gives us the document within the group.membership itself
        // or we need a different strategy. Let's assume for now the document details might be directly available
        // or that `props.group.membership` contains enough to construct `currentDocument.value`
        if (props.group.membership && props.group.membership.document_details) { // Assuming document_details is an object
            currentDocument.value = props.group.membership.document_details;
        } else {
            // Fallback or if no document is submitted yet for the user in this group
            // Check a more specific endpoint. This requires the user ID.
            // For now, let's assume it might be on the group object itself if it's a single required doc. 
            // This logic is highly dependent on your backend API structure.
            // Example: fetch the document for the current user in this group
             try {
                const response = await $axiosInstance.get(`/groups/${props.group.id}/members/me/document`);
                currentDocument.value = response.data.document; // Assuming the API returns { document: { ... } }
             } catch (docError) {
                if (docError.response && docError.response.status === 404) {
                    console.log('No document found for user in this group.');
                    currentDocument.value = null;
                } else {
                    console.error('Failed to fetch member document:', docError);
                    currentDocument.value = null;
                }
             }
        }

      }
      } else {
        currentDocument.value = null;
      console.log('No membership or document URL/ID found on membership object.');
    }
  } catch (error) {
    console.error('Failed to fetch current document:', error);
    currentDocument.value = null;
  } finally {
    loading.value = false;
  }
};

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

// Upload or replace the document
const uploadDocument = async () => {
  if (!newDocumentFile.value) {
    documentError.value = 'Please select a file to upload.';
    return;
  }
  
  isSubmitting.value = true;
  documentError.value = '';
  
    const formData = new FormData();
  formData.append('document', newDocumentFile.value);
  // You might need to send group_id or member_id depending on your backend API
  // formData.append('group_id', props.group.id);
  // If replacing, you might send the ID of the document to be replaced, or backend handles it via user context.

  try {
    // The endpoint for uploading/replacing a document might be specific.
    // e.g., /groups/{groupId}/members/{memberId}/document or just /documents if user context is implicit.
    // This is a placeholder, adjust to your API.
    // Assuming an endpoint that handles the upload for the current user for this group
    const response = await $axiosInstance.post(`/groups/${props.group.id}/members/me/document`, formData, { // USE PASSED INSTANCE
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    currentDocument.value = response.data.document; // Assuming the backend returns the updated/new document details
    newDocumentFile.value = null; // Clear the selection
    if (fileInput.value) fileInput.value.value = ''; // Reset file input
    emit('document-updated', currentDocument.value);
    // Optionally, show a success message
  } catch (error) {
    console.error('Failed to upload document:', error.response?.data || error.message);
    documentError.value = error.response?.data?.error || 'Failed to upload document. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
};

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