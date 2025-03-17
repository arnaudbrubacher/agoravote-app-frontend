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

  const showAlert = (alertOptions: AlertOptions) => {
    options.value = {
      title: alertOptions.title || 'Alert',
      message: alertOptions.message,
      showCancel: alertOptions.showCancel || false,
      actionText: alertOptions.actionText || 'OK',
      cancelText: alertOptions.cancelText || 'Cancel',
      onAction: alertOptions.onAction,
      onCancel: alertOptions.onCancel,
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
    handleAction,
    handleCancel,
    closeAlert
  }
} 