import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    svgr(),
  ],

  resolve: {
    alias: {
      "@":          path.resolve(__dirname, "./src"),
      "@api":       path.resolve(__dirname, "./src/api"),
      "@assets":    path.resolve(__dirname, "./src/assets"),
      "@components":path.resolve(__dirname, "./src/components"),
      "@pages":     path.resolve(__dirname, "./src/pages"),
      "@hooks":     path.resolve(__dirname, "./src/hooks"),
      "@store":     path.resolve(__dirname, "./src/store"),
      "@services":  path.resolve(__dirname, "./src/services"),
      "@utils":     path.resolve(__dirname, "./src/utils"),
      "@routes":    path.resolve(__dirname, "./src/routes"),
      "@constants": path.resolve(__dirname, "./src/constants"),
      "@types":     path.resolve(__dirname, "./src/types"),
    },
  },

  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:  ["react", "react-dom", "react-router-dom"],
          query:   ["@tanstack/react-query"],
          ui:      ["@radix-ui/react-dialog", "@radix-ui/react-toast"],
          utils:   ["axios", "zustand", "date-fns"],
        },
      },
    },
  },
});
