<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Group Settings</DialogTitle>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto p-6">
        <div class="space-y-6">
          <!-- Group Picture Section -->
          <div class="flex flex-col items-center pb-6 border-b">
            <div class="relative mb-4">
              <div v-if="!group.picture && !previewImage" class="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                <Users class="h-10 w-10 text-gray-400" />
              </div>
              <img 
                v-else
                :src="previewImage || (group.picture && isFullUrl(group.picture) ? group.picture : `${apiBaseUrl}${group.picture}`)" 
                alt="Group Picture"
                class="w-24 h-24 rounded-full object-cover border"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                class="absolute bottom-0 right-0 rounded-full bg-background border shadow-sm"
                @click="$refs.fileInput.click()"
              >
                <EditIcon class="h-4 w-4" />
              </Button>
            </div>
            <input 
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleFileChange"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              @click="$refs.fileInput.click()"
            >
              Change Group Picture
            </Button>
          </div>
          
          <!-- Group Information Section -->
          <div class="space-y-4">
            <!-- Group Name Field -->
            <div class="flex items-center justify-between pb-3 border-b">
              <div>
                <p class="text-xs text-muted-foreground mb-1">Name</p>
                <p class="font-medium">{{ formData.name }}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                @click="editingName = !editingName"
              >
                <EditIcon class="h-4 w-4" />
              </Button>
            </div>
            <div v-if="editingName" class="pb-4">
              <Input
                id="name"
                v-model="formData.name"
                class="w-full mb-2"
                placeholder="Enter group name"
                required
              />
              <div class="flex justify-end gap-2">
                <Button variant="outline" size="sm" @click="cancelNameEdit">Cancel</Button>
                <Button type="button" size="sm" @click="saveName">Save</Button>
              </div>
            </div>

            <!-- Group Description Field -->
            <div class="flex items-center justify-between pb-3 border-b">
              <div>
                <p class="text-xs text-muted-foreground mb-1">Description</p>
                <p class="font-medium">{{ formData.description || 'No description' }}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                @click="editingDescription = !editingDescription"
              >
                <EditIcon class="h-4 w-4" />
              </Button>
            </div>
            <div v-if="editingDescription" class="pb-4">
              <Textarea
                id="description"
                v-model="formData.description"
                class="w-full mb-2"
                placeholder="Enter group description"
              />
              <div class="flex justify-end gap-2">
                <Button variant="outline" size="sm" @click="cancelDescriptionEdit">Cancel</Button>
                <Button type="button" size="sm" @click="saveDescription">Save</Button>
              </div>
            </div>

            <!-- Group Privacy Field -->
            <div class="flex items-center justify-between pb-3 border-b">
              <div>
                <p class="text-xs text-muted-foreground mb-1">Privacy Setting</p>
                <p class="font-medium">{{ formData.isPublic ? 'Public' : 'Private' }}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                @click="editingPrivacy = !editingPrivacy"
              >
                <EditIcon class="h-4 w-4" />
              </Button>
            </div>
            <div v-if="editingPrivacy" class="pb-4">
              <div class="flex space-x-4 mb-2">
                <label class="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    v-model="formData.isPublic" 
                    :value="false"
                  />
                  <span>Private Group</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    v-model="formData.isPublic" 
                    :value="true"
                  />
                  <span>Public Group</span>
                </label>
              </div>
              <div class="flex justify-end gap-2">
                <Button variant="outline" size="sm" @click="cancelPrivacyEdit">Cancel</Button>
                <Button type="button" size="sm" @click="savePrivacy">Save</Button>
              </div>
            </div>

            <!-- Password Requirement Field -->
            <div class="flex items-center justify-between pb-3 border-b">
              <div>
                <p class="text-xs text-muted-foreground mb-1">Password Protection</p>
                <p class="font-medium">{{ formData.requires_password ? 'Password Required' : 'No Password Required' }}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                @click="editingPassword = !editingPassword"
              >
                <EditIcon class="h-4 w-4" />
              </Button>
            </div>
            <div v-if="editingPassword" class="pb-4">
              <div class="space-y-3 mb-2">
                <div class="flex items-center space-x-2">
                  <input type="checkbox" id="requires-password" v-model="formData.requires_password" />
                  <Label for="requires-password">Admission requires a password</Label>
                </div>
                
                <Input 
                  type="password" 
                  v-model="formData.password" 
                  placeholder="Enter password" 
                  :disabled="!formData.requires_password"
                  class="mb-2"
                />
                
                <Input 
                  type="password" 
                  v-model="formData.confirmPassword" 
                  placeholder="Confirm password" 
                  :disabled="!formData.requires_password"
                />
              </div>
              <div class="flex justify-end gap-2">
                <Button variant="outline" size="sm" @click="cancelPasswordEdit">Cancel</Button>
                <Button type="button" size="sm" @click="savePassword">Save</Button>
              </div>
            </div>

            <!-- Required Documents Field -->
            <div class="flex items-center justify-between pb-3 border-b">
              <div>
                <p class="text-xs text-muted-foreground mb-1">Required Documents</p>
                <p class="font-medium">
                  <template v-if="formData.documents.length">
                    <span v-for="(doc, index) in formData.documents" :key="index">
                      {{ doc.name }}{{ index < formData.documents.length - 1 ? ', ' : '' }}
                    </span>
                  </template>
                  <template v-else>
                    No documents required
                  </template>
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                @click="editingDocuments = !editingDocuments"
              >
                <EditIcon class="h-4 w-4" />
              </Button>
            </div>
            <div v-if="editingDocuments" class="pb-4">
              <div class="space-y-3 mb-2">
                <p class="text-sm">Documents required from users to join:</p>
                
                <div v-if="formData.documents.length" class="space-y-2">
                  <div v-for="(doc, index) in formData.documents" :key="index" class="flex items-center space-x-2">
                    <Input 
                      v-model="doc.name" 
                      placeholder="Document name (e.g. ID Card, Student Card)" 
                    />
                    <Button 
                      type="button"
                      variant="destructive" 
                      size="icon" 
                      @click="removeDocument(index)"
                      title="Remove this document requirement"
                    >
                      <LucideIcon name="Trash" class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <Button 
                  type="button"
                  variant="outline" 
                  @click="addDocument"
                  class="flex items-center"
                >
                  <LucideIcon name="Plus" class="h-4 w-4 mr-1" />
                  Add Required Document
                </Button>
              </div>
              <div class="flex justify-end gap-2">
                <Button variant="outline" size="sm" @click="cancelDocumentsEdit">Cancel</Button>
                <Button type="button" size="sm" @click="saveDocuments">Save</Button>
              </div>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="flex justify-center pt-4">
            <Button 
              type="button" 
              variant="outline" 
              @click="handleLeave"
              class="mx-auto"
            >
              <LucideIcon name="LogOut" size="4" class="mr-2 h-4 w-4" />
              Leave Group
            </Button>
          </div>
        </div>
      </div>
      
      <!-- Custom Footer instead of DialogFooter -->
      <div class="px-6 pb-6 border-t pt-4 mt-4 flex justify-between w-full">
        <Button 
          variant="destructive" 
          size="sm"
          @click="handleDelete"
        >
          <LucideIcon name="Trash" class="mr-2 h-4 w-4" />
          Delete Group
        </Button>
        
        <div class="flex space-x-2">
          <Button variant="outline" @click="$emit('close')">Cancel</Button>
          <Button type="button" @click="handleSubmit">Save All Changes</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import LucideIcon from '@/components/LucideIcon.vue'
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Users, Camera } from 'lucide-vue-next'
import { EditIcon } from 'lucide-vue-next'
import axios from '~/src/utils/axios'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'

