import { defineNuxtConfig } from 'nuxt/config'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',  // Tailwind CSS module for styling
    '@nuxtjs/color-mode',   // Color mode module for dark/light mode
    'shadcn-nuxt'           // ShadCN module for UI components
    // Remove or comment out the @nuxtjs/axios module
    // '@nuxtjs/axios'
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

  routes: {
    '/group/:id': {
      name: 'group-details',
      component: '~/pages/group/[id].vue'
    }
  },

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

  // Vite Configuration
  vite: {
    // Add your Vite configuration here if needed
  },

  // PostCSS Configuration
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  // Remove the axios configuration
  // axios: {
  //   baseURL: 'http://localhost:8080'
  // },

  // Build Configuration
  build: {
  }
})