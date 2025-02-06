// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    'shadcn-nuxt',
    '@nuxt/icon'  // Update this line
  ],

  colorMode: {
    classSuffix: ''
  },

  shadcn: {
    prefix: 'Ui',
    componentDir: './components/ui'
  },

  app: {
    layoutTransition: {
      name: 'layout',
      mode: 'out-in'
    }
  },

  pages: true,

  compatibilityDate: '2025-02-05'
})