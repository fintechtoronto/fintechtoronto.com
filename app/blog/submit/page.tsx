'use client'

import { useRouter } from 'next/navigation'
import { client } from '@/lib/sanity'
import { ArticleForm } from '@/components/blog/article-form'
import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'

export default function SubmitArticlePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [series, setSeries] = useState<{ id: string; title: string }[]>([])

  useEffect(() => {
    // Fetch available series
    const fetchSeries = async () => {
      try {
        const result = await client.fetch(`
          *[_type == "series"] {
            "id": _id,
            title
          }
        `)
        setSeries(result)
      } catch (error) {
        console.error('Error fetching series:', error)
        toast({
          title: 'Error',
          description: 'Failed to load series. Please try again later.',
          variant: 'destructive',
        })
      }
    }

    fetchSeries()
  }, [toast])

  const handleSubmit = async (data: any) => {
    try {
      // Create a new draft document
      const doc = {
        _type: 'blog',
        title: data.title,
        slug: {
          _type: 'slug',
          current: data.slug
        },
        excerpt: data.excerpt,
        content: data.content,
        series: data.seriesId ? {
          _type: 'reference',
          _ref: data.seriesId
        } : undefined,
        status: 'draft',
        publishDate: new Date().toISOString()
      }

      await client.create(doc)

      toast({
        title: 'Success',
        description: 'Your article has been submitted for review.',
      })

      router.push('/blog')
    } catch (error) {
      console.error('Error submitting article:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit article. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Submit an Article</h1>
        <p className="text-muted-foreground">
          Share your insights with the Toronto fintech community. All submissions will be reviewed before publishing.
        </p>
      </div>

      <ArticleForm
        series={series}
        onSubmit={handleSubmit}
      />
    </div>
  )
} 