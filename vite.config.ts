import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

const faviconSourceDir = path.resolve(__dirname, "src/assets/favicon_io_hapyjo");

/** Copies favicon assets from src/assets/favicon_io_hapyjo to dist so favicon loads on all HTML pages. */
function copyFaviconsPlugin() {
  return {
    name: "copy-favicons",
    closeBundle() {
      const outDir = path.resolve(__dirname, "dist");
      const files = [
        "favicon.ico",
        "favicon-16x16.png",
        "favicon-32x32.png",
        "apple-touch-icon.png",
        "android-chrome-192x192.png",
        "android-chrome-512x512.png",
        "site.webmanifest",
      ];
      files.forEach((file) => {
        const src = path.join(faviconSourceDir, file);
        const dest = path.join(outDir, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
        }
      });
    },
  };
}

/**
 * Serves app.html for /app and /app/* during `vite dev`, mirroring the Vercel
 * rewrites in vercel.json. Without it, deep links like /app/sites would fall
 * through to the marketing index.html in development only.
 */
function fieldOpsDevRewritePlugin() {
  return {
    name: "field-ops-dev-rewrite",
    apply: "serve" as const,
    configureServer(server: { middlewares: { use: (fn: (req: { url?: string }, res: unknown, next: () => void) => void) => void } }) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? "";
        const pathname = url.split("?")[0];
        if (pathname === "/app" || pathname.startsWith("/app/")) {
          req.url = "/app.html";
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: process.env.BASE_PATH || "/",
  build: {
    rollupOptions: {
      input: [
        "index.html",
        // Field Operations app (/app) — its own entry, so the marketing pages never
        // load the app bundle and vice versa.
        "app.html",
        "about.html",
        "privacy.html",
        "services.html",
        "rentals.html",
        "industries.html",
        "blog.html",
        "blog-fleet-deployment.html",
        "blog-machinery-planning.html",
        "blog-dump-truck.html",
        "blog-heavy-equipment-rental.html",
        "blog-site-logistics.html",
        "blog-transport-efficiency.html",
        "gallery.html",
        "gallery-page-2.html",
        "gallery-page-3.html",
        "gallery-page-4.html",
        "contact.html",
      ],
    },
  },
  server: {
    host: "::",
    port: 3000,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    fieldOpsDevRewritePlugin(),
    mode === "development" && componentTagger(),
    copyFaviconsPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
