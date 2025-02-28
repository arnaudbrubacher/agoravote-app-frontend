<script setup>
import { inject, onMounted, onBeforeUnmount, watch, nextTick, ref } from 'vue'

const props = defineProps({
  align: {
    type: String,
    default: 'start',
    validator: (value) => ['start', 'end', 'center'].includes(value)
  }
})

const open = inject('dropdownOpen')
const setOpen = inject('setDropdownOpen')
const contentRef = ref(null)

// Close dropdown when clicking outside
const handleOutsideClick = (event) => {
  if (contentRef.value && !contentRef.value.contains(event.target)) {
    setOpen(false)
  }
}

// Close on escape key
const handleEscapeKey = (event) => {
  if (event.key === 'Escape') {
    setOpen(false)
  }
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
  document.addEventListener('keydown', handleEscapeKey)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
  document.removeEventListener('keydown', handleEscapeKey)
})

// Focus trap to keep focus inside dropdown when open
watch(open, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      const focusable = contentRef.value.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length > 0) {
        focusable[0].focus()
      }
    })
  }
})
</script>

<template>
  <div 
    v-show="open" 
    ref="contentRef"
    class="absolute min-w-[8rem] z-50 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
    :class="{
      'right-0': align === 'end',
      'left-1/2 -translate-x-1/2': align === 'center',
      'left-0': align === 'start'
    }"
  >
    <slot />
  </div>
</template>

<style scoped>
.bg-popover {
  background-color: white;
}
.text-popover-foreground {
  color: #333;
}
</style>