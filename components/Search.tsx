'use client'

import { useState, useEffect } from 'react'
import { Search as SearchIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useDebounce } from '@/lib/hooks'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type SearchResult = {
  type: 'blog' | 'event' | 'series'
  title: string
  slug: string
  description?: string
  date?: string
}

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    async function performSearch() {
      if (!debouncedQuery) {
        setResults([])
        return
      }

      setIsLoading(true)

      try {
        const { data, error } = await supabase
          .rpc('search_content', {
            search_query: debouncedQuery
          })

        if (error) throw error
        setResults(data || [])
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    performSearch()
  }, [debouncedQuery])

  return (
    <div className="relative">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
        <Input
          type="search"
          placeholder="Search articles, events, and series..."
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {(query || results.length > 0) && (
        <Card className="absolute mt-2 w-full z-50">
          <CardContent className="p-2">
            {isLoading ? (
              <p className="p-2 text-sm text-neutral-600">Searching...</p>
            ) : results.length > 0 ? (
              <ul className="space-y-2">
                {results.map((result, index) => (
                  <li key={index}>
                    <Link
                      href={`/${result.type}/${result.slug}`}
                      className="block p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md"
                    >
                      <div className="text-sm font-medium">{result.title}</div>
                      {result.description && (
                        <div className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-1">
                          {result.description}
                        </div>
                      )}
                      {result.date && (
                        <div className="text-xs text-neutral-500 mt-1">
                          {new Date(result.date).toLocaleDateString()}
                        </div>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : query ? (
              <p className="p-2 text-sm text-neutral-600">No results found</p>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 