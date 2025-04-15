'use client'

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface TableOfContentsProps {
  headings: {
    text: string
    level: number
    slug: string
  }[]
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')

  // Add intersection observer to highlight the current heading
  useEffect(() => {
    if (typeof window === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '0px 0px -80% 0px' }
    )

    // Observe all section headings
    headings.forEach(({ slug }) => {
      const element = document.getElementById(slug)
      if (element) observer.observe(element)
    })

    return () => {
      headings.forEach(({ slug }) => {
        const element = document.getElementById(slug)
        if (element) observer.unobserve(element)
      })
    }
  }, [headings])

  return (
    <nav className="text-sm">
      <ul className="space-y-2">
        {headings.map((heading) => {
          const isActive = activeId === heading.slug

          return (
            <li 
              key={heading.slug} 
              className={cn(
                "transition-colors",
                heading.level === 2 && "ml-0",
                heading.level === 3 && "ml-3",
                heading.level === 4 && "ml-6"
              )}
            >
              <a
                href={`#${heading.slug}`}
                className={cn(
                  "inline-block py-1 hover:text-primary transition-colors",
                  isActive ? "text-primary font-medium" : "text-muted-foreground"
                )}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(heading.slug)?.scrollIntoView({
                    behavior: 'smooth'
                  })
                }}
              >
                {heading.text}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
} 