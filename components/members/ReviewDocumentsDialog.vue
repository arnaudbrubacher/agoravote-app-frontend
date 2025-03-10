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
          </div>

          <!-- Documents list -->
          <div v-else class="space-y-4">
            <div v-for="(doc, index) in documents" :key="index" class="border rounded-md p-4">
              <div class="flex justify-between items-center mb-2">
                <h3 class="font-medium">{{ doc.name }}</h3>
                <div class="flex space-x-2">
                  <Button variant="outline" size="sm" @click="downloadDocument(doc)">
                    <LucideIcon name="Download" size="4" class="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" @click="viewDocument(doc)">
                    <LucideIcon name="Eye" size="4" class="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>
              <p v-if="doc.description" class="text-sm text-muted-foreground">{{ doc.description }}</p>
              <div class="mt-2 text-sm text-muted-foreground">
                <span>Uploaded: {{ formatDate(doc.uploadedAt) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" @click="$emit('close')">Close</Button>
          <Button variant="default" @click="$emit('accept', member)">
            <LucideIcon name="Check" size="4" class="h-4 w-4 mr-1" />
            Accept Member
          </Button>
          <Button variant="destructive" @click="$emit('decline', member)">
            <LucideIcon name="X" size="4" class="h-4 w-4 mr-1" />
            Decline Member
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
  member: {
    type: Object,
    required: true
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
  await fetchDocuments()
})

const fetchDocuments = async () => {
  loading.value = true
  try {
    // Get the member ID - prioritize user_id since that's the column name in the database
    const memberId = props.member.user_id || props.member.userId || (props.member.user && props.member.user.id) || props.member.id
    
    // Fetch documents from the API
    const response = await axios.get(`/groups/pending-members/${memberId}/documents`)
    documents.value = response.data
  } catch (error) {
    console.error('Failed to fetch documents:', error)
    // Mock data for development
    documents.value = [
      {
        id: 1,
        name: 'ID Document',
        description: 'Government-issued ID',
        url: '#',
        uploadedAt: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Proof of Address',
        description: 'Utility bill or bank statement',
        url: '#',
        uploadedAt: new Date().toISOString()
      }
    ]
  } finally {
    loading.value = false
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

const downloadDocument = (doc) => {
  // In a real implementation, this would download the document
  console.log('Downloading document:', doc)
  
  // If there's a URL, open it in a new tab
  if (doc.url && doc.url !== '#') {
    window.open(doc.url, '_blank')
  } else {
    alert('Document download not implemented')
  }
}

const viewDocument = (doc) => {
  // In a real implementation, this would open a viewer for the document
  console.log('Viewing document:', doc)
  
  // If there's a URL, open it in a new tab
  if (doc.url && doc.url !== '#') {
    window.open(doc.url, '_blank')
  } else {
    alert('Document viewer not implemented')
  }
}
</script> 