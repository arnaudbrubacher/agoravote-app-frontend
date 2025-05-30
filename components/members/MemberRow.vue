<!-- components/group/cards/MemberRow.vue -->
<template>
  <div class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
    <div class="flex items-center space-x-3">
      <!-- Member Avatar -->
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
      
      <!-- Member Info -->
      <div>
        <div class="flex items-center">
          <router-link 
            v-if="!isPending"
            :to="`/user/${member.id}`" 
            class="font-medium hover:underline"
          >
            {{ member.name || 'Unknown Member' }}
          </router-link>
          <span v-else class="font-medium">
            {{ getMemberName(member) }}
          </span>
          <span v-if="isCurrentMember(member)" class="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
            You
          </span>
          <span v-else-if="isPending && !hidePendingBadge" class="ml-2 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
            Pending
          </span>
          <span v-else-if="isInvited && !hideInvitedBadge" class="ml-2 text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-full">
            Invited
          </span>
          <span v-if="isPending && !invitationAccepted && !member.isJoinRequest" class="ml-2 text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full">
            Awaiting Acceptance
          </span>
        </div>
        <span class="text-sm text-muted-foreground">{{ getMemberEmail(member) }}</span>
      </div>
    </div>
    
    <!-- Member Role and Actions -->
    <div class="flex items-center space-x-2">
      <!-- Actions for pending members - Compact version -->
      <div v-if="isPending" class="flex items-center space-x-2">
        <!-- Compact buttons for small screens -->
        <div class="flex md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <LucideIcon name="MoreHorizontal" size="4" class="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem v-if="hasDocuments" @click="handleReviewDocuments(member)">
                <LucideIcon name="FileText" size="4" class="h-4 w-4 mr-2" />
                Review Documents
              </DropdownMenuItem>
              <DropdownMenuItem 
                @click="$emit('accept', member)"
                :disabled="!invitationAccepted && !member.isJoinRequest"
                :class="{'opacity-50 cursor-not-allowed': !invitationAccepted && !member.isJoinRequest}"
              >
                <LucideIcon name="Check" size="4" class="h-4 w-4 mr-2" />
                Accept
              </DropdownMenuItem>
              <DropdownMenuItem @click="$emit('decline', member)">
                <LucideIcon name="X" size="4" class="h-4 w-4 mr-2" />
                Decline
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <!-- Regular buttons for larger screens -->
        <div class="hidden md:flex md:space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  v-if="hasDocuments"
                  variant="outline" 
                  size="icon" 
                  @click="handleReviewDocuments(member)"
                  class="h-9 w-9"
                >
                  <LucideIcon name="Paperclip" size="4" class="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Review Documents</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button 
            variant="default" 
            size="sm" 
            @click="$emit('accept', member)"
            :disabled="!invitationAccepted && !member.isJoinRequest"
          >
            <LucideIcon name="Check" size="4" class="h-4 w-4" />
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            @click="$emit('decline', member)"
          >
            <LucideIcon name="X" size="4" class="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <!-- Actions for invited members -->
      <div v-else-if="isInvited" class="flex items-center space-x-2">
        <div v-if="isCurrentUserAdmin" class="flex space-x-2">
           <Button variant="outline" size="sm" @click.stop="$emit('resend-invite', member)" title="Resend Invitation">
              <LucideIcon name="Send" size="4" class="h-4 w-4" />
           </Button>
           <Button variant="destructive" size="sm" @click.stop="$emit('cancel-invite', member)" title="Cancel Invitation">
              <LucideIcon name="X" size="4" class="h-4 w-4" />
           </Button>
        </div>
        <div v-else>
           <Badge variant="secondary">Pending Invite</Badge>
        </div>
      </div>
      
      <!-- Actions for active members -->
      <div v-if="!isPending && !isInvited" class="flex items-center space-x-2">
        <!-- Document Review Button - Always visible -->
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                @click="handleReviewDocuments(member)"
                class="h-9 w-9"
              >
                <LucideIcon name="Paperclip" size="4" class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
               <p>Manage Documents</p> 
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <!-- Admin Toggle - Only visible for admins and not for current user if they're an admin -->
        <div v-if="isCurrentUserAdmin && !isCurrentMember(member)" class="flex items-center space-x-2">
          <div class="flex items-center space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    :pressed="member.isAdmin"
                    @click.stop="toggleAdminStatus" 
                    size="icon"
                    variant="outline"
                    :class="[
                      'h-9 w-9',
                      member.isAdmin ? 'bg-amber-200 hover:bg-amber-300' : '' 
                    ]"
                  >
                    <LucideIcon name="Crown" size="4" class="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>
                   <p>{{ member.isAdmin ? 'Demote to Member' : 'Promote to Admin' }}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <!-- Role Display Toggle (Disabled) -->
        <div v-else>
           <TooltipProvider>
             <Tooltip>
               <TooltipTrigger asChild>
                  <Toggle
                    :pressed="member.isAdmin"
                    size="icon"
                    disabled
                    variant="outline"
                    :class="[
                      'opacity-100 h-9 w-9',
                      member.isAdmin ? 'bg-amber-200' : '' 
                    ]"
                  >
                     <LucideIcon name="Crown" size="4" class="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>
                   <p>Role: {{ member.isAdmin ? 'Admin' : 'Member' }}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
        </div>
        
        <!-- Delete button - Visible for admin, disabled for self -->
         <TooltipProvider>
           <Tooltip>
             <TooltipTrigger asChild>
                <Button 
                  v-if="isCurrentUserAdmin"
                  variant="destructive" 
                  size="icon" 
                  @click="handleMemberRemove(member)"
                  class="h-9 w-9"
                  :disabled="isCurrentMember(member)"
                >
                  <LucideIcon name="Trash" size="4" class="h-4 w-4" />
                </Button>
             </TooltipTrigger>
             <TooltipContent>
                <p>Remove Member</p>
             </TooltipContent>
           </Tooltip>
         </TooltipProvider>
      </div>
    </div>
  </div>

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
import { ref, computed, inject } from 'vue'
import LucideIcon from '@/components/LucideIcon.vue'
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { useAlertDialog } from '@/composables/useAlertDialog'
import ActionAlertDialog from '@/components/shared/ActionAlertDialog.vue'
// Import Tooltip components
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu/index.js'
import { Badge } from '@/components/ui/badge'

