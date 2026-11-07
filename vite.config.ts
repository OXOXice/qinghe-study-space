import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
const base=process.env.GITHUB_PAGES_BASE || '/';
if(!/^\/(?:[A-Za-z0-9._-]+\/)*$/.test(base))throw new Error('GITHUB_PAGES_BASE must be an absolute path ending with /.');
export default defineConfig({base,cacheDir:'.vite-cache',plugins:[react()],build:{rollupOptions:{input:{campus:fileURLToPath(new URL('./index.html',import.meta.url)),english:fileURLToPath(new URL('./english/index.html',import.meta.url))}}}});
