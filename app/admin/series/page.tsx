'use client'

import { useState, useEffect } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Search, 
  Loader2, 
  PlusCircle,
  Edit,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  User,
  Check,
  X
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useDebounce } from '@/lib/hooks'

type Series = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_by: string;
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string | null;
    username: string | null;
    email: string | null;
  } | null;
  articleCount: number;
}

export default function SeriesPage() {
  const [seriesList, setSeriesList] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const { toast } = useToast()

  useEffect(() => {
    fetchSeries()
  }, [debouncedSearchTerm])

  const fetchSeries = async () => {
    try {
      setLoading(true)
      
      let query = supabaseAdmin
        .from('series')
        .select(`
          id, name, slug, description, status, created_by, created_at, updated_at,
          profiles(full_name, username, email)
        `)
        .order('created_at', { ascending: false })
      
      // Add search filter if there's a search term
      if (debouncedSearchTerm) {
        query = query.or(`name.ilike.%${debouncedSearchTerm}%,description.ilike.%${debouncedSearchTerm}%`)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      if (data && data.length > 0) {
        // Get article counts separately
        const seriesIds = data.map(series => series.id)
        
        // Use raw SQL for counting articles per series
        const { data: countData, error: countsError } = await supabaseAdmin
          .rpc('get_article_counts_by_series', { series_ids: seriesIds })
        
        // If that fails, try direct SQL query
        let countMap: Record<string, number> = {}
        
        if (countsError || !countData) {
          // Fallback: use separate queries to count articles for each series
          for (const seriesId of seriesIds) {
            const { count, error: countError } = await supabaseAdmin
              .from('articles')
              .select('*', { count: 'exact', head: true })
              .eq('series_id', seriesId)
              
            if (!countError) {
              countMap[seriesId] = count || 0
            }
          }
        } else {
          // Use the RPC result if successful
          countData.forEach((item: any) => {
            countMap[item.series_id] = parseInt(item.count)
          })
        }
        
        // Transform the data to match our Series type
        const processedData: Series[] = data.map(item => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          description: item.description,
          status: item.status,
          created_by: item.created_by,
          created_at: item.created_at,
          updated_at: item.updated_at,
          profiles: item.profiles && Array.isArray(item.profiles) && item.profiles.length > 0 
            ? {
                full_name: item.profiles[0].full_name,
                username: item.profiles[0].username,
                email: item.profiles[0].email
              }
            : null,
          articleCount: countMap[item.id] || 0
        }))
        
        setSeriesList(processedData)
      } else {
        setSeriesList([])
      }
    } catch (error) {
      console.error('Error fetching series:', error)
      toast({
        title: 'Error',
        description: 'Failed to load series',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (series: Series) => {
    setSelectedSeries(series)
    setFormData({
      name: series.name,
      description: series.description || '',
    })
    setIsEditDialogOpen(true)
  }

  const openNewDialog = () => {
    setFormData({
      name: '',
      description: '',
    })
    setIsNewDialogOpen(true)
  }

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      setProcessingId(id)
      
      const { error } = await supabaseAdmin
        .from('series')
        .update({ 
          status,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
      
      if (error) throw error
      
      // Update local state
      setSeriesList(seriesList.map(series => 
        series.id === id ? { ...series, status } : series
      ))
      
      toast({
        title: status === 'approved' ? 'Series Approved' : 'Series Rejected',
        description: status === 'approved' 
          ? 'The series has been approved and is now public' 
          : 'The series has been rejected',
      })
    } catch (error) {
      console.error(`Error ${status === 'approved' ? 'approving' : 'rejecting'} series:`, error)
      toast({
        title: 'Error',
        description: `Failed to ${status === 'approved' ? 'approve' : 'reject'} series`,
        variant: 'destructive',
      })
    } finally {
      setProcessingId(null)
    }
  }

  const updateSeries = async () => {
    if (!selectedSeries) return
    
    try {
      setProcessingId(selectedSeries.id)
      
      const { error } = await supabaseAdmin
        .from('series')
        .update({ 
          name: formData.name,
          description: formData.description,
          updated_at: new Date().toISOString() 
        })
        .eq('id', selectedSeries.id)
      
      if (error) throw error
      
      // Update local state
      setSeriesList(seriesList.map(series => 
        series.id === selectedSeries.id 
          ? { 
              ...series, 
              name: formData.name,
              description: formData.description 
            } 
          : series
      ))
      
      toast({
        title: 'Series Updated',
        description: 'The series has been updated successfully',
      })
      
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error('Error updating series:', error)
      toast({
        title: 'Error',
        description: 'Failed to update series',
        variant: 'destructive',
      })
    } finally {
      setProcessingId(null)
    }
  }

  const createSeries = async () => {
    try {
      setProcessingId('new')
      
      // Generate a slug from the name
      const slug = formData.name
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-')
      
      const { data, error } = await supabaseAdmin
        .from('series')
        .insert({ 
          name: formData.name,
          slug,
          description: formData.description,
          status: 'approved', // Auto-approve when created by admin
          created_by: 'system', // This would normally be the user ID
        })
        .select()
      
      if (error) throw error
      
      if (data && data.length > 0) {
        // Add to local state
        setSeriesList([
          {
            ...data[0],
            articleCount: 0,
            profiles: null
          },
          ...seriesList,
        ])
        
        toast({
          title: 'Series Created',
          description: 'The new series has been created successfully',
        })
        
        setIsNewDialogOpen(false)
      }
    } catch (error) {
      console.error('Error creating series:', error)
      toast({
        title: 'Error',
        description: 'Failed to create series',
        variant: 'destructive',
      })
    } finally {
      setProcessingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading && seriesList.length === 0) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Series Management</h1>
        <div className="flex gap-4 items-center">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search series..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={openNewDialog} variant="default" size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            New Series
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Series</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Series</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {seriesList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <FileText className="h-12 w-12 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No series found</h3>
                      {searchTerm ? (
                        <p>Try a different search term</p>
                      ) : (
                        <p>There are no series in the system</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                seriesList.map((series) => (
                  <TableRow key={series.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{series.name}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {series.description || 'No description'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{series.articleCount}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          series.status === 'approved' ? 'default' : 
                          series.status === 'rejected' ? 'destructive' : 
                          'outline'
                        }
                      >
                        {series.status === 'approved' ? (
                          <span className="flex items-center">
                            <Check className="mr-1 h-3 w-3" />
                            Approved
                          </span>
                        ) : series.status === 'rejected' ? (
                          <span className="flex items-center">
                            <X className="mr-1 h-3 w-3" />
                            Rejected
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            Pending
                          </span>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {series.profiles?.full_name || 'Unknown'}
                    </TableCell>
                    <TableCell>{formatDate(series.created_at)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(series)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      
                      {series.status === 'pending' && (
                        <>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => updateStatus(series.id, 'rejected')}
                            disabled={!!processingId}
                          >
                            {processingId === series.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-2" />
                            )}
                            Reject
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => updateStatus(series.id, 'approved')}
                            disabled={!!processingId}
                          >
                            {processingId === series.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            Approve
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Series Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Series</DialogTitle>
            <DialogDescription>
              Update series information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Series Name</label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter series name"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter series description"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={updateSeries}
              disabled={!formData.name || !!processingId}
            >
              {processingId === selectedSeries?.id ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Series Dialog */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create New Series</DialogTitle>
            <DialogDescription>
              Add a new series for articles
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Series Name</label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter series name"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter series description"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={createSeries}
              disabled={!formData.name || !!processingId}
            >
              {processingId === 'new' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PlusCircle className="h-4 w-4 mr-2" />
              )}
              Create Series
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 