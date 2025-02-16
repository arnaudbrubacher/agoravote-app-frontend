import { defineNuxtConfig } from 'nuxt/config'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',  // Tailwind CSS module for styling
    '@nuxtjs/color-mode',   // Color mode module for dark/light mode
    'shadcn-nuxt'           // ShadCN module for UI components
  ],

  colorMode: {
    classSuffix: ''         // Configuration for color mode class suffix
  },

  shadcn: {
    prefix: 'Ui',           // Prefix for ShadCN components
    componentDir: './components/ui'  // Directory for ShadCN components
  },

  app: {
    layoutTransition: {
      name: 'layout',       // Name of the layout transition
      mode: 'out-in'        // Mode of the layout transition
    }
  },

  pages: true,              // Enable automatic page routing

  compatibilityDate: '2025-02-05',  // Compatibility date for Nuxt features

  // Global page headers
  head: {
    title: 'agoravote-app-frontend',
    htmlAttrs: {
      lang: 'en'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  // Global CSS
  css: [
    '~/assets/css/tailwind.css'
  ],

  // Plugins to run before rendering page
  plugins: [
  ],

  // Auto import components
  components: [
    '~/components',
    '~/components/ui'
  ],

  // Build Configuration
  build: {
  }
})