import { App, reactive } from 'vue'

interface AlertOptions {
  title?: string
  message: string
  showCancel?: boolean
  actionText?: string
  cancelText?: string
  onAction?: () => void
  onCancel?: () => void
}

export default {
  install: (app: App) => {
    const state = reactive({
      isOpen: false,
      options: {
        title: 'Alert',
        message: '',
        showCancel: false,
        actionText: 'OK',
        cancelText: 'Cancel',
        onAction: null as (() => void) | null,
        onCancel: null as (() => void) | null,
      }
    })

    const alert = (message: string, title?: string) => {
      state.options = {
        title: title || 'Alert',
        message,
        showCancel: false,
        actionText: 'OK',
        cancelText: 'Cancel',
        onAction: null,
        onCancel: null,
      }
      state.isOpen = true
      
      return new Promise<void>((resolve) => {
        state.options.onAction = () => {
          resolve()
        }
      })
    }

    const confirm = (message: string, title?: string, options?: Partial<AlertOptions>) => {
      state.options = {
        title: title || 'Confirm',
        message,
        showCancel: true,
        actionText: options?.actionText || 'OK',
        cancelText: options?.cancelText || 'Cancel',
        onAction: null,
        onCancel: null,
      }
      state.isOpen = true
      
      return new Promise<boolean>((resolve) => {
        state.options.onAction = () => {
          resolve(true)
        }
        state.options.onCancel = () => {
          resolve(false)
        }
      })
    }
    
    // Add a method to close the dialog programmatically
    const closeDialog = () => {
      state.isOpen = false
    }

    app.provide('alertDialog', {
      state,
      alert,
      confirm,
      closeDialog
    })

    // Add to global properties for easier access
    app.config.globalProperties.$alert = alert
    app.config.globalProperties.$confirm = confirm
    app.config.globalProperties.$closeAlertDialog = closeDialog
  }
} 