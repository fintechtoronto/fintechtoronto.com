'use client'

import { useState, useEffect } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Search, 
  Loader2, 
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  User,
  ExternalLink,
  Pencil
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useDebounce } from '@/lib/hooks'
import { format } from 'date-fns'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type Submission = {
  id: string
  title: string
  excerpt: string | null
  status: 'submitted' | 'draft' | 'published' | 'rejected'
  author_id: string
  created_at: string
  updated_at: string
  author: {
    full_name: string | null
    email: string | null
    username: string | null
  } | null
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const { toast } = useToast()

  useEffect(() => {
    fetchSubmissions()
  }, [debouncedSearchTerm])

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      
      let query = supabaseAdmin
        .from('articles')
        .select(`
          id, title, excerpt, status, author_id, created_at, updated_at,
          profiles:author_id (full_name, email, username)
        `)
        .eq('status', 'submitted')
        .order('created_at', { ascending: false })
      
      // Add search filter if there's a search term
      if (debouncedSearchTerm) {
        query = query.or(`title.ilike.%${debouncedSearchTerm}%,excerpt.ilike.%${debouncedSearchTerm}%`)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      // Format the data
      const formattedSubmissions: Submission[] = (data || []).map(item => {
        let authorData = null;
        
        // Handle the profiles data with proper type checking
        if (item.profiles) {
          // If it's an array, take the first element
          if (Array.isArray(item.profiles) && item.profiles.length > 0) {
            const authorProfile = item.profiles[0] as any;
            authorData = {
              full_name: authorProfile.full_name || null,
              email: authorProfile.email || null,
              username: authorProfile.username || null
            };
          } 
          // If it's an object, use it directly
          else if (typeof item.profiles === 'object') {
            const authorProfile = item.profiles as any;
            authorData = {
              full_name: authorProfile.full_name || null,
              email: authorProfile.email || null,
              username: authorProfile.username || null
            };
          }
        }
        
        return {
          id: item.id,
          title: item.title,
          excerpt: item.excerpt,
          status: item.status,
          author_id: item.author_id,
          created_at: item.created_at,
          updated_at: item.updated_at,
          author: authorData
        }
      })
      
      setSubmissions(formattedSubmissions)
    } catch (error) {
      console.error('Error fetching submissions:', error)
      toast({
        title: 'Error',
        description: 'Failed to load submissions',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const openRejectDialog = (submission: Submission) => {
    setSelectedSubmission(submission)
    setRejectionReason('')
    setIsRejectDialogOpen(true)
  }

  const approveSubmission = async (id: string) => {
    try {
      setProcessingId(id)
      
      // First, sync to Sanity CMS
      const syncResponse = await fetch('/api/sync-to-sanity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ articleId: id }),
      })
      
      if (!syncResponse.ok) {
        const errorData = await syncResponse.json()
        throw new Error(errorData.error || 'Failed to sync to Sanity CMS')
      }
      
      // The API endpoint already updates the article status in Supabase
      // so we don't need to do it here again
      
      // Remove from local state
      setSubmissions(submissions.filter(submission => submission.id !== id))
      
      toast({
        title: 'Article Approved',
        description: 'The article has been published to Sanity CMS and is now live',
      })
    } catch (error) {
      console.error('Error approving submission:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve article',
        variant: 'destructive',
      })
    } finally {
      setProcessingId(null)
    }
  }

  const rejectSubmission = async () => {
    if (!selectedSubmission) return
    
    try {
      setProcessingId(selectedSubmission.id)
      
      const { error } = await supabaseAdmin
        .from('articles')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason.trim() || 'Your submission does not meet our guidelines.',
          updated_at: new Date().toISOString() 
        })
        .eq('id', selectedSubmission.id)
      
      if (error) throw error
      
      // Remove from local state
      setSubmissions(submissions.filter(submission => submission.id !== selectedSubmission.id))
      
      toast({
        title: 'Article Rejected',
        description: 'The article has been rejected and the author notified',
      })
      
      setIsRejectDialogOpen(false)
    } catch (error) {
      console.error('Error rejecting submission:', error)
      toast({
        title: 'Error',
        description: 'Failed to reject article',
        variant: 'destructive',
      })
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Article Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search submissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          {loading ? (
            <div className="flex justify-center my-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="sr-only">Loading...</span>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        {debouncedSearchTerm 
                          ? 'No submissions match your search.' 
                          : 'No submissions to review.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    submissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-semibold">{submission.title}</p>
                            {submission.excerpt && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {submission.excerpt}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {submission.author?.full_name || submission.author?.username || 'Unknown'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {format(new Date(submission.created_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              asChild
                            >
                              <Link href={`/admin/submissions/${submission.id}`}>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Link>
                            </Button>
                            
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => approveSubmission(submission.id)}
                              disabled={!!processingId}
                            >
                              {processingId === submission.id ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-1" />
                              )}
                              Approve
                            </Button>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    asChild
                                  >
                                    <a 
                                      href={`/studio/desk/blog`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                    >
                                      <Pencil className="h-4 w-4 mr-1" />
                                      Sanity
                                    </a>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit in Sanity Studio</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => openRejectDialog(submission)}
                              disabled={!!processingId}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
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
              disabled={processingId === selectedSubmission?.id}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={rejectSubmission}
              disabled={processingId === selectedSubmission?.id}
            >
              {processingId === selectedSubmission?.id && (
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
