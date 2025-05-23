import { defineNuxtConfig } from 'nuxt/config'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',  // Tailwind CSS module for styling
    '@nuxtjs/color-mode',   // Color mode module for dark/light mode
    'shadcn-nuxt',           // ShadCN module for UI components
    '@nuxt/icon',
    // '@nuxtjs/axios'
    // '@nuxtjs/auth-next'
  ],

  // Fix for colorMode type error - use proper configuration format
  // @ts-ignore - Type issues with @nuxtjs/color-mode module
  colorMode: {
    classSuffix: ''         // Configuration for color mode class suffix
  },

  shadcn: {
    prefix: '',
    componentDir: './components/ui'
  },

  // Add runtimeConfig to expose environment variables
  runtimeConfig: {
    public: {
      signupAccessKey: process.env.NUXT_PUBLIC_SIGNUP_ACCESS_KEY || '',
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8088',
      supertokensApiDomain: process.env.NUXT_PUBLIC_SUPERTOKENS_API_DOMAIN || 'http://localhost:8088',
      stripePublishableKey: process.env.NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
      electionGuardApiBaseUrl: process.env.NUXT_PUBLIC_ELECTIONGUARD_API_BASE_URL || 'http://localhost:8088'
    }
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
    '~/assets/css/tailwind.css',
    '~/assets/css/main.css'
  ],

  // Plugins to run before rendering page
  plugins: [
    '~/plugins/01.axios.ts',
    '~/plugins/supertokens.client.js',
    // '~/plugins/event-bus.js'
  ],

  // Auto import components
  components: [
    '~/components',
    '~/components/ui'
  ],

  // Vite Configuration
  vite: {
    // Add your Vite configuration here if needed
    server: {
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 24678,
      },
      watch: {
        usePolling: true,
        interval: 100
      }
    }
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

  // Auth module configuration (SuperTokens is handled via plugin)
  /*
  auth: {
    strategies: {
      local: false, // Disable default local strategy
      supertokens: {
        provider: '~/auth/supertokens-provider.js', // Path to your SuperTokens provider
        token: {
          global: true,
        },
        user: {
          property: false, // We handle user fetching manually
        },
        endpoints: {
          login: { url: '/auth/signin', method: 'post' },
          logout: { url: '/auth/signout', method: 'post' },
          user: false // Disable automatic user fetching, we use custom logic
        }
      }
    },
    redirect: {
      login: '/auth',
      logout: '/auth',
      callback: false, // SuperTokens handles callbacks
      home: '/profile'
    },
    plugins: ['~/plugins/supertokens.client.js'] // Ensure SuperTokens plugin is registered
  },
  */

  // Build Configuration
  build: {
    transpile: ['jsonwebtoken']
  },

  // Server-side rendering can be enabled or disabled
  // ssr: false, // Set to false if you want a pure SPA, true for SSR (default)
})