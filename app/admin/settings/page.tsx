'use client'

import { useState } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { 
  Settings, 
  Globe, 
  Mail, 
  Loader2, 
  Shield, 
  FileText,
  Save
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Separator } from '@/components/ui/separator'

type SiteSettings = {
  site_name: string
  site_description: string
  contact_email: string
  enable_registration: boolean
  enable_comments: boolean
  require_approval: boolean
  analytics_id: string
  max_article_length: number
  custom_css: string
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<SiteSettings>({
    site_name: 'FintechToronto',
    site_description: 'A community for Fintech enthusiasts in Toronto',
    contact_email: 'admin@fintechtoronto.com',
    enable_registration: true,
    enable_comments: true,
    require_approval: true,
    analytics_id: '',
    max_article_length: 5000,
    custom_css: ''
  })
  
  const { toast } = useToast()

  const handleInputChange = (field: keyof SiteSettings, value: any) => {
    setSettings({
      ...settings,
      [field]: value
    })
  }

  const saveSettings = async () => {
    setLoading(true)
    
    try {
      // In a real implementation, you would save the settings to Supabase or another database
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      toast({
        title: 'Settings Saved',
        description: 'Your site settings have been updated successfully',
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Site Settings</h2>
      </div>
      
      <Tabs defaultValue="general">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="sm:w-48">
            <TabsList className="flex sm:flex-col justify-start p-0">
              <TabsTrigger
                value="general"
                className="w-full justify-start rounded-none mb-1 data-[state=active]:border-l-4 pl-2 data-[state=active]:border-primary"
              >
                <Globe className="h-5 w-5 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger
                value="content"
                className="w-full justify-start rounded-none mb-1 data-[state=active]:border-l-4 pl-2 data-[state=active]:border-primary"
              >
                <FileText className="h-5 w-5 mr-2" />
                Content
              </TabsTrigger>
              <TabsTrigger
                value="email"
                className="w-full justify-start rounded-none mb-1 data-[state=active]:border-l-4 pl-2 data-[state=active]:border-primary"
              >
                <Mail className="h-5 w-5 mr-2" />
                Email
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="w-full justify-start rounded-none mb-1 data-[state=active]:border-l-4 pl-2 data-[state=active]:border-primary"
              >
                <Shield className="h-5 w-5 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger
                value="advanced"
                className="w-full justify-start rounded-none mb-1 data-[state=active]:border-l-4 pl-2 data-[state=active]:border-primary"
              >
                <Settings className="h-5 w-5 mr-2" />
                Advanced
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1">
            <TabsContent value="general" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Manage basic site information and appearance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="site_name">Site Name</Label>
                    <Input
                      id="site_name"
                      value={settings.site_name}
                      onChange={(e) => handleInputChange('site_name', e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      This will be displayed in the header and browser tab
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="site_description">Site Description</Label>
                    <Textarea
                      id="site_description"
                      value={settings.site_description}
                      onChange={(e) => handleInputChange('site_description', e.target.value)}
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground">
                      This will be used for SEO and may appear in search results
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="analytics_id">Google Analytics ID</Label>
                    <Input
                      id="analytics_id"
                      value={settings.analytics_id}
                      onChange={(e) => handleInputChange('analytics_id', e.target.value)}
                      placeholder="G-XXXXXXXXXX"
                    />
                    <p className="text-sm text-muted-foreground">
                      Optional: Add your Google Analytics tracking ID
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-6 flex justify-between">
                  <Button variant="ghost">Reset</Button>
                  <Button onClick={saveSettings} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="content" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Content Settings</CardTitle>
                  <CardDescription>
                    Manage article and content settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="max_article_length">Maximum Article Length</Label>
                    <Input
                      id="max_article_length"
                      type="number"
                      value={settings.max_article_length}
                      onChange={(e) => handleInputChange('max_article_length', parseInt(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground">
                      Maximum number of words allowed in article submissions
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="require_approval">Require Approval</Label>
                      <p className="text-sm text-muted-foreground">
                        Require admin approval before articles are published
                      </p>
                    </div>
                    <Switch
                      id="require_approval"
                      checked={settings.require_approval}
                      onCheckedChange={(checked) => handleInputChange('require_approval', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enable_comments">Enable Comments</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow users to comment on articles
                      </p>
                    </div>
                    <Switch
                      id="enable_comments"
                      checked={settings.enable_comments}
                      onCheckedChange={(checked) => handleInputChange('enable_comments', checked)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-6 flex justify-between">
                  <Button variant="ghost">Reset</Button>
                  <Button onClick={saveSettings} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="email" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Email Settings</CardTitle>
                  <CardDescription>
                    Configure email notifications and templates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={settings.contact_email}
                      onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Email address displayed on the contact page and used for notifications
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="font-medium">Email Templates</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" className="h-auto py-2 justify-start">
                        <div className="flex flex-col items-start">
                          <span>Welcome Email</span>
                          <span className="text-xs text-muted-foreground">Sent to new users</span>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-auto py-2 justify-start">
                        <div className="flex flex-col items-start">
                          <span>Article Approved</span>
                          <span className="text-xs text-muted-foreground">When an article is approved</span>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-auto py-2 justify-start">
                        <div className="flex flex-col items-start">
                          <span>Article Rejected</span>
                          <span className="text-xs text-muted-foreground">When an article is rejected</span>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-auto py-2 justify-start">
                        <div className="flex flex-col items-start">
                          <span>Password Reset</span>
                          <span className="text-xs text-muted-foreground">Password reset requests</span>
                        </div>
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-6 flex justify-between">
                  <Button variant="ghost">Reset</Button>
                  <Button onClick={saveSettings} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="security" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Configure security and access control
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enable_registration">Enable User Registration</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow new users to register on the site
                      </p>
                    </div>
                    <Switch
                      id="enable_registration"
                      checked={settings.enable_registration}
                      onCheckedChange={(checked) => handleInputChange('enable_registration', checked)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="default_role">Default User Role</Label>
                    <Select
                      value="user"
                      onValueChange={() => {}}
                    >
                      <SelectTrigger id="default_role">
                        <SelectValue placeholder="Select a default role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="author">Author</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Role assigned to new users upon registration
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-base font-medium">Authentication Providers</h3>
                    <div className="grid gap-4 grid-cols-2">
                      <div className="flex items-center justify-between border p-4 rounded-md">
                        <div>
                          <h4 className="font-medium">Email/Password</h4>
                          <p className="text-xs text-muted-foreground">Built-in email auth</p>
                        </div>
                        <Switch checked={true} disabled />
                      </div>
                      <div className="flex items-center justify-between border p-4 rounded-md">
                        <div>
                          <h4 className="font-medium">Google</h4>
                          <p className="text-xs text-muted-foreground">OAuth provider</p>
                        </div>
                        <Switch checked={false} />
                      </div>
                      <div className="flex items-center justify-between border p-4 rounded-md">
                        <div>
                          <h4 className="font-medium">GitHub</h4>
                          <p className="text-xs text-muted-foreground">OAuth provider</p>
                        </div>
                        <Switch checked={false} />
                      </div>
                      <div className="flex items-center justify-between border p-4 rounded-md">
                        <div>
                          <h4 className="font-medium">LinkedIn</h4>
                          <p className="text-xs text-muted-foreground">OAuth provider</p>
                        </div>
                        <Switch checked={false} />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-6 flex justify-between">
                  <Button variant="ghost">Reset</Button>
                  <Button onClick={saveSettings} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="advanced" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Settings</CardTitle>
                  <CardDescription>
                    Configure advanced site options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="custom_css">Custom CSS</Label>
                    <Textarea
                      id="custom_css"
                      value={settings.custom_css}
                      onChange={(e) => handleInputChange('custom_css', e.target.value)}
                      rows={8}
                      className="font-mono text-sm"
                      placeholder="/* Add your custom CSS here */"
                    />
                    <p className="text-sm text-muted-foreground">
                      Add custom CSS to override site styling
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-md bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                    <h3 className="font-medium text-amber-800 dark:text-amber-300 mb-2">Danger Zone</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mb-4">
                      These actions can potentially disrupt your site functionality.
                    </p>
                    <div className="grid gap-4 grid-cols-2">
                      <Button variant="outline" className="border-amber-300 dark:border-amber-700">
                        Clear Cache
                      </Button>
                      <Button variant="outline" className="border-amber-300 dark:border-amber-700">
                        Reset to Defaults
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-6 flex justify-between">
                  <Button variant="ghost">Reset</Button>
                  <Button onClick={saveSettings} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  )
} 