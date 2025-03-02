<!-- filepath: /Users/arnaudbrubacher/Desktop/-AGORA/CODE/agoravote-app-frontend/components/dashboard/UserGroupCard.vue -->
<template>
  <div 
    class="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
    @click="$emit('click')"
  >
    <div class="flex items-center space-x-4">
      <div v-if="group.picture" class="w-12 h-12 rounded-full overflow-hidden">
        <img :src="group.picture" :alt="group.name" class="w-full h-full object-cover" />
      </div>
      <div v-else class="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        <UserGroupIcon class="h-6 w-6 text-muted-foreground" />
      </div>
      
      <div>
        <h4 class="font-medium">{{ group.name }}</h4>
        <p class="text-sm text-muted-foreground">{{ group.description }}</p>
      </div>
    </div>
    
    <div class="flex items-center space-x-2">
      <Button variant="outline" size="sm" @click.stop="$emit('view')">
        View
      </Button>
      <Button 
        v-if="group.isPrivate" 
        variant="secondary" 
        size="sm"
      >
        Private
      </Button>
    </div>
  </div>
</template>

<script setup>
import { Button } from '@/components/ui/button'
import { UserGroupIcon } from '@heroicons/vue/outline'

const props = defineProps({
  group: {
    type: Object,
    required: true
  }
})

defineEmits(['click', 'view'])
</script> 