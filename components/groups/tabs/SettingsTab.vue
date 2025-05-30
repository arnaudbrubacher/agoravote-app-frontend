<template>
  <div class="p-6 space-y-8">
    <!-- Non-admin notice -->
    <div v-if="!isCurrentUserAdmin" class="bg-muted p-4 rounded-lg mb-4 border border-border">
      <div class="flex items-center">
        <Info class="h-5 w-5 text-muted-foreground mr-2" />
        <p class="text-sm text-muted-foreground">You are viewing group settings in read-only mode. Only group administrators can modify these settings.</p>
      </div>
    </div>
    
    <!-- Single card containing all tabs -->
    <div class="rounded-lg p-4 space-y-4">
      <Tabs :value="settingsSubtab" @update:value="settingsSubtab = $event" class="w-full">
        <!-- Tabs List with Delete Group Button -->
        <div class="flex items-center mb-4">
          <TabsList class="border border-border rounded-md p-1 flex">
            <TabsTrigger 
              value="group-settings" 
              class="border border-transparent data-[state=inactive]:border-border data-[state=inactive]:border mx-0.5"
            >
              Informations
            </TabsTrigger>
            <TabsTrigger 
              value="permissions" 
              class="border border-transparent data-[state=inactive]:border-border data-[state=inactive]:border mx-0.5"
            >
              Permissions
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              class="border border-transparent data-[state=inactive]:border-border data-[state=inactive]:border mx-0.5"
            >
              Security
            </TabsTrigger>
            <TabsTrigger 
              value="billing" 
              class="border border-transparent data-[state=inactive]:border-border data-[state=inactive]:border mx-0.5"
            >
              Billing
            </TabsTrigger>
          </TabsList>
          
          <Button
            variant="destructive"
            size="sm"
            @click="handleDelete"
            :disabled="!isCurrentUserAdmin"
            v-if="isCurrentUserAdmin"
            class="ml-4"
          >
            <LucideIcon name="Trash" class="mr-2 h-4 w-4" />
            Delete Group
          </Button>
        </div>
        
        <!-- Group Settings Tab -->
        <TabsContent value="group-settings" class="space-y-4">
          <!-- Group Picture Section -->
          <div class="space-y-1 pb-2">
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
          <div class="space-y-2">
            <Label for="name" class="text-sm font-medium">Name</Label>
            <div class="flex items-center space-x-2">
              <Input
                id="name"
                v-model="formData.name"
                class="flex-grow"
                placeholder="Enter group name"
                required
                :disabled="!isCurrentUserAdmin"
              />
              <Button 
                v-if="isCurrentUserAdmin"
                variant="ghost" 
                size="icon" 
                @click="saveField('name')" 
                :disabled="formData.name === originalFormData.name"
                class="flex-shrink-0 border disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Save name"
              >
                <Save class="h-5 w-5" />
              </Button>
            </div>
          </div>

          <!-- Group Description Field -->
          <div class="space-y-2">
            <Label for="description" class="text-sm font-medium">Description</Label>
            <div class="flex items-center space-x-2">
              <Textarea
                id="description"
                v-model="formData.description"
                class="flex-grow"
                placeholder="Enter group description"
                :disabled="!isCurrentUserAdmin"
              />
              <Button 
                v-if="isCurrentUserAdmin"
                variant="ghost" 
                size="icon" 
                @click="saveField('description')" 
                :disabled="formData.description === originalFormData.description"
                class="flex-shrink-0 border disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Save description"
              >
                <Save class="h-5 w-5" />
              </Button>
            </div>
          </div>
        </TabsContent>

        <!-- Permissions Tab -->
        <TabsContent value="permissions" class="space-y-8">
          <!-- Non-admin notice specifically for permissions -->
          <div v-if="!isCurrentUserAdmin" class="bg-muted p-4 rounded-lg mb-4 border border-border">
            <div class="flex items-center">
              <Info class="h-5 w-5 text-muted-foreground mr-2" />
              <p class="text-sm text-muted-foreground">Only group administrators can modify permission settings.</p>
            </div>
          </div>
          
          <!-- Permissions Content -->
          <div class="space-y-6 pt-4">
            
              <!-- Voting Permissions -->
              <div class="mb-3">
                <div>
                  <div class="flex items-center space-x-2">
                    <Switch
                      id="non-admin-create-votes"
                      :disabled="!isCurrentUserAdmin"
                      v-model="permissionsData.allowNonAdminCreateVotes"
                      @update:modelValue="savePermissionSetting('allowNonAdminCreateVotes')"
                    />
                    <Label for="non-admin-create-votes" class="text-sm">
                      Allow non-admin members to create votes
                    </Label>
                  </div>
                </div>
              </div>
              
              <!-- Content Permissions -->
              <div>
                <div>
                  <div class="flex items-center space-x-2">
                    <Switch
                      id="non-admin-create-posts"
                      :disabled="!isCurrentUserAdmin"
                      v-model="permissionsData.allowNonAdminCreatePosts"
                      @update:modelValue="savePermissionSetting('allowNonAdminCreatePosts')"
                    />
                    <Label for="non-admin-create-posts" class="text-sm">
                      Allow non-admin members to create posts
                    </Label>
                  </div>
                </div>
              </div>
          </div>
        </TabsContent>
        
        <!-- Security Tab -->
        <TabsContent value="security" class="space-y-8">
          <!-- Non-admin notice for security tab -->
          <div v-if="!isCurrentUserAdmin" class="bg-muted p-4 rounded-lg mb-4 border border-border">
            <div class="flex items-center">
              <Info class="h-5 w-5 text-muted-foreground mr-2" />
              <p class="text-sm text-muted-foreground">Only group administrators can modify security settings.</p>
            </div>
          </div>
          
          <!-- Security Settings Content -->
          <div class="space-y-6">
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
                  :disabled="!isCurrentUserAdmin"
                />
                <Label for="requires-admin-approval-toggle" class="text-sm text-muted-foreground">
                  {{ formData.requires_admin_approval ? 'Admin approval required' : 'Automatic approval' }}
                </Label>
              </div>
            </div>

            <!-- Password Requirement Field -->
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
                <div class="h-10 flex items-center space-x-2">
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
                  <Button
                    v-if="isCurrentUserAdmin && formData.requires_password"
                    type="button"
                    variant="outline"
                    size="sm"
                    @click="fetchCurrentPassword"
                    :disabled="showPasswordLoading"
                    class="flex items-center"
                  >
                    <LucideIcon 
                      :name="showPasswordLoading ? 'Loader2' : 'Eye'" 
                      class="h-4 w-4 mr-2"
                      :class="{ 'animate-spin': showPasswordLoading }"
                    />
                    {{ showPasswordLoading ? 'Loading...' : 'View Password' }}
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

            <!-- Required Documents Field -->
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
          
          <!-- Save/Cancel Buttons for Security Settings -->
          <div v-if="isCurrentUserAdmin" class="flex justify-end space-x-2 pt-6 border-t">
            <Button
              variant="outline"
              @click="handleSecurityCancel"
              :disabled="!securityModified"
              class="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel Changes
            </Button>
            <Button
              @click="handleSecuritySave"
              :disabled="!securityModified"
              class="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save class="h-4 w-4 mr-2" />
              Save Security Settings
            </Button>
          </div>
        </TabsContent>

        <!-- Billing Tab -->
        <TabsContent value="billing" class="space-y-8">
          <!-- Non-admin notice specifically for billing -->
          <div v-if="!isCurrentUserAdmin" class="bg-muted p-4 rounded-lg mb-4 border border-border">
            <div class="flex items-center">
              <Info class="h-5 w-5 text-muted-foreground mr-2" />
              <p class="text-sm text-muted-foreground">Only group administrators can modify subscription settings.</p>
            </div>
          </div>
          
          <!-- Subscription Management Section -->
          <div class="mb-6">
            <h4 class="text-md font-medium mb-4">Subscription Management</h4>
            
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
                <Badge v-else-if="props.group.subscription_status === 'canceled'" class="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                  Canceled
                </Badge>
                <Badge v-else class="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                  {{ props.group.subscription_status || 'Unknown' }}
                </Badge>
              </div>
              
              <div v-if="formattedRenewalDate && props.group.subscription_status !== 'canceled'" class="mb-2">
                <span class="font-medium">Current Period Ends:</span> {{ formattedRenewalDate }}
              </div>
              
              <div v-if="props.group.subscription_status === 'active'" class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Your subscription is active. You have full access to all premium features.
                
                <!-- Manage Billing Button for managing subscription in Stripe Customer Portal -->
                <div class="mt-3 flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    @click="redirectToCustomerPortal"
                    :disabled="isRedirectingToPortal || !isCurrentUserAdmin"
                  >
                    <span v-if="isRedirectingToPortal">Opening Portal...</span>
                    <span v-else>Manage Billing</span>
                  </Button>
                  <!-- Cancel Subscription Button for Active Subscriptions -->
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    @click="confirmCancelSubscription" 
                    :disabled="isCancellingSubscription || !isCurrentUserAdmin"
                  >
                    <span v-if="isCancellingSubscription">Cancelling...</span>
                    <span v-else>Cancel Subscription</span>
                  </Button>
                </div>
              </div>
              <div v-else-if="props.group.subscription_status === 'incomplete'" class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Your payment is being processed. The subscription will become active shortly.
                <div class="flex gap-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    @click="refreshPage"
                    :disabled="!isCurrentUserAdmin"
                  >
                    Refresh Status
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    @click="deleteIncompleteSubscription" 
                    :disabled="isDeletingSubscription || !isCurrentUserAdmin"
                  >
                    <span v-if="isDeletingSubscription">Deleting...</span>
                    <span v-else>Delete Incomplete Subscription</span>
                  </Button>
                </div>
              </div>
              <div v-else-if="props.group.subscription_status === 'past_due' || props.group.subscription_status === 'unpaid'" class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                There was an issue with your latest payment. Please update your payment details.
              </div>
              <div v-else-if="props.group.subscription_status === 'canceled'" class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Your subscription has been canceled. You can subscribe again at any time.
              </div>
              
              <p v-if="!props.group.stripe_subscription_id" class="text-sm text-orange-600 mt-2">
                Note: Subscription active, but some details might still be updating.
              </p>
            </div>
            
            <!-- Purchase Options -->
            <div v-if="!hasActiveMonthlySubscription && props.group && props.group.id">
              <h4 class="text-md font-medium mb-2">Choose Your Plan</h4>
              <PurchaseOptions :group-id="props.group.id" :is-current-user-admin="isCurrentUserAdmin" />
            </div>
            
            <div v-if="!props.group || !props.group.id" class="text-sm text-muted-foreground">
              Group information not available for billing.
            </div>
          </div>
          
          <!-- Billing History Section -->
          <div class="pt-6 border-t">
            <h4 class="text-md font-medium mb-4">Billing History</h4>
            <BillingHistory :group-id="props.group.id" />
          </div>
        </TabsContent>
      </Tabs>
    </div>

    <!-- Password Change Dialog -->
    <Dialog :open="showPasswordChange" @update:open="showPasswordChange = $event">
      <DialogContent class="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>{{ props.group.requires_password ? 'Change' : 'Set' }} Group Password</DialogTitle>
          <DialogDescription>
            {{ props.group.requires_password ? 'Enter a new password for the group.' : 'Set a password for the group.' }}
          </DialogDescription>
        </DialogHeader>

        <div class="grid gap-4 py-4">
          <div class="space-y-2">
            <Label for="new-password" class="text-sm font-medium">{{ props.group.requires_password ? 'New Password' : 'Password' }}</Label>
            <div class="relative">
              <Input 
                id="new-password" 
                :type="showPassword ? 'text' : 'password'" 
                v-model="newPassword" 
                required 
                class="pr-10"
              />
              <button 
                type="button"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                @click="showPassword = !showPassword"
              >
                <LucideIcon :name="showPassword ? 'EyeOff' : 'Eye'" class="h-5 w-5" />
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <Label for="confirm-password" class="text-sm font-medium">Confirm Password</Label>
            <div class="relative">
              <Input 
                id="confirm-password" 
                :type="showConfirmPassword ? 'text' : 'password'" 
                v-model="confirmPassword" 
                required 
                class="pr-10"
              />
              <button 
                type="button"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <LucideIcon :name="showConfirmPassword ? 'EyeOff' : 'Eye'" class="h-5 w-5" />
              </button>
            </div>
            <p v-if="passwordMismatch" class="text-xs text-destructive">
              Passwords do not match
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showPasswordChange = false">Cancel</Button>
          <Button type="submit" @click="changePassword">{{ props.group.requires_password ? 'Change' : 'Set' }} Password</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Current Password View Dialog -->
    <Dialog :open="showCurrentPassword" @update:open="showCurrentPassword = $event">
      <DialogContent class="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Group Password</DialogTitle>
          <DialogDescription>
            This is the current password required to join the group.
          </DialogDescription>
        </DialogHeader>

        <div class="py-4">
          <div v-if="showPasswordLoading" class="flex justify-center">
            <LucideIcon name="Loader2" class="h-6 w-6 animate-spin" />
          </div>
          <div v-else class="space-y-2">
            <Label class="text-sm font-medium">Current Password</Label>
            <div class="relative">
              <Input 
                readonly
                :value="currentGroupPassword"
                :type="showCurrentPasswordAsPlaintext ? 'text' : 'password'"
                class="pr-10 bg-muted"
              />
              <button 
                type="button"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                @click="showCurrentPasswordAsPlaintext = !showCurrentPasswordAsPlaintext"
              >
                <LucideIcon :name="showCurrentPasswordAsPlaintext ? 'EyeOff' : 'Eye'" class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button @click="showCurrentPassword = false">Close</Button>
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
import { Users, Camera, Info, KeyRound, Save, Eye } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useNuxtApp } from '#app'
import { changeGroupPassword as authUtilChangeGroupPassword, emergencyChangeGroupPassword as authUtilEmergencyChangeGroupPassword } from '@/src/utils/auth'
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
import BillingHistory from '@/components/billing/BillingHistory.vue'
import { Badge } from '~/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from '@/components/ui/toast/use-toast'

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

