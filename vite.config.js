import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy file-service requests to avoid CORS in dev.
      // The browser hits /file-service/... and Vite forwards to the real API.
      '/file-service': {
        target: 'https://api.dev.iohealth.com',
        changeOrigin: true,
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Remove browser-added headers that cause the file service to reject the request
            proxyReq.removeHeader('origin')
            proxyReq.removeHeader('referer')
            proxyReq.removeHeader('sec-fetch-site')
            proxyReq.removeHeader('sec-fetch-mode')
            proxyReq.removeHeader('sec-fetch-dest')
            proxyReq.removeHeader('sec-ch-ua')
            proxyReq.removeHeader('sec-ch-ua-mobile')
            proxyReq.removeHeader('sec-ch-ua-platform')
          })
        },
      },
    },
  },
})
