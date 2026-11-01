import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { contactEndpoint } from './src/lib/contactEndpoint.ts'

export default defineConfig(({ mode }) => {
  const configuredEndpoint = process.env.VITE_CONTACT_ENDPOINT
    ?? loadEnv(mode, process.cwd(), 'VITE_CONTACT_ENDPOINT').VITE_CONTACT_ENDPOINT
  if (configuredEndpoint?.trim() && !contactEndpoint(configuredEndpoint)) {
    throw new Error('VITE_CONTACT_ENDPOINT must be a public HTTPS Formspree /f/ form URL without credentials or query parameters.')
  }
  return {
  // Only assets imported by this app are shipped. Preserve the old public/
  // assets on disk without copying unused artwork into the current build.
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
    outDir: 'dist/phase-2',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
  }
})
