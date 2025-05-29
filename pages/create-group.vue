<template>
  <div class="container mx-auto p-6">
    <div class="max-w-2xl mx-auto">
      <div class="flex items-center mb-6">
        <Plus class="mr-2 h-6 w-6" />
        <h1 class="text-2xl font-semibold">Create Group</h1>
      </div>

      <div class="p-6 space-y-6">
        <!-- Group Picture -->
        <div class="flex justify-center">
          <div class="relative">
            <div v-if="!form.picture" class="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center">
              <Users class="h-20 w-20 text-gray-400" />
            </div>
            <img 
              v-else
              :src="form.picture"
              alt="Group Picture Preview"
              class="w-32 h-32 rounded-full object-cover border-2 border-muted"
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              class="absolute bottom-0 right-0 h-10 w-10 rounded-full shadow-md flex items-center justify-center"
              @click="triggerFileInput"
              title="Upload Group Picture"
            >
              <Camera class="h-5 w-5" />
            </Button>
            <input 
              type="file" 
              ref="fileInput" 
              class="hidden"
              accept="image/*" 
              @change="handlePictureUpload" 
            />
          </div>
        </div>
        
        <!-- Group Name -->
        <div class="space-y-2">
          <Label for="group-name" class="text-base font-medium">Name</Label>
          <Input 
            id="group-name"
            v-model="form.name" 
            placeholder="Enter group name (e.g., 'Book Club')"
            required
            class="text-base py-3 px-4"
          />
        </div>
        
        <!-- Group Description -->
        <div class="space-y-2">
          <Label for="group-description" class="text-base font-medium">Description</Label>
          <Textarea
            id="group-description"
            v-model="form.description"
            class="w-full text-base py-3 px-4" 
            placeholder="Describe your group (optional)"
            rows="4"
          />
        </div>
        
        <!-- Privacy Settings -->
        <div class="space-y-2">
          <Label for="is-private-toggle" class="text-base font-medium">Privacy</Label>
          <div class="flex items-center space-x-3 pt-1">
            <Switch
              id="is-private-toggle"
              v-model="form.isPrivate"
            />
            <Label for="is-private-toggle" class="text-base text-muted-foreground">
              {{ form.isPrivate ? 'Private Group' : 'Public Group' }}
            </Label>
          </div>
           <p class="text-sm text-muted-foreground pt-1">
            Private groups are not visible in public search results and require an invitation or admin approval to join.
          </p>
        </div>
        
        <!-- Group Password -->
        <div class="space-y-2">
          <Label for="requires-password" class="text-base font-medium">Password Protection</Label>
          <div class="flex items-center space-x-3 pt-1">
            <Switch
              id="requires-password"
              v-model="form.requires_password"
            />
            <Label for="requires-password" class="text-base text-muted-foreground">
              {{ form.requires_password ? 'Password Required to Join' : 'No Password Required' }}
            </Label>
          </div>
          
          <div v-if="form.requires_password" class="space-y-2 mt-2">
            <div class="h-10 flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                @click="showPasswordDialog = true"
                class="flex items-center"
              >
                <KeyRound class="h-4 w-4 mr-2"/>
                Set Password
              </Button>
              <span v-if="form.password" class="text-sm text-green-600">✓ Password set</span>
              <span v-else class="text-sm text-muted-foreground">Password required</span>
            </div>
          </div>
        </div>

        <!-- Documents Required -->
        <div class="space-y-2">
          <Label for="requires-documents" class="text-base font-medium">Document Verification</Label>
          <div class="flex items-center space-x-3 pt-1">
            <Switch
              id="requires-documents"
              v-model="form.requires_documents"
            />
            <Label for="requires-documents" class="text-base text-muted-foreground">
              {{ form.requires_documents ? 'Documents Required to Join' : 'No Documents Required' }}
            </Label>
          </div>
          
          <div v-if="form.requires_documents" class="pt-3">
            <Button 
              type="button"
              variant="outline" 
              @click="addDocument"
              class="flex items-center mb-3 text-base py-2 px-3"
            >
              <Plus class="h-5 w-5 mr-2" />
              Add Required Document Type
            </Button>
            
            <div class="space-y-3">
              <div v-for="(doc, index) in form.documents" :key="index" class="flex items-center space-x-3">
                <Input 
                  v-model="doc.name" 
                  placeholder="Document name (e.g. ID Card, Student Card)" 
                  class="text-base py-3 px-4 flex-grow"
                />
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon" 
                  @click="removeDocument(index)"
                  title="Remove this document requirement"
                  class="text-destructive hover:bg-destructive/10"
                >
                  <Trash class="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Membership Approval Setting -->
        <div class="space-y-2">
          <Label for="requires-admin-approval" class="text-base font-medium">Membership Approval</Label>
          <div class="flex items-center space-x-3 pt-1">
            <Switch
              id="requires-admin-approval-toggle"
              v-model="form.requires_admin_approval"
            />
            <Label for="requires-admin-approval-toggle" class="text-base text-muted-foreground">
              {{ form.requires_admin_approval ? 'Admin Approval Required' : 'Automatic Approval' }}
            </Label>
          </div>
          <p class="text-sm text-muted-foreground pt-1">
            {{ form.requires_admin_approval 
              ? 'New members must be approved by an admin before joining.' 
              : 'New members will be automatically approved if other requirements (password/documents) are met.' }}
          </p>
        </div>
      </div>
      
      <div class="flex justify-end space-x-3 mt-8 py-4 border-t">
        <Button type="button" variant="outline" @click="handleCancel" class="text-base py-3 px-6">Cancel</Button>
        <Button type="submit" :disabled="isSubmitting || !isFormValid" @click="handleSubmit" class="text-base py-3 px-6">
          <Loader2 v-if="isSubmitting" class="mr-2 h-5 w-5 animate-spin" />
          {{ isSubmitting ? 'Creating...' : 'Create Group' }}
        </Button>
      </div>
    </div>

    <!-- Password Dialog -->
    <Dialog :open="showPasswordDialog" @update:open="showPasswordDialog = $event">
      <DialogContent class="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>Set Group Password</DialogTitle>
          <DialogDescription>
            Set a password that users will need to enter to join this group.
          </DialogDescription>
        </DialogHeader>

        <div class="grid gap-4 py-4">
          <div class="space-y-2">
            <Label for="new-password" class="text-sm font-medium">Password</Label>
            <div class="relative">
              <Input 
                id="new-password" 
                :type="showPasswordField ? 'text' : 'password'" 
                v-model="tempPassword" 
                required 
                class="pr-10"
              />
              <button 
                type="button"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                @click="showPasswordField = !showPasswordField"
              >
                <Eye v-if="!showPasswordField" class="h-5 w-5" />
                <EyeOff v-else class="h-5 w-5" />
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <Label for="confirm-password" class="text-sm font-medium">Confirm Password</Label>
            <div class="relative">
              <Input 
                id="confirm-password" 
                :type="showConfirmPasswordField ? 'text' : 'password'" 
                v-model="tempConfirmPassword" 
                required 
                class="pr-10"
              />
              <button 
                type="button"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                @click="showConfirmPasswordField = !showConfirmPasswordField"
              >
                <Eye v-if="!showConfirmPasswordField" class="h-5 w-5" />
                <EyeOff v-else class="h-5 w-5" />
              </button>
            </div>
            <p v-if="passwordMismatch" class="text-xs text-destructive">
              Passwords do not match
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showPasswordDialog = false">Cancel</Button>
          <Button type="submit" @click="savePassword" :disabled="!canSavePassword">Set Password</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash, Users, Camera, Loader2, KeyRound, Eye, EyeOff } from 'lucide-vue-next'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cloneDeep } from 'lodash'
