import React from 'react'
import { cn } from '@/lib/utils'

type ColorTheme = 'blue' | 'indigo' | 'purple' | 'green' | 'amber'

const themes = {
  blue: {
    gradient: 'from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/40',
    icon: 'text-blue-300 dark:text-blue-700'
  },
  indigo: {
    gradient: 'from-indigo-50 to-indigo-100 dark:from-indigo-950/40 dark:to-indigo-900/40',
    icon: 'text-indigo-300 dark:text-indigo-700'
  },
  purple: {
    gradient: 'from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/40',
    icon: 'text-purple-300 dark:text-purple-700'
  },
  green: {
    gradient: 'from-green-50 to-green-100 dark:from-green-950/40 dark:to-green-900/40',
    icon: 'text-green-300 dark:text-green-700'
  },
  amber: {
    gradient: 'from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/40',
    icon: 'text-amber-300 dark:text-amber-700'
  },
}

interface ArticlePlaceholderImageProps {
  theme?: ColorTheme
  icon?: string
  className?: string
}

export function ArticlePlaceholderImage({
  theme = 'blue',
  icon = 'FT',
  className
}: ArticlePlaceholderImageProps) {
  const selectedTheme = themes[theme]
  
  return (
    <div 
      className={cn(
        "w-full h-full bg-gradient-to-br flex items-center justify-center",
        selectedTheme.gradient,
        className
      )}
    >
      <div className={cn("text-3xl font-bold", selectedTheme.icon)}>
        {icon}
      </div>
      
      {/* Abstract shapes in the background */}
      <div className="absolute top-1/4 left-1/4 w-16 h-16 rounded-full bg-white/10 dark:bg-white/5" />
      <div className="absolute bottom-1/3 right-1/3 w-12 h-12 rounded-full bg-white/10 dark:bg-white/5" />
      <div className="absolute bottom-1/4 left-1/4 w-8 h-8 rounded-full bg-white/10 dark:bg-white/5" />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-10 dark:opacity-20 pointer-events-none" 
           style={{
             backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
             backgroundSize: '16px 16px'
           }} 
      />
    </div>
  )
} 