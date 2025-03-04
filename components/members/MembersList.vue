<!-- components/members/MembersList.vue -->
<template>
  <div class="space-y-4">
    <!-- Header with title and optional create button -->
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-medium">Members ({{ members.length || 0 }})</h3>
      <div class="flex items-center space-x-2">
        <!-- Add Members Dropdown - Only visible in edit mode -->
        <DropdownMenu v-if="isEditMode">
          <DropdownMenuTrigger asChild>
            <Button size="sm">
              Add Members
              <LucideIcon name="ChevronDown" size="4" class="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem v-if="showImportButton" @click="$emit('import-csv')">
              <LucideIcon name="FileUp" size="4" class="h-4 w-4 mr-2" />
              Upload File
            </DropdownMenuItem>
            <DropdownMenuItem v-if="showAddButton" @click="$emit('add-member')">
              <LucideIcon name="Mail" size="4" class="h-4 w-4 mr-2" />
              Email Invite
            </DropdownMenuItem>
            <DropdownMenuItem v-if="showAddButton" @click="$emit('search-user')">
              <LucideIcon name="Search" size="4" class="h-4 w-4 mr-2" />
              Search Users
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <!-- Edit List Button -->
        <Button
          size="sm"
          variant="outline"
          @click="isEditMode = !isEditMode"
          class="flex items-center"
          :class="isEditMode ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''"
        >
          <LucideIcon :name="isEditMode ? 'Check' : 'Edit2'" size="4" class="h-4 w-4 mr-1" />
          {{ isEditMode ? 'Done' : 'Edit List' }}
        </Button>
      </div>
    </div>
    
    <!-- Search bar -->
    <div class="relative w-full sm:max-w-xs">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search members..."
        class="w-full pl-8 pr-4 py-2 border rounded-md"
      />
      <LucideIcon 
        name="Search" 
        size="4"
        class="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" 
      />
      <button 
        v-if="searchQuery" 
        @click="searchQuery = ''" 
        class="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
      >
        <LucideIcon name="X" size="4" class="h-4 w-4" />
      </button>
    </div>
    
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-6">
      <LucideIcon name="RefreshCw" size="6" class="h-6 w-6 animate-spin text-primary" />
      <span class="ml-2">Loading members...</span>
    </div>
    
    <!-- No members state -->
    <div v-else-if="!filteredMembers || filteredMembers.length === 0" class="text-center py-8 text-muted-foreground">
      <span v-if="searchQuery">No members matching "{{ searchQuery }}"</span>
      <span v-else>No members yet</span>
    </div>
    
    <!-- Members list -->
    <div v-else class="space-y-4">
      <MemberRow 
        v-for="(member, index) in filteredMembers" 
        :key="member.id || index" 
        :member="member" 
        :current-user="currentUser"
        :is-current-user-admin="isEditMode || isCurrentUserAdmin"
        @promote="$emit('promote', member)"
        @demote="$emit('demote', member)"
        @remove="$emit('remove', member)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import LucideIcon from '@/components/LucideIcon.vue'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu/index.js'
import MemberRow from '~/components/members/MemberRow.vue'

const props = defineProps({
  members: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  currentUser: {
    type: Object,
    default: null
  },
  isCurrentUserAdmin: {
    type: Boolean,
    default: false
  },
  showAddButton: {
    type: Boolean,
    default: true
  },
  showImportButton: {
    type: Boolean,
    default: true
  }
})

defineEmits([
  'add-member', 
  'search-user', 
  'import-csv',
  'promote',
  'demote',
  'remove'
])

const searchQuery = ref('')
const isEditMode = ref(false)

const filteredMembers = computed(() => {
  if (!props.members) return []
  
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return props.members
  
  return props.members.filter(member => {
    // Search in name
    if (member.name && member.name.toLowerCase().includes(query)) return true
    
    // Search in email
    if (member.email && member.email.toLowerCase().includes(query)) return true
    
    // Search in role
    if (member.isAdmin && 'admin'.includes(query)) return true
    if (!member.isAdmin && 'member'.includes(query)) return true
    
    return false
  })
})
</script> 