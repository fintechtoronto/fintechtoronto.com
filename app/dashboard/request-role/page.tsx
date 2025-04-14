'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'
import { useToast } from '@/hooks/use-toast'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  Check, 
  Clock,
  HelpCircle,
  AlertTriangle,
  ChevronRight
} from 'lucide-react'
import { format } from 'date-fns'

type AdminRequest = {
  id: string
  user_id: string
  reason: string
  requested_role: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  feedback: string | null
}

type Role = {
  id: string
  name: string
  description: string
  rank: number
}

export default function RequestRolePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [reason, setReason] = useState('')
  const [selectedRole, setSelectedRole] = useState('moderator')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingRequest, setPendingRequest] = useState<AdminRequest | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Check if user already has a pending request
        const { data: requestData, error: requestError } = await supabaseAdmin
          .from('admin_requests')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .single();
          
        if (requestError && requestError.code !== 'PGRST116') {
          console.error('Error fetching requests:', requestError);
          toast({
            title: 'Error',
            description: 'Failed to load request data',
            variant: 'destructive',
          });
        }
        
        if (requestData) {
          setPendingRequest(requestData);
        }
        
        // Get available roles
        const { data: rolesData, error: rolesError } = await supabaseAdmin
          .from('roles')
          .select('*')
          .gt('rank', 10) // Above regular user
          .lt('rank', 80) // Below admin
          .order('rank', { ascending: true });
          
        if (rolesError) {
          console.error('Error fetching roles:', rolesError);
        } else if (rolesData) {
          setRoles(rolesData);
          
          // Set default role if no pending request
          if (!requestData && rolesData.length > 0) {
            setSelectedRole(rolesData[0]?.id || 'moderator');
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user, authLoading, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !reason.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/admin-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          reason: reason.trim(),
          requestedRole: selectedRole,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Request Submitted',
          description: 'Your role upgrade request has been submitted for review',
        });
        
        const { data: requestData } = await supabaseAdmin
          .from('admin_requests')
          .select('*')
          .eq('id', data.requestId)
          .single();
          
        if (requestData) {
          setPendingRequest(requestData);
          setReason('');
        }
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to submit request',
          variant: 'destructive',
        });
        
        // If the error is due to existing request, show that request
        if (data.requestId) {
          const { data: requestData } = await supabaseAdmin
            .from('admin_requests')
            .select('*')
            .eq('id', data.requestId)
            .single();
            
          if (requestData) {
            setPendingRequest(requestData);
          }
        }
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (loading || authLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Request Role Upgrade</h1>
        <p className="text-muted-foreground">
          Request additional permissions to contribute more to the platform
        </p>
      </div>

      {pendingRequest ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Request Under Review</CardTitle>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Pending
              </Badge>
            </div>
            <CardDescription>
              Your request has been submitted and is awaiting review
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Requested Role</h3>
              <Badge variant="secondary" className="capitalize">
                {pendingRequest.requested_role}
              </Badge>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-1">Your Reason</h3>
              <div className="bg-muted p-3 rounded-md text-sm">
                <p className="whitespace-pre-wrap">{pendingRequest.reason}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-1">Submitted On</h3>
              <p className="text-sm">{format(new Date(pendingRequest.created_at), 'MMMM d, yyyy')}</p>
            </div>
            
            <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-4 text-sm border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-700 dark:text-blue-300">What happens next?</h4>
                  <p className="mt-1 text-blue-700/80 dark:text-blue-300/80">
                    An administrator will review your request. You'll be notified once a decision has been made.
                    This process typically takes 1-2 business days.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Apply for Role Upgrade</CardTitle>
              <CardDescription>
                Explain why you're requesting enhanced permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="role-select" className="text-sm font-medium">
                  Select Desired Role
                </label>
                <Select
                  value={selectedRole}
                  onValueChange={setSelectedRole}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="role-select" className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.length > 0 ? (
                      roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="moderator">Content Moderator</SelectItem>
                        <SelectItem value="contributor">Contributor</SelectItem>
                        <SelectItem value="author">Featured Author</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                
                <div className="rounded-md bg-muted p-3 text-sm">
                  {roles.find(r => r.id === selectedRole)?.description || 
                    (selectedRole === 'moderator' ? 'Moderators can review and approve content submitted by others.' :
                    selectedRole === 'contributor' ? 'Contributors can submit articles for approval.' :
                    selectedRole === 'author' ? 'Featured authors can publish articles without approval.' :
                    'This role provides additional permissions on the platform.')}
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="reason" className="text-sm font-medium">
                  Why are you requesting this role?
                </label>
                <Textarea
                  id="reason"
                  placeholder="Please explain why you should be granted this role..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="min-h-[150px]"
                />
                <p className="text-sm text-muted-foreground">
                  Be specific about your qualifications and how you plan to contribute.
                </p>
              </div>
              
              <div className="rounded-md border p-4 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-300">Important</h4>
                    <p className="mt-1 text-amber-800/80 dark:text-amber-300/80">
                      Role upgrades come with additional responsibilities. Make sure you understand
                      what is expected of you before requesting an upgrade.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !reason.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Request
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  )
} 