'use client'

import { useState, useEffect } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Loader2, 
  Shield,
  Users,
  AlertTriangle,
  Info,
  Lock,
  CheckCircle
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/components/auth-provider'

type Role = {
  id: string
  name: string
  description: string
  rank: number
  created_at: string
  permissions?: Permission[]
}

type Permission = {
  id: string
  name: string
  description: string
  created_at?: string
}

type RoleWithPermCount = Role & {
  permission_count: number
}

export default function RolesPage() {
  const { user } = useAuth()
  const [roles, setRoles] = useState<RoleWithPermCount[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('roles')
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const { toast } = useToast()
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    if (activeTab === 'roles') {
      fetchRoles()
    } else {
      fetchPermissions()
    }
    
    if (user) {
      fetchUserRole()
    }
  }, [activeTab, user])

  const fetchUserRole = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user?.id || '')
        .single()
        
      if (error) throw error
      
      setUserRole(data.role)
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
  }

  const fetchRoles = async () => {
    try {
      setLoading(true)
      
      // Get all roles
      const { data: rolesData, error: rolesError } = await supabaseAdmin
        .from('roles')
        .select('*')
        .order('rank', { ascending: false })
        
      if (rolesError) throw rolesError
      
      // Get permission counts for each role
      const rolesWithPermissions: RoleWithPermCount[] = []
      
      for (const role of rolesData || []) {
        const { count, error: countError } = await supabaseAdmin
          .from('role_permissions')
          .select('*', { count: 'exact', head: true })
          .eq('role_id', role.id)
          
        if (countError) throw countError
        
        rolesWithPermissions.push({
          ...role,
          permission_count: count || 0
        })
      }
      
      setRoles(rolesWithPermissions)
    } catch (error) {
      console.error('Error fetching roles:', error)
      toast({
        title: 'Error',
        description: 'Failed to load roles',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabaseAdmin
        .from('permissions')
        .select('*')
        .order('name')
        
      if (error) throw error
      
      setPermissions(data)
    } catch (error) {
      console.error('Error fetching permissions:', error)
      toast({
        title: 'Error',
        description: 'Failed to load permissions',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const viewRoleDetails = async (role: RoleWithPermCount) => {
    try {
      const { data: roleData, error: roleError } = await supabaseAdmin
        .from('role_permissions')
        .select(`
          role_id,
          permissions:permission_id (
            id, name, description
          )
        `)
        .eq('role_id', role.id)
        
      if (roleError) throw roleError
      
      const permissions = roleData?.map(item => {
        // Handle both possible formats for the permissions field
        if (Array.isArray(item.permissions)) {
          return item.permissions[0]
        } else {
          return item.permissions
        }
      }) || []
      
      const roleWithPerms: Role = {
        ...role,
        permissions
      }
      
      setSelectedRole(roleWithPerms)
      setIsRoleDialogOpen(true)
    } catch (error) {
      console.error('Error fetching role details:', error)
      toast({
        title: 'Error',
        description: 'Failed to load role details',
        variant: 'destructive',
      })
    }
  }

  const getRoleBadgeVariant = (rank: number) => {
    if (rank >= 100) return 'destructive' // Superadmin
    if (rank >= 80) return 'default' // Admin
    if (rank >= 60) return 'secondary' // Moderator
    if (rank >= 40) return 'outline' // Author
    return 'secondary' // Other roles
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Roles & Permissions</h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>System Roles</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : roles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No roles found</h3>
                  <p className="text-muted-foreground mt-2">
                    There are no roles defined in the system
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roles.map((role) => (
                        <TableRow key={role.id} className={userRole === role.id ? 'bg-muted/50' : ''}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant={getRoleBadgeVariant(role.rank)} className="capitalize">
                                <Shield className="h-3.5 w-3.5 mr-1" />
                                {role.name}
                              </Badge>
                              {userRole === role.id && (
                                <Badge variant="outline" className="text-xs">
                                  Your role
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{role.description}</TableCell>
                          <TableCell>{role.permission_count} permissions</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewRoleDetails(role)}
                            >
                              <Info className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>System Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : permissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No permissions found</h3>
                  <p className="text-muted-foreground mt-2">
                    There are no permissions defined in the system
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Permission</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {permissions.map((permission) => (
                        <TableRow key={permission.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Lock className="h-4 w-4 text-muted-foreground" />
                              {permission.name}
                            </div>
                          </TableCell>
                          <TableCell>{permission.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Role Details Dialog */}
      {selectedRole && (
        <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className={`h-5 w-5 ${
                  selectedRole.rank >= 100 ? 'text-destructive' :
                  selectedRole.rank >= 80 ? 'text-primary' :
                  'text-muted-foreground'
                }`} />
                {selectedRole.name}
              </DialogTitle>
              <DialogDescription>
                {selectedRole.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <h3 className="text-sm font-medium mb-3">Permissions granted:</h3>
              <div className="space-y-2">
                {selectedRole.permissions && selectedRole.permissions.length > 0 ? (
                  selectedRole.permissions.map((permission) => (
                    <div key={permission.id} className="flex items-start p-2 border rounded-md bg-muted/50">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{permission.name}</p>
                        <p className="text-xs text-muted-foreground">{permission.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">This role has no specific permissions.</p>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={() => setIsRoleDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 