'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-provider'
import { useState, useEffect, useRef } from 'react'

export default function MobileNav() {
  const { user, loading, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    try {
      setIsOpen(false);
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="md:hidden relative" ref={mobileMenuRef}>
      <Button 
        variant="ghost" 
        size="icon" 
        className="md:hidden h-9 w-9 flex items-center justify-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[240px] bg-popover rounded-md shadow-md border border-border overflow-hidden z-50">
          <div className="p-2">
            <p className="text-sm font-medium px-2 py-1">Navigation</p>
          </div>
          
          <div className="p-1">
            <Link href="/" className="flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground">
              Home
            </Link>
            <Link href="/blog" className="flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground">
              Blog
            </Link>
            <Link href="/events" className="flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground">
              Events
            </Link>
            <Link href="/series" className="flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground">
              Series
            </Link>
          </div>
          
          <div className="border-t border-border p-1">
            <Link href="/newsletter" className="flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground">
              Newsletter
            </Link>
            <Link href="/contribute" className="flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground">
              Contribute
            </Link>
          </div>

          {loading ? (
            <div className="border-t border-border p-2 flex justify-center">
              <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
            </div>
          ) : user ? (
            <>
              <div className="border-t border-border p-1">
                <p className="text-sm font-medium px-2 py-1">Account</p>
                <Link href="/dashboard" className="flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground">
                  Dashboard
                </Link>
                <Link href="/dashboard/new-article" className="flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground">
                  New Article
                </Link>
              </div>
              <div className="border-t border-border p-1">
                <button 
                  onClick={handleSignOut} 
                  className="flex items-center w-full text-left px-2 py-1.5 text-sm rounded-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="border-t border-border p-1">
                <Link href="/auth/login" className="flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground">
                  Sign In
                </Link>
                <Link href="/auth/register" className="flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground">
                  Sign Up
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
} 