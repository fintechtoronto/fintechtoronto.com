'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { CheckCircle2, Circle, ArrowRight, User, BookText, MapPin, Settings, FileEdit } from 'lucide-react'
import { cn } from '@/lib/utils'

type OnboardingStep = {
  id: string
  title: string
  description: string
  path: string
  icon: React.ReactNode
  completed?: boolean
}

export default function OnboardingProgressTracker() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState<any>(null)
  const [progress, setProgress] = useState(0)
  
  const steps: OnboardingStep[] = [
    {
      id: 'profile',
      title: 'Complete Profile',
      description: 'Add your name, bio, and profile picture',
      path: '/dashboard/settings/profile',
      icon: <User className="h-5 w-5" />,
    },
    {
      id: 'interests',
      title: 'Select Interests',
      description: 'Tell us what topics you are interested in',
      path: '/dashboard/settings/interests',
      icon: <BookText className="h-5 w-5" />,
    },
    {
      id: 'location',
      title: 'Add Location',
      description: 'Specify your location to connect with local community',
      path: '/dashboard/settings/profile',
      icon: <MapPin className="h-5 w-5" />,
    },
    {
      id: 'first-article',
      title: 'Write First Article',
      description: 'Create your first article to share with the community',
      path: '/dashboard/new-article',
      icon: <FileEdit className="h-5 w-5" />,
    },
    {
      id: 'account',
      title: 'Account Settings',
      description: 'Review and update your account settings',
      path: '/dashboard/settings/account',
      icon: <Settings className="h-5 w-5" />,
    }
  ]

  useEffect(() => {
    async function loadProfileData() {
      if (!user) return
      
      try {
        setLoading(true)
        
        // Fetch profile data
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          
        if (error) throw error
        
        setProfileData(profile)
        
        // Set completed status for steps
        const updatedSteps = [...steps]
        
        // Check profile completion (name, bio, avatar)
        updatedSteps[0].completed = Boolean(
          profile.full_name && 
          profile.bio && 
          profile.avatar_url
        )
        
        // Check interests
        updatedSteps[1].completed = Boolean(
          profile.interests && 
          profile.interests.length > 0
        )
        
        // Check location
        updatedSteps[2].completed = Boolean(profile.location)
        
        // Check if user has created any articles
        const { count, error: articlesError } = await supabase
          .from('articles')
          .select('id', { count: 'exact' })
          .eq('author_id', user.id)
          
        if (!articlesError && count && count > 0) {
          updatedSteps[3].completed = true
        }
        
        // Account settings always marked as completed for simplicity
        updatedSteps[4].completed = true
        
        // Calculate progress
        const completedCount = updatedSteps.filter(step => step.completed).length
        const progressPercentage = Math.round((completedCount / updatedSteps.length) * 100)
        
        setProgress(progressPercentage)
      } catch (error) {
        console.error('Error loading profile data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadProfileData()
  }, [user])
  
  if (!user || loading) {
    return <div className="py-8 animate-pulse flex flex-col gap-4">
      <div className="h-8 bg-muted rounded-md w-56 mb-2"></div>
      <div className="h-3 bg-muted rounded-full w-full"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-muted rounded-lg"></div>
        ))}
      </div>
    </div>
  }
  
  return (
    <Card className="border-2 bg-card/50">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>Take a few steps to complete your profile and get the most out of FintechToronto.</CardDescription>
          </div>
          <div className="text-2xl font-bold">{progress}%</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Progress value={progress} className="h-2 w-full" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {steps.map((step) => (
            <div 
              key={step.id} 
              className={cn(
                "border rounded-lg p-4 transition-all", 
                step.completed 
                  ? "bg-primary/10 border-primary/20" 
                  : "bg-card hover:bg-muted/50"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "rounded-full p-1.5",
                  step.completed ? "text-primary" : "text-muted-foreground"
                )}>
                  {step.completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button asChild variant={step.completed ? "ghost" : "outline"} size="sm">
                  <Link href={step.path} className="flex items-center gap-1">
                    {step.completed ? "View" : "Complete"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-6 flex justify-between">
        <p className="text-sm text-muted-foreground">Complete all steps to unlock all features.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/settings/profile">
            Go to Profile Settings
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
} 