'use client'

import { useState, useEffect } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Search, 
  Loader2, 
  Edit,
  User,
  Shield,
  Calendar,
  Mail,
  MoreHorizontal
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from '@/hooks/use-toast'
import { useDebounce } from '@/lib/hooks'
import { format } from 'date-fns'

type UserProfile = {
  id: string
  email: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  role: 'user' | 'author' | 'admin' | null
  created_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('')
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [debouncedSearchTerm])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      
      let query = supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, username, avatar_url, role, created_at')
        .order('created_at', { ascending: false })
      
      // Add search filter if there's a search term
      if (debouncedSearchTerm) {
        query = query.or(`email.ilike.%${debouncedSearchTerm}%,full_name.ilike.%${debouncedSearchTerm}%,username.ilike.%${debouncedSearchTerm}%`)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      if (data) {
        setUsers(data as UserProfile[])
      } else {
        setUsers([])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (user: UserProfile) => {
    setSelectedUser(user)
    setUserRole(user.role || 'user')
    setIsEditDialogOpen(true)
  }

  const updateUserRole = async () => {
    if (!selectedUser) return
    
    try {
      setProcessingId(selectedUser.id)
      
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ 
          role: userRole,
          updated_at: new Date().toISOString() 
        })
        .eq('id', selectedUser.id)
      
      if (error) throw error
      
      // Update local state
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, role: userRole as UserProfile['role'] } 
          : user
      ))
      
      toast({
        title: 'User Updated',
        description: `User role has been updated to ${userRole}`,
      })
      
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error('Error updating user:', error)
      toast({
        title: 'Error',
        description: 'Failed to update user',
        variant: 'destructive',
      })
    } finally {
      setProcessingId(null)
    }
  }

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case 'admin':
        return 'destructive'
      case 'author':
        return 'default'
      case 'user':
      default:
        return 'secondary'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name, email, or username..."
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
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        {debouncedSearchTerm 
                          ? 'No users match your search.' 
                          : 'No users found.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.full_name || user.email} className="h-full w-full object-cover" />
                              ) : (
                                <User className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{user.full_name || 'Unnamed User'}</p>
                              {user.username && <p className="text-xs text-muted-foreground">@{user.username}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            <Shield className="h-3.5 w-3.5 mr-1" />
                            {user.role || 'user'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {format(new Date(user.created_at), 'MMM d, yyyy')}
                            </span>
                          </div>
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
                              <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="h-4 w-4 mr-2" />
                                Contact User
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

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                User Role
              </label>
              <Select
                value={userRole}
                onValueChange={setUserRole}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="author">Author</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-semibold">Roles:</span>
                <span className="block">• User: Can browse content and comment</span>
                <span className="block">• Author: Can create and publish content</span>
                <span className="block">• Admin: Full site control and management</span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={processingId === selectedUser?.id}
            >
              Cancel
            </Button>
            <Button 
              onClick={updateUserRole} 
              disabled={!userRole || processingId === selectedUser?.id}
            >
              {processingId === selectedUser?.id && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 