'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Loader2, Upload, Check, Info } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { useRouter } from 'next/navigation'

export default function ProfileSettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [profileData, setProfileData] = useState({
    full_name: '',
    username: '',
    bio: '',
    location: '',
    avatar_url: '',
    twitter_handle: '',
    linkedin_url: '',
    website: '',
  })
  const [profileCompletionPercentage, setProfileCompletionPercentage] = useState(0)

  useEffect(() => {
    async function loadProfileData() {
      if (!user) return
      
      try {
        setLoading(true)
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          
        if (error) throw error
        
        // Merge user auth data with profile data
        setProfileData({
          ...profileData,
          ...profile,
          full_name: profile.full_name || user.user_metadata?.full_name || '',
          username: profile.username || user.email?.split('@')[0] || '',
          avatar_url: profile.avatar_url || '',
        })
        
        // Calculate profile completion percentage
        calculateProfileCompletion(profile)
      } catch (error) {
        console.error('Error loading profile data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadProfileData()
  }, [user])
  
  const calculateProfileCompletion = (profile: any) => {
    const requiredFields = [
      'full_name',
      'username',
      'bio',
      'location',
      'avatar_url',
    ]
    
    const optionalFields = [
      'twitter_handle',
      'linkedin_url',
      'website',
    ]
    
    let completedRequiredFields = 0
    let completedOptionalFields = 0
    
    requiredFields.forEach(field => {
      if (profile[field]) completedRequiredFields++
    })
    
    optionalFields.forEach(field => {
      if (profile[field]) completedOptionalFields++
    })
    
    // Required fields count more toward completion (75% of the total)
    const requiredPercentage = (completedRequiredFields / requiredFields.length) * 75
    const optionalPercentage = (completedOptionalFields / optionalFields.length) * 25
    
    const totalPercentage = Math.round(requiredPercentage + optionalPercentage)
    setProfileCompletionPercentage(totalPercentage)
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfileData({
      ...profileData,
      [name]: value,
    })
  }
  
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return
    
    try {
      setUploadingAvatar(true)
      setUploadProgress(0)
      
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}.${fileExt}`
      const filePath = `avatars/${fileName}`
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 5
        })
      }, 100)
      
      const { error } = await supabase.storage
        .from('user-content')
        .upload(filePath, file, { upsert: true })
        
      if (error) throw error
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      const { data: { publicUrl } } = supabase.storage
        .from('user-content')
        .getPublicUrl(filePath)
        
      setProfileData({
        ...profileData,
        avatar_url: publicUrl,
      })
    } catch (error) {
      console.error('Error uploading avatar:', error)
    } finally {
      setUploadingAvatar(false)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return
    
    try {
      setSaving(true)
      setSuccess(false)
      
      // Create a profile object without any email field
      const { 
        full_name, 
        username,
        bio, 
        location, 
        avatar_url, 
        twitter_handle, 
        linkedin_url, 
        website 
      } = profileData
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name,
          username,
          bio,
          location,
          avatar_url,
          twitter_handle,
          linkedin_url,
          website,
          onboarding_completed: profileCompletionPercentage >= 75,
          updated_at: new Date().toISOString(),
        })
        
      if (error) throw error
      
      // Update display name in auth if it has changed
      if (profileData.full_name !== user.user_metadata?.full_name) {
        await supabase.auth.updateUser({
          data: {
            full_name: profileData.full_name,
          }
        })
      }
      
      calculateProfileCompletion(profileData)
      setSuccess(true)
      
      // Success message disappears after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
      
      // Refresh page to show updated avatar and profile
      router.refresh()
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setSaving(false)
    }
  }
  
  if (!user || loading) {
    return <div className="container py-10 animate-pulse">
      <div className="h-8 bg-muted rounded-md w-64 mb-8"></div>
      <div className="grid gap-8">
        <div className="h-64 bg-muted rounded-lg"></div>
      </div>
    </div>
  }
  
  return (
    <div className="container py-10">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground">
          Update your profile information and preferences
        </p>
      </div>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-8 w-full max-w-md">
          <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
          <TabsTrigger value="account" className="flex-1">Account</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Profile Completion</CardTitle>
                <CardDescription>Complete your profile to get the most out of your experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">{profileCompletionPercentage}%</span>
                  </div>
                  <Progress value={profileCompletionPercentage} className="h-2" />
                </div>
                
                <div className="space-y-3 pt-4">
                  <div className="flex items-center gap-2">
                    {profileData.full_name ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Info className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-sm">Add your full name</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {profileData.username ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Info className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-sm">Choose a username</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {profileData.avatar_url ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Info className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-sm">Upload a profile picture</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {profileData.bio ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Info className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-sm">Add a bio</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {profileData.location ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Info className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-sm">Add your location</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details and how others see you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="avatar">Profile Picture</Label>
                    <div className="flex items-center gap-6">
                      <Avatar className="h-20 w-20">
                        {profileData.avatar_url ? (
                          <AvatarImage src={profileData.avatar_url} alt={profileData.full_name} />
                        ) : null}
                        <AvatarFallback className="text-lg">
                          {profileData.full_name.split(' ').map(part => part[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="space-y-2 flex-1">
                        <Label htmlFor="avatar-upload" className="cursor-pointer inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                          {uploadingAvatar ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Image
                            </>
                          )}
                        </Label>
                        <Input 
                          id="avatar-upload" 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleAvatarUpload}
                          disabled={uploadingAvatar}
                        />
                        {uploadingAvatar && (
                          <div className="w-full">
                            <Progress value={uploadProgress} className="h-1" />
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Recommended: Square image, 500x500 pixels or larger
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        placeholder="Your name"
                        value={profileData.full_name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        placeholder="username"
                        value={profileData.username}
                        onChange={handleChange}
                        required
                      />
                      <p className="text-xs text-muted-foreground">This will be used for your profile URL</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">Your email cannot be changed</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      placeholder="Tell us about yourself and your interests in fintech..."
                      rows={4}
                      value={profileData.bio || ''}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="Toronto, ON"
                      value={profileData.location || ''}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Social Media & Links</Label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="twitter_handle" className="text-xs">Twitter</Label>
                        <Input
                          id="twitter_handle"
                          name="twitter_handle"
                          placeholder="@username"
                          value={profileData.twitter_handle || ''}
                          onChange={handleChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="linkedin_url" className="text-xs">LinkedIn</Label>
                        <Input
                          id="linkedin_url"
                          name="linkedin_url"
                          placeholder="https://linkedin.com/in/username"
                          value={profileData.linkedin_url || ''}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <Label htmlFor="website" className="text-xs">Website</Label>
                      <Input
                        id="website"
                        name="website"
                        placeholder="https://example.com"
                        value={profileData.website || ''}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-6">
                  <Button 
                    type="submit" 
                    className="ml-auto" 
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : success ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Saved!
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="account">
          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account preferences and security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-medium">Change Password</h3>
                <p className="text-sm text-muted-foreground">
                  Account password management will be available soon.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Notification Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Email notification preferences will be available soon.
                </p>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <p className="text-sm text-muted-foreground">
                Need help? <a href="/contact" className="underline">Contact support</a>
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 