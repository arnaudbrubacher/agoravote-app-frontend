<!-- filepath: /Users/arnaudbrubacher/Desktop/-AGORA/CODE/agoravote-app-frontend/components/dashboard/UserGroupsTab.vue -->
<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle>Your Groups</CardTitle>
      <Button @click="$emit('create-group')" class="flex items-center">
        <PlusIcon class="h-4 w-4 mr-2" />
        Create Group
      </Button>
    </CardHeader>
    <CardContent class="p-6">
      <!-- Groups list -->
      <div v-if="isLoading" class="text-center py-8">
        <SpinnerIcon class="h-6 w-6 animate-spin inline-block" />
        <span class="ml-2">Loading groups...</span>
      </div>
      <div v-else-if="groups.length === 0" class="text-center py-6 text-muted-foreground">
        No groups yet. Create your first group!
      </div>
      <div v-else class="space-y-4">
        <UserGroupCard 
          v-for="group in groups" 
          :key="group.id" 
          :group="group" 
          @click="$emit('view-group', group.id)"
          @view="$emit('view-group', group.id)"
        />
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import { PlusIcon } from 'lucide-vue-next'
import { Loader2 as SpinnerIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import UserGroupCard from '@/components/dashboard/UserGroupCard.vue'

const props = defineProps({
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

defineEmits(['create-group', 'view-group'])
</script> 