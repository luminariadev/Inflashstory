import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa' 

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      // ✅ FIX BLANK PUTIH: Ngajarin PWA cara nanganin refresh halaman pas offline
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'], // Cache semua file UI
        navigateFallback: '/index.html', // Kalau refresh gagal, balikin ke index.html
        navigateFallbackAllowlist: [/^(?!\/__).*/] 
      },
      manifest: {
        name: 'Inflashtory - QR Inventory',
        short_name: 'Inflashtory',
        description: 'Aplikasi Peminjaman Barang Laboratorium',
        theme_color: '#121215',
        background_color: '#121215',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable' // ✅ FIX WARNING 1: Hapus kata 'any '
          }
        ],
        // ✅ FIX WARNING 2: Tambahin dummy screenshot (Bikin tampilan install ala Play Store)
        screenshots: [
          {
            src: '/pwa-512x512.png', // Pake logo lu dulu aja buat sementara
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Dashboard Admin Inflashtory'
          },
          {
            src: '/pwa-512x512.png', // Pake logo lu dulu aja buat sementara
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Aplikasi Peminjaman Mobile'
          }
        ]
      },
      // ✅ INI KUNCI SAKTINYA BIAR MANIFEST MUNCUL DI LOCALHOST!
      devOptions: {
        enabled: true,
        type: 'module',
      }
    })
  ],
  server: {
    port: 5173,
    open: true,
    allowedHosts: [
      'consuming-defender-prompter.ngrok-free.dev', // Link ngrok lu
      '.ngrok-free.dev' 
    ],
    // ✅ SETTINGAN PROXY LU AMAN GAK KESENTUH
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})