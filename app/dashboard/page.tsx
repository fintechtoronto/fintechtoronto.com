'use client'

import { useAuth } from '@/components/auth-provider'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import OnboardingProgressTracker from '@/components/onboarding/progress-tracker'
import { Button } from '@/components/ui/button'
import { FileText, BarChart2, Clock, PenSquare, BookText, Shield, UserCheck, Loader2, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    articlesCount: 0,
    publishedCount: 0,
    draftCount: 0,
  })
  const [onboardingCompleted, setOnboardingCompleted] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('user')
  const [isApplyingForRole, setIsApplyingForRole] = useState(false)
  const [applicationReason, setApplicationReason] = useState('')
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false)
  const [hasPendingApplication, setHasPendingApplication] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Don't attempt to load data until authentication is complete
    if (authLoading) {
      console.log('Auth still loading, waiting...');
      return;
    }

    async function loadDashboardData() {
      if (!user) {
        console.log('No user found, skipping dashboard data load');
        setLoading(false);
        return;
      }
      
      try {
        console.log('Loading dashboard data for user:', user.id);
        setLoading(true);
        setError(null);
        
        // Fetch profile data to check onboarding status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError) {
          console.error('Profile fetch error:', profileError);
          setError('Failed to load profile data');
        }
        
        if (profile) {
          console.log('Profile loaded:', profile);
          setUserProfile(profile);
          setOnboardingCompleted(profile.onboarding_completed || false);
          setUserRole(profile.role || 'user');
        }
        
        // Check if user has pending role applications
        const { data: pendingApplications, error: pendingAppError } = await supabase
          .from('admin_requests')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .limit(1);
          
        if (pendingAppError) {
          console.error('Error checking pending applications:', pendingAppError);
        } else if (pendingApplications && pendingApplications.length > 0) {
          setHasPendingApplication(true);
        }
        
        // Fetch all articles data to handle different schemas
        const { data: articlesData, error: articlesError } = await supabase
          .from('articles')
          .select('*')
          .eq('author_id', user.id);
          
        if (articlesError) {
          console.error('Articles fetch error:', articlesError);
          setError(prev => prev || 'Failed to load articles data');
          // Continue execution to not block the UI completely
        }
        
        if (articlesData) {
          console.log('Articles loaded:', articlesData.length, 'articles found');
          
          // Check if articles have 'published' boolean field or 'status' text field
          let publishedCount = 0;
          let draftCount = 0;
          
          articlesData.forEach(article => {
            // Handle both potential schemas
            if (typeof article.published === 'boolean') {
              // Using published boolean field
              if (article.published === true) {
                publishedCount++;
              } else {
                draftCount++;
              }
            } else if (article.status && typeof article.status === 'string') {
              // Using status text field
              if (article.status.toLowerCase() === 'published') {
                publishedCount++;
              } else if (article.status.toLowerCase() === 'draft') {
                draftCount++;
              } else {
                // Any other status (pending, rejected, etc)
                draftCount++;
              }
            } else {
              // Default to draft if can't determine
              console.log('Article with undetermined status:', article.id);
              draftCount++;
            }
          });
          
          setStats({
            articlesCount: articlesData.length,
            publishedCount,
            draftCount,
          });
        } else {
          // Set default stats if no articles data
          setStats({
            articlesCount: 0,
            publishedCount: 0,
            draftCount: 0,
          });
        }
      } catch (error) {
        console.error('Dashboard data load error:', error);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    loadDashboardData();
  }, [user, authLoading]);
  
  // Show loading state if either auth is loading or dashboard data is loading
  if (authLoading || (loading && !error)) {
    return (
      <div className="container py-10">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  // If auth is complete but no user is found, show auth error
  if (!authLoading && !user) {
    return (
      <div className="container py-10">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
          <h2 className="text-lg font-medium mb-2">Authentication Error</h2>
          <p>You must be signed in to view this page.</p>
          <div className="mt-4">
            <Link href="/auth/login">
              <Button variant="outline">Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // Show error message if there was an error loading data
  if (error) {
    return (
      <div className="container py-10">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
          <h2 className="text-lg font-medium mb-2">Error</h2>
          <p>{error}</p>
          <p className="mt-2 text-sm">Please try refreshing the page or contact support if the issue persists.</p>
        </div>
      </div>
    );
  }
  
  // Get user's first name safely
  const firstName = user?.user_metadata?.full_name 
    ? user.user_metadata.full_name.split(' ')[0] 
    : userProfile?.full_name 
      ? userProfile.full_name.split(' ')[0]
      : 'Author';
  
  const handleRoleApplicationSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user || !applicationReason.trim()) return;
    
    try {
      setIsSubmittingApplication(true);
      
      const response = await fetch('/api/admin-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          reason: applicationReason,
          requestedRole: 'moderator',
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Application Submitted",
          description: "Your moderator application has been submitted for review.",
        });
        setHasPendingApplication(true);
        setIsApplyingForRole(false);
        setApplicationReason('');
      } else {
        if (response.status === 400 && data.message?.includes('pending request')) {
          toast({
            title: "Application Already Exists",
            description: "You already have a pending application. We'll review it soon!",
            variant: "destructive",
          });
          setHasPendingApplication(true);
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to submit application",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error submitting role application:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  return (
    <div className="container py-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {firstName}!
          </p>
        </div>
        
        {!onboardingCompleted && (
          <OnboardingProgressTracker />
        )}
        
        {/* Role status card */}
        <div className="w-full">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Your Role & Access
                </CardTitle>
                {userRole !== 'user' && (
                  <div className="flex items-center px-3 py-1 rounded-full bg-primary/20 text-sm font-medium">
                    <span className="mr-2 capitalize">{userRole}</span>
                    <Shield className="h-4 w-4" />
                  </div>
                )}
              </div>
              <CardDescription>
                Your current permissions and role on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userRole === 'user' ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">
                      You currently have a standard user account. Want to contribute more to FintechToronto?
                    </p>
                    
                    {hasPendingApplication ? (
                      <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 p-3 rounded-md text-sm flex items-start gap-3">
                        <Clock className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Application under review</p>
                          <p className="mt-1">Your application to become a community moderator is being reviewed. We'll notify you when there's an update.</p>
                        </div>
                      </div>
                    ) : isApplyingForRole ? (
                      <form onSubmit={handleRoleApplicationSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reason">
                            Why do you want to be a moderator?
                          </Label>
                          <Textarea 
                            id="reason"
                            value={applicationReason}
                            onChange={(e) => setApplicationReason(e.target.value)}
                            placeholder="Tell us about yourself and why you'd be a good fit for reviewing and approving content..."
                            className="min-h-[120px]"
                            required
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            type="submit" 
                            disabled={isSubmittingApplication || !applicationReason.trim()}
                          >
                            {isSubmittingApplication && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Submit Application
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsApplyingForRole(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        <Button 
                          onClick={() => setIsApplyingForRole(true)}
                          className="gap-2"
                        >
                          <UserCheck className="h-4 w-4" />
                          Apply to be a Moderator
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-md">
                      <UserCheck className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">
                          You're a <span className="capitalize">{userRole}</span>
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {userRole === 'moderator' 
                            ? 'You can review and approve content submitted by other users.' 
                            : userRole === 'admin'
                            ? 'You have administrative privileges to manage the platform.' 
                            : userRole === 'author'
                            ? 'You can publish articles directly without approval.'
                            : userRole === 'contributor'
                            ? 'You can contribute articles for review and publication.'
                            : userRole === 'superadmin'
                            ? 'You have full access to all platform features and settings.'
                            : 'You have additional permissions on the platform.'}
                        </p>
                      </div>
                    </div>
                    
                    <Link href="/admin" className="inline-block">
                      <Button variant="outline" className="gap-2">
                        <Shield className="h-4 w-4" />
                        {userRole === 'superadmin' || userRole === 'admin' 
                          ? 'Go to Admin Dashboard'
                          : 'Go to Moderator Area'}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard 
            title="Total Articles" 
            value={stats.articlesCount} 
            description="All your articles" 
            icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          />
          <DashboardCard 
            title="Published" 
            value={stats.publishedCount} 
            description="Live on the site" 
            icon={<BookText className="h-4 w-4 text-muted-foreground" />}
          />
          <DashboardCard 
            title="Draft" 
            value={stats.draftCount} 
            description="Work in progress" 
            icon={<PenSquare className="h-4 w-4 text-muted-foreground" />}
          />
          <DashboardCard 
            title="Views" 
            value={0} 
            description="Coming soon" 
            icon={<BarChart2 className="h-4 w-4 text-muted-foreground" />}
          />
        </div>
        
        <div className="grid gap-4 grid-cols-1 md:grid-cols-6">
          <Card className="md:col-span-4">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent articles and engagement</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.articlesCount > 0 ? (
                <div className="space-y-8">
                  <Tabs defaultValue="articles" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="articles">Your Articles</TabsTrigger>
                      <TabsTrigger value="engagement">Engagement</TabsTrigger>
                    </TabsList>
                    <TabsContent value="articles" className="space-y-4">
                      <div className="rounded-md border">
                        <div className="p-4">
                          <h3 className="text-lg font-medium">Coming Soon</h3>
                          <p className="text-sm text-muted-foreground">
                            We're working on a comprehensive activity dashboard.
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="engagement" className="space-y-4">
                      <div className="rounded-md border">
                        <div className="p-4">
                          <h3 className="text-lg font-medium">Coming Soon</h3>
                          <p className="text-sm text-muted-foreground">
                            This feature is under development.
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No articles yet</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                    Share your insights with the Toronto fintech community by writing your first article.
                  </p>
                  <Link href="/dashboard/new-article">
                    <Button>Write Your First Article</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/dashboard/new-article" className="flex items-center w-full">
                <Button variant="outline" className="w-full justify-start">
                  <PenSquare className="mr-2 h-4 w-4" />
                  New Article
                </Button>
              </Link>
              <Link href="/dashboard/articles" className="flex items-center w-full">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  My Articles
                </Button>
              </Link>
              <Link href="/dashboard/settings/profile" className="flex items-center w-full">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Request Role Upgrade */}
        <div className="flex flex-col gap-2 mt-6">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Want to contribute more?</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Apply for a role upgrade to get additional permissions
                  </p>
                </div>
                <Link href="/dashboard/request-role">
                  <Button>
                    Request Role
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardCard({ title, value, description, icon }: { 
  title: string, 
  value: number, 
  description: string,
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
} 