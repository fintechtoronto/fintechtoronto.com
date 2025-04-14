'use client'

import { useState, useEffect } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FileText, 
  Users, 
  List, 
  Activity,
  TrendingUp,
  Clock,
  Eye,
  AlertTriangle,
  Check,
  Loader2,
  UserCheck,
  PenSquare,
  BookText,
  Shield
} from 'lucide-react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter } from 'next/navigation'

type DashboardStats = {
  totalArticles: number
  publishedArticles: number
  pendingArticles: number
  totalUsers: number
  totalSeries: number
  totalViews: number
}

type RecentActivity = {
  id: string
  type: 'article' | 'user' | 'series'
  title: string
  status: string
  date: string
  user: {
    name: string
    email: string
  }
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalArticles: 0,
    publishedArticles: 0,
    pendingArticles: 0,
    totalUsers: 0,
    totalSeries: 0,
    totalViews: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const { toast } = useToast()
  
  // Move these hooks outside of the conditional
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [requestedRole, setRequestedRole] = useState('moderator')
  
  const router = useRouter()
  
  useEffect(() => {
    if (authLoading) return;
    
    // Check if user is an admin
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      
      try {
        console.log('Checking admin status for user:', user.id);
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
          return;
        }
        
        // Store the actual role
        const role = data?.role || 'user';
        setUserRole(role);
        
        // Check if user has admin-level permissions (admin, moderator, or superadmin)
        const adminRoles = ['admin', 'moderator', 'superadmin'];
        const isUserAdmin = adminRoles.includes(role);
        
        console.log('User admin status:', isUserAdmin, 'Role:', role);
        setIsAdmin(isUserAdmin);
        
        if (isUserAdmin) {
          fetchDashboardData();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Unexpected error checking admin status:', error);
        setIsAdmin(false);
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [user, authLoading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      console.log('Fetching admin dashboard data');

      // Get article stats
      const { data: articleData, error: articleError } = await supabaseAdmin
        .from('articles')
        .select('status')

      if (articleError) {
        console.error('Article fetch error:', articleError);
        throw articleError;
      }

      const publishedArticles = articleData?.filter(a => a.status === 'published').length || 0
      const pendingArticles = articleData?.filter(a => a.status === 'submitted').length || 0

      // Get user count
      const { count: userCount, error: userError } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      if (userError) {
        console.error('User count error:', userError);
        throw userError;
      }

      // Get series count
      const { count: seriesCount, error: seriesError } = await supabaseAdmin
        .from('series')
        .select('*', { count: 'exact', head: true })

      if (seriesError) {
        console.error('Series count error:', seriesError);
        throw seriesError;
      }

      // Use a mock value for view count until we implement analytics
      const totalViews = 1250  

      setStats({
        totalArticles: articleData?.length || 0,
        publishedArticles,
        pendingArticles,
        totalUsers: userCount || 0,
        totalSeries: seriesCount || 0,
        totalViews
      })

      // Get recent activity (articles)
      const { data: recentArticles, error: recentArticlesError } = await supabaseAdmin
        .from('articles')
        .select(`
          id, title, status, created_at, 
          profiles:author_id (full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentArticlesError) {
        console.error('Recent articles error:', recentArticlesError);
        throw recentArticlesError;
      }

      // Get recent user signups
      const { data: recentUsers, error: recentUsersError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentUsersError) {
        console.error('Recent users error:', recentUsersError);
        throw recentUsersError;
      }

      // Combine and format recent activity
      const formattedArticles: RecentActivity[] = (recentArticles || []).map(article => {
        // Handle the case where profiles might be an array or an object
        const profile = Array.isArray(article.profiles) 
          ? article.profiles[0] 
          : article.profiles
        
        return {
          id: article.id,
          type: 'article',
          title: article.title,
          status: article.status,
          date: article.created_at,
          user: {
            name: profile ? profile.full_name || 'Unknown' : 'Unknown',
            email: profile ? profile.email || 'Unknown' : 'Unknown'
          }
        }
      })

      const formattedUsers: RecentActivity[] = (recentUsers || []).map(user => ({
        id: user.id,
        type: 'user',
        title: user.full_name || user.email,
        status: 'active',
        date: user.created_at,
        user: {
          name: user.full_name || 'Unknown',
          email: user.email || 'Unknown'
        }
      }))

      // Combine and sort by date
      const combinedActivity = [...formattedArticles, ...formattedUsers]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10)

      setRecentActivity(combinedActivity)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Show loading spinner while authentication status is being determined
  if (authLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking credentials...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show login prompt
  if (!user) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[70vh]">
        <div className="max-w-md w-full p-6 bg-card rounded-lg shadow-md border border-border">
          <div className="flex flex-col items-center text-center gap-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <h2 className="text-2xl font-bold">Authentication Required</h2>
            <p className="text-muted-foreground">You must be logged in to access the admin dashboard.</p>
            <div className="flex gap-4 mt-4">
              <Link href="/auth/login">
                <Button variant="default">Sign In</Button>
              </Link>
              <Link href="/">
                <Button variant="outline">Go Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated but not an admin, show access denied message with application option
  if (!isAdmin) {
    // Define available roles information
    const availableRoles = [
      { id: 'moderator', name: 'Content Moderator', description: 'Review and approve submitted content' },
      { id: 'contributor', name: 'Contributor', description: 'Submit articles to the platform' },
    ]

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      
      if (!user || !reason.trim()) return
      
      try {
        setIsSubmitting(true)
        
        const response = await fetch('/api/admin-request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            reason: reason.trim(),
            requestedRole,
          }),
        })
        
        const data = await response.json()
        
        if (data.success) {
          setHasApplied(true)
          setReason('')
          toast({
            title: "Success",
            description: "Your request has been submitted for review",
          })
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to submit application. Please try again later.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error submitting application:", error)
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsSubmitting(false)
      }
    }

    return (
      <div className="container py-10">
        <div className="max-w-md mx-auto">
          <div className="flex flex-col items-center text-center gap-4 mb-8">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <h2 className="text-2xl font-bold">Access Denied</h2>
            <p className="text-muted-foreground">
              You need admin permissions to access the admin dashboard.
            </p>
          </div>

          {hasApplied ? (
            <Card>
              <CardHeader>
                <CardTitle>Request Submitted</CardTitle>
                <CardDescription>Thanks for your interest in contributing!</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-primary/10 rounded-lg p-4 flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Application Received</h3>
                    <p className="text-sm text-muted-foreground">
                      We'll review your request and get back to you soon. This process typically takes 1-2 business days.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/dashboard')}
                >
                  Return to Dashboard
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Request Admin Access</CardTitle>
                <CardDescription>Apply for additional permissions on the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium">Available Roles</h3>
                  <p className="text-sm text-muted-foreground">
                    Select the role you'd like to apply for:
                  </p>
                </div>
                
                {!isSubmitting ? (
                  <div className="space-y-6">
                    <div className="grid gap-4">
                      {availableRoles.map(role => (
                        <div 
                          key={role.id} 
                          onClick={() => {
                            setRequestedRole(role.id);
                            setIsSubmitting(true);
                          }} 
                          className="flex gap-4 p-4 border rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors"
                        >
                          {role.id === 'moderator' ? (
                            <Shield className="h-5 w-5 text-primary" />
                          ) : (
                            <PenSquare className="h-5 w-5 text-primary" />
                          )}
                          <div>
                            <h4 className="font-medium">{role.name}</h4>
                            <p className="text-sm text-muted-foreground">{role.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Selected Role</Label>
                      <Select 
                        value={requestedRole} 
                        onValueChange={setRequestedRole}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoles.map(role => (
                            <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reason">Why are you interested in this role?</Label>
                      <Textarea 
                        id="reason"
                        placeholder="Please explain why you'd like to become a moderator and any relevant experience you have..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="min-h-[120px]"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Be specific about your qualifications and how you plan to contribute to the platform.
                      </p>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setIsSubmitting(false)}
                      >
                        Back
                      </Button>
                      <Button type="submit" className="flex-1">
                        Submit Request
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      {loading ? (
        <div className="flex justify-center my-12">
          <Activity className="h-8 w-8 animate-spin" />
          <span className="sr-only">Loading...</span>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalArticles}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.publishedArticles} published, {stats.pendingArticles} pending
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Active community members
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Series/Collections</CardTitle>
                <List className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSeries}</div>
                <p className="text-xs text-muted-foreground">
                  Organized article collections
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Article views this month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  The latest user and content activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentActivity.map((activity) => (
                      <TableRow key={`${activity.type}-${activity.id}`}>
                        <TableCell>
                          <Badge variant={activity.type === 'article' ? 'default' : 'secondary'}>
                            {activity.type === 'article' ? 'Article' : 'User'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{activity.title}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              activity.status === 'published' ? 'default' : 
                              activity.status === 'submitted' ? 'secondary' : 
                              activity.status === 'active' ? 'outline' : 'default'
                            }
                          >
                            {activity.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(activity.date), 'MMM d, yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted cursor-pointer">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Review submissions</h3>
                      <p className="text-sm text-muted-foreground">
                        {stats.pendingArticles} articles pending review
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted cursor-pointer">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">View analytics</h3>
                      <p className="text-sm text-muted-foreground">
                        Check performance metrics
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted cursor-pointer">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Schedule content</h3>
                      <p className="text-sm text-muted-foreground">
                        Plan upcoming publications
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
