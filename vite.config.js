import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dynamicImport from 'vite-plugin-dynamic-import'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    dynamicImport()
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'lib/main.ts'),
      name: 'particlesystemsjs',
      // the proper extensions will be added
      fileName: 'particlesystems',
    },
  },
})