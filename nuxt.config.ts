// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: [
    '~/assets/css/global.css'
  ],
  build: {
    transpile: ['@shadcn/ui'],
    postcss: {
      plugins: {
        '@tailwindcss/postcss7-compat': {},
        autoprefixer: {},
      },
    },
  },
})
