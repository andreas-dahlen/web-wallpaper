import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'
export default mergeConfig(
  viteConfig,
  defineConfig({

    test: {
      reporters: ['verbose'],

      name: 'app',
      environment: 'jsdom',

      include: [
        'src/**/*.test.ts',
      ],
      exclude: [
        'src/test/react/**'
      ],
      setupFiles: [
        'src/test/app/setup.utils.ts',
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