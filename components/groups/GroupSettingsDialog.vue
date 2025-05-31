<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="sm:max-w-lg flex flex-col h-[80vh]">
      <DialogHeader>
        <DialogTitle>Group Settings</DialogTitle>
        <DialogDescription v-if="!isCurrentUserAdmin" class="text-amber-600">
          View-only mode. Only group admins can modify settings.
        </DialogDescription>
      </DialogHeader>

      <ScrollArea class="flex-1" maxHeight="calc(80vh - 140px)">
        <div class="p-6 space-y-6">
          <!-- Group Picture Section -->
          <div class="flex flex-col items-center mb-8 pb-4">
            <div class="relative mb-4">
              <div v-if="!group.picture && !previewImage" class="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center">
                <Users class="h-16 w-16 text-gray-400" />
              </div>
              <img 
                v-else
                :src="previewImage || (group.picture && isFullUrl(group.picture) ? group.picture : `${apiBaseUrl}${group.picture}`)" 
                alt="Group Picture"
                class="w-28 h-28 rounded-full object-cover border"
              />
              <Button
                v-if="isCurrentUserAdmin"
                type="button"
                variant="secondary"
                size="icon"
                class="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-md"
                @click="$refs.fileInput.click()"
              >
                <Camera class="h-4 w-4" />
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
              v-if="isCurrentUserAdmin"
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
            <div class="space-y-2 pb-3">
              <Label for="name" class="text-sm font-medium">Name</Label>
              <Input
                id="name"
                v-model="formData.name"
                class="w-full"
                placeholder="Enter group name"
                required
                :disabled="!isCurrentUserAdmin"
              />
            </div>

            <!-- Group Description Field -->
            <div class="space-y-2 pb-3">
              <Label for="description" class="text-sm font-medium">Description</Label>
              <Textarea
                id="description"
                v-model="formData.description"
                class="w-full"
                placeholder="Enter group description"
                :disabled="!isCurrentUserAdmin"
              />
            </div>

            <!-- Group Privacy Field -->
            <div class="space-y-2 pb-3">
              <Label for="is-private-toggle" class="text-sm font-medium">Privacy</Label>
              <div class="flex items-center space-x-2">
                <Switch
                  id="is-private-toggle"
                  v-model="formData.isPrivate"
                  @update:modelValue="savePrivacy"
                  :disabled="!isCurrentUserAdmin"
                />
                <Label for="is-private-toggle" class="text-sm text-muted-foreground">
                  {{ formData.isPrivate ? 'Private Group' : 'Public Group' }}
                </Label>
              </div>
            </div>

            <!-- Password Requirement Field -->
            <div class="space-y-2 pb-3">
              <Label for="requires-password" class="text-sm font-medium">Password</Label>
              <div class="flex items-center space-x-2">
                <Switch
                  id="requires-password-toggle"
                  v-model="formData.requires_password"
                  @update:modelValue="togglePasswordRequirement"
                  :disabled="!isCurrentUserAdmin"
                />
                <Label for="requires-password-toggle" class="text-sm text-muted-foreground">
                  {{ formData.requires_password ? 'Password Required' : 'No Password Required' }}
                </Label>
              </div>
              
              <div v-if="formData.requires_password" class="space-y-2 mt-2">
                <div class="h-10 flex items-center">
                  <Button
                    v-if="isCurrentUserAdmin"
                    type="button"
                    variant="outline"
                    size="sm"
                    @click="showPasswordChange = true"
                  >
                    Change Password
                  </Button>
                  <p v-else class="text-sm text-muted-foreground">
                    Password is required to join this group.
                  </p>
                </div>
              </div>
              
              <div v-else class="space-y-2 mt-2">
                <div class="h-10 flex items-center">
                  <p class="text-sm text-muted-foreground">
                    No password is required to join this group.
                  </p>
                </div>
              </div>
            </div>

            <!-- Required Documents Field -->
            <div class="space-y-2 pb-3">
              <Label for="requires-documents" class="text-sm font-medium">Documents</Label>
              <div class="flex items-center space-x-2">
                <Switch
                  id="requires-documents-toggle"
                  v-model="formData.requires_documents"
                  @update:modelValue="toggleDocumentRequirement"
                  :disabled="!isCurrentUserAdmin"
                />
                <Label for="requires-documents-toggle" class="text-sm text-muted-foreground">
                  {{ formData.requires_documents ? 'Documents Required' : 'No Documents Required' }}
                </Label>
              </div>
              
              <div class="space-y-2 mt-2">
                <Button 
                  type="button"
                  variant="outline" 
                  @click="addDocument"
                  class="flex items-center"
                  :disabled="!isCurrentUserAdmin || !formData.requires_documents"
                  :class="{ 'opacity-50': !formData.requires_documents || !isCurrentUserAdmin }"
                >
                  <LucideIcon name="Plus" class="h-4 w-4 mr-1" />
                  Add Required Document
                </Button>
                
                <div class="space-y-2">
                  <div v-for="(doc, index) in formData.documents" :key="index" class="flex items-center space-x-2">
                    <Input 
                      v-model="doc.name" 
                      placeholder="Document name (e.g. ID Card, Student Card)" 
                      :disabled="!isCurrentUserAdmin || !formData.requires_documents"
                      :class="{ 'opacity-50': !formData.requires_documents || !isCurrentUserAdmin }"
                    />
                    <Button
                      type="button"
                      variant="destructive" 
                      size="icon" 
                      @click="removeDocument(index)"
                      title="Remove this document requirement"
                      :disabled="!isCurrentUserAdmin || !formData.requires_documents"
                      :class="{ 'opacity-50': !formData.requires_documents || !isCurrentUserAdmin }"
                    >
                      <LucideIcon name="Trash" class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Membership Approval Field -->
            <div class="space-y-2 pb-3">
              <Label for="requires-admin-approval" class="text-sm font-medium">Membership Approval</Label>
              <div class="flex items-center space-x-2">
                <Switch
                  id="requires-admin-approval-toggle"
                  v-model="formData.requires_admin_approval"
                  @update:modelValue="toggleAdminApprovalRequirement"
                  :disabled="!isCurrentUserAdmin"
                />
                <Label for="requires-admin-approval-toggle" class="text-sm text-muted-foreground">
                  {{ formData.requires_admin_approval ? 'Admin approval required' : 'Automatic approval' }}
                </Label>
              </div>
              
              <div class="space-y-2 mt-2">
                <div class="h-10 flex items-center">
                  <p class="text-sm text-muted-foreground">
                    {{ formData.requires_admin_approval 
                      ? 'New members must be approved by an admin before joining.' 
                      : 'New members will be automatically approved when they join.' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Remove the Leave Group button and its container -->
        </div>
      </ScrollArea>
      
      <!-- Custom Footer instead of DialogFooter -->
      <div class="px-6 py-4 border-t mt-4 flex justify-between w-full">
        <Button 
          variant="destructive" 
          size="sm"
          @click="handleDelete"
          :disabled="!isCurrentUserAdmin"
          v-if="isCurrentUserAdmin"
        >
          <LucideIcon name="Trash" class="mr-2 h-4 w-4" />
          Delete Group
        </Button>
        <div v-else></div>
        
        <div class="flex space-x-2">
          <Button variant="outline" @click="handleDialogCancel">Close</Button>
          <Button 
            v-if="isCurrentUserAdmin" 
            type="button" 
            @click="handleSubmit" 
            :disabled="!formModified"
          >
            Save All Changes
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Password Change Dialog - Separate from main dialog -->
  <Dialog :open="showPasswordChange" @update:open="showPasswordChange = $event">
    <DialogContent class="w-full max-w-lg">
      <DialogHeader>
        <DialogTitle>Change Group Password</DialogTitle>
        <DialogDescription>
          {{ props.group.requires_password ? 'Enter a new password for the group.' : 'Set a password for the group.' }}
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <div v-if="props.group.requires_password" class="space-y-2">
          <Label for="current-password" class="text-sm font-medium">
            Current Password
          </Label>
          <Input id="current-password" type="password" v-model="currentPassword" required />
        </div>

        <div class="space-y-2">
          <Label for="new-password" class="text-sm font-medium">New Password</Label>
          <Input id="new-password" type="password" v-model="newPassword" required />
        </div>

        <div class="space-y-2">
          <Label for="confirm-password" class="text-sm font-medium">Confirm New Password</Label>
          <Input id="confirm-password" type="password" v-model="confirmPassword" required />
          <p v-if="passwordMismatch" class="text-xs text-destructive">
            Passwords do not match
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="showPasswordChange = false">Cancel</Button>
        <Button type="submit" @click="changePassword">Change Password</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  
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
import { useAlertDialog } from '@/composables/useAlertDialog'
import ActionAlertDialog from '@/components/shared/ActionAlertDialog.vue'
import LucideIcon from '@/components/LucideIcon.vue'
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Users, Camera } from 'lucide-vue-next'
import { useNuxtApp } from '#app'
import { changeGroupPassword, emergencyChangeGroupPassword } from '@/src/utils/auth'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cloneDeep } from 'lodash'
import { useToast } from '@/components/ui/toast/use-toast'

