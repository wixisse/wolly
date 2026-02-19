import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";

// Only activate Electron plugin when building for desktop
const isElectron = process.env.BUILD_TARGET === "electron";

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used — do not remove them
    react(),
    tailwindcss(),

    // ── Electron plugin (dev + build) ──────────────────────────────────────
    // Activated only when BUILD_TARGET=electron so the normal web dev/build
    // is completely unaffected.
    ...(isElectron
      ? [
          electron([
            {
              // Main process
              entry: "electron/main.ts",
              vite: {
                build: {
                  outDir: "dist-electron",
                  rollupOptions: {
                    external: ["electron"],
                  },
                },
              },
            },
            {
              // Preload script
              entry: "electron/preload.ts",
              vite: {
                build: {
                  outDir: "dist-electron",
                  rollupOptions: {
                    external: ["electron"],
                  },
                },
              },
              onstart(options) {
                // Reload renderer on preload change
                options.reload();
              },
            },
          ]),
          renderer(), // Polyfills Node built-ins for the renderer process
        ]
      : []),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // ── Dev server options ──────────────────────────────────────────────────────
  server: {
    port: 5173,
    strictPort: true,
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ["**/*.svg", "**/*.csv"],

  // ── Build output ────────────────────────────────────────────────────────────
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
