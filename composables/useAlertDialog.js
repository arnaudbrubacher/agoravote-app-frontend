import { ref } from 'vue'

export function useAlertDialog() {
  const isOpen = ref(false)
  const title = ref('')
  const message = ref('')
  const actionText = ref('OK')
  const cancelText = ref('Cancel')
  const showCancel = ref(false)
  const actionCallback = ref(null)
  const cancelCallback = ref(null)

  // Show a simple alert dialog
  const showAlert = (alertTitle, alertMessage, alertActionText = 'OK') => {
    title.value = alertTitle
    message.value = alertMessage
    actionText.value = alertActionText
    showCancel.value = false
    actionCallback.value = null
    cancelCallback.value = null
    isOpen.value = true
  }

  // Show a confirmation dialog with both confirm and cancel options
  const showConfirm = (confirmTitle, confirmMessage, onConfirm, onCancel = null, confirmActionText = 'Confirm', confirmCancelText = 'Cancel') => {
    title.value = confirmTitle
    message.value = confirmMessage
    actionText.value = confirmActionText
    cancelText.value = confirmCancelText
    showCancel.value = true
    actionCallback.value = onConfirm
    cancelCallback.value = onCancel
    isOpen.value = true
  }

  // Handler for the action button
  const handleAction = () => {
    if (actionCallback.value) {
      actionCallback.value()
    }
    isOpen.value = false
  }

  // Handler for the cancel button
  const handleCancel = () => {
    if (cancelCallback.value) {
      cancelCallback.value()
    }
    isOpen.value = false
  }

  return {
    isOpen,
    title,
    message,
    actionText,
    cancelText,
    showCancel,
    showAlert,
    showConfirm,
    handleAction,
    handleCancel
  }
} 