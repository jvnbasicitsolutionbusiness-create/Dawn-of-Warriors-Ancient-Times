import { defineConfig } from "vite";
export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 4173,
    strictPort: true,
    hmr: {
      host: "localhost",
      port: 24679,
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        index: "index.html",
        auth: "auth.html",
        enter: "enter.html",
        lobby: "lobby.html",
      },
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three")) return "world-renderer";
          if (
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react/")
          )
            return "react-runtime";
        },
      },
    },
  },
});
