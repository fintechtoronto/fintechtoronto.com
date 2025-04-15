import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, BookOpen } from 'lucide-react'
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'
import { ArticlePlaceholderImage } from '@/components/ui/article-placeholder-image'
import { SeriesBadge } from '@/components/ui/series-badge'
import { cn } from '@/lib/utils'

export type ColorTheme = 'blue' | 'indigo' | 'purple' | 'green' | 'amber' | 'pink'

type SeriesInfo = {
  title: string
  slug?: string
}

type Author = {
  name: string
  slug?: string
  image?: any
}

interface ArticleCardProps {
  title: string
  slug: string
  excerpt?: string
  image?: any
  publishDate?: string
  authors?: Author[]
  series?: SeriesInfo
  theme?: ColorTheme
  imageUrl?: string
  className?: string
  withHoverEffect?: boolean
}

// Helper function to get theme colors
const getThemeColors = (theme: ColorTheme) => {
  const colors = {
    blue: {
      light: 'bg-blue-100',
      dark: 'bg-blue-900/40',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-700',
      shadow: 'shadow-blue-500/10',
      ribbon: 'from-blue-500 to-blue-600',
    },
    indigo: {
      light: 'bg-indigo-100',
      dark: 'bg-indigo-900/40',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-200 dark:border-indigo-700',
      shadow: 'shadow-indigo-500/10',
      ribbon: 'from-indigo-500 to-indigo-600',
    },
    purple: {
      light: 'bg-purple-100',
      dark: 'bg-purple-900/40',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-700',
      shadow: 'shadow-purple-500/10',
      ribbon: 'from-purple-500 to-purple-600',
    },
    green: {
      light: 'bg-green-100',
      dark: 'bg-green-900/40',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-700',
      shadow: 'shadow-green-500/10',
      ribbon: 'from-green-500 to-green-600',
    },
    amber: {
      light: 'bg-amber-100',
      dark: 'bg-amber-900/40',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-700',
      shadow: 'shadow-amber-500/10',
      ribbon: 'from-amber-500 to-amber-600',
    },
    pink: {
      light: 'bg-pink-100',
      dark: 'bg-pink-900/40',
      text: 'text-pink-600 dark:text-pink-400',
      border: 'border-pink-200 dark:border-pink-700',
      shadow: 'shadow-pink-500/10',
      ribbon: 'from-pink-500 to-pink-600',
    },
  };
  return colors[theme];
}

export function ArticleCard({
  title,
  slug,
  excerpt,
  image,
  publishDate,
  authors = [],
  series,
  theme = 'blue',
  imageUrl,
  className,
  withHoverEffect = true
}: ArticleCardProps) {
  // Format date if provided
  const formattedDate = publishDate 
    ? new Date(publishDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : '';
  
  const themeColors = getThemeColors(theme);

  return (
    <div className={cn("group relative h-full", className)}>
      <Card className="h-full transition-all duration-300 bg-card hover:shadow-md overflow-hidden">
        {withHoverEffect && (
          <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <HoverBorderGradient
              containerClassName="absolute inset-0 rounded-xl"
              className="hidden"
              duration={1.5}
              as="div"
            />
          </div>
        )}
        
        {/* Ribbon for series (positioned outside the card) */}
        {series && (
          <div className="absolute -right-2 top-4 z-20">
            <div className={`flex items-center py-1 pl-2 pr-3 rounded-l-md bg-gradient-to-r ${themeColors.ribbon} text-white shadow-md`}>
              <BookOpen className="h-3.5 w-3.5 mr-1.5" />
              <span className="text-xs font-medium whitespace-nowrap">{series.title}</span>
            </div>
            {/* Triangle at bottom of ribbon */}
            <div className={`absolute top-full right-0 w-2 h-2 bg-gradient-to-r ${themeColors.ribbon} brightness-75`}></div>
          </div>
        )}
        
        <div className="aspect-video w-full bg-card relative overflow-hidden">
          {imageUrl ? (
            <Image 
              src={imageUrl} 
              alt={title}
              fill 
              className="object-cover transition-transform group-hover:scale-105 duration-500"
            />
          ) : image ? (
            <Image 
              src={image} 
              alt={title} 
              fill 
              className="object-cover transition-transform group-hover:scale-105 duration-300"
            />
          ) : (
            <ArticlePlaceholderImage theme={theme as 'blue' | 'indigo' | 'purple' | 'green' | 'amber'} />
          )}
          
          {/* Badge for series (positioned inside the image) */}
          {series && (
            <div className="absolute bottom-3 left-3 z-10">
              <SeriesBadge 
                title={series.title}
                slug={series.slug}
                theme={theme as any}
              />
            </div>
          )}
        </div>
        
        <CardHeader className="p-5 pb-3">
          <div>
            {((authors && authors.length > 0) || formattedDate) && (
              <div className="flex items-center gap-2 mb-3">
                <div className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center",
                  {
                    "bg-blue-100 dark:bg-blue-900/40": theme === 'blue',
                    "bg-indigo-100 dark:bg-indigo-900/40": theme === 'indigo',
                    "bg-purple-100 dark:bg-purple-900/40": theme === 'purple',
                    "bg-green-100 dark:bg-green-900/40": theme === 'green',
                    "bg-amber-100 dark:bg-amber-900/40": theme === 'amber',
                    "bg-pink-100 dark:bg-pink-900/40": theme === 'pink'
                  }
                )}>
                  <span className={cn(
                    "text-xs font-semibold",
                    {
                      "text-blue-600 dark:text-blue-400": theme === 'blue',
                      "text-indigo-600 dark:text-indigo-400": theme === 'indigo',
                      "text-purple-600 dark:text-purple-400": theme === 'purple',
                      "text-green-600 dark:text-green-400": theme === 'green',
                      "text-amber-600 dark:text-amber-400": theme === 'amber',
                      "text-pink-600 dark:text-pink-400": theme === 'pink'
                    }
                  )}>FT</span>
                </div>
                
                {authors && authors.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {authors.map((author) => author.name).join(', ')}
                  </span>
                )}
                
                {formattedDate && (
                  <>
                    {authors && authors.length > 0 && (
                      <span className="text-sm text-muted-foreground">•</span>
                    )}
                    <span className="text-sm text-muted-foreground">{formattedDate}</span>
                  </>
                )}
              </div>
            )}
            
            <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-2">
              <Link href={`/blog/${slug}`}>{title}</Link>
            </CardTitle>
          </div>
        </CardHeader>
        
        {excerpt && (
          <CardContent className="px-5 py-2 flex-grow">
            <p className="text-muted-foreground line-clamp-3 text-sm">
              {excerpt}
            </p>
          </CardContent>
        )}
        
        <CardFooter className="border-t px-5 py-4 mt-auto">
          <Button variant="ghost" size="sm" className="px-0 hover:bg-transparent hover:text-primary" asChild>
            <Link href={`/blog/${slug}`} className="flex items-center text-sm font-medium">
              Read article
              <ArrowRight className="ml-1.5 h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 