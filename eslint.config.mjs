// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

// Run `npx @eslint/config-inspector` to inspect the resolved config interactively
export default createConfigForNuxt({
  features: {
    // Rules for module authors
    tooling: true,
    // Rules for formatting
    stylistic: false,
  },
  dirs: {
    src: [
      './playground',
    ],
  },
})
  .append({
    // Nuxt page files in the test fixtures are named by their route
    files: ['test/fixtures/**/pages/**/*.vue'],
    rules: { 'vue/multi-word-component-names': 'off' },
  })