const props = defineProps({
  member: {
    type: Object,
    required: true
  },
  currentUser: {
    type: Object,
    default: null
  },
  isCurrentUserAdmin: {
    type: Boolean,
    default: false
  },
  isPending: {
    type: Boolean,
    default: false
  },
  isInvited: {
    type: Boolean,
    default: false
  },
  hasDocuments: {
    type: Boolean,
    default: false
  },
  invitationAccepted: {
    type: Boolean,
    default: false
  },
  hideInvitedBadge: {
    type: Boolean,
    default: false
  },
  hidePendingBadge: {
    type: Boolean,
    default: false
  }
})

// Log props for debugging
console.log('MemberRow props for:', props.member.name, {
  hasDocuments: props.hasDocuments,
  isPending: props.isPending,
  isCurrentUserAdmin: props.isCurrentUserAdmin,
  invitationAccepted: props.invitationAccepted,
  documents: props.member.documents_submitted,
  member: props.member
})

const emit = defineEmits([
  'promote', 
  'demote', 
  'remove', 
  'review-documents', 
  'accept', 
  'decline',
  'resend-invite',
  'cancel-invite'
])

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

// Try to get app user data from parent components
const appUserData = inject('appUserData', null)

// Computed property for member avatar URL
const memberAvatarUrl = computed(() => {
  console.log(`[MemberRow ${getMemberName(props.member)}] Computing avatar URL. Is current member: ${isCurrentMember(props.member)}`);
  console.log(`[MemberRow ${getMemberName(props.member)}] appUserData available: ${!!appUserData?.value}`);
  
  // For invited members, check if they have a profile picture
  if (props.isInvited) {
    console.log(`[MemberRow ${getMemberName(props.member)}] Invited member profile data:`, { 
      avatar: props.member.avatar, 
      profile_picture: props.member.profile_picture 
    });
    
    // Check if invited member has an avatar or profile picture
    if (props.member.avatar || props.member.profile_picture) {
      const avatarUrl = props.member.avatar || props.member.profile_picture;
      
      // If the avatar URL is already absolute, use it directly
      if (avatarUrl && avatarUrl.startsWith('http')) {
        return avatarUrl;
      }
      
      // Otherwise, prepend the API base URL if the path is valid
      if (avatarUrl && avatarUrl.length > 0) {
        const config = useRuntimeConfig()
    const baseUrl = config.public.apiBaseUrl || 'http://localhost:8088';
        return `${baseUrl}/${avatarUrl}`;
      }
    }
    
    // If no valid avatar/profile picture, return null to show initials
    return null;
  }
  
  // Continue with existing logic for regular members
  if (appUserData?.value) {
    console.log(`[MemberRow ${getMemberName(props.member)}] appUserData.profile_picture: ${appUserData.value.profile_picture}`);
  }
  console.log(`[MemberRow ${getMemberName(props.member)}] member prop data:`, { avatar: props.member.avatar, profile_picture: props.member.profile_picture });
  // Check if this is the current user and if we have updated profile data from app layout
  if (isCurrentMember(props.member) && appUserData?.value?.profile_picture) {
    const profilePic = appUserData.value.profile_picture
    
    // If the profile picture is a full URL, return it as is
    if (profilePic.startsWith('http')) {
      console.log(`[MemberRow ${getMemberName(props.member)}] Using appUserData (absolute): ${profilePic}`);
      return profilePic
    }
    
    // Otherwise, prepend the API base URL
    const config = useRuntimeConfig()
    const baseUrl = config.public.apiBaseUrl || 'http://localhost:8088'
    const finalUrl = `${baseUrl}/${profilePic}`;
    console.log(`[MemberRow ${getMemberName(props.member)}] Using appUserData (relative): ${finalUrl}`);
    return finalUrl;
  }
  
  // Otherwise use the member's avatar if available
  if (!props.member.avatar && !props.member.profile_picture) return null
  
  const avatarUrl = props.member.avatar || props.member.profile_picture
  
  // If the avatar is a full URL, return it as is
  if (avatarUrl.startsWith('http')) {
    console.log(`[MemberRow ${getMemberName(props.member)}] Using member prop (absolute): ${avatarUrl}`);
    return avatarUrl
  }
  
  // Otherwise, prepend the API base URL
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl || 'http://localhost:8088'
  const finalUrl = `${baseUrl}/${avatarUrl}`;
  console.log(`[MemberRow ${getMemberName(props.member)}] Using member prop (relative): ${finalUrl}`);
  return finalUrl;
})

