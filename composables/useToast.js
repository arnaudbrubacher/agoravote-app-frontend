import { ref, readonly } from 'vue'

// Simple toast notification system
const toasts = ref([])
let nextId = 0

export function useToast() {
  // Add a new toast notification
  const toast = (options) => {
    const id = nextId++
    const defaultDuration = 5000
    
    const newToast = {
      id,
      title: options.title || 'Notification',
      description: options.description || '',
      type: options.type || 'default', // default, success, error, warning, info
      duration: options.duration || defaultDuration,
    }
    
    toasts.value.push(newToast)
    
    // Auto-remove toast after duration
    setTimeout(() => {
      dismiss(id)
    }, newToast.duration)
    
    return id
  }
  
  // Remove a specific toast by ID
  const dismiss = (id) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }
  
  // Clear all toasts
  const clearAll = () => {
    toasts.value = []
  }
  
  return {
    toasts: readonly(toasts),
    toast,
    dismiss,
    clearAll
  }
}