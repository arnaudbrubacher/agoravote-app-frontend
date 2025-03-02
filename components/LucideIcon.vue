<template>
  <component 
    :is="iconComponent" 
    :size="props.size" 
    :stroke-width="props.strokeWidth"
    :class="props.class"
  />
</template>

<script setup>
import { computed } from 'vue'
import * as icons from 'lucide-vue-next'
import { convertHeroIconString } from '@/lib/iconMapping'

const props = defineProps({
  name: {
    type: String,
    required: true,
    description: 'Icon name (e.g., "User") or HeroIcon format (e.g., "heroicons:user")'
  },
  size: {
    type: [Number, String],
    default: 24,
    description: 'Icon size in pixels'
  },
  strokeWidth: {
    type: [Number, String],
    default: 2,
    description: 'Stroke width of the icon'
  },
  class: {
    type: String,
    default: '',
    description: 'Additional CSS classes'
  }
})

const iconComponent = computed(() => {
  let iconName;
  
  // Handle HeroIcon format conversion
  if (props.name.startsWith('heroicons:')) {
    iconName = convertHeroIconString(props.name);
  } 
  // Handle direct Lucide name
  else {
    iconName = props.name.charAt(0).toUpperCase() + props.name.slice(1);
  }
  
  return icons[iconName] || null;
})
</script> 