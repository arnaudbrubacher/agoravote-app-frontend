import { defineNuxtPlugin } from '#app'
import alertDialogPlugin from './alertDialog'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(alertDialogPlugin)
}) 