const props = defineProps({
  group: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'submit', 'delete', 'leave'])
const fileInput = ref(null)
const previewImage = ref(null)
const selectedFile = ref(null)
const apiBaseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8080'

// Editing states
const editingName = ref(false)
const editingDescription = ref(false)
const editingPrivacy = ref(false)
const editingPassword = ref(false)
const editingDocuments = ref(false)

const formData = ref({
  name: '',
  description: '',
  isPublic: true,
  requires_password: false,
  password: '',
  confirmPassword: '',
  documents: []
})

// Check if a URL is a full URL or a relative path
const isFullUrl = (url) => {
  return url && (url.startsWith('http://') || url.startsWith('https://'))
}

// Initialize form data
onMounted(() => {
  console.log('Group data received:', props.group);
  console.log('Is private:', props.group.isPrivate, props.group.is_private);
  console.log('Required documents (raw):', props.group.required_documents);
  console.log('Required documents type:', typeof props.group.required_documents);
  
  // Direct check of the required_documents field
  console.log('Direct check of required_documents:');
  if (props.group.required_documents === null) {
    console.log('required_documents is null');
  } else if (props.group.required_documents === undefined) {
    console.log('required_documents is undefined');
  } else if (props.group.required_documents === '') {
    console.log('required_documents is an empty string');
  } else if (props.group.required_documents === '[]') {
    console.log('required_documents is an empty JSON array string');
  } else {
    console.log('required_documents has content:', props.group.required_documents);
    
    // Try to access it directly as an array
    if (Array.isArray(props.group.required_documents)) {
      console.log('It is an array with length:', props.group.required_documents.length);
      console.log('Array contents:', props.group.required_documents);
    }
  }
  
  if (props.group.required_documents) {
    try {
      // Try to parse if it's a string
      if (typeof props.group.required_documents === 'string') {
        console.log('Attempting to parse required_documents as JSON string');
        const parsed = JSON.parse(props.group.required_documents);
        console.log('Parsed required_documents:', parsed);
      }
    } catch (e) {
      console.error('Error parsing required_documents:', e);
    }
  }
  
  const parsedDocs = parseRequiredDocuments(props.group.required_documents);
  console.log('Parsed documents result:', parsedDocs);
  
  formData.value = {
    name: props.group.name || '',
    description: props.group.description || '',
    isPublic: !(props.group.isPrivate || props.group.is_private), // Check both possible field names
    requires_password: props.group.requires_password || false,
    password: '',
    confirmPassword: '',
    documents: parsedDocs
  }
  
  console.log('Form data initialized with documents:', formData.value.documents);
  
  // Add event listener for group data updates
  window.addEventListener('group-data-updated', refreshFormData)
})

