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
            {{ member.name || 'Unknown Member' }}
          </span>
          <span v-if="isCurrentMember(member)" class="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
            You
          </span>
          <span v-if="isPending" class="ml-2 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
            Pending
          </span>
        </div>
        <span class="text-sm text-muted-foreground">{{ member.email || 'No email available' }}</span>
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
              <DropdownMenuItem v-if="member.hasDocuments" @click="$emit('review-documents', member)">
                <LucideIcon name="FileText" size="4" class="h-4 w-4 mr-2" />
                Review Documents
              </DropdownMenuItem>
              <DropdownMenuItem @click="$emit('accept', member)">
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
          <Button 
            v-if="member.hasDocuments"
            variant="outline" 
            size="sm" 
            @click="$emit('review-documents', member)"
          >
            <LucideIcon name="FileText" size="4" class="h-4 w-4 mr-1" />
            Docs
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            @click="$emit('accept', member)"
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
      
      <!-- Actions for active members -->
      <div v-if="!isPending" class="flex items-center space-x-2">
        <!-- Admin Toggle - Only visible for admins and not for current user if they're an admin -->
        <div v-if="isCurrentUserAdmin && !isCurrentMember(member)" class="flex items-center space-x-2">
          <div class="flex items-center space-x-1">
            <Button 
              :variant="member.isAdmin ? 'default' : 'outline'"
              size="sm"
              @click="toggleAdminStatus"
              class="min-w-[90px] justify-center"
            >
              {{ member.isAdmin ? 'Admin' : 'Member' }}
            </Button>
          </div>
        </div>
        
        <!-- Just show the role badge if not an admin or for current user -->
        <div v-else>
          <span v-if="member.isAdmin" class="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
            Admin
          </span>
          <span v-else class="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
            Member
          </span>
        </div>
        
        <!-- Delete button - Only visible for admins and not for current user -->
        <Button 
          v-if="isCurrentUserAdmin && !isCurrentMember(member)"
          variant="destructive" 
          size="sm"
          @click="handleMemberRemove(member)"
        >
          <LucideIcon name="Trash" size="4" class="h-4 w-4 mr-1" />
          Remove
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import LucideIcon from '@/components/LucideIcon.vue'
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu/index.js'

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
  }
})

const emit = defineEmits([
  'promote', 
  'demote', 
  'remove', 
  'review-documents', 
  'accept', 
  'decline'
])

// Try to get app user data from parent components
const appUserData = inject('appUserData', null)

// Computed property for member avatar URL
const memberAvatarUrl = computed(() => {
  // Check if this is the current user and if we have updated profile data from app layout
  if (isCurrentMember(props.member) && appUserData?.value?.profile_picture) {
    const profilePic = appUserData.value.profile_picture
    
    // If the profile picture is a full URL, return it as is
    if (profilePic.startsWith('http')) {
      return profilePic
    }
    
    // Otherwise, prepend the API base URL
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
    return `${baseUrl}/${profilePic}`
  }
  
  // Otherwise use the member's avatar if available
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

const getMemberInitial = (member) => {
  if (!member || !member.name || member.name === 'Unknown Member') return 'U'
  return member.name.charAt(0).toUpperCase()
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

// Add a handler for the remove action to log the member data
const handleMemberRemove = (member) => {
  // Confirm before removing
  if (!confirm(`Are you sure you want to remove ${member.name} from this group?`)) {
    return
  }
  
  console.log('MemberRow - Remove button clicked for member:', member.name, {
    id: member.id,
    userId: member.userId,
    user_id: member.user_id,
    user: member.user && member.user.id
  });
  emit('remove', member);
}
</script>