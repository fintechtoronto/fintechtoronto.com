import { client, groq } from '@/lib/sanity'
import { notFound } from 'next/navigation'
import { PortableText } from '@portabletext/react'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Clock, Users, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import RegisterForm from './register-form'
import EventCountdown from './countdown'

async function getEvent(slug: string) {
  return client.fetch(
    groq`*[_type == "event" && slug.current == $slug][0] {
      _id,
      title,
      description,
      date,
      location,
      link,
      slug,
      eventType,
      maxAttendees,
      calId,
      mainImage
    }`,
    { slug }
  )
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const event = await getEvent(params.slug)
  
  if (!event) {
    return {
      title: 'Event not found',
      description: 'The event you are looking for could not be found.'
    }
  }
  
  return {
    title: `${event.title} | FinTech Toronto`,
    description: event.description?.[0]?.children?.[0]?.text || 'Join us for this exciting fintech event in Toronto'
  }
}

export default async function EventPage({ params }: { params: { slug: string } }) {
  const event = await getEvent(params.slug)
  
  if (!event) {
    notFound()
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }
  
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }
  
  // Check if event is in the past
  const eventDate = new Date(event.date)
  const isEventPast = eventDate < new Date()
  
  return (
    <main className="container py-12">
      <div className="max-w-4xl mx-auto">
        {/* Event Countdown */}
        {!isEventPast && (
          <div className="mb-8">
            <EventCountdown targetDate={eventDate} />
          </div>
        )}
        
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div>
                <CardTitle className="text-3xl mb-2">{event.title}</CardTitle>
                {event.eventType && (
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground mb-4">
                    {event.eventType}
                  </div>
                )}
                <CardDescription className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <time dateTime={event.date} className="text-base">
                      {formatDate(event.date)}
                    </time>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <time dateTime={event.date} className="text-base">
                      {formatTime(event.date)}
                    </time>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span className="text-base">{event.location}</span>
                  </div>
                  {event.maxAttendees && (
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <span className="text-base">Limited to {event.maxAttendees} attendees</span>
                    </div>
                  )}
                </CardDescription>
              </div>
              
              {!isEventPast && (
                <div className="flex flex-col gap-2">
                  <Button size="lg" asChild>
                    <a href={event.link} target="_blank" rel="noopener noreferrer">
                      Register on Cal.com
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <a href="#register">
                      Register Here
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <PortableText value={event.description} />
          </CardContent>
          
          {isEventPast && (
            <CardFooter>
              <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-md w-full text-center">
                <p className="text-lg font-medium">This event has already taken place.</p>
                <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                  Check out our other upcoming events or subscribe to our newsletter to stay updated.
                </p>
                <div className="flex gap-4 justify-center mt-4">
                  <Button asChild>
                    <a href="/events">View Upcoming Events</a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/newsletter">Subscribe</a>
                  </Button>
                </div>
              </div>
            </CardFooter>
          )}
        </Card>
        
        {/* Registration Form */}
        {!isEventPast && (
          <section id="register" className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Register for this Event</h2>
            <Card>
              <CardContent className="pt-6">
                <RegisterForm eventId={event._id} eventTitle={event.title} />
              </CardContent>
            </Card>
          </section>
        )}
        
        {/* Add events map or venue details here */}
      </div>
    </main>
  )
} 