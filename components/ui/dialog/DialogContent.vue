<script setup>
import { onMounted, onUnmounted, nextTick } from 'vue'

// Focus trap implementation
const focusableSelectors = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

const props = defineProps({
  closeOnEscape: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['close'])

let firstFocusableEl
let lastFocusableEl
let previousActiveElement = null

const handleKeyDown = (e) => {
  if (e.key === 'Escape' && props.closeOnEscape) {
    emit('close')
    return
  }

  if (e.key !== 'Tab') return

  // Handle focus trap
  const focusableElements = Array.from(
    document.querySelector('.dialog-content')?.querySelectorAll(focusableSelectors) || []
  )

  firstFocusableEl = focusableElements[0]
  lastFocusableEl = focusableElements[focusableElements.length - 1]

  if (e.shiftKey) {
    if (document.activeElement === firstFocusableEl) {
      lastFocusableEl?.focus()
      e.preventDefault()
    }
  } else {
    if (document.activeElement === lastFocusableEl) {
      firstFocusableEl?.focus()
      e.preventDefault()
    }
  }
}

onMounted(() => {
  previousActiveElement = document.activeElement
  
  nextTick(() => {
    const focusableElements = Array.from(
      document.querySelector('.dialog-content')?.querySelectorAll(focusableSelectors) || []
    )
    if (focusableElements.length) {
      focusableElements[0].focus()
    }
  })
  
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  if (previousActiveElement) {
    previousActiveElement.focus()
  }
})
</script>

<template>
  <div 
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-20"
    role="dialog"
    aria-modal="true"
  >
    <div 
      class="dialog-content relative bg-background w-full max-w-lg rounded-lg border shadow-lg sm:max-w-md"
      @click.stop
    >
      <button
        class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        @click="emit('close')"
        type="button"
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <slot />
    </div>
  </div>
</template>