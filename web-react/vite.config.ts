import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'node:path'
import svgr from "vite-plugin-svgr";
import { tokenCompiler } from './tools/plugins/src/vite.token-compiler.ts';

const fromRoot = (relativePath: string) => path.resolve(import.meta.dirname, relativePath)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tokenCompiler(),
    react(),
    viteSingleFile(),
    svgr()
  ],
  base: './',
  build: {
    target: 'es2015',
    minify: true
  },
  resolve: {
    alias: {
      '@api': fromRoot('src/api'),
      '@app': fromRoot('src/app'),
      '@assets': fromRoot('src/assets'),
      '@blocks': fromRoot('src/blocks'),
      '@composites': fromRoot('src/composites'),
      '@config': fromRoot('src/config'),
      '@data': fromRoot('src/data'),
      '@features': fromRoot('src/features'),
      '@interaction': fromRoot('src/interaction'),
      '@panels': fromRoot('src/panels'),
      '@primitives': fromRoot('src/primitives'),

      '@shared': fromRoot('src/shared/'),
      '@stores': fromRoot('src/shared/state/stores'),
      '@hooks': fromRoot('src/shared/state/hooks'),
      '@types': fromRoot('src/shared/types'),
      '@styles': fromRoot('src/shared/styles'),
      '@generated': fromRoot('src/styleTokens/generated'),

      // '@styleTokens': fromRoot('src/styleTokens'),

      '@test': fromRoot('src/test')
    }
  }
})