const { toast } = useToast()
const { $axiosInstance } = useNuxtApp()

const fileInput = ref(null)
const previewImage = ref(null)
const selectedFile = ref(null)
const config = useRuntimeConfig()
const apiBaseUrl = config.public.apiBaseUrl || 'http://localhost:8088'

// Password change dialog state
const showPasswordChange = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')

// Current password view state
const showCurrentPassword = ref(false)
const currentGroupPassword = ref('')
const showPasswordLoading = ref(false)
const showCurrentPasswordAsPlaintext = ref(false)

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

// Permissions data
const permissionsData = ref({
  allowNonAdminCreateVotes: false,
  allowNonAdminCreatePosts: true
})

const originalPermissionsData = ref({})

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
    
    // Initialize permissions data with default values
    permissionsData.value = {
      allowNonAdminCreateVotes: false,
      allowNonAdminCreatePosts: true
    };
    
    originalFormData.value = {};
    originalPermissionsData.value = {};
    selectedFile.value = null;
    showPassword.value = false;
    showConfirmPassword.value = false;
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
  
  // Initialize permissions data from group permissions or defaults
  permissionsData.value = {
    allowNonAdminCreateVotes: props.group.permissions?.allowNonAdminCreateVotes ?? false,
    allowNonAdminCreatePosts: props.group.permissions?.allowNonAdminCreatePosts ?? true
  }

  originalFormData.value = cloneDeep(formData.value)
  originalPermissionsData.value = cloneDeep(permissionsData.value)
  selectedFile.value = null
  showPassword.value = false
  showConfirmPassword.value = false

  console.log('Form data initialized:', formData.value);
  console.log('Permissions data initialized:', permissionsData.value);
}

