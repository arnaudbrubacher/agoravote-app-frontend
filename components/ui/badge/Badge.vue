<!-- filepath: /Users/arnaudbrubacher/Desktop/-AGORA/CODE/agoravote-app-frontend/components/ui/badge/Badge.vue -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (value) => {
      return ['default', 'secondary', 'destructive', 'outline'].includes(value)
    }
  }
})

const variantStyles = computed(() => {
  switch (props.variant) {
    case 'default':
      return 'bg-primary text-primary-foreground hover:bg-primary/80'
    case 'secondary':
      return 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
    case 'destructive':
      return 'bg-destructive text-destructive-foreground hover:bg-destructive/80'
    case 'outline':
      return 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
    default:
      return 'bg-primary text-primary-foreground hover:bg-primary/80'
  }
})
</script>

<template>
  <div 
    class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    :class="variantStyles"
  >
    <slot></slot>
  </div>
</template>