<script setup lang="ts">
import { defineProps, withDefaults } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  variant?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  class: ''
})
</script>

<template>
  <button
    :class="cn(
      'px-4 py-2 rounded',
      props.variant === 'default' ? 'bg-button-default text-background-light hover:bg-button-hover dark:bg-button-default dark:text-background-light dark:hover:bg-button-hover' : '',
      props.class
    )"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<style scoped>
/* Add any additional styles here */
</style>
