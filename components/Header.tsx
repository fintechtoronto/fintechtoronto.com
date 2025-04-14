'use client'

import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import MobileNav from '@/components/MobileNav'
import { useAuth } from '@/components/auth-provider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UserCircle, Settings, FileText, BookOpen, LayoutDashboard, LogOut, Bell, PenSquare, ChevronDown } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function Header() {
  const { user, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const getInitials = (name?: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Function to handle navigation from dropdown
  const handleNavigate = (path: string) => {
    setIsOpen(false)
    // Use window.location for hard navigation to avoid potential authentication issues
    window.location.href = path
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-primary">
              <span className="flex h-full w-full items-center justify-center text-lg font-bold text-primary-foreground">FT</span>
            </div>
            <span className="text-xl font-semibold tracking-tight">FintechToronto</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/">
              <Button variant="ghost" size="sm">Home</Button>
            </Link>
            <Link href="/blog">
              <Button variant="ghost" size="sm">Blog</Button>
            </Link>
            <Link href="/events">
              <Button variant="ghost" size="sm">Events</Button>
            </Link>
            <Link href="/series">
              <Button variant="ghost" size="sm">Series</Button>
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="hidden md:inline-flex">
                <Link href="/auth/register">Sign Up</Link>
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <div className="relative" ref={dropdownRef}>
                <button 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-input hover:bg-accent hover:text-accent-foreground transition-colors relative"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <Avatar className="h-8 w-8">
                    {user?.user_metadata?.avatar_url ? (
                      <AvatarImage src={user.user_metadata.avatar_url} alt={user?.user_metadata?.full_name || 'User'} />
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user?.user_metadata?.full_name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="hidden md:inline-block font-medium">
                    {user?.user_metadata?.full_name?.split(' ')[0] || 'Account'}
                  </span>
                  <ChevronDown className="h-4 w-4 hidden md:inline-block" />
                  {/* Notification indicator */}
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive md:top-0 md:right-2"></span>
                </button>
                
                {isOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-popover rounded-md shadow-md border border-border overflow-hidden z-50">
                    <div className="p-2 border-b border-border">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.user_metadata?.full_name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    
                    <div className="p-1">
                      <button 
                        onClick={() => handleNavigate('/dashboard')}
                        className="flex items-center gap-2 w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                      >
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Dashboard
                      </button>
                      <button 
                        onClick={() => handleNavigate('/dashboard/new-article')}
                        className="flex items-center gap-2 w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                      >
                        <PenSquare className="h-4 w-4 mr-2" />
                        Write Article
                      </button>
                      <button 
                        onClick={() => handleNavigate('/dashboard/articles')}
                        className="flex items-center gap-2 w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        My Articles
                      </button>
                    </div>
                    
                    <div className="border-t border-border p-1">
                      <button 
                        onClick={() => handleNavigate('/dashboard/notifications')}
                        className="flex items-center justify-between w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                      >
                        <div className="flex items-center">
                          <Bell className="h-4 w-4 mr-2" />
                          Notifications
                        </div>
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">3</span>
                      </button>
                      <button 
                        onClick={() => handleNavigate('/dashboard/settings/profile')}
                        className="flex items-center gap-2 w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </button>
                    </div>
                    
                    <div className="border-t border-border p-1">
                      <button 
                        onClick={() => {
                          setIsOpen(false);
                          signOut();
                        }} 
                        className="flex items-center gap-2 w-full text-left px-2 py-1.5 text-sm rounded-sm text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <Button 
                className="hidden md:inline-flex gap-1"
                variant="outline" 
                size="sm" 
                onClick={() => handleNavigate('/dashboard/new-article')}
              >
                <FileText className="h-4 w-4 mr-1" />
                Write
              </Button>
            </div>
          )}
          <ThemeToggle />
          <MobileNav />
        </div>
      </div>
    </header>
  )
} 