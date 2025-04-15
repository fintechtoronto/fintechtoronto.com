'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Search, 
  Plus, 
  Tag, 
  Clock, 
  Edit, 
  Trash, 
  Check, 
  Eye, 
  AlertCircle, 
  Loader2,
  BookOpenCheck,
  Filter,
  X
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useToast } from '@/hooks/use-toast'

type Article = {
  id: string
  title: string
  summary: string
  content: string
  author_id: string
  created_at: string
  updated_at: string
  status: 'draft' | 'submitted' | 'published' | 'rejected'
  published?: boolean
  tags?: string[]
}

type ArticleWithTags = Article & {
  tags: string[]
}

export default function ArticlesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [articles, setArticles] = useState<ArticleWithTags[]>([])
  const [allArticles, setAllArticles] = useState<ArticleWithTags[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [status, setStatus] = useState<string>('all')
  const [deleteArticleId, setDeleteArticleId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    submitted: 0,
    rejected: 0
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const fetchArticles = async () => {
      if (!user) return
      
      try {
        setLoading(true)
        
        // Fetch articles
        const { data: articlesData, error: articlesError } = await supabase
          .from('articles')
          .select('*')
          .eq('author_id', user.id)
          .order('updated_at', { ascending: false })
        
        if (articlesError) {
          console.error('Error fetching articles:', articlesError)
          setError('Failed to load your articles')
          return
        }
        
        // Create an array to store articles with their tags
        const articlesWithTags: ArticleWithTags[] = articlesData.map((article: Article) => ({
          ...article,
          tags: []
        }))
        
        // Create a Set to store all unique tags
        const uniqueTags = new Set<string>()
        
        // For each article, fetch its tags
        for (const article of articlesWithTags) {
          // Get tag_ids for this article
          const { data: articleTags, error: articleTagsError } = await supabase
            .from('article_tags')
            .select('tag_id')
            .eq('article_id', article.id)
          
          if (articleTagsError) {
            console.error('Error fetching article tags:', articleTagsError)
            continue
          }
          
          if (articleTags && articleTags.length > 0) {
            // Get tag IDs
            const tagIds = articleTags.map(item => item.tag_id)
            
            // Fetch actual tags
            const { data: tagsData, error: tagsError } = await supabase
              .from('tags')
              .select('name')
              .in('id', tagIds)
              
            if (tagsError) {
              console.error('Error fetching tags:', tagsError)
              continue
            }
            
            if (tagsData) {
              // Add tag names to the article
              const tagNames = tagsData.map(tag => tag.name)
              article.tags = tagNames
              
              // Add tags to the unique tags set
              tagNames.forEach(tag => uniqueTags.add(tag))
            }
          }
        }
        
        // Set the articles and available tags
        setAllArticles(articlesWithTags)
        setAvailableTags(Array.from(uniqueTags))
        
        // Calculate stats
        const stats = {
          total: articlesWithTags.length,
          published: articlesWithTags.filter(a => a.status === 'published').length,
          draft: articlesWithTags.filter(a => a.status === 'draft').length,
          submitted: articlesWithTags.filter(a => a.status === 'submitted').length,
          rejected: articlesWithTags.filter(a => a.status === 'rejected').length
        }
        
        setStats(stats)
      } catch (error) {
        console.error('Error:', error)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }
    
    fetchArticles()
  }, [user])
  
  // Apply filters whenever search term, status, or selected tags change
  useEffect(() => {
    if (allArticles.length === 0) return
    
    let filtered = [...allArticles]
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(term) ||
        article.summary.toLowerCase().includes(term)
      )
    }
    
    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter(article => article.status === status)
    }
    
    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(article => 
        selectedTags.every(tag => article.tags.includes(tag))
      )
    }
    
    setArticles(filtered)
  }, [searchTerm, status, selectedTags, allArticles])
  
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }
  
  const handleDelete = async (id: string) => {
    if (!user) return
    
    try {
      setIsDeleting(true)
      
      // Delete article_tags first to maintain referential integrity
      const { error: tagDeleteError } = await supabase
        .from('article_tags')
        .delete()
        .eq('article_id', id)
      
      if (tagDeleteError) {
        console.error('Error deleting article tags:', tagDeleteError)
        toast({
          title: "Error",
          description: "Failed to delete article tags",
          variant: "destructive"
        })
        return
      }
      
      // Then delete the article
      const { error: articleDeleteError } = await supabase
        .from('articles')
        .delete()
        .eq('id', id)
        .eq('author_id', user.id)
      
      if (articleDeleteError) {
        console.error('Error deleting article:', articleDeleteError)
        toast({
          title: "Error",
          description: "Failed to delete article",
          variant: "destructive"
        })
        return
      }
      
      // Update articles state
      setAllArticles(prev => prev.filter(article => article.id !== id))
      
      toast({
        title: "Success",
        description: "Article deleted successfully",
      })
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
      setDeleteArticleId(null)
    }
  }
  
  // Show loading state
  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading your articles...</p>
        </div>
      </div>
    )
  }

  // Show error message
  if (error) {
    return (
      <div className="container py-10">
        <div className="bg-destructive/10 text-destructive p-6 rounded-lg">
          <AlertCircle className="h-8 w-8 mb-2" />
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p>{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6 md:py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Articles</h1>
          <p className="text-muted-foreground mt-1">Manage all your articles in one place</p>
        </div>
        <Button asChild size="lg" className="gap-2">
          <Link href="/dashboard/articles/new">
            <Plus className="h-4 w-4" />
            <span>Create Article</span>
          </Link>
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard 
          title="Total" 
          value={stats.total} 
          icon={<FileText className="h-4 w-4 text-primary" />} 
        />
        <StatCard 
          title="Published" 
          value={stats.published} 
          icon={<Check className="h-4 w-4 text-emerald-500" />} 
        />
        <StatCard 
          title="Drafts" 
          value={stats.draft} 
          icon={<Edit className="h-4 w-4 text-blue-500" />} 
        />
        <StatCard 
          title="Submitted" 
          value={stats.submitted} 
          icon={<Clock className="h-4 w-4 text-amber-500" />} 
        />
        <StatCard 
          title="Rejected" 
          value={stats.rejected} 
          icon={<AlertCircle className="h-4 w-4 text-red-500" />} 
        />
      </div>
      
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles by title or summary..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                <span>Status</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatus('all')} className={status === 'all' ? 'bg-muted' : ''}>
                All ({stats.total})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatus('published')} className={status === 'published' ? 'bg-muted' : ''}>
                Published ({stats.published})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatus('draft')} className={status === 'draft' ? 'bg-muted' : ''}>
                Drafts ({stats.draft})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatus('submitted')} className={status === 'submitted' ? 'bg-muted' : ''}>
                Submitted ({stats.submitted})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatus('rejected')} className={status === 'rejected' ? 'bg-muted' : ''}>
                Rejected ({stats.rejected})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {availableTags.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Tag className="h-4 w-4" />
                  <span>Tags</span>
                  {selectedTags.length > 0 && (
                    <Badge variant="secondary" className="ml-1">{selectedTags.length}</Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Tags</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableTags.map(tag => (
                  <DropdownMenuItem 
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={selectedTags.includes(tag) ? 'bg-muted' : ''}
                  >
                    {selectedTags.includes(tag) && <Check className="mr-2 h-4 w-4" />}
                    {!selectedTags.includes(tag) && <div className="w-4 mr-2" />}
                    {tag}
                  </DropdownMenuItem>
                ))}
                {selectedTags.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSelectedTags([])}>
                      Clear all filters
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      
      {/* Active Filters */}
      {(status !== 'all' || selectedTags.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {status !== 'all' && (
            <Badge variant="secondary" className="px-3 py-1">
              Status: {status}
              <button 
                className="ml-2 hover:text-destructive" 
                onClick={() => setStatus('all')}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {selectedTags.map(tag => (
            <Badge key={tag} variant="secondary" className="px-3 py-1">
              {tag}
              <button 
                className="ml-2 hover:text-destructive" 
                onClick={() => handleTagToggle(tag)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          
          {(status !== 'all' || selectedTags.length > 0) && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="px-2 h-7 text-xs"
              onClick={() => {
                setStatus('all')
                setSelectedTags([])
              }}
            >
              Clear all
            </Button>
          )}
        </div>
      )}
      
      {/* Articles List */}
      {articles.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-xl font-medium mb-2">No articles found</h3>
            <p className="text-muted-foreground text-center mb-6">
              {allArticles.length === 0 
                ? "You haven't created any articles yet." 
                : "No articles match your current filters."}
            </p>
            {allArticles.length === 0 ? (
              <Button asChild>
                <Link href="/dashboard/articles/new">Create your first article</Link>
              </Button>
            ) : (
              <Button variant="outline" onClick={() => {
                setSearchTerm('')
                setStatus('all')
                setSelectedTags([])
              }}>
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {articles.map(article => (
            <ArticleCard 
              key={article.id} 
              article={article}
              onDelete={() => setDeleteArticleId(article.id)}
            />
          ))}
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteArticleId} onOpenChange={() => !isDeleting && setDeleteArticleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the article
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteArticleId && handleDelete(deleteArticleId)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>Delete</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Article Card Component
function ArticleCard({ 
  article, 
  onDelete 
}: { 
  article: ArticleWithTags
  onDelete: () => void
}) {
  const router = useRouter()
  
  // Determine the status badge color
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'published':
        return <Badge className="bg-emerald-500">Published</Badge>
      case 'draft':
        return <Badge variant="outline">Draft</Badge>
      case 'submitted':
        return <Badge className="bg-amber-500">Submitted</Badge>
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div className="flex flex-col md:flex-row">
        <div className="flex-grow p-6">
          <div className="flex items-center gap-2 mb-2">
            {getStatusBadge(article.status)}
            <span className="text-xs text-muted-foreground">
              Updated {formatDistanceToNow(new Date(article.updated_at), { addSuffix: true })}
            </span>
          </div>
          
          <h3 className="text-xl font-semibold mb-2 line-clamp-1">{article.title}</h3>
          
          <p className="text-muted-foreground mb-4 line-clamp-2">{article.summary}</p>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {article.tags.map(tag => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
            {article.tags.length === 0 && (
              <span className="text-xs text-muted-foreground">No tags</span>
            )}
          </div>
        </div>
        
        <div className="flex md:flex-col items-center justify-end gap-2 p-4 md:p-6 bg-muted/30 md:border-l">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => router.push(`/dashboard/articles/${article.id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          
          {article.status === 'published' && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href={`/blog/${article.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </Link>
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </Card>
  )
}

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  icon 
}: { 
  title: string
  value: number
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
      </CardContent>
    </Card>
  )
} 