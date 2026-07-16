import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// internal supply-provisioning-service (offers); proxied to avoid browser CORS.
// ClusterIP pinned directly because macOS DNS for telepresence cluster names is flaky;
// refresh via: kubectl --context aks-emea-dev -n fourscreen get svc supply-provisioning-service
const SUPPLY_PROXY = {
  '/api/supply': {
    target: 'http://10.0.197.101:8080',
    changeOrigin: true
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: SUPPLY_PROXY
  },
  preview: {
    port: 3000,
    proxy: SUPPLY_PROXY
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          maplibre: ['maplibre-gl'],
          react: ['react', 'react-dom']
        }
      }
    }
  }
})
