import Vue from 'vue'

declare module 'vue' {
  interface ComponentCustomProperties {
    $alert: (message: string, title?: string) => Promise<void>
    $confirm: (message: string, title?: string, options?: {
      actionText?: string
      cancelText?: string
    }) => Promise<boolean>
  }
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $alert: (message: string, title?: string) => Promise<void>
    $confirm: (message: string, title?: string, options?: {
      actionText?: string
      cancelText?: string
    }) => Promise<boolean>
  }
} 