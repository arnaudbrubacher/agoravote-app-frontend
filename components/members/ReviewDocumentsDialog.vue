<!-- components/members/ReviewDocumentsDialog.vue -->
<template>
  <div class="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
    <div class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
      <div class="flex flex-col space-y-4">
        <header class="flex justify-between items-center">
          <h2 class="text-lg font-semibold">Review Documents</h2>
          <Button variant="ghost" size="icon" @click="$emit('close')">
            <LucideIcon name="X" size="4" class="h-4 w-4" />
          </Button>
        </header>

        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- Member Info -->
          <div class="flex items-center space-x-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span v-if="!memberAvatarUrl" class="font-medium text-primary">
                {{ getMemberInitial(member) }}
              </span>
              <img 
                v-else 
                :src="memberAvatarUrl" 
                class="w-10 h-10 rounded-full object-cover"
                alt="Member avatar"
              />
            </div>
            <div>
              <div class="font-medium">{{ member.name || 'Unknown Member' }}</div>
              <div class="text-sm text-muted-foreground">{{ member.email || 'No email available' }}</div>
            </div>
          </div>

          <!-- Loading state -->
          <div v-if="loading" class="flex justify-center items-center py-6">
            <LucideIcon name="RefreshCw" size="6" class="h-6 w-6 animate-spin text-primary" />
            <span class="ml-2">Loading documents...</span>
          </div>

          <!-- No documents state -->
          <div v-else-if="!documents || documents.length === 0" class="text-center py-8 text-muted-foreground">
            <span>No documents available</span>
            <div class="mt-4 p-3 bg-gray-100 rounded text-xs text-left">
              <div><strong>Debug:</strong> Member data</div>
              <pre>{{ JSON.stringify(member, null, 2) }}</pre>
              <div class="mt-2"><strong>Documents array:</strong></div>
              <pre>{{ JSON.stringify(documents, null, 2) }}</pre>
            </div>
          </div>

          <!-- Documents list -->
          <div v-else class="space-y-4">
            <div v-for="(doc, index) in documents" :key="index" class="border rounded-md p-4">
              <div class="flex justify-between items-center mb-2">
                <h3 class="font-medium">{{ doc.name || `Document ${index + 1}` }}</h3>
                <div class="flex space-x-2">
                  <Button 
                    v-if="doc.url || doc.document_file_url" 
                    variant="outline" 
                    size="sm" 
                    @click="downloadDocument(doc)"
                  >
                    <LucideIcon name="Download" size="4" class="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button 
                    v-if="doc.url || doc.document_file_url" 
                    variant="outline" 
                    size="sm" 
                    @click="viewDocument(doc)"
                  >
                    <LucideIcon name="Eye" size="4" class="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>
              <p v-if="doc.description" class="text-sm text-muted-foreground">{{ doc.description }}</p>
              <div class="mt-2 text-sm text-muted-foreground">
                <div class="flex items-center space-x-2">
                  <LucideIcon 
                    :name="getFileIcon(doc.fileType || doc.document_file_type)" 
                    size="4" 
                    class="h-4 w-4" 
                  />
                  <span>{{ doc.fileName || doc.document_file_name || 'Unknown file' }}</span>
                </div>
                <div v-if="doc.fileSize || doc.document_file_size" class="mt-1">
                  Size: {{ formatFileSize(doc.fileSize || doc.document_file_size) }}
                </div>
                <div v-if="doc.uploadedAt || doc.document_uploaded_at" class="mt-1">
                  Uploaded: {{ formatDate(doc.uploadedAt || doc.document_uploaded_at) }}
                </div>
                <!-- Debug information -->
                <div class="mt-2 p-2 bg-gray-100 rounded text-xs">
                  <div><strong>Debug:</strong> Document properties</div>
                  <div v-for="(value, key) in doc" :key="key">
                    <strong>{{ key }}:</strong> {{ typeof value === 'object' ? JSON.stringify(value) : value }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" @click="$emit('close')">Close</Button>
          <template v-if="isPending">
            <Button variant="default" @click="$emit('accept', member)">
              <LucideIcon name="Check" size="4" class="h-4 w-4 mr-1" />
              Accept Member
            </Button>
            <Button variant="destructive" @click="$emit('decline', member)">
              <LucideIcon name="X" size="4" class="h-4 w-4 mr-1" />
              Decline Member
            </Button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import LucideIcon from '@/components/LucideIcon.vue'
import { Button } from '@/components/ui/button'
import axios from '~/src/utils/axios'

const props = defineProps({
  member: {
    type: Object,
    required: true
  },
  groupId: {
    type: String,
    required: true
  },
  isPending: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'accept', 'decline'])

const loading = ref(true)
const documents = ref([])

// Computed property for member avatar URL
const memberAvatarUrl = computed(() => {
  // Use the member's avatar if available
  if (!props.member.avatar && !props.member.profile_picture) return null
  
  const avatarUrl = props.member.avatar || props.member.profile_picture
  
  // If the avatar is a full URL, return it as is
  if (avatarUrl.startsWith('http')) {
    return avatarUrl
  }
  
  // Otherwise, prepend the API base URL
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return `${baseUrl}/${avatarUrl}`
})

onMounted(async () => {
  console.log('ReviewDocumentsDialog - Component mounted with props:', {
    member: props.member,
    groupId: props.groupId,
    isPending: props.isPending
  })
  
  // Check if the member has document fields
  if (props.member && props.member.document_file_url) {
    console.log('ReviewDocumentsDialog - Member has document fields:', {
      url: props.member.document_file_url,
      name: props.member.document_file_name,
      type: props.member.document_file_type,
      size: props.member.document_file_size
    })
    
    // Create a document object from the fields
    const doc = {
      name: props.member.document_file_name || 'Document',
      document_file_url: props.member.document_file_url,
      document_file_name: props.member.document_file_name || 'document',
      document_file_type: props.member.document_file_type || 'application/octet-stream',
      document_file_size: props.member.document_file_size || 0,
      document_uploaded_at: props.member.document_uploaded_at || new Date().toISOString()
    }
    
    documents.value = [doc]
    loading.value = false
    console.log('ReviewDocumentsDialog - Created document object from fields:', documents.value)
    return // Skip further processing
  }
  
  // If we don't have documents from the member object, try to fetch from API
  await fetchDocuments()
})

const fetchDocuments = async () => {
  if (!props.member) {
    console.error('Cannot fetch documents: No member provided')
    return
  }
  
  console.log('ReviewDocumentsDialog - fetchDocuments called with member:', props.member)
  console.log('ReviewDocumentsDialog - isPending:', props.isPending)
  console.log('ReviewDocumentsDialog - groupId:', props.groupId)
  
  loading.value = true
  
  // Check if the member has document fields
  if (props.member.document_file_url) {
    console.log('ReviewDocumentsDialog - Member has document fields:', {
      url: props.member.document_file_url,
      name: props.member.document_file_name,
      type: props.member.document_file_type,
      size: props.member.document_file_size
    })
    
    // Create a document object from the fields
    const doc = {
      name: props.member.document_file_name || 'Document',
      document_file_url: props.member.document_file_url,
      document_file_name: props.member.document_file_name || 'document',
      document_file_type: props.member.document_file_type || 'application/octet-stream',
      document_file_size: props.member.document_file_size || 0,
      document_uploaded_at: props.member.document_uploaded_at || new Date().toISOString()
    }
    
    documents.value = [doc]
    loading.value = false
    console.log('ReviewDocumentsDialog - Created document object from fields:', documents.value)
    return
  }
  
  // If no document fields, try to fetch from API
  try {
    // Get the member ID - prioritize user_id since that's the column name in the database
    const memberId = props.member.user_id || props.member.userId || (props.member.user && props.member.user.id) || props.member.id
    
    // Get the group ID
    const groupId = props.groupId
    
    console.log('ReviewDocumentsDialog - Resolved memberId:', memberId)
    
    // Check if we have valid IDs
    if (!memberId || !groupId) {
      console.error('Cannot fetch documents: Missing member ID or group ID', { memberId, groupId })
      loading.value = false
      return
    }
    
    // Try to fetch from API
    try {
      // Use different API endpoints based on whether the member is pending or active
      let endpoint = '';
      if (props.isPending) {
        endpoint = `/groups/${groupId}/pending-members/${memberId}/documents`;
      } else {
        endpoint = `/groups/${groupId}/members/${memberId}/documents`;
      }
      
      console.log(`ReviewDocumentsDialog - Fetching documents from endpoint: ${endpoint}`);
      
      // Fetch documents from the API
      const response = await axios.get(endpoint);
      console.log('ReviewDocumentsDialog - API response:', response.data);
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        documents.value = response.data;
        console.log('ReviewDocumentsDialog - Using documents from API:', documents.value);
      } else {
        console.log('ReviewDocumentsDialog - No documents returned from API');
        documents.value = [];
      }
    } catch (apiError) {
      console.error('ReviewDocumentsDialog - API call failed:', apiError);
      console.log('ReviewDocumentsDialog - API endpoint might not exist yet, using fallback');
      
      // If the API call fails, create a fallback document if the member has a document_file_url
      if (props.member.document_file_url) {
        console.log('ReviewDocumentsDialog - Creating fallback document from document_file_url:', props.member.document_file_url);
        
        const doc = {
          name: props.member.document_file_name || 'Document',
          document_file_url: props.member.document_file_url,
          document_file_name: props.member.document_file_name || 'document',
          document_file_type: props.member.document_file_type || 'application/octet-stream',
          document_file_size: props.member.document_file_size || 0,
          document_uploaded_at: props.member.document_uploaded_at || new Date().toISOString()
        };
        
        documents.value = [doc];
      } else {
        documents.value = [];
      }
    }
  } catch (error) {
    console.error('ReviewDocumentsDialog - Error in fetchDocuments:', error);
    documents.value = [];
  } finally {
    loading.value = false;
    console.log('ReviewDocumentsDialog - Final documents value:', documents.value);
  }
}

