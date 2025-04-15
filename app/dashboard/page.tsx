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
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }
  
  // If auth is complete but no user is found, show auth error
  if (!authLoading && !user) {
    return (
      <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
        <h2 className="text-lg font-medium mb-2">Authentication Error</h2>
        <p>You must be signed in to view this page.</p>
        <div className="mt-4">
          <Link href="/auth/login">
            <Button variant="outline">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // Show error message if there was an error loading data
  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
        <h2 className="text-lg font-medium mb-2">Error</h2>
        <p>{error}</p>
        <p className="mt-2 text-sm">Please try refreshing the page or contact support if the issue persists.</p>
      </div>
    );
  }

  // Get user's first name safely
  const firstName = user?.user_metadata?.full_name 
    ? user.user_metadata.full_name.split(' ')[0] 
    : userProfile?.full_name?.split(' ')[0] 
    || 'there';

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {firstName}!</h1>
        <p className="text-muted-foreground">Here's an overview of your activity and content.</p>
      </div>

      {!onboardingCompleted && user && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              Take a few minutes to set up your profile and get the most out of your experience.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OnboardingProgressTracker />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.articlesCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.publishedCount} published, {stats.draftCount} drafts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Role Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{userRole}</div>
            {userRole === 'user' && !hasPendingApplication && (
              <Button
                variant="link"
                className="h-auto p-0 text-xs text-muted-foreground"
                onClick={() => setIsApplyingForRole(true)}
              >
                Apply for contributor role
              </Button>
            )}
            {hasPendingApplication && (
              <p className="text-xs text-muted-foreground">
                Application pending review
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Link href="/dashboard/new-article">
              <Button className="w-full justify-between" variant="outline">
                Create New Article
                <PenSquare className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/dashboard/articles">
              <Button className="w-full justify-between" variant="outline">
                View All Articles
                <BookText className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/dashboard/settings/profile">
              <Button className="w-full justify-between" variant="outline">
                Edit Profile
                <UserCheck className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {isApplyingForRole && user && (
          <Card>
            <CardHeader>
              <CardTitle>Apply for Contributor Role</CardTitle>
              <CardDescription>
                Tell us why you'd like to become a contributor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!applicationReason.trim()) {
                  toast({
                    title: "Error",
                    description: "Please provide a reason for your application",
                    variant: "destructive",
                  });
                  return;
                }
                
                setIsSubmittingApplication(true);
                
                try {
                  const { error } = await supabase
                    .from('admin_requests')
                    .insert([
                      {
                        user_id: user.id,
                        request_type: 'role_upgrade',
                        status: 'pending',
                        details: {
                          current_role: userRole,
                          requested_role: 'contributor',
                          reason: applicationReason
                        }
                      }
                    ]);
                    
                  if (error) throw error;
                  
                  toast({
                    title: "Application Submitted",
                    description: "We'll review your application and get back to you soon.",
                  });
                  
                  setIsApplyingForRole(false);
                  setHasPendingApplication(true);
                  setApplicationReason('');
                } catch (error) {
                  console.error('Error submitting application:', error);
                  toast({
                    title: "Error",
                    description: "Failed to submit application. Please try again.",
                    variant: "destructive",
                  });
                } finally {
                  setIsSubmittingApplication(false);
                }
              }}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reason">Application Reason</Label>
                    <Textarea
                      id="reason"
                      placeholder="Tell us about your experience and why you'd like to contribute..."
                      value={applicationReason}
                      onChange={(e) => setApplicationReason(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsApplyingForRole(false);
                        setApplicationReason('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmittingApplication}
                    >
                      {isSubmittingApplication && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Submit Application
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 