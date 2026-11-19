import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// O React, o Carbon e o campbel-ui chegam prontos pelo bundle do kit
// (public/campbel/), carregado antes do app. Os imports apontam para
// os objetos globais que ele cria, e os tipos continuam vindo dos pacotes.
const globais = (arquivo: string) => fileURLToPath(new URL(`./src/globais/${arquivo}`, import.meta.url))

export default defineConfig({
  base: '/plataforma/',
  resolve: {
    alias: [
      { find: /^react$/, replacement: globais('react.ts') },
      { find: /^react\/jsx-runtime$/, replacement: globais('jsx-runtime.ts') },
      { find: /^react-dom\/client$/, replacement: globais('react-dom.ts') },
      { find: /^@carbon\/react$/, replacement: globais('carbon.ts') },
      { find: /^@carbon\/icons-react$/, replacement: globais('icones.ts') },
      { find: /^campbel-ui$/, replacement: globais('campbel-ui.ts') },
    ],
  },
  build: {
    outDir: '../src/main/resources/static/plataforma',
    emptyOutDir: true,
  },
})
