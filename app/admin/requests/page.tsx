'use client'

import { useState, useEffect } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'
import { useToast } from '@/hooks/use-toast'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  UserCheck, 
  UserX, 
  AlertTriangle,
  Loader2, 
  Clock,
  Check, 
  X
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
  user?: {
    full_name: string
    email: string
    avatar_url?: string
  }
}

export default function AdminRequestsPage() {
  const { user, loading: authLoading } = useAuth()
  const [requests, setRequests] = useState<AdminRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<'approved' | 'rejected' | null>(null)
  const { toast } = useToast()

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
        
        // Only true admins can review requests
        const isUserAdmin = data?.role === 'admin' || data?.role === 'superadmin';
        
        console.log('User admin status:', isUserAdmin, 'Role:', data?.role);
        setIsAdmin(isUserAdmin);
        
        if (isUserAdmin) {
          fetchRequests();
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

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabaseAdmin
        .from('admin_requests')
        .select(`
          *,
          user:profiles(
            full_name,
            email,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openReviewDialog = (request: AdminRequest, status: 'approved' | 'rejected') => {
    setSelectedRequest(request);
    setSelectedStatus(status);
    setFeedbackText('');
    setIsReviewDialogOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!selectedRequest || !selectedStatus || !user) return;
    
    try {
      setIsProcessing(true);
      
      const response = await fetch('/api/admin-request/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          adminId: user.id,
          status: selectedStatus,
          feedback: feedbackText.trim() || null,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Request Processed',
          description: `Successfully ${selectedStatus} the user's request`,
        });
        
        // Update the local state
        setRequests(prev => 
          prev.map(req => 
            req.id === selectedRequest.id 
              ? { 
                  ...req, 
                  status: selectedStatus, 
                  reviewed_at: new Date().toISOString(),
                  reviewed_by: user.id
                } 
              : req
          )
        );
        
        setIsReviewDialogOpen(false);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to process request',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error processing request:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Access denied view
  if (!authLoading && (!user || !isAdmin)) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[70vh]">
        <div className="max-w-md w-full p-6 bg-card rounded-lg shadow-md border border-border">
          <div className="flex flex-col items-center text-center gap-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <h2 className="text-2xl font-bold">Access Denied</h2>
            <p className="text-muted-foreground">
              You need admin permissions to access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Role Requests</h1>
        <p className="text-muted-foreground">
          Review and manage user role upgrade requests
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
          <CardDescription>
            Users requesting upgraded permissions on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Check className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No pending requests</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                There are currently no role upgrade requests to review.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Requested Role</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{request.user?.full_name || 'Unknown User'}</span>
                          <span className="text-sm text-muted-foreground">
                            {request.user?.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {request.requested_role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(request.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            request.status === 'pending'
                              ? 'outline'
                              : request.status === 'approved'
                              ? 'default'
                              : 'destructive'
                          }
                          className="capitalize"
                        >
                          {request.status}
                          {request.status === 'pending' && (
                            <Clock className="ml-1 h-3 w-3" />
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {request.status === 'pending' ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => openReviewDialog(request, 'approved')}
                                className="h-8 gap-1"
                              >
                                <UserCheck className="h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openReviewDialog(request, 'rejected')}
                                className="h-8 gap-1"
                              >
                                <UserX className="h-4 w-4" />
                                Reject
                              </Button>
                            </>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(request);
                                setFeedbackText(request.status === 'rejected' ? 'Request rejected' : 'Request approved');
                                setIsReviewDialogOpen(true);
                              }}
                              className="h-8"
                            >
                              View Details
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedStatus === 'approved' 
                ? 'Approve Request' 
                : selectedStatus === 'rejected'
                ? 'Reject Request'
                : 'Request Details'}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.status !== 'pending'
                ? 'View the details of this processed request'
                : selectedStatus === 'approved'
                ? `Grant ${selectedRequest?.requested_role} role to ${selectedRequest?.user?.full_name || 'this user'}`
                : `Decline ${selectedRequest?.user?.full_name || 'this user'}'s request for ${selectedRequest?.requested_role} role`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedRequest && (
              <div className="rounded-md bg-muted p-4 text-sm">
                <h4 className="font-medium mb-2">User's Reason:</h4>
                <p className="whitespace-pre-wrap">{selectedRequest.reason || 'No reason provided'}</p>
              </div>
            )}

            {(selectedRequest?.status === 'pending' || !selectedRequest?.status) && (
              <div className="space-y-2">
                <Label htmlFor="feedback">
                  {selectedStatus === 'approved' ? 'Approval Message' : 'Rejection Reason'}
                </Label>
                <Textarea
                  id="feedback"
                  placeholder={
                    selectedStatus === 'approved'
                      ? 'Optional: Add a note about their new permissions...'
                      : 'Please provide a reason for rejecting this request...'
                  }
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            )}

            {selectedRequest?.status !== 'pending' && selectedRequest?.reviewed_at && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Decision Details:</h4>
                <div className="rounded-md bg-muted p-4 text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant={selectedRequest.status === 'approved' ? 'default' : 'destructive'}
                      className="capitalize"
                    >
                      {selectedRequest.status}
                    </Badge>
                    <span className="text-muted-foreground">
                      on {format(new Date(selectedRequest.reviewed_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {selectedRequest.feedback && (
                    <div>
                      <h5 className="font-medium mb-1">Feedback:</h5>
                      <p className="whitespace-pre-wrap">{selectedRequest.feedback}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsReviewDialogOpen(false)}
            >
              {selectedRequest?.status !== 'pending' ? 'Close' : 'Cancel'}
            </Button>
            
            {selectedRequest?.status === 'pending' && (
              <div className="flex gap-2">
                {selectedStatus === 'rejected' && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleReviewSubmit}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <X className="mr-2 h-4 w-4" />
                        Reject Request
                      </>
                    )}
                  </Button>
                )}
                
                {selectedStatus === 'approved' && (
                  <Button
                    type="button"
                    onClick={handleReviewSubmit}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Approve Request
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 