// Clean up event listeners when component is unmounted
onBeforeUnmount(() => {
  window.removeEventListener('group-data-updated', refreshFormData)
})

// Refresh form data when group data is updated
const refreshFormData = () => {
  console.log('Refreshing form data with:', props.group);
  console.log('Required documents (refresh):', props.group.required_documents);
  
  // Direct check of the required_documents field on refresh
  console.log('Direct check of required_documents on refresh:');
  if (props.group.required_documents === null) {
    console.log('required_documents is null');
  } else if (props.group.required_documents === undefined) {
    console.log('required_documents is undefined');
  } else if (props.group.required_documents === '') {
    console.log('required_documents is an empty string');
  } else if (props.group.required_documents === '[]') {
    console.log('required_documents is an empty JSON array string');
  } else {
    console.log('required_documents has content:', props.group.required_documents);
    
    // Try to access it directly as an array
    if (Array.isArray(props.group.required_documents)) {
      console.log('It is an array with length:', props.group.required_documents.length);
      console.log('Array contents:', props.group.required_documents);
    }
  }
  
  const parsedDocs = parseRequiredDocuments(props.group.required_documents);
  console.log('Parsed documents on refresh:', parsedDocs);
  
  formData.value = {
    name: props.group.name || '',
    description: props.group.description || '',
    isPublic: !(props.group.isPrivate || props.group.is_private), // Check both possible field names
    requires_password: props.group.requires_password || false,
    password: '',
    confirmPassword: '',
    documents: parsedDocs
  }
  
  console.log('Form data refreshed with documents:', formData.value.documents);
}