const props = defineProps({
  group: {
    type: Object,
    required: true
  },
  isCurrentUserAdmin: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'submit', 'delete'])
const { $axiosInstance } = useNuxtApp()
const fileInput = ref(null)
const previewImage = ref(null)
const selectedFile = ref(null)
const config = useRuntimeConfig()
const apiBaseUrl = config.public.apiBaseUrl || 'http://localhost:8088'

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

// Password change dialog state
const showPasswordChange = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
// Flag to track if a password has been successfully set during this session
const passwordHasBeenSet = ref(false)

// Computed property to check if passwords match
const passwordMismatch = computed(() => {
  return newPassword.value && confirmPassword.value && 
         newPassword.value !== confirmPassword.value
})

// Editing states are no longer needed
// const editingName = ref(false)
// const editingDescription = ref(false)

const formData = ref({
  name: '',
  description: '',
  isPrivate: true,
  requires_password: false,
  password: '',
  confirmPassword: '',
  requires_documents: false,
  documents: [],
  requires_admin_approval: true
})

// Original form data from the server
const originalFormData = ref({})

// Check if a URL is a full URL or a relative path
const isFullUrl = (url) => {
  return url && (url.startsWith('http://') || url.startsWith('https://'))
}

// Create a reference to the event handler function
const handleGroupDataUpdated = () => {
  refreshFormData().catch(error => {
    console.error('Error in refreshFormData:', error);
  });
};

