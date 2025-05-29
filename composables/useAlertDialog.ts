import { ref, shallowRef } from 'vue'

interface AlertOptions {
  title?: string
  message: string
  showCancel?: boolean
  actionText?: string
  cancelText?: string
  onAction?: () => void
  onCancel?: () => void
}

export function useAlertDialog() {
  const isOpen = ref(false)
  const options = shallowRef<AlertOptions>({
    title: 'Alert',
    message: '',
    showCancel: false,
    actionText: 'OK',
    cancelText: 'Cancel',
  })

  const showAlert = (title: string, message: string) => {
    options.value = {
      title: title,
      message: message,
      showCancel: false,
      actionText: 'OK',
      cancelText: 'Cancel',
    }
    isOpen.value = true
  }

  const showConfirm = (title: string, message: string, action: () => void, cancelAction?: () => void) => {
    options.value = {
      title: title,
      message: message,
      showCancel: true,
      actionText: 'Confirm',
      cancelText: 'Cancel',
      onAction: action,
      onCancel: cancelAction,
    }
    isOpen.value = true
  }

  const handleAction = () => {
    if (options.value.onAction) {
      options.value.onAction()
    }
    isOpen.value = false
  }

  const handleCancel = () => {
    if (options.value.onCancel) {
      options.value.onCancel()
    }
    isOpen.value = false
  }

  const closeAlert = () => {
    isOpen.value = false
  }

  return {
    isOpen,
    options,
    showAlert,
    showConfirm,
    handleAction,
    handleCancel,
    closeAlert
  }
} 