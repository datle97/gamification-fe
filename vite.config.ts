import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Extract base path from VITE_BASE_URL (e.g., /internal/sandbox/)
  let base = '/'
  if (env.VITE_BASE_URL) {
    try {
      const url = new URL(env.VITE_BASE_URL)
      base = url.pathname
    } catch {
      // If not a valid URL, use as-is
      base = env.VITE_BASE_URL
    }
  }

  return {
    base,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})
