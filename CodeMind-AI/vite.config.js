import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 12000,
    cors: true,
    allowedHosts: ['work-1-iglohtlhgdkjqkdx.prod-runtime.all-hands.dev', 'work-1-wcanbphwerymqpxm.prod-runtime.all-hands.dev', 'localhost', '127.0.0.1'],
    headers: {
      'X-Frame-Options': 'ALLOWALL',
      'Access-Control-Allow-Origin': '*'
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/ui/components',
      '@utils': '/src/utils',
      '@core': '/src/core'
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify('1.0.0')
  }
})