import { Link } from 'react-router'

export function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">Welcome to Vibe Stack 🚀</h1>
      <p className="mt-4 text-muted-foreground">
        React 19 + Vite + TypeScript + TailwindCSS v4 + shadcn/ui
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Claude Theme by tweakcn
      </p>
    </div>
  )
}
