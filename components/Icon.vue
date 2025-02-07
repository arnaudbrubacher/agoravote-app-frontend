<template>
  <component :is="iconComponent" :class="class" />
</template>

<script setup>
import { computed } from 'vue'
import * as HeroIcons from '@heroicons/vue/outline'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  class: {
    type: String,
    default: ''
  }
})

const iconComponent = computed(() => {
  const iconName = props.name.split(':')[1]
  return HeroIcons[iconName] || null
})
</script>

<style scoped>
.icon {
  display: inline-block;
}
</style>