'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { LayoutDashboard, FileText, Users, List, Settings, LogOut, Tag, Pencil, ExternalLink, UserCheck, ShieldCheck, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  // Navigation items for admin sidebar
  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: 'Submissions',
      href: '/admin/submissions',
      icon: <FileText className="h-5 w-5" />,
    },
    {
      name: 'Events',
      href: '/admin/events',
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      name: 'Moderator Requests',
      href: '/admin/requests',
      icon: <UserCheck className="h-5 w-5" />,
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: 'Roles',
      href: '/admin/roles',
      icon: <ShieldCheck className="h-5 w-5" />,
    },
    {
      name: 'Series',
      href: '/admin/series',
      icon: <List className="h-5 w-5" />,
    },
    {
      name: 'Tags',
      href: '/admin/tags',
      icon: <Tag className="h-5 w-5" />,
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 border-r bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b dark:border-gray-700">
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-md ${
                  pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </Link>
            ))}
            
            <Separator className="my-2" />
            
            <a
              href="/studio"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Pencil className="h-5 w-5" />
              <span className="ml-3">Sanity Studio</span>
              <ExternalLink className="ml-auto h-4 w-4" />
            </a>
          </nav>
          
          <div className="p-4 border-t dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium">{user?.user_metadata?.full_name || 'Admin'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1">
        <main className="h-full overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
