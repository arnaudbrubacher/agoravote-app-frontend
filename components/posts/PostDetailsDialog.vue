<!-- filepath: /Users/arnaudbrubacher/Desktop/-AGORA/CODE/agoravote-app-frontend/components/dashboard/PostDetailsDialog.vue -->
<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="sm:max-w-2xl md:max-w-3xl">
      <DialogHeader>
        <div class="flex items-center justify-between">
          <DialogTitle>{{ post.title }}</DialogTitle>
        </div>
        <DialogDescription>
          Posted {{ formattedDate }}
          <span v-if="post.user"> by {{ post.user.name || post.user.username }}</span>
          <span v-if="post.isPublic" class="ml-2 text-xs px-2 py-1 bg-muted/70 rounded-full">Public</span>
        </DialogDescription>
      </DialogHeader>
      
      <div class="py-4">
        <!-- Edit Mode -->
        <form v-if="editMode" @submit.prevent="handleUpdate" class="space-y-4">
          <div>
            <Label for="edit-title">Title</Label>
            <Input id="edit-title" v-model="editForm.title" required />
          </div>
          
          <div>
            <Label for="edit-content">Content</Label>
            <Textarea 
              id="edit-content" 
              v-model="editForm.content" 
              class="min-h-[120px]" 
              required 
            />
          </div>
          
          <!-- File Attachment Input -->
          <div>
            <Label class="mb-2 block">Attachment</Label>
            <div class="flex items-center space-x-2">
              <div v-if="filePreview || editForm.attachment" class="flex-1 border rounded p-2 flex items-center">
                <LucideIcon 
                  :name="getFileIcon(filePreview ? selectedFile.name : editForm.attachment)" 
                  class="h-5 w-5 mr-2 text-primary" 
                />
                <span class="text-sm truncate">
                  {{ filePreview ? selectedFile.name : getAttachmentName(editForm.attachment) }}
                </span>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  class="ml-auto"
                  @click="removeAttachment"
                >
                  <LucideIcon name="X" class="h-4 w-4" />
                </Button>
              </div>
              <div v-else class="flex-1">
                <div 
                  class="border border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  @click="triggerFileInput"
                >
                  <LucideIcon name="Upload" class="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p class="text-sm text-muted-foreground">Click to upload a file</p>
                </div>
              </div>
              <input 
                ref="fileInput"
                type="file"
                class="hidden"
                @change="handleFileChange"
              />
            </div>
          </div>
          
          <div class="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="outline" @click="editMode = false">
              Cancel
            </Button>
            <Button type="submit" :disabled="isSubmitting">
              <LucideIcon v-if="isSubmitting" name="RefreshCw" size="4" class="h-4 w-4 mr-2 animate-spin" />
              Save Changes
            </Button>
          </div>
        </form>
        
        <!-- View Mode -->
        <div v-else>
          <!-- Post Content -->
          <div class="prose max-w-none">
            <p>{{ post.content }}</p>
          </div>
          
          <!-- Post Attachment - Always shown, greyed out when no file -->
          <div class="mt-6 border-t pt-4">
            <h4 class="font-medium mb-3">Attachment</h4>
            
            <!-- When there is an attachment -->
            <div v-if="fileUrl" class="border rounded-lg overflow-hidden">
              <!-- Preview section based on file type -->
              <div class="bg-muted/30 p-4">
                <!-- Image preview -->
                <img 
                  v-if="isImageAttachment" 
                  :src="fileUrl" 
                  alt="Attachment preview" 
                  class="max-h-[200px] mx-auto object-contain rounded"
                />
                
                <!-- PDF preview -->
                <div v-else-if="isPdfAttachment" class="flex items-center justify-center h-[150px]">
                  <LucideIcon name="FileText" class="h-16 w-16 text-muted-foreground" />
                </div>
                
                <!-- Generic file preview -->
                <div v-else class="flex items-center justify-center h-[150px]">
                  <LucideIcon name="File" class="h-16 w-16 text-muted-foreground" />
                </div>
              </div>
              
              <!-- Attachment info and actions -->
              <div class="p-3 bg-background">
                <div class="flex items-center overflow-hidden mb-2">
                  <LucideIcon 
                    :name="getFileIcon(fileUrl)" 
                    class="h-5 w-5 mr-2 flex-shrink-0 text-primary" 
                  />
                  <span class="text-sm font-medium truncate">
                    {{ getAttachmentName(fileUrl) }}
                  </span>
                </div>
                
                <div class="flex items-center space-x-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    @click="downloadAttachment"
                    class="flex-1"
                  >
                    <LucideIcon name="Download" class="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    @click="openAttachment"
                    class="flex-1"
                  >
                    <LucideIcon name="ExternalLink" class="h-4 w-4 mr-1" />
                    Open
                  </Button>
                </div>
              </div>
            </div>
            
            <!-- When there is no attachment -->
            <div v-else class="border border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center">
              <LucideIcon name="File" class="h-12 w-12 mb-2 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">No attachment for this post</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Bottom Action Buttons -->
      <div v-if="!editMode && isCurrentUsersPost" class="border-t pt-4 flex justify-between">
        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button variant="destructive" size="sm">
              <LucideIcon name="Trash" size="4" class="h-4 w-4 mr-1" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Post</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The post "{{ post.title }}" will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction @click="handleDelete" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete Post
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button variant="outline" size="sm" @click="editMode = !editMode">
          <LucideIcon name="Pencil" size="4" class="h-4 w-4 mr-1" />
          Edit
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import LucideIcon from '@/components/LucideIcon.vue'
import { ref, computed, onMounted, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { useNuxtApp } from '#app'

const { $axiosInstance } = useNuxtApp()

const props = defineProps({
  post: {
    type: Object,
    required: true
  },
  currentUserId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'edit', 'delete'])

// State management
const editMode = ref(false)
const isSubmitting = ref(false)
const fileInput = ref(null)
const selectedFile = ref(null)
const filePreview = ref(null)
const editForm = ref({
  title: props.post.title,
  content: props.post.content,
  attachment: null // Will be set in onMounted
})

// Check if this post belongs to the current user
const isCurrentUsersPost = computed(() => {
  return props.post.user_id === props.currentUserId || 
         props.post.userId === props.currentUserId ||
         props.post.user?.id === props.currentUserId
})

// Computed property to get the file URL from either attachment or file_url
const fileUrl = computed(() => {
  // Prioritize file_url since that's the actual database column name
  const url = props.post.file_url || props.post.fileURL || props.post.attachment || null
  
  // If the URL exists but doesn't have a protocol, it's a relative URL
  if (url && !url.startsWith('http')) {
    // If it doesn't start with a slash, add one
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`
    const config = useRuntimeConfig()
    const baseUrl = config.public.apiBaseUrl || 'http://localhost:8088'
    return `${baseUrl}${normalizedUrl}`
  }
  
  return url
})

// Attachment related computed properties
const isImageAttachment = computed(() => {
  if (!fileUrl.value) return false
  const url = fileUrl.value.toLowerCase()
  return url.includes('.jpg') || url.includes('.jpeg') || 
         url.includes('.png') || url.includes('.gif') || 
         url.includes('.webp') || url.includes('.svg')
})

const isPdfAttachment = computed(() => {
  if (!fileUrl.value) return false
  return fileUrl.value.toLowerCase().includes('.pdf')
})

// Formatted date for display
const formattedDate = computed(() => {
  if (!props.post.created_at) return ''
  
  const date = new Date(props.post.created_at)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date)
})

// Methods
function getAttachmentName(url) {
  if (!url) return 'Attachment'
  const parts = url.split('/')
  return parts[parts.length - 1]
}

function getFileIcon(url) {
  if (!url) return 'File'
  
  const filename = getAttachmentName(url)
  const extension = filename.split('.').pop()?.toLowerCase()
  
  switch (extension) {
    case 'pdf':
      return 'FileText'
    case 'doc':
    case 'docx':
      return 'FileText'
    case 'xls':
    case 'xlsx':
      return 'FileSpreadsheet'
    case 'ppt':
    case 'pptx':
      return 'FilePresentation'
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
    case 'svg':
      return 'Image'
    case 'mp4':
    case 'mov':
    case 'avi':
      return 'FileVideo'
    case 'mp3':
    case 'wav':
      return 'FileAudio'
    case 'zip':
    case 'rar':
      return 'FileArchive'
    default:
      return 'File'
  }
}

function openAttachment() {
  if (fileUrl.value) {
    // Log the URL being opened for debugging
    console.log('Opening attachment URL:', fileUrl.value)
    window.open(fileUrl.value, '_blank')
  }
}

function downloadAttachment() {
  if (fileUrl.value) {
    // Log the URL being downloaded for debugging
    console.log('Downloading attachment URL:', fileUrl.value)
    
    // Create a blob from the file URL and force download
    fetch(fileUrl.value)
      .then(response => response.blob())
      .then(blob => {
        // Create a blob URL
        const blobUrl = URL.createObjectURL(blob)
        
        // Create a link element
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = getAttachmentName(fileUrl.value)
        
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
        console.error('Error downloading file:', error)
        alert('Failed to download the file. Please try again.')
      })
  }
}

function triggerFileInput() {
  fileInput.value.click()
}

function handleFileChange(event) {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    // Create a preview if it's an image
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        filePreview.value = e.target.result
      }
      reader.readAsDataURL(file)
    } else {
      filePreview.value = null // Or some generic icon/placeholder for non-images
    }
    editForm.value.attachment = file.name // Store file name for display, actual file is in selectedFile
  }
}

function removeAttachment() {
  selectedFile.value = null
  filePreview.value = null
  editForm.value.attachment = null
  if (fileInput.value) {
    fileInput.value.value = '' // Reset the file input
  }
}

async function handleUpdate() {
  isSubmitting.value = true
  try {
    let updatedFileUrl = fileUrl.value // Keep current file URL by default

    // Handle file upload first if there's a new file
    if (selectedFile.value) {
      // Upload the new file
      const formData = new FormData()
      formData.append('file', selectedFile.value)

      const uploadResponse = await $axiosInstance.post(`/api/posts/${props.post.id}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      // Update the file URL with the new uploaded file
      updatedFileUrl = uploadResponse.data.url
    } else if (editForm.value.attachment === null) {
      // User wants to remove the existing attachment
      // We'll handle this in the JSON update below
      updatedFileUrl = ""
    }

    // Now send the JSON update for post data
    const updateData = {
      title: editForm.value.title,
      content: editForm.value.content,
      isPublic: props.post.isPublic || false, // Preserve existing value
      file_url: updatedFileUrl
    }

    const response = await $axiosInstance.put(`/api/posts/${props.post.id}`, updateData, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    emit('edit', response.data) // Emit the updated post data
    editMode.value = false
  } catch (error) {
    console.error('Failed to update post:', error.response?.data || error.message)
    // TODO: Show user-friendly error message
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = () => {
  emit('delete', props.post) // Emit the full post object
}

// Watch for changes to the post prop
watch(() => props.post, (newPost) => {
  console.log('Post changed:', newPost)
  console.log('New post file_url:', newPost.file_url)
  
  // Update the form when the post changes
  editForm.value.title = newPost.title
  editForm.value.content = newPost.content
  // If the new post has an attachment, set it. Otherwise, clear it.
  editForm.value.attachment = newPost.file_url || newPost.fileURL || newPost.attachment || null
  selectedFile.value = null // Reset selected file when post changes
  filePreview.value = null // Reset file preview
}, { immediate: true, deep: true })

onMounted(() => {
  // Reset form when post changes
  editForm.value = {
    title: props.post.title,
    content: props.post.content,
    attachment: fileUrl.value
  }
  
  // Reset file-related state
  selectedFile.value = null
  filePreview.value = null

  // Debug post data
  console.log('Post data:', props.post)
  console.log('Post file_url:', props.post.file_url)
  console.log('Post fileURL:', props.post.fileURL)
  console.log('Post attachment:', props.post.attachment)
  console.log('Raw URL from post:', props.post.file_url || props.post.fileURL || props.post.attachment)
  console.log('Computed fileUrl:', fileUrl.value)
  console.log('Current User ID:', props.currentUserId)
  console.log('Post User ID:', props.post.user_id)
})
</script>