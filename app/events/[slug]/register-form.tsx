'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  dietaryRequirements: z.string().optional(),
  newsletter: z.boolean().default(false),
  agreeTerms: z.boolean().refine(value => value === true, {
    message: 'You must agree to the terms and conditions.'
  })
})

type FormValues = z.infer<typeof formSchema>

export default function RegisterForm({ 
  eventId, 
  eventTitle 
}: { 
  eventId: string, 
  eventTitle: string 
}) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      jobTitle: '',
      dietaryRequirements: '',
      newsletter: true,
      agreeTerms: false
    }
  })
  
  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    try {
      // Prepare data for API call
      const registrationData = {
        eventId,
        name: data.name,
        email: data.email,
        company: data.company || '',
        attendeeDetails: {
          jobTitle: data.jobTitle || '',
          dietaryRequirements: data.dietaryRequirements || '',
          newsletter: data.newsletter
        }
      }
      
      // Submit registration
      const response = await fetch('/api/events/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registrationData)
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to register for the event')
      }
      
      // Show success message
      setIsSuccess(true)
      toast({
        title: 'Registration successful!',
        description: 'You have been registered for the event. Check your email for confirmation.',
        variant: 'default'
      })
      
      // If newsletter option selected, subscribe to newsletter
      if (data.newsletter) {
        try {
          await fetch('/api/newsletter/subscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: data.email,
              name: data.name
            })
          })
        } catch (error) {
          // Just log newsletter subscription errors, don't affect overall registration
          console.error('Error subscribing to newsletter:', error)
        }
      }
      
    } catch (error) {
      console.error('Registration error:', error)
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <h3 className="text-2xl font-bold mb-4">Registration Successful!</h3>
        <p className="mb-6">
          Thank you for registering for {eventTitle}. We've sent you a confirmation email with the event details.
        </p>
        <p className="text-neutral-600 dark:text-neutral-400">
          If you don't receive the email within a few minutes, please check your spam folder.
        </p>
      </div>
    )
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your email" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your company (optional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="jobTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your job title (optional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="dietaryRequirements"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dietary Requirements</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Please list any dietary requirements or allergies (optional)" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="newsletter"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Subscribe to newsletter</FormLabel>
                <FormDescription>
                  Receive updates about future events and fintech news in Toronto.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="agreeTerms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Terms and Conditions</FormLabel>
                <FormDescription>
                  I agree to the <a href="/terms" className="text-primary underline">terms and conditions</a> and privacy policy.
                </FormDescription>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Register for Event'
          )}
        </Button>
      </form>
    </Form>
  )
} 