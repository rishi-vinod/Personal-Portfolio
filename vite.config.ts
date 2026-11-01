import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // Only assets imported by this app are shipped. Preserve the old public/
  // assets on disk without copying unused artwork into the Phase 1 build.
  publicDir: false,
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    fs: {
      deny: [
        '.env', '.env.*', '*.{crt,pem,key,p12,pfx,cer,der,pdf,docx}',
        '.npmrc', '.yarnrc.yml', '**/.git/**', '**/.private/**',
        '**/private/**', '**/docs/legacy/**',
      ],
    },
  },
  build: {
    // Do not delete the user's existing dist files.
    outDir: 'dist/phase-1',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
})
