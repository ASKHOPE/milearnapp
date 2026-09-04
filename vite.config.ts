import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 3500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('citation-js') || id.includes('@citation-js')) {
              return 'vendor-citation';
            }
            if (id.includes('three')) {
              return 'vendor-three';
            }
            if (id.includes('blockly')) {
              return 'vendor-blockly';
            }
            if (id.includes('@xyflow') || id.includes('@reactflow')) {
              return 'vendor-xyflow';
            }
            if (id.includes('desmos') || id.includes('advanced-calculator')) {
              return 'vendor-math';
            }
            if (id.includes('mermaid')) {
              return 'vendor-mermaid';
            }
            if (id.includes('katex')) {
              return 'vendor-katex';
            }
            if (id.includes('tesseract.js')) {
              return 'vendor-ocr';
            }
            if (id.includes('pdfjs-dist') || id.includes('epubjs')) {
              return 'vendor-readers';
            }
            if (id.includes('fabric') || id.includes('two.js') || id.includes('perfect-freehand')) {
              return 'vendor-canvas';
            }
            if (id.includes('react-dom') || id.includes('react/')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
          }
        }
      }
    }
  }
})