onMounted(() => {
  console.log('SettingsTab - isCurrentUserAdmin:', props.isCurrentUserAdmin)
  
  // Check URL for settings_subtab parameter 
  if (route.query.settings_subtab) {
    console.log('Settings subtab specified in URL:', route.query.settings_subtab)
    
    if (route.query.settings_subtab === 'billing') {
      settingsSubtab.value = 'billing'
      console.log('Setting active subtab to billing')
    } else if (['group-settings', 'permissions', 'security'].includes(route.query.settings_subtab)) {
      settingsSubtab.value = route.query.settings_subtab
    }
  }
  
  // Check for refresh_subscription parameter
  if (route.query.refresh_subscription === 'true') {
    console.log('Subscription refresh requested, fetching latest group data')
    fetchGroup()
  }
  
  initializeFormData();
  setupAutoRefresh();
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

    const response = await $axiosInstance.post(`/api/groups/${props.group.id}/picture`, formData, {
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

const savePrivacy = async () => {
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

// Method to save individual field
const saveField = async (fieldName) => {
  if (!props.isCurrentUserAdmin || !props.group || !props.group.id) return;
  
  try {
    console.log(`Saving ${fieldName} field: ${formData.value[fieldName]}`);
    
    // Create a minimal update payload with just the changed field
    const updateData = {
      [fieldName]: formData.value[fieldName]
    };
    
    // API call to update just this field
    const response = await $axiosInstance.put(`/api/groups/${props.group.id}`, updateData);
    
    // Update original data to match current value for this field
    originalFormData.value[fieldName] = formData.value[fieldName];
    
    console.log(`Field ${fieldName} saved successfully`);
  } catch (error) {
    console.error(`Failed to save ${fieldName}:`, error);
    alert(`Failed to save ${fieldName}: ${error.response?.data?.error || error.message}`);
    
    // Revert to original value on error
    formData.value[fieldName] = originalFormData.value[fieldName];
  }
};

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

    if (formData.value.requires_password && !props.group.requires_password) {
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

// Check if permissions have been modified
const permissionsModified = computed(() => {
  return JSON.stringify(permissionsData.value) !== JSON.stringify(originalPermissionsData.value);
})

// Check if security settings have been modified
const securityModified = computed(() => {
  const current = {
    isPrivate: formData.value.isPrivate,
    requires_admin_approval: formData.value.requires_admin_approval,
    requires_password: formData.value.requires_password,
    requires_documents: formData.value.requires_documents,
    documents: formData.value.documents
  };
  
  const original = {
    isPrivate: originalFormData.value.isPrivate,
    requires_admin_approval: originalFormData.value.requires_admin_approval,
    requires_password: originalFormData.value.requires_password,
    requires_documents: originalFormData.value.requires_documents,
    documents: originalFormData.value.documents
  };
  
  return JSON.stringify(current) !== JSON.stringify(original);
})

const changePassword = async () => {
  if (!props.isCurrentUserAdmin) return;

  if (passwordMismatch.value) {
    alert('Passwords do not match')
    return
  }

  const isChangingExistingPassword = props.group.requires_password;

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
      await authUtilEmergencyChangeGroupPassword($axiosInstance, props.group.id, newPassword.value);
    } else {
      await authUtilChangeGroupPassword($axiosInstance, props.group.id, currentGroupPassword.value, newPassword.value)
    }

    newPassword.value = ''
    confirmPassword.value = ''
    showPasswordChange.value = false
    showPassword.value = false
    showConfirmPassword.value = false

    alert('Group password ' + (isChangingExistingPassword ? 'changed' : 'set') + ' successfully')

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
const isCancellingSubscription = ref(false);

// Add the delete subscription function
async function deleteIncompleteSubscription() {
  if (isDeletingSubscription.value) return;
  
  isDeletingSubscription.value = true;
  
  try {
    // Send a PUT request to update the group with null subscription fields
    const response = await $axiosInstance.put(`/api/groups/${props.group.id}`, {
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

// Add state for redirecting to customer portal
const isRedirectingToPortal = ref(false);

// Confirmation function for subscription cancellation
function confirmCancelSubscription() {
  if (!confirm('Are you sure you want to cancel your subscription? You will lose premium features at the end of your current billing period.')) {
    return;
  }
  
  cancelSubscription();
}

// Function to directly cancel the subscription
async function cancelSubscription() {
  if (isCancellingSubscription.value) return;
  
  isCancellingSubscription.value = true;
  
  try {
    const response = await $axiosInstance.delete(`/api/payments/subscriptions/${props.group.id}`);
    
    console.log("Subscription canceled successfully:", response.data);
    alert('Your subscription has been canceled successfully. You will have access until the end of your current billing period.');
    
    // Refresh the group data to update the UI
    if (props.fetchGroup) {
      await props.fetchGroup();
    } else {
      // Refresh the page if fetchGroup is not available
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
    
  } catch (err) {
    console.error("Error canceling subscription:", err);
    alert(`Failed to cancel subscription: ${err.response?.data?.error || err.message}`);
  } finally {
    isCancellingSubscription.value = false;
  }
}

const redirectToCustomerPortal = async () => {
  if (isRedirectingToPortal.value) return;
  
  isRedirectingToPortal.value = true;
  
  try {
    const response = await $axiosInstance.post(`/api/payments/customer-portal/${props.group.id}`);
    
    console.log("Redirecting to customer portal:", response.data);
    window.location.href = response.data.url;
    
  } catch (err) {
    console.error("Error redirecting to customer portal:", err);
    alert(`Failed to redirect to customer portal: ${err.response?.data?.error || err.message}`);
  } finally {
    isRedirectingToPortal.value = false;
  }
};

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

// Clean up on unmount
onBeforeUnmount(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
    refreshInterval.value = null;
  }
});

// Handler for permissions save button
const handleSavePermissions = async () => {
  if (!props.isCurrentUserAdmin) return;
  
  try {
    console.log('Saving permissions data:', permissionsData.value);
    
    // API request to update permissions
    const response = await $axiosInstance.put(`/api/groups/${props.group.id}/permissions`, {
      permissions: permissionsData.value
    });
    
    // Update original data to match current data
    originalPermissionsData.value = cloneDeep(permissionsData.value);
    
    // Show success message
    alert('Group permissions updated successfully');
    
    // Emit event to refresh group data
    if (props.fetchGroup) {
      await props.fetchGroup();
    }
    
  } catch (error) {
    console.error('Failed to update permissions:', error);
    alert('Failed to update permissions: ' + (error.response?.data?.error || 'Unknown error'));
  }
};

// Handler for permissions reset button
const handleResetPermissions = () => {
  // Reset permissions to original values
  permissionsData.value = cloneDeep(originalPermissionsData.value);
};

// New function to save permission setting
const savePermissionSetting = async (setting) => {
  try {
    console.log(`Auto-saving permission setting: ${setting} with value: ${permissionsData.value[setting]}`);
    
    // Update the original data to match the current setting
    originalPermissionsData.value[setting] = permissionsData.value[setting];
    
    // API request to update permission
    const response = await $axiosInstance.put(`/api/groups/${props.group.id}/permissions`, {
      permissions: permissionsData.value
    });
    
    console.log('Permission updated successfully');
    
    // Refresh group data if fetchGroup is available
    if (props.fetchGroup) {
      await props.fetchGroup();
    }
  } catch (error) {
    console.error('Failed to update permission:', error);
    // Revert the change if there was an error
    permissionsData.value[setting] = !permissionsData.value[setting];
    alert('Failed to update permission: ' + (error.response?.data?.error || 'Unknown error'));
  }
};

const fetchCurrentPassword = async () => {
  if (!props.isCurrentUserAdmin) return;
  
  try {
    showPasswordLoading.value = true;
    const response = await $axiosInstance.get(`/api/groups/${props.group.id}/password`);
    currentGroupPassword.value = response.data.password;
    showCurrentPassword.value = true;
  } catch (error) {
    console.error('Failed to fetch current password:', error);
    alert('Failed to fetch current password: ' + (error.response?.data?.error || error.message));
  } finally {
    showPasswordLoading.value = false;
  }
};

// Add ref for settings subtab selection
const settingsSubtab = ref('group-settings') // default

// Set up route
const route = useRoute()

// Handler functions for security settings
const handleSecuritySave = async () => {
  if (!props.isCurrentUserAdmin) return;
  
  try {
    console.log('Saving security settings...');
    
    // Validate document requirements
    if (formData.value.requires_documents && formData.value.documents.length > 0) {
      const emptyDocs = formData.value.documents.filter(doc => !doc.name.trim());
      if (emptyDocs.length > 0) {
        toast({
          title: "Error",
          description: "Please provide names for all required documents",
          variant: "destructive"
        });
        return;
      }
    }

    if (formData.value.requires_documents && formData.value.documents.length === 0) {
      toast({
        title: "Error", 
        description: "If documents are required, you must specify at least one required document type.",
        variant: "destructive"
      });
      return;
    }

    // Check if password is required but not set
    if (formData.value.requires_password && !props.group.requires_password) {
      toast({
        title: "Error",
        description: "Please set a password for the group before saving changes.",
        variant: "destructive"
      });
      showPasswordChange.value = true;
      return;
    }

    // Prepare security data for API call
    const requiredDocumentsList = formData.value.requires_documents ? formData.value.documents.map(doc => doc.name.trim()) : [];

    const securityData = {
      is_private: formData.value.isPrivate,
      requires_admin_approval: formData.value.requires_admin_approval,
      requires_password: formData.value.requires_password,
      requires_documents: formData.value.requires_documents,
      required_documents: JSON.stringify(requiredDocumentsList)
    };

    console.log('Submitting security data:', securityData);

    // API call to update security settings
    const response = await $axiosInstance.put(`/api/groups/${props.group.id}`, securityData);

    // Update original data to match current data
    originalFormData.value.isPrivate = formData.value.isPrivate;
    originalFormData.value.requires_admin_approval = formData.value.requires_admin_approval;
    originalFormData.value.requires_password = formData.value.requires_password;
    originalFormData.value.requires_documents = formData.value.requires_documents;
    originalFormData.value.documents = cloneDeep(formData.value.documents);

    toast({
      title: "Success",
      description: "Security settings saved successfully",
    });

    // Emit event to refresh group data
    if (props.fetchGroup) {
      await props.fetchGroup();
    }

  } catch (error) {
    console.error('Failed to save security settings:', error);
    toast({
      title: "Error",
      description: 'Failed to save security settings: ' + (error.response?.data?.error || 'Unknown error'),
      variant: "destructive"
    });
  }
};

const handleSecurityCancel = () => {
  // Reset security settings to original values
  formData.value.isPrivate = originalFormData.value.isPrivate;
  formData.value.requires_admin_approval = originalFormData.value.requires_admin_approval;
  formData.value.requires_password = originalFormData.value.requires_password;
  formData.value.requires_documents = originalFormData.value.requires_documents;
  formData.value.documents = cloneDeep(originalFormData.value.documents);
  
  console.log('Security settings reset to original values');
  
  toast({
    title: "Changes Cancelled",
    description: "Security settings have been reset to their original values",
  });
};
</script>

<style scoped>
/* Add any specific styles if needed */
.capitalize {
  text-transform: capitalize;
}
</style> 