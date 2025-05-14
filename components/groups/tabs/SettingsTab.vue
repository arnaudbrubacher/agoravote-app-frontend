<template>
  <div class="space-y-8 p-4">
    <!-- Group Information Section (Adjusted) -->
    <div class="border rounded-lg p-4 space-y-4">
        <h3 class="text-lg font-medium border-b pb-2">Group Settings</h3>
        <!-- Group Picture Section -->
        <div class="space-y-2 pb-3">
            <Label class="text-sm font-medium">Group Picture</Label>
            <div class="flex items-center">
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
                    variant="outline"
                    size="sm"
                    @click="$refs.fileInput.click()"
                    class="flex items-center"
                >
                    <Camera class="h-4 w-4 mr-2" />
                    Change Group Picture
                </Button>
            </div>
        </div>

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
            <div class="flex items-center space-x-1 mb-1">
                <Label for="is-private-toggle" class="text-sm font-medium">Privacy</Label>
                <TooltipProvider :delay-duration="100">
                    <Tooltip>
                        <TooltipTrigger as-child>
                            <Info class="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p class="max-w-xs">
                                Toggle whether the group is public (discoverable via search) or private (not discoverable).
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
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

        <!-- Membership Approval Field -->
        <div class="space-y-2 pb-3">
            <div class="flex items-center space-x-1 mb-1">
                <Label for="requires-admin-approval-toggle" class="text-sm font-medium">Membership Approval</Label>
                <TooltipProvider :delay-duration="100">
                    <Tooltip>
                        <TooltipTrigger as-child>
                            <Info class="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p class="max-w-xs">
                                Toggle whether new members require admin approval to join or are approved automatically.
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
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
        </div>

        <!-- Password Requirement Field - Reverted -->
        <div class="space-y-2 pb-3">
            <div class="flex items-center space-x-1 mb-1">
                <Label for="requires-password-toggle" class="text-sm font-medium">Password</Label>
                <TooltipProvider :delay-duration="100">
                    <Tooltip>
                        <TooltipTrigger as-child>
                            <Info class="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p class="max-w-xs">
                                Toggle whether users must enter a password to join the group.
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <div class="flex items-center space-x-2">
                <Switch
                    id="requires-password-toggle"
                    v-model="formData.requires_password"
                    @update:modelValue="togglePasswordRequirementUpdate"
                    :disabled="!isCurrentUserAdmin"
                />
                <Label for="requires-password-toggle" class="text-sm text-muted-foreground">
                    {{ formData.requires_password ? 'Password Required' : 'No Password Required' }}
                </Label>
            </div>
            <div class="space-y-2 mt-2">
                <div class="h-10 flex items-center">
                    <Button
                        v-if="isCurrentUserAdmin"
                        type="button"
                        variant="outline"
                        size="sm"
                        @click="showPasswordChange = true"
                        :disabled="!formData.requires_password"
                        class="flex items-center"
                        :class="{ 'opacity-50': !formData.requires_password }"
                    >
                        <KeyRound class="h-4 w-4 mr-2"/>
                        Change Password
                    </Button>
                    <p v-else-if="!isCurrentUserAdmin && props.group.requires_password" class="text-sm text-muted-foreground ml-2">
                        Password is required to join.
                    </p>
                    <p v-else-if="!isCurrentUserAdmin && !props.group.requires_password" class="text-sm text-muted-foreground ml-2">
                        No password required.
                    </p>
                </div>
            </div>
        </div>

        <!-- Required Documents Field - Reverted -->
        <div class="space-y-2 pb-3">
            <div class="flex items-center space-x-1 mb-1">
                <Label for="requires-documents-toggle" class="text-sm font-medium">Documents</Label>
                <TooltipProvider :delay-duration="100">
                    <Tooltip>
                        <TooltipTrigger as-child>
                            <Info class="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p class="max-w-xs">
                                Toggle whether users must upload specified documents for admin review before joining.
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <div class="flex items-center space-x-2">
                <Switch
                    id="requires-documents-toggle"
                    v-model="formData.requires_documents"
                    @update:modelValue="toggleDocumentRequirementUpdate"
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
                    :class="{ 'opacity-50': !isCurrentUserAdmin || !formData.requires_documents }"
                >
                    <LucideIcon name="Plus" class="h-4 w-4 mr-1" />
                    Add Required Document
                </Button>

                <div class="space-y-2">
                    <div v-if="formData.documents.length === 0 && !isCurrentUserAdmin && props.group.requires_documents" class="text-sm text-muted-foreground mt-2">
                        Documents required, but types not specified by admin yet.
                    </div>
                    <div v-else-if="formData.documents.length === 0 && !isCurrentUserAdmin && !props.group.requires_documents" class="text-sm text-muted-foreground mt-2">
                        No documents required.
                    </div>
                    <div v-for="(doc, index) in formData.documents" :key="index" class="flex items-center space-x-2">
                        <Input
                            v-model="doc.name"
                            placeholder="Document name (e.g. ID Card, Student Card)"
                            :disabled="!isCurrentUserAdmin || !formData.requires_documents"
                            :class="{ 'opacity-50': !isCurrentUserAdmin || !formData.requires_documents }"
                        />
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            @click="removeDocument(index)"
                            title="Remove this document requirement"
                            :disabled="!isCurrentUserAdmin || !formData.requires_documents"
                            :class="{ 'opacity-50': !isCurrentUserAdmin || !formData.requires_documents }"
                        >
                            <LucideIcon name="Trash" class="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Billing Section (Integrated) -->
    <div class="border rounded-lg p-4 space-y-4">
      <h3 class="text-lg font-medium border-b pb-2">Billing</h3>
      
      <!-- Subscription Status -->
      <div v-if="props.group.stripe_subscription_id" class="mb-4">
        <div class="flex items-center mb-2">
          <span class="font-medium mr-2">Status:</span>
          <Badge v-if="props.group.subscription_status === 'active'" class="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Active
          </Badge>
          <Badge v-else-if="props.group.subscription_status === 'incomplete'" class="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Processing
          </Badge>
          <Badge v-else-if="props.group.subscription_status === 'past_due' || props.group.subscription_status === 'unpaid'" class="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            Payment Issue
          </Badge>
          <Badge v-else class="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            {{ props.group.subscription_status || 'Unknown' }}
          </Badge>
        </div>
        
        <div v-if="formattedRenewalDate" class="mb-2">
          <span class="font-medium">Current Period Ends:</span> {{ formattedRenewalDate }}
        </div>
        
        <div v-if="props.group.subscription_status === 'active'" class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Your subscription is active. You have full access to all premium features.
        </div>
        <div v-else-if="props.group.subscription_status === 'incomplete'" class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Your payment is being processed. The subscription will become active shortly.
          <div class="flex gap-2 mt-2">
            <Button variant="outline" size="sm" @click="refreshPage">
              Refresh Status
            </Button>
            <Button variant="destructive" size="sm" @click="deleteIncompleteSubscription" :disabled="isDeletingSubscription">
              <span v-if="isDeletingSubscription">Deleting...</span>
              <span v-else>Delete Incomplete Subscription</span>
            </Button>
          </div>
        </div>
        <div v-else-if="props.group.subscription_status === 'past_due' || props.group.subscription_status === 'unpaid'" class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          There was an issue with your latest payment. Please update your payment details.
        </div>
        
        <p v-if="!props.group.stripe_subscription_id" class="text-sm text-orange-600 mt-2">
          Note: Subscription active, but some details might still be updating.
        </p>
      </div>
      
      <!-- Purchase Options -->
      <div v-if="!hasActiveMonthlySubscription && props.group && props.group.id">
        <h4 class="text-md font-medium mb-2">Choose Your Plan</h4>
        <PurchaseOptions :group-id="props.group.id" />
      </div>
      
      <div v-if="!props.group || !props.group.id" class="text-sm text-muted-foreground">
        Group information not available for billing.
      </div>
    </div>

    <!-- Action Buttons Section -->
    <div class="pt-6 border-t flex justify-between w-full">
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
            <Button
                v-if="isCurrentUserAdmin"
                variant="outline"
                @click="handleCancel"
            >
                Reset Changes
            </Button>
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

    <!-- Password Change Dialog -->
    <Dialog :open="showPasswordChange" @update:open="showPasswordChange = $event">
        <DialogContent class="w-full max-w-lg">
            <DialogHeader>
                <DialogTitle> {{ props.group.requires_password ? 'Change' : 'Set' }} Group Password</DialogTitle>
                <DialogDescription>
                    {{ props.group.requires_password ? 'Enter the current and a new password for the group.' : 'Set a password for the group.' }}
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
                <Button type="submit" @click="changePassword"> {{ props.group.requires_password ? 'Change' : 'Set' }} Password</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import LucideIcon from '@/components/LucideIcon.vue'
