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
