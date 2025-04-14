import { client, groq } from '@/lib/sanity'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Users, Clock, Tag } from 'lucide-react'
import Link from 'next/link'
import { PortableText } from '@portabletext/react'
import { urlForImage } from '@/lib/sanity-image'
import Image from 'next/image'

type Event = {
  _id: string
  title: string
  description: any[]
  date: string
  location: string
  link: string
  slug: { current: string }
  eventType?: string
  isFeatured?: boolean
  mainImage?: {
    asset: {
      _ref: string
    }
  }
}

export const revalidate = 3600 // Revalidate every hour

export async function generateStaticParams() {
  // This function is empty as we don't need params for the main events page
  // But having it ensures the page is statically generated at build time
  return [{}]
}

async function getEvents() {
  return client.fetch(
    groq`*[_type == "event" && dateTime(date) > dateTime(now())] | order(date asc) {
      _id,
      title,
      description,
      date,
      location,
      link,
      slug,
      eventType,
      isFeatured,
      mainImage
    }`
  )
}

async function getFeaturedEvents() {
  return client.fetch(
    groq`*[_type == "event" && dateTime(date) > dateTime(now()) && isFeatured == true] | order(date asc) [0...3] {
      _id,
      title,
      description,
      date,
      location,
      link,
      slug,
      eventType,
      mainImage
    }`
  )
}

export default async function EventsPage() {
  const events = await getEvents()
  const featuredEvents = await getFeaturedEvents()

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

  return (
    <main className="container py-12">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-5xl font-bold mb-4">Upcoming Events</h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400">
          Join us at our upcoming events to network, learn, and grow with Toronto's fintech community.
        </p>
      </div>

      {featuredEvents.length > 0 && (
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Featured Events</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featuredEvents.map((event: Event) => (
              <Card key={event._id} className="overflow-hidden flex flex-col h-full">
                {event.mainImage && (
                  <div className="relative h-48 w-full">
                    <Image
                      src={urlForImage(event.mainImage).url()}
                      alt={event.title}
                      fill
                      className="object-cover"
                    />
                    {event.eventType && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="font-medium">
                          {event.eventType}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl line-clamp-2">
                    <Link href={`/events/${event.slug.current}`} className="hover:underline">
                      {event.title}
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <time dateTime={event.date}>
                        {formatDate(event.date)}
                      </time>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-primary" />
                      <time dateTime={event.date}>
                        {formatTime(event.date)}
                      </time>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{event.location}</span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="text-neutral-600 dark:text-neutral-400 line-clamp-3">
                    <PortableText value={event.description} />
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="flex flex-col w-full gap-2">
                    <Button className="w-full" asChild>
                      <Link href={`/events/${event.slug.current}`}>
                        View Details
                      </Link>
                    </Button>
                    <Button className="w-full" variant="outline" asChild>
                      <a href={event.link} target="_blank" rel="noopener noreferrer">
                        Register Now
                      </a>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-2xl font-bold mb-6">All Upcoming Events</h2>
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {events.map((event: Event) => (
            <Card key={event._id} className="flex flex-col md:flex-row overflow-hidden">
              {event.mainImage ? (
                <div className="relative md:w-1/3 h-48 md:h-auto">
                  <Image
                    src={urlForImage(event.mainImage).url()}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="bg-neutral-100 dark:bg-neutral-800 md:w-1/3 flex items-center justify-center p-6">
                  <Calendar className="h-12 w-12 text-neutral-400" />
                </div>
              )}
              <div className="flex flex-col md:w-2/3">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="line-clamp-2">
                      <Link href={`/events/${event.slug.current}`} className="hover:underline">
                        {event.title}
                      </Link>
                    </CardTitle>
                    {event.eventType && (
                      <Badge variant="outline" className="ml-2 whitespace-nowrap">
                        {event.eventType}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <time dateTime={event.date}>
                        {formatDate(event.date)}
                      </time>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-primary" />
                      <time dateTime={event.date}>
                        {formatTime(event.date)}
                      </time>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{event.location}</span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-0 flex-grow">
                  <p className="text-neutral-600 dark:text-neutral-400 line-clamp-3">
                    <PortableText value={event.description} />
                  </p>
                </CardContent>
                <CardFooter>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" asChild>
                      <Link href={`/events/${event.slug.current}`}>
                        View Details
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a href={event.link} target="_blank" rel="noopener noreferrer">
                        Register
                      </a>
                    </Button>
                  </div>
                </CardFooter>
              </div>
            </Card>
          ))}
        </div>

        {events.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              No upcoming events at the moment. Check back soon!
            </p>
          </div>
        )}
      </section>
    </main>
  )
}

// Custom Badge component
function Badge({ 
  variant = "default", 
  className, 
  children 
}: { 
  variant?: "default" | "secondary" | "outline", 
  className?: string, 
  children: React.ReactNode 
}) {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
  
  const variantClasses = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "bg-transparent border border-neutral-200 dark:border-neutral-700 text-foreground"
  }
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className || ''}`}>
      {children}
    </span>
  )
} 