const getMemberInitial = (member) => {
  if (!member || !member.name || member.name === 'Unknown Member') return 'U'
  return member.name.charAt(0).toUpperCase()
}

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Get appropriate icon based on file type
const getFileIcon = (fileType) => {
  if (!fileType) return 'File'
  if (fileType.startsWith('image')) return 'Image'
  if (fileType === 'pdf') return 'FileText'
  if (fileType.includes('word') || fileType.includes('doc')) return 'FileText'
  if (fileType.includes('spreadsheet') || fileType.includes('xls')) return 'FileSpreadsheet'
  if (fileType.includes('presentation') || fileType.includes('ppt')) return 'FilePresentation'
  return 'File'
}

// Format file size
const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown size'
  if (bytes < 1024) return bytes + ' bytes'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const downloadDocument = (doc) => {
  console.log('ReviewDocumentsDialog - downloadDocument called with doc:', doc)
  
  // Get the document URL - try all possible property names
  const url = doc.url || doc.document_file_url || doc.file_url || doc.fileURL
  console.log('ReviewDocumentsDialog - Resolved document URL:', url)
  
  if (!url || url === '#') {
    console.error('ReviewDocumentsDialog - Document URL not available')
    alert('Document URL not available')
    return
  }
  
  // Construct the full URL if it's a relative path
  const fullUrl = url.startsWith('http') 
    ? url 
    : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${url.startsWith('/') ? url : `/${url}`}`
  
  console.log('ReviewDocumentsDialog - Downloading document from URL:', fullUrl)
  
  // Create a blob from the file URL and force download
  fetch(fullUrl, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }
      return response.blob()
    })
    .then(blob => {
      // Create a blob URL
      const blobUrl = URL.createObjectURL(blob)
      
      // Create a link element
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = doc.fileName || doc.document_file_name || doc.name || 'document'
      
      // Append to body, click and remove
      document.body.appendChild(link)
      link.click()
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link)
        URL.revokeObjectURL(blobUrl)
      }, 100)
    })
    .catch(error => {
      console.error('ReviewDocumentsDialog - Error downloading file:', error)
      alert('Failed to download the file. Please try again.')
    })
}

const viewDocument = (doc) => {
  console.log('ReviewDocumentsDialog - viewDocument called with doc:', doc)
  
  // Get the document URL - try all possible property names
  const url = doc.url || doc.document_file_url || doc.file_url || doc.fileURL
  console.log('ReviewDocumentsDialog - Resolved document URL:', url)
  
  if (!url || url === '#') {
    console.error('ReviewDocumentsDialog - Document URL not available')
    alert('Document URL not available')
    return
  }
  
  // Construct the full URL if it's a relative path
  const fullUrl = url.startsWith('http') 
    ? url 
    : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${url.startsWith('/') ? url : `/${url}`}`
  
  console.log('ReviewDocumentsDialog - Opening document URL:', fullUrl)
  
  // Open the document in a new tab
  window.open(fullUrl, '_blank')
}