import { useAlert } from '@/composables/useAlert'
import { useNuxtApp } from '#app'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

definePageMeta({
  layout: 'app-layout',
  middleware: ['auth']
})

const { $axiosInstance } = useNuxtApp()
const router = useRouter()
const { alert, confirm } = useAlert()

const fileInput = ref(null)
const isSubmitting = ref(false)

const initialForm = {
  name: '',
  description: '',
  isPrivate: true,
  picture: null, // Will store base64 string or null
  requires_password: false,
  password: '',
  confirmPassword: '',
  requires_documents: false,
  documents: [], // Array of objects like { name: 'ID Card' }
  requires_admin_approval: true
}

const form = ref(cloneDeep(initialForm))

const isFormValid = computed(() => {
  if (!form.value.name.trim()) return false;
  if (form.value.requires_password && !form.value.password) {
    return false;
  }
  if (form.value.requires_documents && form.value.documents.some(doc => !doc.name.trim())) {
    return false;
  }
  return true;
});

const triggerFileInput = () => {
  fileInput.value.click()
}

const handlePictureUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      alert('Image Too Large', 'Please select an image smaller than 2MB.', 'error');
      return;
    }
    // Store the file object itself for FormData
    form.value.pictureFile = file; 

    // Create a preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      form.value.picture = e.target.result; // For preview only
    };
    reader.readAsDataURL(file);
  }
}

const addDocument = () => {
  if (form.value.documents.length < 5) { // Limit number of document types
    form.value.documents.push({ name: '' })
  }
}