import { ref, onMounted, computed, onBeforeUnmount, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Users, Camera, Info, KeyRound } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import axios from '~/src/utils/axios'
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
import { cloneDeep } from 'lodash'
import PurchaseOptions from '@/components/billing/PurchaseOptions.vue'
import { Badge } from '~/components/ui/badge'

const props = defineProps({
    group: {
        type: Object,
        required: true
    },
    isCurrentUserAdmin: {
        type: Boolean,
        default: false
    },
    fetchGroup: {
        type: Function,
        required: false
    }
})

const emit = defineEmits(['group-updated', 'group-deleted'])

const fileInput = ref(null)
const selectedFile = ref(null)
const apiBaseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8080'

// Password change dialog state
const showPasswordChange = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordHasBeenSet = ref(false)

const passwordMismatch = computed(() => {
    return newPassword.value && confirmPassword.value &&
           newPassword.value !== confirmPassword.value
})

const formData = ref({
    name: '',
    description: '',
    isPrivate: true,
    requires_password: false,
    requires_documents: false,
    documents: [],
    requires_admin_approval: true
})

const originalFormData = ref({})

const isFullUrl = (url) => {
    return url && (url.startsWith('http://') || url.startsWith('https://'))
}

const initializeFormData = () => {
    if (!props.group || !props.group.id) {
        console.warn('SettingsTab: Attempted to initialize form data without a valid group prop.');
        formData.value = {
            name: '',
            description: '',
            isPrivate: true,
            requires_password: false,
            requires_documents: false,
            documents: [],
            requires_admin_approval: true
        };
        originalFormData.value = {};
        selectedFile.value = null;
        passwordHasBeenSet.value = false;
        return;
    }

    console.log('SettingsTab: Initializing form data from group prop:', props.group);

    const parsedDocs = parseRequiredDocuments(props.group.required_documents);
    const requiresDocumentsInitial = props.group.requires_documents !== undefined 
                                    ? Boolean(props.group.requires_documents)
                                    : parsedDocs.length > 0;

    formData.value = {
        name: props.group.name || '',
        description: props.group.description || '',
        isPrivate: (props.group.isPrivate !== undefined ? props.group.isPrivate : props.group.is_private),
        requires_password: props.group.requires_password || false,
        requires_documents: requiresDocumentsInitial,
        documents: parsedDocs,
        requires_admin_approval: props.group.requires_admin_approval !== undefined
            ? props.group.requires_admin_approval
            : true
    }

    originalFormData.value = cloneDeep(formData.value)
    selectedFile.value = null
    passwordHasBeenSet.value = false

    console.log('Form data initialized:', formData.value);
}

