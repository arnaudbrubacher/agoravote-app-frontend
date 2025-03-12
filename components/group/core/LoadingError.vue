<!-- components/group/LoadingError.vue -->
<template>
  <!-- Loading State -->
  <div v-if="loading" class="text-center py-12">
    <LucideIcon name="RefreshCw" size="8" class="h-8 w-8 animate-spin text-primary inline-block" />
    <div class="mt-2 text-muted-foreground">Loading group information...</div>
  </div>

  <!-- Error State -->
  <div v-else-if="error" class="max-w-md mx-auto bg-destructive/10 p-6 rounded-lg border border-destructive/20">
    <div class="flex items-center mb-4">
      <LucideIcon name="AlertCircle" size="6" class="h-6 w-6 text-destructive mr-2" />
      <h2 class="text-lg font-semibold text-destructive">Error</h2>
    </div>
    <p class="text-destructive-foreground">{{ error }}</p>
    <Button 
      class="mt-4" 
      variant="outline" 
      @click="() => router.push('/profile')"
    >
      Return to Profile
    </Button>
  </div>
</template>

<script setup>
import LucideIcon from '@/components/LucideIcon.vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'

const router = useRouter()

defineProps({
  loading: Boolean,
  error: String
})
</script>