<!-- components/group/tabs/MembersTab.vue -->
<template>
  <Card>
    <CardHeader class="flex flex-col sm:flex-row justify-between gap-4">
      <div class="flex flex-col gap-2">
        <CardTitle>Members ({{ filteredMembers.length || 0 }})</CardTitle>
        
        <!-- Search bar -->
        <div class="relative w-full sm:max-w-xs">
          <input
            v-model="memberSearchQuery"
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
            v-if="memberSearchQuery" 
            @click="memberSearchQuery = ''" 
            class="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
          >
            <LucideIcon name="X" size="4" class="h-4 w-4" />
          </button>
        </div>
      </div>
      <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <!-- Import Members Button -->
        <div class="flex items-center">
          <label class="mr-2 text-sm text-muted-foreground">Import member list:</label>
          <Button 
            size="sm"
            variant="outline"
            @click="triggerCsvFileInput()"
            class="flex items-center"
          >
            <LucideIcon name="FileUp" size="4" class="h-4 w-4 mr-1" />
            Upload .CSV
          </Button>
          <input
            type="file"
            ref="csvFileInput"
            class="hidden"
            accept=".csv"
            @change="handleFileChange"
          />
        </div>
        
        <!-- Add Member Button -->
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              Add Member
              <LucideIcon name="ChevronDown" size="4" class="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="$emit('show-add-member')">
              <LucideIcon name="Mail" size="4" class="h-4 w-4 mr-2" />
              Add by Email
            </DropdownMenuItem>
            <DropdownMenuItem @click="$emit('show-user-search')">
              <LucideIcon name="Search" size="4" class="h-4 w-4 mr-2" />
              Search Users
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="isLoadingMembers" class="text-center py-8">
        <LucideIcon name="RefreshCw" size="6" class="h-6 w-6 animate-spin inline-block" />
        <span class="ml-2">Loading members...</span>
      </div>
      <div v-else-if="group.members?.length" class="space-y-4">
        <!-- No results message -->
        <div v-if="filteredMembers.length === 0 && memberSearchQuery" class="text-center py-8 text-muted-foreground">
          No members matching "{{ memberSearchQuery }}"
        </div>
        
        <!-- Members list -->
        <MemberRow
          v-else
          v-for="(member, index) in filteredMembers"
          :key="member.id || index"
          :member="member"
          :current-user="currentUser"
          :is-current-user-admin="isCurrentUserAdmin"
          @promote="promoteMember"
          @demote="demoteMember"
          @remove="removeMember"
        />
      </div>
      <div v-else class="text-center text-muted-foreground py-8">
        No members yet
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import LucideIcon from '@/components/LucideIcon.vue'
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu/index.js'
import MemberRow from '@/components/group/cards/MemberRow.vue'

const props = defineProps({
  group: {
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

const emit = defineEmits([
  'show-add-member', 
  'show-user-search', 
  'csv-import',
  'member-promoted',
  'member-demoted',
  'member-removed'
])

const memberSearchQuery = ref('')
const csvFileInput = ref(null)
const isLoadingMembers = ref(false)

const filteredMembers = computed(() => {
  if (!props.group?.members) return []
  
  const query = memberSearchQuery.value.trim().toLowerCase()
  if (!query) return props.group.members
  
  return props.group.members.filter(member => {
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

const triggerCsvFileInput = () => {
  csvFileInput.value.click()
}

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    emit('csv-import', file)
  }
  // Reset input
  event.target.value = ''
}

const promoteMember = (member) => {
  emit('member-promoted', member)
}

const demoteMember = (member) => {
  emit('member-demoted', member)
}

const removeMember = (member) => {
  emit('member-removed', member)
}
</script>