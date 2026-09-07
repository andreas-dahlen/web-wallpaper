import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        './vitest.app.config.ts',
        './vitest.react.config.ts',
        './tools/token-compiler/vitest.config.ts',
        './tools/lint/vitest.config.ts',
        './tools/plugins/vitest.config.ts',
        './tools/extensions/*/vitest.config.ts'
      ]
    }
  })
)