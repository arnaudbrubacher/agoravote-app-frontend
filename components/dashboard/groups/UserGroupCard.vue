<!-- filepath: /Users/arnaudbrubacher/Desktop/-AGORA/CODE/agoravote-app-frontend/components/dashboard/groups/UserGroupCard.vue -->
<template>
  <div 
    class="flex items-center p-4 border rounded-lg hover:bg-accent/5 transition-colors cursor-pointer"
    @click="$emit('click')"
  >
    <div class="flex-shrink-0 mr-4">
      <div v-if="!group.picture" class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
        <Users class="h-6 w-6 text-gray-400" />
      </div>
      <img 
        v-else
        :src="group.picture" 
        alt="Group Picture"
        class="w-12 h-12 rounded-full object-cover border"
      />
    </div>
    <div class="flex-grow">
      <h3 class="font-medium">{{ group.name }}</h3>
      <p class="text-sm text-muted-foreground truncate">{{ group.description }}</p>
    </div>
    <div class="flex-shrink-0 ml-2">
      <Button v-if="group.is_private" size="sm" variant="outline" class="text-xs">
        Private
      </Button>
    </div>
  </div>
</template>

<script setup>
import { Button } from '@/components/ui/button'
import { Users } from 'lucide-vue-next'

const props = defineProps({
  group: {
    type: Object,
    required: true
  }
})

defineEmits(['click', 'view'])
</script> 