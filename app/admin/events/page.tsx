'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { client, adminClient } from '@/lib/sanity'
import { useAuth } from '@/components/auth-provider'
import { useToast } from '@/hooks/use-toast'
import { useDebounce } from '@/lib/hooks'

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
  CardFooter,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { 
  CalendarPlus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash, 
  Copy, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ExternalLink, 
  Loader2, 
  PlusCircle 
} from 'lucide-react'
import { format } from 'date-fns'

// For managing tabs, active: events you're organizing, past: all past events
type Tab = 'active' | 'past' | 'draft'

// Type for event details
type Event = {
  _id: string
  title: string
  description: any[]
  date: string
  location: string
  link: string
  slug: { current: string }
  eventType?: string
  calId?: string
  status?: 'published' | 'draft'
  attendees?: number
  maxAttendees?: number
}

export default function EventsPage() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  // State for events data
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  
  // Dialog states
  const [isCalDialogOpen, setIsCalDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  
  // Active tab
  const [activeTab, setActiveTab] = useState<Tab>('active')
  
  // Cal.com integration
  const [calApiKey] = useState('cal_live_6ffcf56ccee336a15d23d9869974e8b9')
  const [calEvents, setCalEvents] = useState([])
  const [loadingCalEvents, setLoadingCalEvents] = useState(false)
  
  // Form states for new event
  const [newEventForm, setNewEventForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    eventType: 'In-Person',
    maxAttendees: 50,
    isFeatured: false,
    calIntegration: true,
  })
  
  // Load events on component mount and when search term changes
  useEffect(() => {
    if (!authLoading && user) {
      fetchEvents()
    }
  }, [debouncedSearchTerm, activeTab, user, authLoading])
  
  // Function to fetch events from Sanity
  const fetchEvents = async () => {
    setLoading(true)
    try {
      // Build GROQ query based on active tab and search term
      let query = '*[_type == "event"'
      
      // Add date filter based on tab
      if (activeTab === 'active') {
        query += ' && dateTime(date) > dateTime(now())'
      } else if (activeTab === 'past') {
        query += ' && dateTime(date) < dateTime(now())'
      } else if (activeTab === 'draft') {
        query += ' && status == "draft"'
      }
      
      // Add search term filter
      if (debouncedSearchTerm) {
        query += ` && (title match "*${debouncedSearchTerm}*" || location match "*${debouncedSearchTerm}*")`
      }
      
      // Order by date and add projection
      query += '] | order(date desc) { _id, title, description, date, location, link, slug, eventType, calId, status, attendees, maxAttendees }'
      
      const data = await client.fetch(query)
      
      // If we're on the active tab, also fetch Cal.com event data
      if (activeTab === 'active' && calApiKey) {
        fetchCalData(data)
      }
      
      setEvents(data)
    } catch (error) {
      console.error('Error fetching events:', error)
      toast({
        title: 'Error',
        description: 'Failed to load events. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Function to fetch event data from Cal.com API
  const fetchCalData = async (sanityEvents: Event[]) => {
    setLoadingCalEvents(true)
    try {
      // For each event that has a calId, fetch attendee info
      const eventsWithCalIds = sanityEvents.filter(event => event.calId)
      
      if (eventsWithCalIds.length > 0) {
        // In a real implementation, you would make API calls to Cal.com here
        // For now, we'll simulate with sample data
        
        // This would be replaced with actual API calls in production
        const calData = eventsWithCalIds.map(event => ({
          id: event.calId,
          title: event.title,
          attendees: Math.floor(Math.random() * 30),
          maxAttendees: event.maxAttendees || 50
        }))
        
        setCalEvents(calData)
        
        // Update Sanity events with attendee counts
        const updatedEvents = sanityEvents.map(event => {
          const calEvent = calData.find(ce => ce.id === event.calId)
          if (calEvent) {
            return {
              ...event,
              attendees: calEvent.attendees,
              maxAttendees: calEvent.maxAttendees
            }
          }
          return event
        })
        
        setEvents(updatedEvents)
      }
    } catch (error) {
      console.error('Error fetching Cal.com data:', error)
    } finally {
      setLoadingCalEvents(false)
    }
  }
  
  // Function to open the Cal.com integration dialog
  const openCalDialog = (event: Event) => {
    setSelectedEvent(event)
    setIsCalDialogOpen(true)
  }
  
  // Function to create a new event
  const createEvent = async () => {
    try {
      const { title, description, date, time, location, eventType, maxAttendees, isFeatured, calIntegration } = newEventForm
      
      // Validate form
      if (!title || !description || !date || !time || !location) {
        toast({
          title: 'Missing information',
          description: 'Please fill out all required fields',
          variant: 'destructive',
        })
        return
      }
      
      // Format date and time correctly
      const eventDateTime = new Date(`${date}T${time}`)
      
      let calId = null
      
      // If Cal.com integration is enabled, create the event there first
      if (calIntegration && calApiKey) {
        // In a real implementation, you would make API calls to Cal.com here
        // For now, we'll simulate with a sample calId
        calId = `cal_${Math.random().toString(36).substring(2, 15)}`
      }
      
      // Prepare event data for Sanity
      const eventData = {
        _type: 'event',
        title,
        slug: {
          _type: 'slug',
          current: title
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
        },
        description: [{
          _type: 'block',
          style: 'normal',
          _key: new Date().toISOString(),
          markDefs: [],
          children: [{
            _type: 'span',
            _key: new Date().toISOString(),
            text: description,
            marks: []
          }]
        }],
        date: eventDateTime.toISOString(),
        location,
        link: calIntegration && calId ? `https://cal.com/event/${calId}` : '',
        eventType,
        calId,
        status: 'published',
        isFeatured: isFeatured,
        maxAttendees: parseInt(maxAttendees.toString())
      }
      
      // Create document in Sanity using adminClient instead of client
      const response = await adminClient.create(eventData)
      
      toast({
        title: 'Success!',
        description: 'Event created successfully',
      })
      
      // Reset form and close dialog
      setNewEventForm({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        eventType: 'In-Person',
        maxAttendees: 50,
        isFeatured: false,
        calIntegration: true,
      })
      setIsCreateDialogOpen(false)
      
      // Refetch events
      fetchEvents()
    } catch (error) {
      console.error('Error creating event:', error)
      toast({
        title: 'Error',
        description: 'Failed to create event. Please try again.',
        variant: 'destructive',
      })
    }
  }
  
  // Function to delete an event
  const deleteEvent = async () => {
    if (!selectedEvent) return
    
    try {
      // If the event has a Cal.com integration, delete it there first
      if (selectedEvent.calId) {
        // In a real implementation, you would make API calls to Cal.com here
        console.log(`Deleting Cal.com event with ID: ${selectedEvent.calId}`)
      }
      
      // Delete the event document from Sanity using adminClient
      await adminClient.delete(selectedEvent._id)
      
      toast({
        title: 'Success!',
        description: 'Event deleted successfully',
      })
      
      // Close dialog and refetch events
      setIsConfirmDeleteOpen(false)
      setSelectedEvent(null)
      fetchEvents()
    } catch (error) {
      console.error('Error deleting event:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete event. Please try again.',
        variant: 'destructive',
      })
    }
  }
  
  // Function to view event RSVPs
  const viewRSVPs = (event: Event) => {
    if (!event.calId) {
      toast({
        title: 'No Cal.com Integration',
        description: 'This event is not integrated with Cal.com',
        variant: 'destructive',
      })
      return
    }
    
    // In a real implementation, you would navigate to a page that shows RSVPs
    // For now, we'll just show a toast with the attendee count
    toast({
      title: 'Event RSVPs',
      description: `${event.attendees || 0} attendees out of ${event.maxAttendees || 50} maximum`,
    })
  }
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">Manage and create events for your community</p>
        </div>
        <Button 
          className="mt-4 md:mt-0" 
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <CalendarPlus className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center w-full max-w-sm space-x-2">
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="outline" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          <Tabs defaultValue="active" className="w-full sm:w-auto" onValueChange={(value) => setActiveTab(value as Tab)}>
            <TabsList>
              <TabsTrigger value="active">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
              <TabsTrigger value="draft">Drafts</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No events found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchTerm 
                    ? "No events match your search criteria" 
                    : activeTab === 'active' 
                      ? "You don't have any upcoming events" 
                      : activeTab === 'draft'
                        ? "You don't have any draft events"
                        : "You don't have any past events"}
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Event
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="hidden md:table-cell">Registrations</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event._id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="font-medium">{event.title}</span>
                          {event.eventType && (
                            <Badge 
                              variant="outline" 
                              className="w-fit mt-1 text-xs"
                            >
                              {event.eventType}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center text-sm">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            {event.date && format(new Date(event.date), 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Clock className="mr-2 h-4 w-4" />
                            {event.date && format(new Date(event.date), 'h:mm a')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{event.location}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {event.calId ? (
                          <div className="flex items-center">
                            <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {event.attendees !== undefined 
                                ? `${event.attendees} / ${event.maxAttendees || 'unlimited'}`
                                : 'Not available'}
                            </span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs">No tracking</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => router.push(`/events/${event.slug.current}`)}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View Event
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/admin/events/${event._id}`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Event
                            </DropdownMenuItem>
                            {event.calId && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => viewRSVPs(event)}>
                                  <Users className="mr-2 h-4 w-4" />
                                  View RSVPs
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openCalDialog(event)}>
                                  <Calendar className="mr-2 h-4 w-4" />
                                  Cal.com Settings
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => {
                                setSelectedEvent(event)
                                setIsConfirmDeleteOpen(true)
                              }}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete Event
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Create Event Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>
              Fill out the details below to create a new event. Events can be integrated with Cal.com for registration and calendar invites.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                placeholder="e.g. Toronto Fintech Meetup"
                value={newEventForm.title}
                onChange={(e) => setNewEventForm({ ...newEventForm, title: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your event..."
                className="min-h-[100px]"
                value={newEventForm.description}
                onChange={(e) => setNewEventForm({ ...newEventForm, description: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newEventForm.date}
                  onChange={(e) => setNewEventForm({ ...newEventForm, date: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={newEventForm.time}
                  onChange={(e) => setNewEventForm({ ...newEventForm, time: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g. MaRS Discovery District, Toronto or Zoom (Virtual)"
                value={newEventForm.location}
                onChange={(e) => setNewEventForm({ ...newEventForm, location: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type</Label>
                <select
                  id="eventType"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newEventForm.eventType}
                  onChange={(e) => setNewEventForm({ ...newEventForm, eventType: e.target.value })}
                >
                  <option value="In-Person">In-Person</option>
                  <option value="Virtual">Virtual</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Conference">Conference</option>
                  <option value="Networking">Networking</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxAttendees">Max Attendees</Label>
                <Input
                  id="maxAttendees"
                  type="number"
                  min="1"
                  value={newEventForm.maxAttendees}
                  onChange={(e) => setNewEventForm({ ...newEventForm, maxAttendees: parseInt(e.target.value) })}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between space-y-0 pt-4 border-t">
              <div className="space-y-0.5">
                <Label htmlFor="calIntegration">Cal.com Integration</Label>
                <p className="text-sm text-muted-foreground">
                  Enable calendar integration and RSVP tracking
                </p>
              </div>
              <Switch
                id="calIntegration"
                checked={newEventForm.calIntegration}
                onCheckedChange={(checked) => setNewEventForm({ ...newEventForm, calIntegration: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between space-y-0 pt-2">
              <div className="space-y-0.5">
                <Label htmlFor="featured">Featured Event</Label>
                <p className="text-sm text-muted-foreground">
                  Show this event in the featured events section
                </p>
              </div>
              <Switch
                id="featured"
                checked={newEventForm.isFeatured}
                onCheckedChange={(checked) => setNewEventForm({ ...newEventForm, isFeatured: checked })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createEvent}>
              Create Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Cal.com Integration Dialog */}
      <Dialog open={isCalDialogOpen} onOpenChange={setIsCalDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cal.com Integration</DialogTitle>
            <DialogDescription>
              Manage calendar integration and RSVP settings for this event.
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between border p-4 rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Cal.com Event ID</p>
                  <p className="text-xs text-muted-foreground">{selectedEvent.calId}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(selectedEvent.calId || '')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-col space-y-2">
                <p className="text-sm font-medium">Registrations</p>
                <div className="bg-muted h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full" 
                    style={{ 
                      width: `${selectedEvent.attendees && selectedEvent.maxAttendees ? 
                        (selectedEvent.attendees / selectedEvent.maxAttendees) * 100 : 0}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedEvent.attendees || 0} registered out of {selectedEvent.maxAttendees || 'unlimited'} total spots
                </p>
              </div>
              
              <div className="pt-4 flex items-center justify-between">
                <Button variant="outline" asChild>
                  <a 
                    href={`https://cal.com/events/${selectedEvent.calId}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Manage in Cal.com
                  </a>
                </Button>
                
                <Button variant="default" onClick={() => viewRSVPs(selectedEvent)}>
                  <Users className="mr-2 h-4 w-4" />
                  View Attendees
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Confirm Delete Dialog */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="border rounded-lg p-4 my-4">
              <p className="font-medium">{selectedEvent.title}</p>
              <div className="flex items-center text-sm text-muted-foreground mt-2">
                <Calendar className="mr-2 h-4 w-4" />
                {selectedEvent.date && format(new Date(selectedEvent.date), 'MMM d, yyyy')}
                <span className="mx-2">•</span>
                <Clock className="mr-2 h-4 w-4" />
                {selectedEvent.date && format(new Date(selectedEvent.date), 'h:mm a')}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteEvent}>
              Delete Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 