<template>
  <Sheet v-model:open="isOpen" side="left">
    <SheetContent class="w-full sm:max-w-md overflow-y-auto" side="left">
      <SheetHeader class="pb-4">
        <SheetTitle>Dashboard</SheetTitle>
      </SheetHeader>
      
      <!-- Groups Section -->
      <div class="space-y-6 p-4">
        <!-- Group Actions -->
        <div class="space-y-2">
          <Button 
            variant="outline" 
            class="w-full justify-start"
            @click="$emit('find-group')"
          >
            <Search class="h-4 w-4 mr-2" />
            Find a Group
          </Button>
          
          <Button 
            variant="default" 
            class="w-full justify-start"
            @click="$emit('create-group')"
          >
            <Plus class="h-4 w-4 mr-2" />
            Create Group
          </Button>
        </div>
      </div>
      
      <!-- Group Invitations Section -->
      <SheetHeader class="pb-4">
        <SheetTitle>Group Invitations</SheetTitle>
      </SheetHeader>
      
      <div class="p-4 pt-0 space-y-4">
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-8">
          <Loader2 class="h-6 w-6 animate-spin inline-block" />
          <span class="ml-2 text-sm text-muted-foreground">Loading invitations...</span>
        </div>
        
        <!-- Empty State -->
        <div v-else-if="pendingGroups.length === 0" class="text-center py-6 text-sm text-muted-foreground">
          No pending invitations
        </div>
        
        <!-- Invitations List -->
        <div v-else class="space-y-3">
          <GroupCard 
            v-for="group in pendingGroups" 
            :key="group.id" 
            :group="group"
            :showActions="true"
            :showPrivateBadge="false"
          >
            <template #actions>
              <Button 
                variant="outline" 
                size="sm"
                @click.stop="declineGroupInvitation(group)"
              >
                Decline
              </Button>
              <Button 
                variant="default" 
                size="sm"
                @click.stop="acceptGroupInvitation(group)"
              >
                Accept
              </Button>
            </template>
          </GroupCard>
        </div>
      </div>
      
      <!-- Your Groups Section -->
      <SheetHeader class="pb-4">
        <SheetTitle>Your Groups</SheetTitle>
      </SheetHeader>
      
      <div class="p-4 pt-0 space-y-4">
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-8">
          <Loader2 class="h-6 w-6 animate-spin inline-block" />
          <span class="ml-2 text-sm text-muted-foreground">Loading groups...</span>
        </div>
        
        <!-- Empty State -->
        <div v-else-if="activeGroups.length === 0" class="text-center py-6 text-sm text-muted-foreground">
          No groups yet. Create your first group!
        </div>
        
        <!-- Groups List -->
        <div v-else class="space-y-3">
          <GroupCard 
            v-for="group in activeGroups" 
            :key="group.id" 
            :group="group"
            :showActions="false"
            @click="$emit('view-group', group.id)"
          />
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { 
  Search, 
  Plus, 
  Users,
  Loader2
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import GroupCard from '@/components/groups/GroupCard.vue'
import axios from '~/src/utils/axios'

// Props
const props = defineProps({
  open: {
    type: Boolean,
    required: true
  },
  groups: {
    type: Array,
    required: true,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:open', 'find-group', 'create-group', 'view-group', 'refresh-groups'])

// Computed property for two-way binding of open state
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

// Filter out pending memberships from the groups list
const activeGroups = computed(() => {
  // If no groups or not loaded yet, return empty array
  if (!props.groups || props.groups.length === 0) return []
  
  // Filter out groups where the user is a pending member
  return props.groups.filter(group => {
    // Check if the group has a membership property with status
    if (group.membership && group.membership.status === 'pending') {
      console.log(`Filtering out group with pending membership.status from Your Groups: ${group.name}`)
      return false
    }
    
    // Legacy checks for backward compatibility
    if (group.membership_status === 'pending') {
      console.log(`Filtering out group with pending membership_status from Your Groups: ${group.name}`)
      return false
    }
    
    if (group.status === 'pending') {
      console.log(`Filtering out group with pending status from Your Groups: ${group.name}`)
      return false
    }
    
    // Only include groups with approved status (or no status specified)
    return true
  })
})

// Get pending groups from the groups list
const pendingGroups = computed(() => {
  // If no groups or not loaded yet, return empty array
  if (!props.groups || props.groups.length === 0) return []
  
  // Filter for groups where the user is a pending member
  return props.groups.filter(group => {
    // Check if the group has a membership property with status
    if (group.membership && group.membership.status === 'pending') {
      console.log(`Including group with pending membership.status in Group Invitations: ${group.name}`)
      return true
    }
    
    // Legacy checks for backward compatibility
    if (group.membership_status === 'pending') {
      console.log(`Including group with pending membership_status in Group Invitations: ${group.name}`)
      return true
    }
    
    if (group.status === 'pending') {
      console.log(`Including group with pending status in Group Invitations: ${group.name}`)
      return true
    }
    
    return false
  })
})

// Listen for the user-left-group event
const handleUserLeftGroup = (event) => {
  console.log('User left group event received in DashboardSidebar:', event.detail)
  // Emit an event to refresh the groups list
  emit('refresh-groups')
}

// Handle the close-dashboard-sidebar event
const handleCloseDashboardSidebar = () => {
  isOpen.value = false
}

// Set up event listeners
onMounted(() => {
  window.addEventListener('user-left-group', handleUserLeftGroup)
  window.addEventListener('close-dashboard-sidebar', handleCloseDashboardSidebar)
  
  // Log the groups that are being displayed
  console.log('DashboardSidebar - All groups:', props.groups)
  console.log('DashboardSidebar - Active groups:', activeGroups.value)
})

// Clean up event listeners
onBeforeUnmount(() => {
  window.removeEventListener('user-left-group', handleUserLeftGroup)
  window.removeEventListener('close-dashboard-sidebar', handleCloseDashboardSidebar)
})

// Watch for changes in the groups prop
watch(() => props.groups, (newGroups) => {
  console.log('DashboardSidebar - Groups updated:', newGroups)
  console.log('DashboardSidebar - Active groups after update:', activeGroups.value)
})

// Helper function to properly format group picture URLs

// Accept a group invitation
const acceptGroupInvitation = async (group) => {
  try {
    await axios.post(`/groups/${group.id}/accept`)
    
    // Show success message
    alert(`You have successfully joined ${group.name || 'the group'}`)
    
    // Refresh the groups list to show the newly joined group
    emit('refresh-groups')
  } catch (error) {
    console.error('Failed to accept group invitation:', error)
    alert('Failed to accept invitation: ' + (error.response?.data?.error || 'Unknown error'))
  }
}

// Decline a group invitation
const declineGroupInvitation = async (group) => {
  if (!confirm(`Are you sure you want to decline the invitation to join ${group.name || 'this group'}?`)) {
    return
  }
  
  try {
    await axios.post(`/groups/${group.id}/decline`)
    
    // Refresh the groups list
    emit('refresh-groups')
  } catch (error) {
    console.error('Failed to decline group invitation:', error)
    alert('Failed to decline invitation: ' + (error.response?.data?.error || 'Unknown error'))
  }
}
</script> 