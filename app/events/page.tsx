import { client, groq } from '@/lib/sanity'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin } from 'lucide-react'

async function getEvents() {
  return client.fetch(
    groq`*[_type == "event" && dateTime(date) > dateTime(now())] | order(date asc) {
      _id,
      title,
      description,
      date,
      location,
      link,
      slug
    }`
  )
}

export default async function EventsPage() {
  const events = await getEvents()

  return (
    <main className="container py-12">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Upcoming Events</h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400">
          Join us at our upcoming events to network, learn, and grow with Toronto's fintech community.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event: any) => (
          <Card key={event._id}>
            <CardHeader>
              <CardTitle className="line-clamp-2">{event.title}</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Calendar className="h-4 w-4" />
                  <time dateTime={event.date}>
                    {new Date(event.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </time>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location}</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-neutral-600 dark:text-neutral-400 line-clamp-3">
                {event.description}
              </p>
              <Button className="w-full" asChild>
                <a href={event.link} target="_blank" rel="noopener noreferrer">
                  Register Now
                </a>
              </Button>
            </CardContent>
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
    </main>
  )
} 