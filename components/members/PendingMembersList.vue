<!-- components/members/PendingMembersList.vue -->
<template>
  <div class="space-y-4">
    <!-- Header with title -->
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-medium">Pending Members ({{ pendingMembers.length || 0 }})</h3>
    </div>
    
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-6">
      <LucideIcon name="RefreshCw" size="6" class="h-6 w-6 animate-spin text-primary" />
      <span class="ml-2">Loading pending members...</span>
    </div>
    
    <!-- No pending members state -->
    <div v-else-if="!pendingMembers || pendingMembers.length === 0" class="text-center py-8 text-muted-foreground">
      <span>No pending members</span>
    </div>
    
    <!-- Pending members list -->
    <div v-else class="space-y-4">
      <MemberRow 
        v-for="(member, index) in pendingMembers" 
        :key="member.id || index" 
        :member="member"
        :current-user="currentUser"
        :is-pending="true"
        :is-current-user-admin="true"
        @review-documents="$emit('review-documents', member)"
        @accept="$emit('accept', member)"
        @decline="$emit('decline', member)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import LucideIcon from '@/components/LucideIcon.vue'
import MemberRow from '~/components/members/MemberRow.vue'

const props = defineProps({
  pendingMembers: {
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
  }
})

const emit = defineEmits([
  'review-documents',
  'accept',
  'decline'
])
</script> 