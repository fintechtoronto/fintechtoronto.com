'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import RichTextEditor from '@/components/RichTextEditor'
import { ArrowLeft, Loader2, Plus, Upload, X, Tag, Info, AlertCircle } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"

type Series = {
  id: string;
  name: string;
  status: string;
  created_by?: string;
}

export default function NewArticlePage() {
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('<p>Start writing your article here...</p>')
  const [seriesList, setSeriesList] = useState<Series[]>([])
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null)
  const [newSeriesName, setNewSeriesName] = useState('')
  const [newSeriesDescription, setNewSeriesDescription] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [creatingNewSeries, setCreatingNewSeries] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  
  // SEO fields
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [featuredImage, setFeaturedImage] = useState<string | null>(null)
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const [error, setError] = useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = useState<'draft' | 'submitted' | null>(null)
  const [saving, setSaving] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [success, setSuccess] = useState<string | null>(null)

  // Load series list
  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const { data, error } = await supabase
          .from('series')
          .select('id, name, status, created_by')
          .order('name')
        
        if (error) throw error
        
        // Include only approved series or ones created by the current user
        if (user) {
          setSeriesList(data.filter(series => 
            series.status === 'approved' || series.created_by === user.id
          ))
        }
      } catch (err) {
        console.error('Error fetching series:', err)
      }
    }
    
    if (user) {
      fetchSeries()
    }
  }, [user])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  const handleCreateNewSeries = async () => {
    if (!newSeriesName.trim()) {
      return
    }
    
    try {
      setCreatingNewSeries(true)
      
      const { data, error } = await supabase
        .from('series')
        .insert({
          name: newSeriesName,
          description: newSeriesDescription,
          created_by: user!.id,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
      
      if (error) throw error
      
      if (data && data[0]) {
        // Add the new series to the list
        setSeriesList([...seriesList, data[0]])
        
        // Select the new series
        setSelectedSeries(data[0].id)
        
        // Reset form fields
        setNewSeriesName('')
        setNewSeriesDescription('')
        
        // Close dialog
        setIsDialogOpen(false)
      }
    } catch (err) {
      console.error('Error creating new series:', err)
      setError('Failed to create new series')
    } finally {
      setCreatingNewSeries(false)
    }
  }

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return
    
    try {
      setIsUploading(true)
      setUploadProgress(0)
      
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
      const filePath = `article-images/${fileName}`
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 5
        })
      }, 100)
      
      const { error } = await supabase.storage
        .from('user-content')
        .upload(filePath, file, { upsert: true })
        
      if (error) throw error
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      const { data: { publicUrl } } = supabase.storage
        .from('user-content')
        .getPublicUrl(filePath)
        
      setFeaturedImage(publicUrl)
    } catch (error) {
      console.error('Error uploading image:', error)
      setError('Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, status: 'draft' | 'submitted') => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)
    setCurrentStatus(status)

    try {
      if (!user) {
        setError('You must be logged in to create an article')
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

      if (content === '<p>Start writing your article here...</p>' || content === '<p></p>') {
        setError('Content is required')
        return
      }

      // First, insert article
      const newArticle = {
        title,
        summary,
        content,
        status,
        author_id: user.id,
        series_id: selectedSeries || null,
        seo_title: seoTitle || title,
        seo_description: seoDescription || summary,
        featured_image: featuredImage,
        slug: '', 
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log('Creating new article with data:', JSON.stringify(newArticle, null, 2))

      const { data: articleData, error: articleError } = await supabase
        .from('articles')
        .insert(newArticle)
        .select()

      if (articleError) {
        console.error('Error inserting article:', articleError)
        setError(`Failed to create article: ${articleError.message}`)
        return
      }

      console.log('Article created successfully:', articleData)
      
      // Show success message
      setSuccess(`Article ${status === 'draft' ? 'saved as draft' : 'submitted for review'} successfully!`)
      
      // Store recent article data in localStorage for dashboard display
      try {
        const recentArticle = {
          id: articleData[0].id,
          title: articleData[0].title,
          status: articleData[0].status,
          created_at: articleData[0].created_at
        }
        
        // Get existing recent articles or initialize empty array
        const existingRecent = JSON.parse(localStorage.getItem('recentArticles') || '[]')
        
        // Add new article to front of array and limit to 5 items
        const updatedRecent = [recentArticle, ...existingRecent.slice(0, 4)]
        
        localStorage.setItem('recentArticles', JSON.stringify(updatedRecent))
      } catch (storageError) {
        console.error('Error saving to localStorage:', storageError)
        // Non-critical error, continue with redirect
      }

      // If article is created successfully and we have tags, insert them
      if (articleData && articleData[0] && tags.length > 0) {
        console.log('Adding tags for article:', articleData[0].id)
        
        try {
          // Get existing tags
          const { data: existingTags, error: existingTagsError } = await supabase
            .from('tags')
            .select('id, name')
            .in('name', tags)
          
          if (existingTagsError) {
            console.error('Error fetching existing tags:', existingTagsError)
          }
          
          // Determine which tags already exist
          const existingTagNames = existingTags?.map(tag => tag.name) || []
          const newTagNames = tags.filter(tag => !existingTagNames.includes(tag))
          
          console.log('Existing tags:', existingTagNames)
          console.log('New tags to create:', newTagNames)
          
          // Insert new tags if any
          if (newTagNames.length > 0) {
            const tagsToInsert = newTagNames.map(name => ({ name }))
            const { error: insertTagsError } = await supabase.from('tags').insert(tagsToInsert)
            
            if (insertTagsError) {
              console.error('Error inserting new tags:', insertTagsError)
            }
          }
          
          // Get all tags again to make sure we have their IDs
          const { data: allTags, error: allTagsError } = await supabase
            .from('tags')
            .select('id, name')
            .in('name', tags)
          
          if (allTagsError) {
            console.error('Error fetching all tags:', allTagsError)
          }
          
          if (allTags) {
            // Create article_tags junction entries
            const articleTagsToInsert = allTags.map(tag => ({
              article_id: articleData[0].id,
              tag_id: tag.id
            }))
            
            console.log('Inserting article-tag relationships:', articleTagsToInsert)
            
            const { error: articleTagsError } = await supabase.from('article_tags').insert(articleTagsToInsert)
            
            if (articleTagsError) {
              console.error('Error inserting article-tag relationships:', articleTagsError)
            }
          }
        } catch (tagError) {
          console.error('Error processing tags:', tagError)
          // Continue with redirect even if tag processing fails
        }
      }

      // Use router.push with callback for more reliable navigation after state updates
      if (status === 'draft') {
        toast({
          title: 'Draft Saved',
          description: 'Your article has been saved as a draft.',
          variant: 'default',
        })
      } else {
        toast({
          title: 'Article Submitted',
          description: 'Your article has been submitted for review.',
          variant: 'default',
        })
      }

      // Navigate with a short delay to ensure toast is visible
      setTimeout(() => {
        router.push('/dashboard?success=article-created')
      }, 1000)
    } catch (err) {
      console.error('Unexpected error in article creation:', err)
      setError('An unexpected error occurred. Please check the console for details.')
    } finally {
      setSaving(false)
      setCurrentStatus(null)
    }
  }

  if (authLoading) {
    return <div className="container py-16 text-center">Loading...</div>
  }

  if (!user) {
    return null // Will redirect in the useEffect
  }

  return (
    <div className="container py-10 max-w-4xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-2">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Create New Article</h1>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6 flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-medium">Success</p>
            <p className="text-sm">{success}</p>
          </div>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, 'submitted')}>
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="categorization">Categorization</TabsTrigger>
            <TabsTrigger value="seo">SEO & Media</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>Article Content</CardTitle>
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
                  <label htmlFor="series" className="text-sm font-medium">
                    Series
                  </label>
                  <div className="flex gap-2">
                    <Select
                      value={selectedSeries || ""}
                      onValueChange={setSelectedSeries}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a series (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {seriesList.map((series) => (
                          <SelectItem key={series.id} value={series.id}>
                            {series.name} 
                            {series.status === 'pending' && " (Pending approval)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Series</DialogTitle>
                          <DialogDescription>
                            New series require approval from administrators before becoming public.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="seriesName">Series Name</Label>
                            <Input
                              id="seriesName"
                              value={newSeriesName}
                              onChange={(e) => setNewSeriesName(e.target.value)}
                              placeholder="E.g., Blockchain Basics"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="seriesDescription">Description</Label>
                            <Textarea
                              id="seriesDescription"
                              value={newSeriesDescription}
                              onChange={(e) => setNewSeriesDescription(e.target.value)}
                              placeholder="A brief description of this series"
                              className="resize-none h-20"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => setIsDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleCreateNewSeries}
                            disabled={!newSeriesName.trim() || creatingNewSeries}
                          >
                            {creatingNewSeries ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              'Create Series'
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Optional: Group related articles into a series
                  </p>
                </div>
                
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
          
          <TabsContent value="seo">
            <Card>
              <CardHeader>
                <CardTitle>SEO & Media</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="seoTitle" className="text-sm font-medium">
                      SEO Title
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Info className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent side="top" className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium">SEO Title Tips</h4>
                          <p className="text-sm text-muted-foreground">
                            The SEO title appears in search engine results. Keep it under 60 characters and include relevant keywords.
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Input
                    id="seoTitle"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder={title || "Enter SEO title (defaults to article title)"}
                  />
                  <p className="text-xs text-muted-foreground">
                    {seoTitle.length}/60 characters recommended
                    {seoTitle.length > 60 && " (too long)"}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="seoDescription" className="text-sm font-medium">
                      SEO Description
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Info className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent side="top" className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium">SEO Description Tips</h4>
                          <p className="text-sm text-muted-foreground">
                            This appears as the description in search results. Keep it between 120-155 characters and make it compelling to click.
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Textarea
                    id="seoDescription"
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder={summary || "Enter SEO description (defaults to article summary)"}
                    className="resize-none h-20"
                  />
                  <p className="text-xs text-muted-foreground">
                    {seoDescription.length}/155 characters recommended
                    {seoDescription.length > 155 && " (too long)"}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="featuredImage" className="text-sm font-medium">
                    Featured Image
                  </label>
                  <div className="border rounded-md p-4">
                    {featuredImage ? (
                      <div className="space-y-4">
                        <div className="aspect-video overflow-hidden rounded-md bg-muted">
                          <img 
                            src={featuredImage} 
                            alt="Featured" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex justify-between">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => setFeaturedImage(null)}
                          >
                            Remove
                          </Button>
                          <Label 
                            htmlFor="change-image"
                            className="cursor-pointer inline-flex h-9 items-center justify-center rounded-md bg-muted px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm hover:bg-muted/80"
                          >
                            Change Image
                          </Label>
                          <Input
                            id="change-image"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="mb-4 text-muted-foreground">
                          <Upload className="h-12 w-12 mx-auto mb-2" />
                          <p className="text-center">Drag & drop or click to upload</p>
                        </div>
                        <Label 
                          htmlFor="image-upload"
                          className="cursor-pointer inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            'Upload Image'
                          )}
                        </Label>
                        <Input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                        />
                      </div>
                    )}
                    {isUploading && (
                      <div className="mt-4">
                        <Progress value={uploadProgress} className="h-1" />
                        <p className="text-xs text-center mt-1">{uploadProgress}%</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recommended size: 1200×630 pixels, 16:9 aspect ratio
                  </p>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 flex justify-between">
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
          <Button type="submit" disabled={saving}>
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
      </form>
    </div>
  )
} 