'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import RichTextEditor from '@/components/RichTextEditor'
import { ArrowLeft, Loader2, AlertCircle, X, Tag } from 'lucide-react'
import { Article } from '@/lib/supabase'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

type ArticleStatus = 'draft' | 'submitted' | 'published' | 'rejected'

export default function EditArticlePage() {
  const [article, setArticle] = useState<Article | null>(null)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = useState<ArticleStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id = params ? params.id as string : ''

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const fetchArticle = async () => {
      if (!user || !id) return

      try {
        // Fetch article
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('id', id)
          .eq('author_id', user.id)
          .single()

        if (error) {
          console.error('Error fetching article:', error)
          setError('Article not found or you do not have permission to edit it')
          return
        }

        if (!data) {
          setError('Article not found')
          return
        }

        // Fetch tags for this article - first get tag IDs
        const { data: articleTags, error: articleTagsError } = await supabase
          .from('article_tags')
          .select('tag_id')
          .eq('article_id', id)

        if (!articleTagsError && articleTags.length > 0) {
          // Get the tag IDs
          const tagIds = articleTags.map(item => item.tag_id)
          
          // Then fetch the actual tags
          const { data: tagsData, error: tagsError } = await supabase
            .from('tags')
            .select('name')
            .in('id', tagIds)
            
          if (!tagsError && tagsData) {
            // Set the tag names
            setTags(tagsData.map(tag => tag.name))
          } else if (tagsError) {
            console.error('Error fetching tags:', tagsError)
          }
        } else if (articleTagsError) {
          console.error('Error fetching article tags:', articleTagsError)
        }

        setArticle(data as Article)
        setTitle(data.title)
        setSummary(data.summary)
        setContent(data.content)
      } catch (error) {
        console.error('Error fetching article:', error)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchArticle()
  }, [user, id])

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()])
      }
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, status: ArticleStatus) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    setCurrentStatus(status)

    try {
      if (!user) {
        setError('You must be logged in to edit an article')
        return
      }

      if (!title.trim()) {
        setError('Title is required')
        return
      }

      if (!summary.trim()) {
        setError('Summary is required')
        return
      }

      if (!content || content === '<p></p>') {
        setError('Content is required')
        return
      }

      const updatedArticle = {
        title,
        summary,
        content,
        status,
        updated_at: new Date().toISOString(),
      }

      const { error: supabaseError } = await supabase
        .from('articles')
        .update(updatedArticle)
        .eq('id', id)
        .eq('author_id', user.id)

      if (supabaseError) {
        setError(supabaseError.message)
        return
      }

      // Update article tags
      // First get existing tags for this article
      const { data: existingArticleTags, error: existingTagsError } = await supabase
        .from('article_tags')
        .select('*')
        .eq('article_id', id)

      if (existingTagsError) {
        console.error('Error fetching existing article tags:', existingTagsError)
        setError('Failed to update tags')
        return
      }

      // Delete all existing article_tags for this article
      if (existingArticleTags.length > 0) {
        const { error: deleteError } = await supabase
          .from('article_tags')
          .delete()
          .eq('article_id', id)

        if (deleteError) {
          console.error('Error deleting existing article tags:', deleteError)
          setError('Failed to update tags')
          return
        }
      }

      // If we have tags to add, insert them
      if (tags.length > 0) {
        // Get existing tags
        const { data: existingTags } = await supabase
          .from('tags')
          .select('id, name')
          .in('name', tags)
        
        // Determine which tags already exist
        const existingTagNames = existingTags?.map(tag => tag.name) || []
        const newTagNames = tags.filter(tag => !existingTagNames.includes(tag))
        
        // Insert new tags if any
        if (newTagNames.length > 0) {
          const tagsToInsert = newTagNames.map(name => ({ name }))
          await supabase.from('tags').insert(tagsToInsert)
        }
        
        // Get all tags again to make sure we have their IDs
        const { data: allTags } = await supabase
          .from('tags')
          .select('id, name')
          .in('name', tags)
        
        if (allTags) {
          // Create article_tags junction entries
          const articleTagsToInsert = allTags.map(tag => ({
            article_id: id,
            tag_id: tag.id
          }))
          
          await supabase.from('article_tags').insert(articleTagsToInsert)
        }
      }

      router.push('/dashboard')
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setSaving(false)
      setCurrentStatus(null)
    }
  }

  const handleDelete = async () => {
    if (!user || !id) return

    setDeleteLoading(true)
    
    try {
      // First delete article_tags relationships
      await supabase
        .from('article_tags')
        .delete()
        .eq('article_id', id)

      // Then delete the article
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id)
        .eq('author_id', user.id)

      if (error) {
        console.error('Error deleting article:', error)
        setError('Failed to delete article')
        return
      }

      router.push('/dashboard')
    } catch (error) {
      console.error('Error deleting article:', error)
      setError('An unexpected error occurred')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (authLoading || loading) {
    return <div className="container py-16 text-center">Loading...</div>
  }

  if (!user) {
    return null // Will redirect in the useEffect
  }

  if (error && !article) {
    return (
      <div className="container py-16 max-w-md">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <CardTitle className="mt-4 text-xl">Article Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Edit Article</h1>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={deleteLoading}>
              {deleteLoading ? 'Deleting...' : 'Delete Article'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your article.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <form onSubmit={(e) => handleSubmit(e, article?.status as ArticleStatus || 'draft')}>
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="categorization">Categorization</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>Article Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Title
                  </label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter article title"
                    className="text-lg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="summary" className="text-sm font-medium">
                    Summary
                  </label>
                  <Textarea
                    id="summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="A brief summary of your article (300-500 characters)"
                    className="resize-none h-24"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {summary.length}/500 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="content" className="text-sm font-medium">
                    Content
                  </label>
                  <RichTextEditor content={content} onChange={setContent} />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="categorization">
            <Card>
              <CardHeader>
                <CardTitle>Article Categorization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="tags" className="text-sm font-medium">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="gap-1 px-3 py-1.5">
                        <Tag className="h-3 w-3" />
                        {tag}
                        <button 
                          type="button" 
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="tagInput"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder="Add a tag and press Enter"
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      disabled={!tagInput.trim()}
                      onClick={() => {
                        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                          setTags([...tags, tagInput.trim()])
                          setTagInput('')
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Add relevant tags to help readers find your article
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 flex justify-end">
          {article?.status === 'draft' ? (
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={(e) => handleSubmit(e as any, 'draft')}
                disabled={saving}
              >
                {saving && currentStatus === 'draft' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save as Draft'
                )}
              </Button>
              <Button 
                type="button"
                onClick={(e) => handleSubmit(e as any, 'submitted')}
                disabled={saving}
              >
                {saving && currentStatus === 'submitted' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit for Review'
                )}
              </Button>
            </div>
          ) : (
            <Button
              type="submit"
              className="ml-auto"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
} 