const getMemberName = (member) => {
  // Try to get the name from various possible locations
  return member.name || 
         (member.user && member.user.name) || 
         'Unknown Member';
}

const getMemberInitial = (member) => {
  const name = getMemberName(member);
  if (name === 'Unknown Member') return 'U';
  return name.charAt(0).toUpperCase();
}

const isCurrentMember = (member) => {
  if (!props.currentUser || !member) return false
  
  return member.id === props.currentUser.id || 
         member.userId === props.currentUser.id || 
         member.user_id === props.currentUser.id
}

// Toggle admin status
const toggleAdminStatus = () => {
  if (props.member.isAdmin) {
    emit('demote', props.member)
  } else {
    emit('promote', props.member)
  }
}

// Update handleMemberRemove to directly emit without showing confirmation
const handleMemberRemove = (member) => {
  console.log('MemberRow - Remove button clicked for member:', member.name, {
    id: member.id,
    userId: member.userId,
    user_id: member.user_id,
    user: member.user && member.user.id
  });
  
  // Directly emit the remove event - confirmation will be handled by parent
  emit('remove', member);
}

const getMemberEmail = (member) => {
  // Try to get the email from various possible locations
  return member.email || 
         (member.user && member.user.email) || 
         'No email available';
}

// Add a method to handle the review-documents event
const handleReviewDocuments = (member) => {
  console.log('MemberRow - handleReviewDocuments called for member:', member.name)
  console.log('MemberRow - member documents_submitted:', member.documents_submitted)
  emit('review-documents', member)
}

const confirmRemoveMember = () => {
  // Confirmation handled by parent
  // if (!confirm(`Are you sure you want to remove ${props.member.name} from this group?`)) {
  //  return
  // }
  emit('remove-member', props.member.id)
}
</script>