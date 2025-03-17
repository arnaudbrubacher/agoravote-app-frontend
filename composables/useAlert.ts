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

  return {
    alert: alertDialog.alert,
    confirm: alertDialog.confirm,
    closeDialog: alertDialog.closeDialog
  }
} 