// Initialize form data
onMounted(async () => {
  console.log('Group data received:', props.group);
  console.log('Group ID:', props.group.id);
  console.log('Is private:', props.group.isPrivate, props.group.is_private);
  console.log('Required documents (raw):', props.group.required_documents);
  console.log('Required documents type:', typeof props.group.required_documents);
  console.log('Requires documents flag:', props.group.requires_documents);
  console.log('Is current user admin:', props.isCurrentUserAdmin);
  console.log('Requires admin approval:', props.group.requires_admin_approval);
  
  // Make a direct API call to fetch the latest group data
  try {
    console.log('Making direct API call to fetch group data');
    const response = await axios.get(`/api/groups/${props.group.id}`);
    console.log('Direct API response:', response.data);
    
    // Update the group data with the direct API response
    Object.assign(props.group, response.data);
    console.log('Updated group data with direct API response');
    console.log('Requires admin approval after API update:', props.group.requires_admin_approval);
    
    // For backward compatibility with older backend versions
    // If requires_documents is not in the response, we need to check if required_documents exists
    if (props.group.requires_documents === undefined && props.group.required_documents !== undefined) {
      console.log('requires_documents not found in API response, determining from required_documents');
      
      // If required_documents is a non-empty array, set requires_documents to true
      if (typeof props.group.required_documents === 'string' && 
          props.group.required_documents !== '[]' && 
          props.group.required_documents !== '') {
        props.group.requires_documents = true;
        console.log('Setting requires_documents to true based on non-empty required_documents');
      } else if (Array.isArray(props.group.required_documents) && props.group.required_documents.length > 0) {
        props.group.requires_documents = true;
        console.log('Setting requires_documents to true based on non-empty required_documents array');
      } else {
        props.group.requires_documents = false;
        console.log('Setting requires_documents to false based on empty required_documents');
      }
    }
    
    // If requires_admin_approval is not in the response, set it to true (default)
    if (props.group.requires_admin_approval === undefined) {
      console.log('requires_admin_approval not found in API response, setting to default (true)');
      props.group.requires_admin_approval = true;
    }
  } catch (error) {
    console.error('Error fetching group data directly:', error);
  }
  
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
  
  // Parse the documents
  const parsedDocs = parseRequiredDocuments(props.group.required_documents);
  console.log('Parsed documents result:', parsedDocs);
  
  // Determine if documents are required
  // First check the explicit requires_documents flag, then fall back to checking if there are any documents
  let requiresDocuments = false;
  
  // If the requires_documents flag is explicitly set, use that
  if (props.group.requires_documents !== undefined) {
    requiresDocuments = Boolean(props.group.requires_documents);
    console.log('Using explicit requires_documents flag:', requiresDocuments);
  } 
  // Otherwise, check if there are any documents
  else if (parsedDocs.length > 0) {
    requiresDocuments = true;
    console.log('No explicit flag, but documents found. Setting requires_documents to true');
  }
  // If required_documents is a non-empty string but couldn't be parsed, assume documents are required
  else if (typeof props.group.required_documents === 'string' && 
           props.group.required_documents.trim() !== '' && 
           props.group.required_documents.trim() !== '[]') {
    requiresDocuments = true;
    console.log('Non-empty required_documents string found. Setting requires_documents to true');
  }
  
  console.log('Determined requires_documents value:', requiresDocuments);
  
  formData.value = {
    name: props.group.name || '',
    description: props.group.description || '',
    isPrivate: (props.group.isPrivate || props.group.is_private), // Check both possible field names
    requires_password: props.group.requires_password || false,
    password: '',
    confirmPassword: '',
    requires_documents: requiresDocuments,
    documents: parsedDocs,
    requires_admin_approval: props.group.requires_admin_approval !== undefined 
      ? props.group.requires_admin_approval 
      : true // Default to true if not specified
  }
  
  // Store a deep copy of the original form data
  originalFormData.value = cloneDeep(formData.value)
  
  console.log('Form data initialized with documents:', formData.value.documents);
  console.log('Form data initialized with requires_documents:', formData.value.requires_documents);
  
  // Add event listener for group data updates
  window.addEventListener('group-data-updated', handleGroupDataUpdated);
});

