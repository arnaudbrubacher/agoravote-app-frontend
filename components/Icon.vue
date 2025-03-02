<template>
  <component :is="iconComponent" :class="props.class" :size="props.size" :stroke-width="props.strokeWidth" />
</template>

<script setup>
import { computed } from 'vue'
import * as LucideIcons from 'lucide-vue-next'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  class: {
    type: String,
    default: ''
  },
  size: {
    type: [Number, String],
    default: 24
  },
  strokeWidth: {
    type: [Number, String],
    default: 2
  }
})

const iconComponent = computed(() => {
  // Handle both formats: "icon:UserIcon" and "user"
  const iconName = props.name.includes(':') 
    ? props.name.split(':')[1] 
    : props.name.charAt(0).toUpperCase() + props.name.slice(1);
  
  return LucideIcons[iconName] || null
})
</script>

<style scoped>
.icon {
  display: inline-block;
}
</style>