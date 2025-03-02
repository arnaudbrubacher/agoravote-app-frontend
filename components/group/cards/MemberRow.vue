<!-- components/group/cards/MemberRow.vue -->
<template>
  <div class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
    <div class="flex items-center space-x-3">
      <!-- Member Avatar -->
      <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <span v-if="!member.avatar" class="font-medium text-primary">
          {{ getMemberInitial(member) }}
        </span>
        <img 
          v-else 
          :src="member.avatar" 
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
              <Icon name="heroicons:ellipsis-vertical" class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem v-if="!member.isAdmin" @click="$emit('promote', member)">
              <Icon name="heroicons:user-plus" class="h-4 w-4 mr-2" />
              Make Admin
            </DropdownMenuItem>
            <DropdownMenuItem v-if="member.isAdmin && !isCurrentMember(member)" @click="$emit('demote', member)">
              <Icon name="heroicons:user-minus" class="h-4 w-4 mr-2" />
              Remove Admin Role
            </DropdownMenuItem>
            <DropdownMenuItem v-if="!isCurrentMember(member)" @click="$emit('remove', member)">
              <Icon name="heroicons:trash" class="h-4 w-4 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </div>
</template>

<script setup>
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

defineEmits(['promote', 'demote', 'remove'])

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
</script>