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
            :to="`/user/${member.id}`" 
            class="font-medium hover:underline"
          >
            {{ member.name || 'Unknown Member' }}
          </router-link>
          <span v-if="isCurrentMember(member)" class="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
            You
          </span>
        </div>
        <span class="text-sm text-muted-foreground">{{ member.email || 'No email available' }}</span>
      </div>
    </div>
    
    <!-- Member Role and Actions -->
    <div class="flex items-center space-x-2">
      <span v-if="member.isAdmin" class="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
        Admin
      </span>
      <span v-else class="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
        Member
      </span>
      
      <!-- Actions for admins -->
      <div v-if="isCurrentUserAdmin" class="ml-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <LucideIcon name="MoreVertical" size="4" class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem v-if="!member.isAdmin" @click="emit('promote', member)">
              <LucideIcon name="UserPlus" size="4" class="h-4 w-4 mr-2" />
              Make Admin
            </DropdownMenuItem>
            <DropdownMenuItem v-if="member.isAdmin && !isCurrentMember(member)" @click="emit('demote', member)">
              <LucideIcon name="UserMinus" size="4" class="h-4 w-4 mr-2" />
              Remove Admin Role
            </DropdownMenuItem>
            <DropdownMenuItem v-if="!isCurrentMember(member)" @click="handleRemove(member)">
              <LucideIcon name="Trash" size="4" class="h-4 w-4 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import LucideIcon from '@/components/LucideIcon.vue'
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
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
  }
})

const emit = defineEmits(['promote', 'demote', 'remove'])

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

// Add a handler for the remove action to log the member data
const handleRemove = (member) => {
  console.log('MemberRow - Remove button clicked for member:', member.name, {
    id: member.id,
    userId: member.userId,
    user_id: member.user_id,
    user: member.user && member.user.id
  });
  emit('remove', member);
}
</script>