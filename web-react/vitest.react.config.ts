import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      reporters: ['verbose'],

      name: 'react',
      environment: 'jsdom',

      include: [
        'src/test/react/**/*.test.{ts,tsx}',
      ],

      setupFiles: [
        'src/test/react/setup.utils.ts',
      ],

      coverage: {
        provider: 'v8',
        include: [
          'src/**/*.ts',
          'src/**/*.tsx',
        ],
        exclude: [
          'src/test/**',
          '**/*.css'
        ]
      },
    },
  })
)