// Clean up event listeners when component is unmounted
onBeforeUnmount(() => {
  window.removeEventListener('group-data-updated', handleGroupDataUpdated);
});

// Refresh form data when group data is updated
const refreshFormData = async () => {
  console.log('Refreshing form data with:', props.group);
  console.log('Group ID on refresh:', props.group.id);
  console.log('Required documents (refresh):', props.group.required_documents);
  console.log('Requires documents flag (refresh):', props.group.requires_documents);
  console.log('Requires admin approval (refresh):', props.group.requires_admin_approval);
  
  // Make a direct API call to fetch the latest group data
  try {
    console.log('Making direct API call to fetch group data on refresh');
    const response = await axios.get(`/api/groups/${props.group.id}`);
    console.log('Direct API response on refresh:', response.data);
    
    // Update the group data with the direct API response
    Object.assign(props.group, response.data);
    console.log('Updated group data with direct API response on refresh');
    console.log('Requires admin approval after API update on refresh:', props.group.requires_admin_approval);
    
    // For backward compatibility with older backend versions
    // If requires_documents is not in the response, we need to check if required_documents exists
    if (props.group.requires_documents === undefined && props.group.required_documents !== undefined) {
      console.log('requires_documents not found in API response on refresh, determining from required_documents');
      
      // If required_documents is a non-empty array, set requires_documents to true
      if (typeof props.group.required_documents === 'string' && 
          props.group.required_documents !== '[]' && 
          props.group.required_documents !== '') {
        props.group.requires_documents = true;
        console.log('Setting requires_documents to true based on non-empty required_documents on refresh');
      } else if (Array.isArray(props.group.required_documents) && props.group.required_documents.length > 0) {
        props.group.requires_documents = true;
        console.log('Setting requires_documents to true based on non-empty required_documents array on refresh');
      } else {
        props.group.requires_documents = false;
        console.log('Setting requires_documents to false based on empty required_documents on refresh');
      }
    }
    
    // If requires_admin_approval is not in the response, set it to true (default)
    if (props.group.requires_admin_approval === undefined) {
      console.log('requires_admin_approval not found in API response on refresh, setting to default (true)');
      props.group.requires_admin_approval = true;
    }
  } catch (error) {
    console.error('Error fetching group data directly on refresh:', error);
    
    // If 404 error (group doesn't exist anymore), close the dialog
    if (error.response && error.response.status === 404) {
      console.log('Group no longer exists, closing settings dialog');
      if (typeof props.onClose === 'function') {
        props.onClose();
      }
      return; // Exit early
    }
  }
  
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
  
  // Determine if documents are required
  // First check the explicit requires_documents flag, then fall back to checking if there are any documents
  let requiresDocuments = false;
  
  // If the requires_documents flag is explicitly set, use that
  if (props.group.requires_documents !== undefined) {
    requiresDocuments = Boolean(props.group.requires_documents);
    console.log('Using explicit requires_documents flag on refresh:', requiresDocuments);
  } 
  // Otherwise, check if there are any documents
  else if (parsedDocs.length > 0) {
    requiresDocuments = true;
    console.log('No explicit flag, but documents found on refresh. Setting requires_documents to true');
  }
  // If required_documents is a non-empty string but couldn't be parsed, assume documents are required
  else if (typeof props.group.required_documents === 'string' && 
           props.group.required_documents.trim() !== '' && 
           props.group.required_documents.trim() !== '[]') {
    requiresDocuments = true;
    console.log('Non-empty required_documents string found on refresh. Setting requires_documents to true');
  }
  
  console.log('Determined requires_documents value on refresh:', requiresDocuments);
  
  // Keep the current password if it exists
  const currentPassword = formData.value.password;
  const currentConfirmPassword = formData.value.confirmPassword;
  
  formData.value = {
    name: props.group.name || '',
    description: props.group.description || '',
    isPrivate: (props.group.isPrivate || props.group.is_private), // Check both possible field names
    requires_password: props.group.requires_password || false,
    password: currentPassword,
    confirmPassword: currentConfirmPassword,
    requires_documents: requiresDocuments,
    documents: parsedDocs,
    requires_admin_approval: props.group.requires_admin_approval !== undefined 
      ? props.group.requires_admin_approval 
      : true // Default to true if not specified
  }
  
  // Update the original form data to match the refreshed data
  originalFormData.value = cloneDeep(formData.value);
  
  console.log('Form data refreshed with documents:', formData.value.documents);
  console.log('Form data refreshed with requires_documents:', formData.value.requires_documents);
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
      
      // If it's an empty string or empty JSON array, return empty array
      if (requiredDocs.trim() === '' || requiredDocs.trim() === '[]') {
        console.log('requiredDocs is an empty string or empty JSON array');
        return [];
      }
      
      // Check if it's a simple string that's not JSON
      // This handles cases where the backend might store a single document name as a plain string
      if (!requiredDocs.startsWith('[') && !requiredDocs.startsWith('{')) {
        console.log('requiredDocs appears to be a plain string, not JSON');
        // Split by commas in case it's a comma-separated list
        const docNames = requiredDocs.split(',').map(name => name.trim());
        const result = docNames.map(name => ({ name }));
        console.log('Processed plain string result:', result);
        return result;
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
    
    const response = await axios.post(`/api/groups/${props.group.id}/picture`, formData, {
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

// Save individual fields - these will be removed or modified to not make immediate API calls
const saveName = () => {
  // Just update local state, don't make API call
  console.log('Name updated locally:', formData.value.name)
}

const saveDescription = () => {
  // Just update local state, don't make API call
  console.log('Description updated locally:', formData.value.description)
}

const savePrivacy = () => {
  // Just update local state, don't make API call
  console.log('Privacy setting updated locally:', formData.value.isPrivate)
}

const togglePasswordRequirement = () => {
  // Just update local state, don't make API call
  console.log('Password requirement toggled locally:', formData.value.requires_password)
  
  // If turning off password requirement, clear password fields
  if (!formData.value.requires_password) {
    formData.value.password = ''
    formData.value.confirmPassword = ''
    passwordHasBeenSet.value = false
  } else {
    // If turning on password requirement, show the password change dialog
    showPasswordChange.value = true
    // Reset the passwordHasBeenSet flag when toggling on
    passwordHasBeenSet.value = false
  }
}

const savePassword = () => {
  // Just update local state, don't make API call
  console.log('Password updated locally')
}

const toggleDocumentRequirement = () => {
  // Just update local state, don't make API call
  console.log('Document requirement toggled locally:', formData.value.requires_documents)
}

const saveDocuments = () => {
  // Just update local state, don't make API call
  console.log('Documents updated locally:', formData.value.documents)
}

// Helper function to update a single field - will only be used by handleSubmit
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
    const response = await axios.put(`/api/groups/${props.group.id}`, fieldData)
    
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
    // Check if user is admin before proceeding
    if (!props.isCurrentUserAdmin) {
      console.warn('Non-admin user attempted to submit group settings changes');
      return;
    }

    // We no longer need to validate passwords here since we're using a separate dialog
    // Just make sure to clear password fields if password is not required
    if (!formData.value.requires_password) {
      formData.value.password = '';
      formData.value.confirmPassword = '';
    } else {
      // If the user is enabling password requirement but hasn't set a password yet,
      // show the password dialog
      if (formData.value.requires_password && !originalFormData.value.requires_password && !passwordHasBeenSet.value) {
        showAlert('Action Required', 'Please set a password for the group before saving changes.');
        showPasswordChange.value = true;
        return;
      }
    }
    
    // Validate document names if documents are required
    if (formData.value.requires_documents && formData.value.documents.length > 0) {
      const emptyDocs = formData.value.documents.filter(doc => !doc.name.trim())
      if (emptyDocs.length > 0) {
        showAlert('Validation Error', 'Please provide names for all required documents')
        return
      }
    }
    
    // Check if documents are required but none are specified
    if (formData.value.requires_documents && formData.value.documents.length === 0) {
      showAlert('Validation Error', 'If documents are required, you must specify at least one required document type.');
      return;
    }
    
    // First upload the picture if a new one was selected
    let picturePath = null
    if (selectedFile.value) {
      picturePath = await uploadGroupPicture()
    }
    
    // Log the requires_admin_approval value before preparing the data
    console.log('Submitting requires_admin_approval value:', formData.value.requires_admin_approval);

    // Prepare the data to submit
    const dataToSubmit = { 
      name: formData.value.name,
      description: formData.value.description,
      is_private: formData.value.isPrivate,
      requires_password: formData.value.requires_password,
      requires_documents: formData.value.requires_documents,
      requires_admin_approval: formData.value.requires_admin_approval
    }
    
    // We no longer include password in the main form submission
    // Password changes are handled by the separate changePassword function
    
    // Format documents for the backend
    if (formData.value.requires_documents) {
      // If documents are required, include the document list (even if empty)
      const requiredDocuments = formData.value.documents.map(doc => doc.name.trim())
      console.log('Documents to submit in handleSubmit (array):', requiredDocuments)
      
      // Convert to JSON string to match the expected format
      dataToSubmit.required_documents = JSON.stringify(requiredDocuments)
      console.log('Documents as JSON string in handleSubmit:', dataToSubmit.required_documents)
    } else {
      // If documents are not required, set to empty array
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
      const response = await axios.put(`/api/groups/${props.group.id}`, dataToSubmit)
      
      console.log('Group update response:', response.data)
      
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
      console.error('Error response:', error.response?.data)
      
      // Fall back to emit if direct call fails
      emit('submit', dataToSubmit)
    }
  } catch (error) {
    console.error('Error submitting form:', error)
    alert('Failed to save group settings: ' + (error.response?.data?.error || 'Unknown error'))
  }
}

const handleDelete = () => {
  // Check if user is admin before proceeding
  if (!props.isCurrentUserAdmin) {
    console.warn('Non-admin user attempted to delete group');
    return;
  }

    emit('delete')
}

// Document management
const addDocument = () => {
  formData.value.documents.push({ name: '' })
}

const removeDocument = (index) => {
  formData.value.documents.splice(index, 1)
}

// Reset form data to original values
const resetForm = () => {
  formData.value = cloneDeep(originalFormData.value)
  passwordHasBeenSet.value = false
  selectedFile.value = null // Reset selected file
  previewImage.value = null // Reset preview image
  console.log('Form reset to original values')
}

// Cancel button handler
const handleDialogCancel = () => {
  // Check if the user has toggled requires_password to true but hasn't set a password
  if (formData.value.requires_password && !originalFormData.value.requires_password && showPasswordChange.value) {
    // Reset the requires_password toggle
    formData.value.requires_password = false;
    showPasswordChange.value = false;
    passwordHasBeenSet.value = false;
  }
  
  // Only reset the form if the user is an admin
  if (props.isCurrentUserAdmin) {
    resetForm() // This now also resets the file/preview
    passwordHasBeenSet.value = false;
  } else {
    // If not admin, still reset the file selection if they changed it
    selectedFile.value = null 
    previewImage.value = null 
  }
  emit('close')
}

// Check if form has been modified
const formModified = computed(() => {
  // Check if a new file has been selected OR if form data has changed
  return selectedFile.value !== null || 
         JSON.stringify(formData.value) !== JSON.stringify(originalFormData.value)
})

// Change password function
const changePassword = async () => {
  // Check if user is admin before proceeding
  if (!props.isCurrentUserAdmin) {
    console.warn('Non-admin user attempted to change group password');
    return;
  }

  if (passwordMismatch.value) {
    showAlert('Validation Error', 'Passwords do not match')
    return
  }
  
      // Check if the group previously required a password
    const groupPreviouslyRequiredPassword = props.group.requires_password;
    
    // Only require current password if the group previously required a password
    if (groupPreviouslyRequiredPassword && !currentPassword.value) {
      showAlert('Missing Field', 'Please enter your current password')
      return
    }
    
    if (!newPassword.value) {
      showAlert('Missing Field', 'Please enter a new password')
      return
    }
  
      // Simple password validation
    if (newPassword.value.length < 6) {
      showAlert('Validation Error', 'Password must be at least 6 characters long')
      return
    }
  
  try {
    console.log('Changing password for group:', props.group.id)
    console.log('Group requires password:', props.group.requires_password)
    console.log('Group password:', props.group.password ? 'Set' : 'Not set')
    console.log('Group password length:', props.group.password ? props.group.password.length : 0)
    console.log('Current password provided:', currentPassword.value)
    console.log('Current password length:', currentPassword.value.length)
    
    // If the group didn't previously require a password, use the emergency password change endpoint
    if (!groupPreviouslyRequiredPassword) {
      await emergencyChangeGroupPassword($axiosInstance, props.group.id, newPassword.value);
    } else {
      // Use the regular password change function with plaintext passwords
      await changeGroupPassword($axiosInstance, props.group.id, currentPassword.value, newPassword.value)
    }
    
    // Reset form and close dialog
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    showPasswordChange.value = false
    
    // Show success message
    showAlert('Success', 'Group password changed successfully')
    
    // Update the original form data to reflect that password has been changed
    // but we don't need to store the actual password
    originalFormData.value.password = ''
    originalFormData.value.confirmPassword = ''
    
    // Set the passwordHasBeenSet flag to true
    passwordHasBeenSet.value = true
    
    // Also update the requires_password flag in the original form data
    // to prevent the form from thinking this is a new change
    originalFormData.value.requires_password = true
    
  } catch (error) {
    console.error('Failed to change group password:', error)
    console.error('Error response:', error.response?.data)
    console.error('Error status:', error.response?.status)
    
    // Handle specific error cases
    if (error.response) {
      const status = error.response.status
      const errorMessage = error.response.data?.error || 'Unknown error'
      
      if (status === 401) {
        showAlert('Authentication Error', 'Current password is incorrect')
      } else if (status === 400) {
        showAlert('Error', `Failed to change password: ${errorMessage}`)
      } else if (status === 403) {
        showAlert('Permission Denied', 'You do not have permission to change this group\'s password')
      } else {
        showAlert('Error', `Failed to change password: ${errorMessage}`)
      }
    } else {
      showAlert('Connection Error', 'Failed to change password: Network error')
    }
  }
}

const toggleAdminApprovalRequirement = () => {
  // Just update local state, don't make API call
  console.log('Admin approval requirement toggled from', !formData.value.requires_admin_approval, 'to', formData.value.requires_admin_approval);
  console.log('Current formData state:', formData.value);
  
  // Update the original form data to track changes
  if (JSON.stringify(formData.value) !== JSON.stringify(originalFormData.value)) {
    console.log('Form data has been modified');
  } else {
    console.log('Form data is unchanged');
  }
}
</script>