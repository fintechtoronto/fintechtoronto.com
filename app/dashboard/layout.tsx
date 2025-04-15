'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname?.split('/').filter(Boolean) || []

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
      <Link
        href="/dashboard"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Dashboard</span>
      </Link>
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join('/')}`
        const isLast = index === segments.length - 1
        const title = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')

        return (
          <div key={segment} className="flex items-center">
            <ChevronRight className="h-4 w-4" />
            {isLast ? (
              <span className="ml-1 font-medium text-foreground">{title}</span>
            ) : (
              <Link
                href={href}
                className="ml-1 hover:text-foreground transition-colors"
              >
                {title}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="container py-10">
      <Breadcrumbs />
      
      <div className="flex gap-6">
        <aside className="w-64 hidden md:block">
          <nav className="space-y-2">
            <Link
              href="/dashboard"
              className={`block px-3 py-2 rounded-lg transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              Overview
            </Link>
            <Link
              href="/dashboard/articles"
              className={`block px-3 py-2 rounded-lg transition-colors ${
                pathname?.startsWith('/dashboard/articles')
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              Articles
            </Link>
            <Link
              href="/dashboard/settings/profile"
              className={`block px-3 py-2 rounded-lg transition-colors ${
                pathname?.startsWith('/dashboard/settings')
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              Settings
            </Link>
          </nav>
        </aside>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
} 