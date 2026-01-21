import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    {
      name: 'spa-fallback',
      configureServer(server) {
        // Run early to intercept SPA routes before static file serving
        server.middlewares.use((req, _res, next) => {
          const url = req.url || ''
          // SPA routes that should fall back to index.html
          // Match /guestbook/* but not static files (those have extensions)
          if (url.startsWith('/guestbook') && !url.includes('.')) {
            req.url = '/'
          }
          next()
        })
      },
    },
    {
      name: 'demo-redirect',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/demo' || req.url === '/demo/') {
            res.writeHead(302, { Location: '/demo/index.html' })
            res.end()
            return
          }
          next()
        })
      },
    },
    {
      name: 'advanced-redirect',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/advanced' || req.url === '/advanced/') {
            res.writeHead(302, { Location: '/advanced/index.html' })
            res.end()
            return
          }
          next()
        })
      },
    },
    {
      name: '2-redirect',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/2' || req.url === '/2/') {
            res.writeHead(302, { Location: '/2/index.html' })
            res.end()
            return
          }
          next()
        })
      },
    },
  ],
})