onMounted(() => {
    initializeFormData();
});

watch(() => props.group, (newGroup, oldGroup) => {
    if (newGroup && oldGroup && JSON.stringify(newGroup) !== JSON.stringify(oldGroup)) {
        console.log("SettingsTab: Group prop changed, re-initializing form data.");
        initializeFormData();
    }
}, { deep: true });

const parseRequiredDocuments = (requiredDocs) => {
    console.log('Parsing required documents, raw value:', requiredDocs);
    console.log('Type of requiredDocs:', typeof requiredDocs);

    if (!requiredDocs) {
        console.log('No required documents found');
        return [];
    }

    try {
        if (Array.isArray(requiredDocs)) {
            console.log('requiredDocs is an array with length:', requiredDocs.length);
            const result = requiredDocs.map(doc => {
                console.log('Processing array item:', doc, 'type:', typeof doc);
                if (typeof doc === 'string') {
                    console.log('Item is a string, creating object with name:', doc);
                    return { name: doc };
                }
                const name = doc.name || doc.toString();
                console.log('Item is not a string, using name property or toString():', name);
                return { name };
            });
            console.log('Processed array result:', result);
            return result;
        }

        if (typeof requiredDocs === 'string') {
            console.log('requiredDocs is a string, attempting to parse');

            if (requiredDocs.trim() === '' || requiredDocs.trim() === '[]') {
                console.log('requiredDocs is an empty string or empty JSON array');
                return [];
            }

            if (!requiredDocs.startsWith('[') && !requiredDocs.startsWith('{')) {
                console.log('requiredDocs appears to be a plain string, not JSON');
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
                console.log('Treating the string as a single document name:', requiredDocs);
                return [{ name: requiredDocs }];
            }
        }

        if (typeof requiredDocs === 'object' && requiredDocs !== null) {
            console.log('requiredDocs is an object:', requiredDocs);
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

const savePrivacy = () => {
    console.log('Privacy setting updated locally:', formData.value.isPrivate)
}

const toggleAdminApprovalRequirement = () => {
    console.log('Admin approval requirement toggled locally:', formData.value.requires_admin_approval)
}

const togglePasswordRequirementUpdate = (newValue) => {
    formData.value.requires_password = newValue;
    console.log('Password requirement toggled locally:', newValue);
    if (newValue && !props.group.requires_password) {
        showPasswordChange.value = true;
    }
}

const toggleDocumentRequirementUpdate = (newValue) => {
    formData.value.requires_documents = newValue;
    console.log('Document requirement toggled locally:', newValue);
}

const handleSubmit = async () => {
    try {
        if (!props.isCurrentUserAdmin) return;

        if (formData.value.requires_documents && formData.value.documents.length > 0) {
            const emptyDocs = formData.value.documents.filter(doc => !doc.name.trim())
            if (emptyDocs.length > 0) {
                alert('Please provide names for all required documents')
                return
            }
        }

        if (formData.value.requires_documents && formData.value.documents.length === 0) {
            alert('If documents are required, you must specify at least one required document type.');
            return;
        }

        if (formData.value.requires_password && !props.group.requires_password && !passwordHasBeenSet.value) {
            alert('Please set a password for the group before saving changes.');
            showPasswordChange.value = true;
            return;
        }

        let picturePath = null
        if (selectedFile.value) {
            picturePath = await uploadGroupPicture()
        }

        const requiredDocumentsList = formData.value.requires_documents ? formData.value.documents.map(doc => doc.name.trim()) : [];

        const dataToSubmit = {
            name: formData.value.name,
            description: formData.value.description,
            is_private: formData.value.isPrivate,
            requires_password: formData.value.requires_password,
            requires_documents: formData.value.requires_documents,
            required_documents: JSON.stringify(requiredDocumentsList),
            requires_admin_approval: formData.value.requires_admin_approval
        }

        if (picturePath) {
            dataToSubmit.picture = picturePath
        }

        console.log('Submitting group update via emit:', dataToSubmit)
        emit('group-updated', dataToSubmit)

        originalFormData.value = cloneDeep(formData.value)
        selectedFile.value = null

    } catch (error) {
        console.error('Error preparing group settings submission:', error)
        alert('Failed to save group settings: ' + (error.response?.data?.error || 'Unknown error'))
    }
}

const handleDelete = () => {
    if (!props.isCurrentUserAdmin) return;
    emit('group-deleted')
}

const addDocument = () => {
    formData.value.documents.push({ name: '' })
}

const removeDocument = (index) => {
    formData.value.documents.splice(index, 1)
}

const resetForm = () => {
    initializeFormData();
    console.log('Form reset to original values')
}

const handleCancel = resetForm;

const formModified = computed(() => {
    return selectedFile.value !== null || JSON.stringify(formData.value) !== JSON.stringify(originalFormData.value);
})

const changePassword = async () => {
    if (!props.isCurrentUserAdmin) return;

    if (passwordMismatch.value) {
        alert('Passwords do not match')
        return
    }

    const isChangingExistingPassword = props.group.requires_password;

    if (isChangingExistingPassword && !currentPassword.value) {
        alert('Please enter the current group password')
        return
    }

    if (!newPassword.value) {
        alert('Please enter a new password')
        return
    }

    if (newPassword.value.length < 6) {
        alert('Password must be at least 6 characters long')
        return
    }

    try {
        if (!isChangingExistingPassword) {
            await emergencyChangeGroupPassword(props.group.id, newPassword.value);
        } else {
            await changeGroupPassword(props.group.id, currentPassword.value, newPassword.value)
        }

        currentPassword.value = ''
        newPassword.value = ''
        confirmPassword.value = ''
        showPasswordChange.value = false

        alert('Group password ' + (isChangingExistingPassword ? 'changed' : 'set') + ' successfully')

        passwordHasBeenSet.value = true

        if (props.fetchGroup) {
            props.fetchGroup();
        } else {
           console.warn("SettingsTab: fetchGroup function not provided, cannot refresh group data after password change.")
        }

    } catch (error) {
        console.error('Failed to change/set group password:', error)
        const status = error.response?.status
        const errorMessage = error.response?.data?.error || 'Unknown error'

        if (status === 401) {
            alert('Current password is incorrect')
        } else {
            alert(`Failed to ${isChangingExistingPassword ? 'change' : 'set'} password: ${errorMessage}`)
        }
    }
}

// --- BEGIN NEW COMPUTED PROPERTIES FOR BILLING ---
const testMonthlyPriceId = 'price_1RLQb4H0qQW9H6xGYOaHK6Cu'; // Updated to the actual price ID from logs

const hasActiveMonthlySubscription = computed(() => {
  console.log('[SettingsTab] Checking for active subscription. Group data:', JSON.parse(JSON.stringify(props.group)));
  console.log('[SettingsTab] props.group.subscription_status:', props.group?.subscription_status);
  console.log('[SettingsTab] props.group.subscription_price_id:', props.group?.subscription_price_id);
  console.log('[SettingsTab] testMonthlyPriceId:', testMonthlyPriceId);
  console.log('[SettingsTab] props.group.stripe_subscription_id:', props.group?.stripe_subscription_id);
  
  const isActive = props.group &&
         props.group.subscription_status === 'active' &&
         props.group.subscription_price_id === testMonthlyPriceId &&
         props.group.stripe_subscription_id;
  console.log('[SettingsTab] hasActiveMonthlySubscription result:', isActive);
  return isActive;
});

const formattedRenewalDate = computed(() => {
  if (props.group && props.group.subscription_current_period_end) {
    try {
      // Stripe's period end is often a Unix timestamp (seconds). Convert to milliseconds for JS Date.
      // If it's already an ISO string from your backend, new Date() will parse it.
      let dateValue = props.group.subscription_current_period_end;
      if (typeof dateValue === 'string' && /^[0-9]+$/.test(dateValue)) { // If it's a string of numbers (timestamp)
        dateValue = parseInt(dateValue, 10);
      }
      if (typeof dateValue === 'number' && dateValue > 1000000000 && dateValue < 99999999999) { // Heuristic for Unix timestamp in seconds
         dateValue = dateValue * 1000;
      }
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) { // Check for invalid date
          console.warn("Invalid date for subscription_current_period_end:", props.group.subscription_current_period_end);
          // Attempt to parse as ISO string if it failed as timestamp
          const isoDate = new Date(props.group.subscription_current_period_end);
          if(!isNaN(isoDate.getTime())) return isoDate.toLocaleDateString();
          return 'Invalid Date';
      }
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      console.error("Error formatting renewal date:", props.group.subscription_current_period_end, e);
      return props.group.subscription_current_period_end; // Fallback to raw value
    }
  }
  return null;
});

// --- END NEW COMPUTED PROPERTIES FOR BILLING ---

// Helper function to refresh the page to update subscription status
function refreshPage() {
  window.location.reload();
}

// Add state for delete subscription button
const isDeletingSubscription = ref(false);

// Add the delete subscription function
async function deleteIncompleteSubscription() {
  if (isDeletingSubscription.value) return;
  
  isDeletingSubscription.value = true;
  
  try {
    // Send a PUT request to update the group with null subscription fields
    const response = await axios.put(`/api/groups/${props.group.id}`, {
      stripe_customer_id: null,
      stripe_subscription_id: null,
      subscription_status: null, 
      subscription_price_id: null,
      subscription_current_period_end: null
    });
    
    console.log("Subscription deleted successfully:", response.data);
    alert('The incomplete subscription has been deleted successfully.');
    
    // Refresh the page to update the UI
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
  } catch (err) {
    console.error("Error deleting subscription:", err);
    alert(`Failed to delete subscription: ${err.response?.data?.error || err.message}`);
  } finally {
    isDeletingSubscription.value = false;
  }
}

// Add auto-refresh timer logic for incomplete subscriptions
const refreshInterval = ref(null);
const refreshing = ref(false);

const setupAutoRefresh = () => {
  // Clear any existing interval
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
    refreshInterval.value = null;
  }
  
  // If subscription status is incomplete, set up periodic refresh
  if (props.group?.subscription_status === 'incomplete') {
    console.log('Setting up auto-refresh for incomplete subscription status');
    refreshInterval.value = setInterval(async () => {
      if (refreshing.value) return; // Prevent multiple simultaneous refreshes
      
      refreshing.value = true;
      console.log('Auto-refreshing group data to check subscription status');
      
      try {
        if (props.fetchGroup) {
          await props.fetchGroup();
          console.log('Group data refreshed, new subscription status:', props.group?.subscription_status);
          
          // If status is no longer incomplete, clear the interval
          if (props.group?.subscription_status !== 'incomplete') {
            console.log('Subscription status changed, stopping auto-refresh');
            clearInterval(refreshInterval.value);
            refreshInterval.value = null;
          }
        }
      } catch (err) {
        console.error('Error refreshing group data:', err);
      } finally {
        refreshing.value = false;
      }
    }, 10000); // Check every 10 seconds
  }
};

// Watch for changes in subscription status
watch(() => props.group?.subscription_status, (newStatus, oldStatus) => {
  console.log(`Subscription status changed from ${oldStatus} to ${newStatus}`);
  setupAutoRefresh();
}, { immediate: true });

// Set up auto-refresh on mount if needed
onMounted(() => {
  setupAutoRefresh();
});

// Clean up on unmount
onBeforeUnmount(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
    refreshInterval.value = null;
  }
});
</script>

<style scoped>
/* Add any specific styles if needed */
.capitalize {
  text-transform: capitalize;
}
</style> 