// Parse required documents from JSON string or object
const parseRequiredDocuments = (requiredDocs) => {
  console.log('Parsing required documents, raw value:', requiredDocs);
  console.log('Type of requiredDocs:', typeof requiredDocs);
  
  if (!requiredDocs) {
    console.log('No required documents found');
    return [];
  }
  
  try {
    // If it's already an array, use it
    if (Array.isArray(requiredDocs)) {
      console.log('requiredDocs is an array with length:', requiredDocs.length);
      const result = requiredDocs.map(doc => {
        console.log('Processing array item:', doc, 'type:', typeof doc);
        // If it's a string, create an object with name property
        if (typeof doc === 'string') {
          console.log('Item is a string, creating object with name:', doc);
          return { name: doc };
        }
        // If it's an object, extract the name property or use the object itself
        const name = doc.name || doc.toString();
        console.log('Item is not a string, using name property or toString():', name);
        return { name };
      });
      console.log('Processed array result:', result);
      return result;
    }
    
    // If it's a string, try to parse it as JSON
    if (typeof requiredDocs === 'string') {
      console.log('requiredDocs is a string, attempting to parse');
      
      // If it's an empty string, return empty array
      if (requiredDocs.trim() === '') {
        console.log('requiredDocs is an empty string');
        return [];
      }
      
      try {
        const parsed = JSON.parse(requiredDocs);
        console.log('Parsed JSON:', parsed, 'type:', typeof parsed);
        
        if (Array.isArray(parsed)) {
          console.log('Parsed JSON is an array with length:', parsed.length);
          const result = parsed.map(doc => {
            console.log('Processing parsed item:', doc, 'type:', typeof doc);
            if (typeof doc === 'string') {
              console.log('Parsed item is a string, creating object with name:', doc);
              return { name: doc };
            } else if (typeof doc === 'object' && doc !== null) {
              const name = doc.name || '';
              console.log('Parsed item is an object, using name property:', name);
              return { name };
            } else {
              const name = String(doc);
              console.log('Parsed item is neither string nor object, converting to string:', name);
              return { name };
            }
          });
          console.log('Processed parsed array result:', result);
          return result;
        } else if (typeof parsed === 'object' && parsed !== null) {
          // If it parsed to an object but not an array, try to extract document names
          console.log('Parsed JSON is an object, not an array');
          if (parsed.documents) {
            console.log('Found documents property in parsed object:', parsed.documents);
            if (Array.isArray(parsed.documents)) {
              const result = parsed.documents.map(doc => {
                if (typeof doc === 'string') return { name: doc };
                return { name: doc.name || String(doc) };
              });
              console.log('Processed documents property result:', result);
              return result;
            } else {
              console.log('Documents property is not an array');
              return [];
            }
          }
          
          // If it has keys that might be document names
          const keys = Object.keys(parsed);
          if (keys.length > 0) {
            console.log('Using object keys as document names:', keys);
            const result = keys.map(key => ({ name: key }));
            console.log('Processed object keys result:', result);
            return result;
          }
        }
        
        console.log('Parsed JSON is not in a usable format');
        return [];
      } catch (parseError) {
        console.error('Error parsing JSON string:', parseError);
        // If it can't be parsed as JSON, treat it as a single document name
        console.log('Treating the string as a single document name:', requiredDocs);
        return [{ name: requiredDocs }];
      }
    }
    
    // If it's an object but not an array, check if it has specific properties
    if (typeof requiredDocs === 'object' && requiredDocs !== null) {
      console.log('requiredDocs is an object:', requiredDocs);
      
      // Check if it has a property that might contain the documents
      if (requiredDocs.documents) {
        console.log('Found documents property:', requiredDocs.documents);
        if (Array.isArray(requiredDocs.documents)) {
          const result = requiredDocs.documents.map(doc => {
            if (typeof doc === 'string') return { name: doc };
            return { name: doc.name || String(doc) };
          });
          console.log('Processed documents property result:', result);
          return result;
        } else {
          console.log('Documents property is not an array');
          return [];
        }
      }
      
      // If it has keys that might be document names
      const keys = Object.keys(requiredDocs);
      if (keys.length > 0) {
        console.log('Using object keys as document names:', keys);
        const result = keys.map(key => ({ name: key }));
        console.log('Processed object keys result:', result);
        return result;
      }
    }
    
    console.log('Could not parse required documents, returning empty array');
    return [];
  } catch (error) {
    console.error('Error parsing required documents:', error);
    return [];
  }
}

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  selectedFile.value = file
  
  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    previewImage.value = e.target.result
  }
  reader.readAsDataURL(file)
}

