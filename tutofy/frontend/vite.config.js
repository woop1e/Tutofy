import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:8080',
      '/users': 'http://localhost:8080',
      '/courses': 'http://localhost:8080',
      '/enrollments': 'http://localhost:8080',
      '/lessons': 'http://localhost:8080',
      '/assignments': 'http://localhost:8080',
      '/grades': 'http://localhost:8080',
      '/notifications': 'http://localhost:8080',
      '/progress': 'http://localhost:8080',
      '/payments': 'http://localhost:8080',
      '/messages': 'http://localhost:8080',
      '/conversations': 'http://localhost:8080',
      '/my-students': 'http://localhost:8080',
      '/my-tutors': 'http://localhost:8080',
      '/my-coursemates': 'http://localhost:8080',
      '/media': 'http://localhost:8080',
      '/reviews': 'http://localhost:8080',
      '/certificates': 'http://localhost:8080',
    },
  },
})