// Watch for changes to the documents array
watch(documents, (newDocs) => {
  console.log('ReviewDocumentsDialog - documents changed:', newDocs)
}, { deep: true })

// Watch for changes to the member prop
watch(() => props.member, (newMember) => {
  console.log('ReviewDocumentsDialog - member prop changed:', newMember)
  
  // Check if the member has document fields
  if (newMember && newMember.document_file_url) {
    console.log('ReviewDocumentsDialog - New member has document fields:', {
      url: newMember.document_file_url,
      name: newMember.document_file_name,
      type: newMember.document_file_type,
      size: newMember.document_file_size
    })
    
    // Create a document object from the fields
    const doc = {
      name: newMember.document_file_name || 'Document',
      document_file_url: newMember.document_file_url,
      document_file_name: newMember.document_file_name || 'document',
      document_file_type: newMember.document_file_type || 'application/octet-stream',
      document_file_size: newMember.document_file_size || 0,
      document_uploaded_at: newMember.document_uploaded_at || new Date().toISOString()
    }
    
    documents.value = [doc]
    loading.value = false
    console.log('ReviewDocumentsDialog - Created document object from fields:', documents.value)
    return // Skip further processing
  } else {
    // If no document fields, try to fetch from API
    fetchDocuments()
  }
}, { deep: true })
</script> 