import { inject } from 'vue'

interface AlertOptions {
  title?: string
  actionText?: string
  cancelText?: string
}

export function useAlert() {
  const alertDialog = inject('alertDialog') as {
    alert: (message: string, title?: string) => Promise<void>
    confirm: (message: string, title?: string, options?: Partial<AlertOptions>) => Promise<boolean>
    closeDialog: () => void
  }

  if (!alertDialog) {
    throw new Error('Alert dialog plugin not installed')
  }

  const debugAlert = async (message: string, title?: string) => {
    console.log('[useAlert] debugAlert called with:', { message, title })
    console.log('[useAlert] alertDialog object:', alertDialog)
    try {
      const result = await alertDialog.alert(message, title)
      console.log('[useAlert] alert completed:', result)
      return result
    } catch (error) {
      console.error('[useAlert] alert error:', error)
      throw error
    }
  }

  return {
    alert: debugAlert,
    confirm: alertDialog.confirm,
    closeDialog: alertDialog.closeDialog
  }
} 