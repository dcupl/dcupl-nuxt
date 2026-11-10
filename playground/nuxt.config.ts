import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },
  css: ['~/assets/main.css'],
  compatibilityDate: '2026-11-10',
  vite: {
    plugins: [tailwindcss()],
  },
  dcupl: {
    config: {
      projectId: 'PP7ECntN4AI5Zfn5vEou',
      apiKey: 'e0aa9e13-8f82-4edb-a5f3-3cf0c9e40207',
    },
    reloadHook: {
      secret: 'super-secret',
    },
    // updateCheckInterval: 60_000,
    // shouldUpdate: async () => {
    //   console.log('called my custom update function')
    //   return true
    // },
  },
})
