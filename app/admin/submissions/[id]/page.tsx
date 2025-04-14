'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar, 
  Tag
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

type ArticleSubmission = {
  id: string
  title: string
  excerpt: string | null
  content: string
  status: 'submitted' | 'draft' | 'published' | 'rejected'
  author_id: string
  created_at: string
  updated_at: string
  seo_title: string | null
  seo_description: string | null
  featured_image: string | null
  author: {
    full_name: string | null
    email: string | null
    username: string | null
  } | null
  tags: {
    id: string
    name: string
  }[]
  series: {
    id: string
    name: string
  } | null
}

export default function SubmissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  
  const [submission, setSubmission] = useState<ArticleSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)
  
  useEffect(() => {
    if (params.id) {
      fetchSubmission(params.id as string)
    }
  }, [params.id])
  
  const fetchSubmission = async (id: string) => {
    try {
      setLoading(true)
      
      // Fetch the article with author info
      const { data: article, error } = await supabaseAdmin
        .from('articles')
        .select(`
          id, title, excerpt, content, status, 
          author_id, created_at, updated_at,
          seo_title, seo_description, featured_image,
          profiles:author_id (full_name, email, username)
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      
      if (!article) {
        toast({
          title: 'Not Found',
          description: 'The requested submission could not be found',
          variant: 'destructive',
        })
        router.push('/admin/submissions')
        return
      }
      
      // Fetch tags for the article
      const { data: articleTags, error: tagsError } = await supabaseAdmin
        .from('article_tags')
        .select(`
          tags (id, name)
        `)
        .eq('article_id', id)
      
      // Fetch series if any
      const { data: seriesData, error: seriesError } = await supabaseAdmin
        .from('articles')
        .select(`
          series:series_id (id, name)
        `)
        .eq('id', id)
        .maybeSingle()
      
      // Format the data for our component
      let authorData = null
      if (article.profiles) {
        if (Array.isArray(article.profiles) && article.profiles.length > 0) {
          const profile = article.profiles[0] as any
          authorData = {
            full_name: profile.full_name || null,
            email: profile.email || null,
            username: profile.username || null
          }
        } else {
          const profile = article.profiles as any
          authorData = {
            full_name: profile.full_name || null,
            email: profile.email || null,
            username: profile.username || null
          }
        }
      }
      
      // Format tags data
      const tags = articleTags 
        ? articleTags.map(item => {
            const tag = (Array.isArray(item.tags) ? item.tags[0] : item.tags) as any
            return { id: tag.id, name: tag.name }
          })
        : []
      
      // Get series info if available
      let seriesInfo = null
      if (seriesData?.series) {
        const series = (Array.isArray(seriesData.series) 
          ? seriesData.series[0]
          : seriesData.series) as any
        
        seriesInfo = { id: series.id, name: series.name }
      }
      
      setSubmission({
        ...article,
        author: authorData,
        tags: tags,
        series: seriesInfo
      })
    } catch (error) {
      console.error('Error fetching submission:', error)
      toast({
        title: 'Error',
        description: 'Failed to load submission details',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }
  
  const approveSubmission = async () => {
    if (!submission) return
    
    try {
      setProcessing(true)
      
      const { error } = await supabaseAdmin
        .from('articles')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq('id', submission.id)
      
      if (error) throw error
      
      toast({
        title: 'Article Approved',
        description: 'The article has been published and is now live',
      })
      
      // Navigate back to the submissions list
      router.push('/admin/submissions')
    } catch (error) {
      console.error('Error approving submission:', error)
      toast({
        title: 'Error',
        description: 'Failed to approve article',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }
  
  const openRejectDialog = () => {
    setRejectionReason('')
    setIsRejectDialogOpen(true)
  }
  
  const rejectSubmission = async () => {
    if (!submission) return
    
    try {
      setProcessing(true)
      
      const { error } = await supabaseAdmin
        .from('articles')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason.trim() || 'Your submission does not meet our guidelines.',
          updated_at: new Date().toISOString() 
        })
        .eq('id', submission.id)
      
      if (error) throw error
      
      toast({
        title: 'Article Rejected',
        description: 'The article has been rejected and the author has been notified',
      })
      
      setIsRejectDialogOpen(false)
      
      // Navigate back to the submissions list
      router.push('/admin/submissions')
    } catch (error) {
      console.error('Error rejecting submission:', error)
      toast({
        title: 'Error',
        description: 'Failed to reject article',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
  
  if (!submission) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Submission Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The article submission you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push('/admin/submissions')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Submissions
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => router.push('/admin/submissions')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Submissions
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant="destructive" 
            onClick={openRejectDialog}
            disabled={processing}
          >
            {processing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            Reject
          </Button>
          
          <Button 
            variant="default" 
            onClick={approveSubmission}
            disabled={processing}
          >
            {processing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Approve
          </Button>
        </div>
      </div>
      
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/50">
          <div className="space-y-1">
            <CardTitle className="text-2xl">{submission.title}</CardTitle>
            {submission.excerpt && (
              <p className="text-muted-foreground">{submission.excerpt}</p>
            )}
          </div>
        </CardHeader>
        
        <Tabs defaultValue="content">
          <div className="border-b px-4">
            <TabsList className="w-full justify-start rounded-none border-b-0 pl-0 h-12">
              <TabsTrigger value="content" className="rounded-none">Content</TabsTrigger>
              <TabsTrigger value="metadata" className="rounded-none">Metadata</TabsTrigger>
              <TabsTrigger value="preview" className="rounded-none">Preview</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="content" className="p-6">
            <div className="whitespace-pre-wrap font-sans text-base">
              {submission.content}
            </div>
          </TabsContent>
          
          <TabsContent value="metadata" className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-medium mb-2">Author Information</h3>
                <div className="flex items-center space-x-2 mb-4">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {submission.author?.full_name || submission.author?.username || 'Unknown'}
                  </span>
                </div>
                
                <h3 className="text-lg font-medium mb-2">Publication Details</h3>
                <div className="flex items-center space-x-2 mb-4">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Submitted on {format(new Date(submission.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                
                {submission.series && (
                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">Series</h3>
                    <Badge className="mr-1">{submission.series.name}</Badge>
                  </div>
                )}
                
                {submission.tags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {submission.tags.map(tag => (
                        <Badge variant="outline" key={tag.id}>
                          <Tag className="h-3.5 w-3.5 mr-1" />
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">SEO Information</h3>
                {submission.seo_title && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-muted-foreground">SEO Title</p>
                    <p>{submission.seo_title}</p>
                  </div>
                )}
                
                {submission.seo_description && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-muted-foreground">SEO Description</p>
                    <p>{submission.seo_description}</p>
                  </div>
                )}
                
                {submission.featured_image && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Featured Image</p>
                    <img 
                      src={submission.featured_image} 
                      alt={submission.title} 
                      className="rounded-md border max-h-64 object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="p-6">
            <div className="prose dark:prose-invert prose-headings:font-heading max-w-none">
              {/* This would ideally be replaced with a proper markdown or rich text preview */}
              <div className="whitespace-pre-wrap">
                {submission.content}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
      
      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Article</DialogTitle>
            <DialogDescription>
              Provide feedback to the author about why their submission was rejected.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="rejection-reason" className="text-sm font-medium">
                Rejection Reason
              </label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please explain why this article was rejected..."
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                This feedback will be sent to the author.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={rejectSubmission}
              disabled={processing}
            >
              {processing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reject Article
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 