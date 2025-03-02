<!-- components/group/GroupHeader.vue -->
<template>
  <Card class="w-full">
    <div class="p-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center space-x-4">
          <Button variant="ghost" @click="$emit('back-to-dashboard')" class="p-2 border">
            <ArrowLeftIcon class="h-4 w-4" />
            <span class="ml-2">Back</span>
          </Button>
          
          <!-- Group Picture -->
          <div class="flex-shrink-0">
            <div v-if="!group.picture" class="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Icon name="heroicons:user-group" class="h-8 w-8 text-muted-foreground" />
            </div>
            <img 
              v-else
              :src="group.picture" 
              alt="Group Picture"
              class="w-12 h-12 rounded-full object-cover border"
            />
          </div>
          
          <div>
            <h1 class="text-3xl font-bold">{{ group.name }}</h1>
            <p class="text-muted-foreground">{{ group.description }}</p>
          </div>
        </div>
        
        <div class="flex space-x-2">
          <!-- Settings button shown to everyone but disabled for non-admins -->
          <Button 
            variant="outline" 
            size="sm"
            @click="$emit('show-settings')"
            class="flex items-center"
            :disabled="!isCurrentUserAdmin"
          >
            <SettingsIcon class="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { ArrowLeftIcon, SettingsIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

defineProps({
  group: {
    type: Object,
    required: true
  },
  isCurrentUserAdmin: {
    type: Boolean,
    default: false
  }
})

defineEmits(['show-settings', 'back-to-dashboard'])
</script>