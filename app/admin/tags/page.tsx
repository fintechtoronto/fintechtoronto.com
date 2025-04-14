'use client'

import { useState, useEffect } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Search, 
  Loader2, 
  Edit,
  Plus,
  Trash2,
  Tag,
  MoreHorizontal
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from '@/hooks/use-toast'
import { useDebounce } from '@/lib/hooks'
import { Separator } from '@/components/ui/separator'

type Tag = {
  id: string
  name: string
  slug: string
  article_count: number
  created_at: string
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [tagName, setTagName] = useState<string>('')
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const { toast } = useToast()

  useEffect(() => {
    fetchTags()
  }, [debouncedSearchTerm])

  const fetchTags = async () => {
    try {
      setLoading(true)
      
      let query = supabaseAdmin
        .from('tags')
        .select(`
          id, 
          name, 
          slug, 
          created_at,
          article_tags(count)
        `, { count: 'exact' })
        .order('name', { ascending: true })
      
      // Add search filter if there's a search term
      if (debouncedSearchTerm) {
        query = query.or(`name.ilike.%${debouncedSearchTerm}%,slug.ilike.%${debouncedSearchTerm}%`)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      // Process the data to get the count from each article_tags count
      const processedData = data?.map(tag => {
        // Handle the article_tags count
        let articleCount = 0;
        if (tag.article_tags && tag.article_tags.length > 0) {
          const count = tag.article_tags[0].count;
          articleCount = typeof count === 'string' ? parseInt(count) : count;
        }
          
        return {
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          created_at: tag.created_at,
          article_count: articleCount
        };
      });
      
      if (processedData) {
        setTags(processedData as Tag[])
      } else {
        setTags([])
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
      toast({
        title: 'Error',
        description: 'Failed to load tags',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (tag: Tag) => {
    setSelectedTag(tag)
    setTagName(tag.name)
    setIsEditDialogOpen(true)
  }

  const openNewDialog = () => {
    setTagName('')
    setIsNewDialogOpen(true)
  }

  const updateTag = async () => {
    if (!selectedTag || !tagName.trim()) return
    
    try {
      setProcessingId(selectedTag.id)
      
      const { error } = await supabaseAdmin
        .from('tags')
        .update({ 
          name: tagName.trim()
          // slug will be generated automatically via trigger
        })
        .eq('id', selectedTag.id)
      
      if (error) throw error
      
      // Update local state
      setTags(tags.map(tag => 
        tag.id === selectedTag.id 
          ? { ...tag, name: tagName.trim() } 
          : tag
      ))
      
      toast({
        title: 'Tag Updated',
        description: `Tag has been updated to "${tagName}"`,
      })
      
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error('Error updating tag:', error)
      toast({
        title: 'Error',
        description: 'Failed to update tag',
        variant: 'destructive',
      })
    } finally {
      setProcessingId(null)
    }
  }

  const createTag = async () => {
    if (!tagName.trim()) return
    
    try {
      setProcessingId('new')
      
      const { data, error } = await supabaseAdmin
        .from('tags')
        .insert({ 
          name: tagName.trim()
          // slug will be generated automatically via trigger
        })
        .select()
      
      if (error) throw error
      
      if (data && data.length > 0) {
        // Add the new tag to local state
        setTags([
          ...tags, 
          { 
            ...data[0], 
            article_count: 0
          }
        ])
      }
      
      toast({
        title: 'Tag Created',
        description: `New tag "${tagName}" has been created`,
      })
      
      setIsNewDialogOpen(false)
      setTagName('')
    } catch (error) {
      console.error('Error creating tag:', error)
      toast({
        title: 'Error',
        description: 'Failed to create tag',
        variant: 'destructive',
      })
    } finally {
      setProcessingId(null)
    }
  }

  const deleteTag = async (tag: Tag) => {
    try {
      setProcessingId(tag.id)
      
      // Check if tag is associated with any articles
      if (tag.article_count > 0) {
        toast({
          title: 'Cannot Delete Tag',
          description: `This tag is associated with ${tag.article_count} article(s). Remove these associations first.`,
          variant: 'destructive',
        })
        return
      }
      
      const { error } = await supabaseAdmin
        .from('tags')
        .delete()
        .eq('id', tag.id)
      
      if (error) throw error
      
      // Update local state
      setTags(tags.filter(t => t.id !== tag.id))
      
      toast({
        title: 'Tag Deleted',
        description: `Tag "${tag.name}" has been deleted`,
      })
    } catch (error) {
      console.error('Error deleting tag:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete tag',
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
          <CardTitle>Tag Management</CardTitle>
          <Button onClick={openNewDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Tag
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tags by name..."
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
                    <TableHead>Tag Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Articles</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tags.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        {debouncedSearchTerm 
                          ? 'No tags match your search.' 
                          : 'No tags found. Create your first tag!'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    tags.map((tag) => (
                      <TableRow key={tag.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <span>{tag.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{tag.slug}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {tag.article_count} {tag.article_count === 1 ? 'article' : 'articles'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                disabled={!!processingId}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openEditDialog(tag)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Tag
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => deleteTag(tag)}
                                disabled={tag.article_count > 0}
                                className={tag.article_count > 0 ? "text-muted-foreground" : "text-destructive"}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Tag
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Edit Tag Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
            <DialogDescription>
              Update the name for this tag. The slug will be generated automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="tag-name" className="text-sm font-medium">
                Tag Name
              </label>
              <Input
                id="tag-name"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="Enter tag name"
              />
            </div>
            {selectedTag && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Slug</label>
                <div className="p-2 bg-muted rounded-md">
                  <code>{selectedTag.slug}</code>
                </div>
                <p className="text-xs text-muted-foreground">
                  The slug will be updated automatically based on the tag name
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={processingId === selectedTag?.id}
            >
              Cancel
            </Button>
            <Button 
              onClick={updateTag} 
              disabled={!tagName.trim() || processingId === selectedTag?.id}
            >
              {processingId === selectedTag?.id && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Tag Dialog */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
            <DialogDescription>
              Add a new tag to categorize articles
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="new-tag-name" className="text-sm font-medium">
                Tag Name
              </label>
              <Input
                id="new-tag-name"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="Enter tag name"
              />
              <p className="text-xs text-muted-foreground">
                A slug will be generated automatically based on the tag name
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewDialogOpen(false)}
              disabled={processingId === 'new'}
            >
              Cancel
            </Button>
            <Button 
              onClick={createTag} 
              disabled={!tagName.trim() || processingId === 'new'}
            >
              {processingId === 'new' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 