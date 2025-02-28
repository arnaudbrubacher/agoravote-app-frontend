<!-- filepath: /Users/arnaudbrubacher/Desktop/-AGORA/CODE/agoravote-app-frontend/components/ui/dialog/Dialog.vue -->
<script setup>
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:open'])

// Watch for open prop changes to emit events
watch(() => props.open, (newVal) => {
  if (newVal) {
    document.body.classList.add('overflow-hidden')
  } else {
    document.body.classList.remove('overflow-hidden')
  }
})

// Clean up on unmount
onUnmounted(() => {
  document.body.classList.remove('overflow-hidden')
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-50">
        <div 
          class="fixed inset-0 bg-black/50"
          @click="emit('update:open', false)"
          aria-hidden="true"
        />
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>