const uploadGroupPicture = async () => {
  if (!selectedFile.value) return null
  
  try {
    const formData = new FormData()
    formData.append('picture', selectedFile.value)
    
    const response = await axios.post(`/groups/${props.group.id}/picture`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    return response.data.picture
  } catch (error) {
    console.error('Failed to upload group picture:', error)
    alert('Failed to upload group picture: ' + (error.response?.data?.error || 'Unknown error'))
    return null
  }
}

// Save individual fields
const saveName = async () => {
  try {
    const dataToSubmit = {
      name: formData.value.name
    }
    
    await updateGroupField(dataToSubmit)
    editingName.value = false
  } catch (error) {
    console.error('Failed to update group name:', error)
    alert('Failed to update group name: ' + (error.response?.data?.error || 'Unknown error'))
  }
}

const cancelNameEdit = () => {
  // Reset to original value
  formData.value.name = props.group.name || ''
  editingName.value = false
}

const saveDescription = async () => {
  try {
    const dataToSubmit = {
      description: formData.value.description
    }
    
    await updateGroupField(dataToSubmit)
    editingDescription.value = false
  } catch (error) {
    console.error('Failed to update group description:', error)
    alert('Failed to update group description: ' + (error.response?.data?.error || 'Unknown error'))
  }
}

const cancelDescriptionEdit = () => {
  // Reset to original value
  formData.value.description = props.group.description || ''
  editingDescription.value = false
}

const savePrivacy = async () => {
  try {
    const dataToSubmit = {
      is_private: !formData.value.isPublic
    }
    
    await updateGroupField(dataToSubmit)
    editingPrivacy.value = false
  } catch (error) {
    console.error('Failed to update group privacy:', error)
    alert('Failed to update group privacy: ' + (error.response?.data?.error || 'Unknown error'))
  }
}

const cancelPrivacyEdit = () => {
  // Reset to original value
  formData.value.isPublic = !(props.group.isPrivate || props.group.is_private)
  editingPrivacy.value = false
}

const savePassword = async () => {
  try {
    // Validate passwords match if password is required
    if (formData.value.requires_password) {
      if (!formData.value.password) {
        alert('Please enter a password')
        return
      }
      
      if (formData.value.password !== formData.value.confirmPassword) {
        alert('Passwords do not match')
        return
      }
    }
    
    const dataToSubmit = {
      requires_password: formData.value.requires_password
    }
    
    // Only include password if it's required and provided
    if (formData.value.requires_password && formData.value.password) {
      dataToSubmit.password = formData.value.password
    }
    
    await updateGroupField(dataToSubmit)
    editingPassword.value = false
  } catch (error) {
    console.error('Failed to update password settings:', error)
    alert('Failed to update password settings: ' + (error.response?.data?.error || 'Unknown error'))
  }
}

const cancelPasswordEdit = () => {
  // Reset to original values
  formData.value.requires_password = props.group.requires_password || false
  formData.value.password = ''
  formData.value.confirmPassword = ''
  editingPassword.value = false
}

const saveDocuments = async () => {
  try {
    // Validate document names
    const emptyDocs = formData.value.documents.filter(doc => !doc.name.trim())
    if (emptyDocs.length > 0) {
      alert('Please provide names for all required documents')
      return
    }
    
    // Format documents for the backend - simple array of strings
    const requiredDocuments = formData.value.documents.map(doc => doc.name.trim())
    
    console.log('Documents to submit (array):', requiredDocuments)
    
    // Convert to JSON string to match the expected format
    const jsonDocuments = JSON.stringify(requiredDocuments)
    console.log('Documents as JSON string:', jsonDocuments)
    
    const dataToSubmit = {
      required_documents: jsonDocuments
    }
    
    console.log('Submitting documents update:', dataToSubmit)
    
    await updateGroupField(dataToSubmit)
    editingDocuments.value = false
  } catch (error) {
    console.error('Failed to update required documents:', error)
    alert('Failed to update required documents: ' + (error.response?.data?.error || 'Unknown error'))
  }
}

const cancelDocumentsEdit = () => {
  // Reset to original values
  formData.value.documents = parseRequiredDocuments(props.group.required_documents)
  editingDocuments.value = false
}

// Helper function to update a single field
const updateGroupField = async (fieldData) => {
  try {
    console.log('Updating group field:', fieldData)
    console.log('Group ID:', props.group.id)
    
    // For required_documents, ensure it's a proper JSON string
    if (fieldData.required_documents !== undefined) {
      console.log('Required documents before sending:', fieldData.required_documents)
      
      // If it's already a string, we're good
      if (typeof fieldData.required_documents !== 'string') {
        // If it's not a string, stringify it
        fieldData.required_documents = JSON.stringify(fieldData.required_documents)
        console.log('Stringified required_documents:', fieldData.required_documents)
      }
    }
    
    // Make direct API call instead of using emit
    const response = await axios.put(`/groups/${props.group.id}`, fieldData)
    
    console.log('Response from backend:', response.data)
    
    // Update local data
    Object.assign(props.group, response.data)
    
    // Refresh form data to ensure all fields are up to date
    refreshFormData()
    
    // Dispatch global event for other components
    window.dispatchEvent(new CustomEvent('group-data-updated'))
    
    return response.data
  } catch (error) {
    console.error('Error updating group field:', error)
    console.error('Error response:', error.response?.data)
    throw error
  }
}

const handleSubmit = async () => {
  try {
    // First upload the picture if a new one was selected
    let picturePath = null
    if (selectedFile.value) {
      picturePath = await uploadGroupPicture()
    }
    
    // Prepare the data to submit
    const dataToSubmit = { 
      name: formData.value.name,
      description: formData.value.description,
      is_private: !formData.value.isPublic,
      requires_password: formData.value.requires_password
    }
    
    // Only include password if it's required and provided
    if (formData.value.requires_password && formData.value.password) {
      // Validate passwords match
      if (formData.value.password !== formData.value.confirmPassword) {
        alert('Passwords do not match')
        return
      }
      
      dataToSubmit.password = formData.value.password
    }
    
    // Format documents for the backend - simple array of strings
    if (formData.value.documents.length > 0) {
      // Validate document names
      const emptyDocs = formData.value.documents.filter(doc => !doc.name.trim())
      if (emptyDocs.length > 0) {
        alert('Please provide names for all required documents')
        return
      }
      
      const requiredDocuments = formData.value.documents.map(doc => doc.name.trim())
      console.log('Documents to submit in handleSubmit (array):', requiredDocuments)
      
      // Convert to JSON string to match the expected format
      dataToSubmit.required_documents = JSON.stringify(requiredDocuments)
      console.log('Documents as JSON string in handleSubmit:', dataToSubmit.required_documents)
    } else {
      dataToSubmit.required_documents = '[]'
    }
    
    // Add the picture path if a new one was uploaded
    if (picturePath) {
      dataToSubmit.picture = picturePath
    }
    
    console.log('Submitting group update:', dataToSubmit)
    console.log('Group ID:', props.group.id)
    
    // Make direct API call instead of using emit
    try {
      const response = await axios.put(`/groups/${props.group.id}`, dataToSubmit)
      
      // Update local data
      Object.assign(props.group, response.data)
      
      // Refresh form data to ensure all fields are up to date
      refreshFormData()
      
      // Dispatch global event for other components
      window.dispatchEvent(new CustomEvent('group-data-updated'))
      
      // Close dialog
      emit('close')
    } catch (error) {
      console.error('Failed to update group via direct API call:', error)
      
      // Fall back to emit if direct call fails
      emit('submit', dataToSubmit)
    }
  } catch (error) {
    console.error('Error submitting form:', error)
    alert('Failed to save group settings: ' + (error.response?.data?.error || 'Unknown error'))
  }
}

const handleDelete = () => {
  if (confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
    emit('delete')
  }
}

const handleLeave = () => {
  if (confirm('Are you sure you want to leave this group?')) {
    emit('leave')
  }
}

// Document management
const addDocument = () => {
  formData.value.documents.push({ name: '' })
}

const removeDocument = (index) => {
  formData.value.documents.splice(index, 1)
}
</script>