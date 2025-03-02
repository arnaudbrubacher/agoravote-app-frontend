<!-- filepath: /Users/arnaudbrubacher/Desktop/-AGORA/CODE/agoravote-app-frontend/components/shared/users/UserCard.vue -->
<template>
  <div 
    class="flex items-center p-4 border rounded-lg hover:bg-accent/5 transition-colors cursor-pointer"
    @click="navigateToUserProfile"
  >
    <div class="flex-shrink-0 mr-4">
      <div v-if="!user.profile_picture" class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
        <User class="h-6 w-6 text-gray-400" />
      </div>
      <img 
        v-else
        :src="user.profile_picture" 
        alt="User Profile Picture"
        class="w-12 h-12 rounded-full object-cover border"
      />
    </div>
    <div class="flex-grow">
      <h3 class="font-medium">{{ user.name || 'User' }}</h3>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { User } from 'lucide-vue-next'

const router = useRouter()

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click'])

const navigateToUserProfile = () => {
  emit('click')
  // Navigate to the user profile page
  router.push(`/user/${props.user.id}`)
}
</script> 