import { defineConfig } from "vite";
export default defineConfig({
  build: {
    rollupOptions: {
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
