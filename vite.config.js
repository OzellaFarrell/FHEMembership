import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    exclude: ['@fhevm/hardhat-plugin', 'fhevmjs'],
    include: ['ethers'] // 明确包含 ethers
  },
  define: {
    global: 'globalThis', // 为 ethers 提供 global 定义
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      process: 'process/browser',
      util: 'util'
    }
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      external: [],
      output: {
        manualChunks: undefined,
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js'
      }
    },
    copyPublicDir: true
  },
  server: {
    port: 8484,
    host: true
  },
  preview: {
    port: 8484,
    host: true
  }
});