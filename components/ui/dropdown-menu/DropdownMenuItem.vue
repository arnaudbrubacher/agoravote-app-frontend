<script setup>
import { inject } from 'vue'

const setOpen = inject('setDropdownOpen')

const handleClick = (event) => {
  setOpen(false)
  emit('click', event)
}

const emit = defineEmits(['click'])
</script>

<template>
  <button
    class="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground w-full text-left"
    role="menuitem"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<style scoped>
.hover\:bg-accent:hover {
  background-color: #f5f5f5;
}
.focus\:bg-accent:focus {
  background-color: #f5f5f5;
}
.hover\:text-accent-foreground:hover,
.focus\:text-accent-foreground:focus {
  color: #000;
}
</style>