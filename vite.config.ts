import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// BASE_PATH wird beim Veröffentlichen auf GitHub Pages gesetzt (z. B. /Excelingo/).
export default defineConfig({ base: process.env.BASE_PATH ?? '/', plugins: [react()] });