const removeDocument = (index) => {
  form.value.documents.splice(index, 1)
}

const handleSubmit = async () => {
  if (!isFormValid.value) {
    alert('Form is invalid', 'Please check the fields and try again.', 'error');
    return;
  }

  isSubmitting.value = true;

  // Debug log the form data before creating FormData
  console.log('Form data before submission:', {
    name: form.value.name,
    description: form.value.description,
    isPrivate: form.value.isPrivate,
    requires_password: form.value.requires_password,
    password: form.value.password,
    requires_documents: form.value.requires_documents,
    documents: form.value.documents,
    requires_admin_approval: form.value.requires_admin_approval,
    pictureFile: form.value.pictureFile
  });

  // Additional validation to ensure name is not empty
  if (!form.value.name || form.value.name.trim() === '') {
    alert('Group Name Required', 'Please enter a group name.', 'error');
    isSubmitting.value = false;
    return;
  }

  // Create a FormData object to handle file uploads
  const formData = new FormData();
  formData.append('name', form.value.name.trim());
  formData.append('description', form.value.description.trim());
  formData.append('is_private', form.value.isPrivate.toString());
  formData.append('requires_password', form.value.requires_password.toString());
  if (form.value.requires_password) {
    formData.append('password', form.value.password);
  }
  formData.append('requires_documents', form.value.requires_documents.toString());
  if (form.value.requires_documents && form.value.documents.length > 0) {
    // Filter out empty document names before sending
    const validDocuments = form.value.documents
      .map(doc => ({ name: doc.name.trim() }))
      .filter(doc => doc.name !== '');
    formData.append('documents', JSON.stringify(validDocuments));
  }
  formData.append('requires_admin_approval', form.value.requires_admin_approval.toString());

  // Append the picture file if it exists (original file object, not base64)
  if (form.value.pictureFile) { // Assuming pictureFile holds the File object
    formData.append('picture', form.value.pictureFile);
  }

  // Debug log the FormData content
  console.log('FormData entries:');
  for (let [key, value] of formData.entries()) {
    console.log(`${key}:`, value);
  }

  try {
    // Use $axiosInstance for the POST request
    const response = await $axiosInstance.post('/api/groups', formData);

    alert('Group Created', 'Your group has been successfully created.', 'success');
    
    // Emit events to refresh the sidebar groups list
    window.dispatchEvent(new CustomEvent('group-data-updated'));
    
    // Reset form after successful submission
    form.value = cloneDeep(initialForm);
    fileInput.value.value = ''; // Clear file input

    // Redirect to the new group page or another relevant page
    if (response.data && response.data.id) {
      router.push(`/group/${response.data.id}`);
    }

  } catch (error) {
    console.error('Failed to create group:', error.response ? error.response.data : error);
    const errorMessage = error.response?.data?.error || 'An unexpected error occurred.';
    alert('Creation Failed', errorMessage, 'error');
  } finally {
    isSubmitting.value = false;
  }
};

const handleCancel = async () => {
  const confirmed = await confirm(
    'Discard Changes?',
    'Are you sure you want to discard the changes and go back?',
    { actionText: 'Discard', cancelText: 'Keep Editing' }
  );
  if (confirmed) {
    router.back() // Or router.push('/dashboard') or another default page
  }
}

// Watchers to clear dependent fields when toggles are switched off
watch(() => form.value.requires_password, (newValue) => {
  if (!newValue) {
    form.value.password = ''
    form.value.confirmPassword = ''
    showPasswordDialog.value = false
    tempPassword.value = ''
    tempConfirmPassword.value = ''
  }
})

watch(() => form.value.requires_documents, (newValue) => {
  if (!newValue) {
    form.value.documents = []
  }
})

// Password dialog state
const showPasswordDialog = ref(false)
const showPasswordField = ref(false)
const showConfirmPasswordField = ref(false)
const tempPassword = ref('')
const tempConfirmPassword = ref('')

const passwordMismatch = computed(() => {
  return tempPassword.value && tempConfirmPassword.value &&
         tempPassword.value !== tempConfirmPassword.value
})

const canSavePassword = computed(() => {
  return tempPassword.value && 
         tempConfirmPassword.value && 
         tempPassword.value === tempConfirmPassword.value &&
         tempPassword.value.length >= 6
})

const savePassword = () => {
  if (canSavePassword.value) {
    form.value.password = tempPassword.value
    form.value.confirmPassword = tempConfirmPassword.value
    showPasswordDialog.value = false
    tempPassword.value = ''
    tempConfirmPassword.value = ''
  }
}

</script>

<style scoped>
/* Add any page-specific styles if needed */
</style> 