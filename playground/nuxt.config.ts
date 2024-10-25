export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },
  css: ['~/assets/main.css'],
  compatibilityDate: '2024-10-25',
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  dcupl: {
    config: {
      projectId: 'PP7ECntN4AI5Zfn5vEou',
      apiKey: 'e0aa9e13-8f82-4edb-a5f3-3cf0c9e40207',
    },
    reloadHook: {
      secret: 'super-secret',
    },
  },
})
