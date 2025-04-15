import React from 'react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type ColorTheme = 'blue' | 'indigo' | 'purple' | 'green' | 'amber' | 'pink'

const themes = {
  blue: {
    bg: 'bg-blue-50/90 dark:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    hover: 'hover:bg-blue-100/90 dark:hover:bg-blue-800/40',
  },
  indigo: {
    bg: 'bg-indigo-50/90 dark:bg-indigo-900/30',
    border: 'border-indigo-200 dark:border-indigo-800',
    text: 'text-indigo-700 dark:text-indigo-300',
    hover: 'hover:bg-indigo-100/90 dark:hover:bg-indigo-800/40',
  },
  purple: {
    bg: 'bg-purple-50/90 dark:bg-purple-900/30',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-700 dark:text-purple-300',
    hover: 'hover:bg-purple-100/90 dark:hover:bg-purple-800/40',
  },
  green: {
    bg: 'bg-green-50/90 dark:bg-green-900/30',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-700 dark:text-green-300',
    hover: 'hover:bg-green-100/90 dark:hover:bg-green-800/40',
  },
  amber: {
    bg: 'bg-amber-50/90 dark:bg-amber-900/30',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    hover: 'hover:bg-amber-100/90 dark:hover:bg-amber-800/40',
  },
  pink: {
    bg: 'bg-pink-50/90 dark:bg-pink-900/30',
    border: 'border-pink-200 dark:border-pink-800',
    text: 'text-pink-700 dark:text-pink-300',
    hover: 'hover:bg-pink-100/90 dark:hover:bg-pink-800/40',
  },
}

interface SeriesBadgeProps {
  title: string
  slug?: string
  theme?: ColorTheme
  className?: string
}

export function SeriesBadge({
  title,
  slug,
  theme = 'blue',
  className
}: SeriesBadgeProps) {
  const selectedTheme = themes[theme]
  
  const badgeClasses = cn(
    "inline-flex items-center rounded-full backdrop-blur-sm px-3 py-1 text-xs font-medium border transition-colors",
    selectedTheme.bg,
    selectedTheme.border,
    selectedTheme.text,
    selectedTheme.hover,
    className
  )
  
  if (slug) {
    return (
      <Link href={`/series/${slug}`} className={badgeClasses}>
        {title}
      </Link>
    )
  }
  
  return (
    <span className={badgeClasses}>
      {title}
    </span>
  )
} 