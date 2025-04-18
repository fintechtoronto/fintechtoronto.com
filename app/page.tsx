import { client, groq, urlFor } from '@/lib/sanity'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'
import NewsletterSignup from '@/components/NewsletterSignup'
import { ArrowRight, Calendar, ArrowUpRight, MapPin, Clock } from 'lucide-react'
import { Newsletter } from "@/components/Newsletter"
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'
import { ArticlePlaceholderImage } from '@/components/ui/article-placeholder-image'
import { SeriesBadge } from '@/components/ui/series-badge'
import { ArticleCard } from '@/components/cards/article-card'

// Add dynamic flag for client-side rendering fallback
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

async function getHomePageData() {
  let blogs = [];
  let events = [];
  
  try {
    blogs = await client.fetch(
      groq`*[_type == "blog"] | order(publishDate desc)[0...3]{
        _id,
        title,
        slug,
        publishDate,
        excerpt,
        image,
        series->{
          title,
          slug
        },
        authors[]->{
          name,
          slug
        }
      }`
    ) || [];
  } catch (error) {
    console.error('Error fetching blog data:', error);
    // Continue with empty array
  }

  try {
    events = await client.fetch(
      groq`*[_type == "event" && dateTime(date) > dateTime(now())] | order(date asc)[0...3]{
        _id,
        title,
        description,
        date,
        location,
        link,
        slug,
        featured,
        eventType
      }`
    ) || [];
  } catch (error) {
    console.error('Error fetching event data:', error);
    // Continue with empty array
  }

  return { blogs, events }
}

export default async function Home() {
  const { blogs, events } = await getHomePageData();
  
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-blue-950/40">
        {/* Decorative elements */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-200/50 blur-3xl dark:bg-blue-900/20"></div>
          <div className="absolute top-40 -left-20 h-60 w-60 rounded-full bg-indigo-200/50 blur-3xl dark:bg-indigo-900/20"></div>
        </div>
        
        <div className="container relative z-10 px-4 py-20 md:py-32">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="space-y-8">
              <div>
                <div className="mb-6 inline-flex items-center rounded-full border border-blue-200 bg-blue-100/80 px-4 py-1.5 text-sm font-medium text-blue-700 backdrop-blur-sm dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full bg-blue-500"></span>
                  Toronto's FinTech & AI Community Hub
                </div>
                <h1 className="font-bold tracking-tighter text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
                  <div className="whitespace-normal sm:whitespace-nowrap">
                    <span className="text-blue-600 dark:text-blue-400">Elevating</span> Fintech Voices
                  </div>
                  <div className="whitespace-normal sm:whitespace-nowrap">
                    Amplifying Toronto's <span className="text-blue-600 dark:text-blue-400">Potential</span>
                  </div>
                </h1>
              </div>
              <p className="max-w-[600px] text-gray-600 dark:text-gray-300 md:text-xl">
                Join a thriving community dedicated to boosting FinTech & AI innovation through knowledge sharing, 
                engagement, and increasing visibility of Toronto's brightest minds and companies.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="rounded-full px-8 shadow-md" asChild>
                  <Link href="#newsletter">
                    Join Our Community
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="rounded-full border-blue-200 bg-white/50 backdrop-blur-sm dark:border-blue-800 dark:bg-gray-900/50" asChild>
                  <Link href="/blog">
                    Explore Articles
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Community-Contributed Articles
                </span>
                <span className="hidden h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600 sm:block"></span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  200+ Member Companies
                </span>
                <span className="hidden h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600 sm:block"></span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  FinTech & AI Networking Events
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-[500px]">
                <div className="absolute -right-4 -top-4 h-20 w-20 rounded-lg bg-blue-100/80 dark:bg-blue-900/30 backdrop-blur-sm"></div>
                <div className="absolute -left-4 -bottom-4 h-20 w-20 rounded-lg bg-indigo-100/80 dark:bg-indigo-900/30 backdrop-blur-sm"></div>
                
                <div className="relative z-10 overflow-hidden rounded-xl bg-white shadow-xl dark:bg-gray-900 dark:shadow-gray-800/40">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-1">
                    <div className="flex items-center gap-2 px-3 py-2">
                      <div className="h-3 w-3 rounded-full bg-red-400"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                      <div className="h-3 w-3 rounded-full bg-green-400"></div>
                      <div className="ml-2 text-xs font-medium text-white">FinTech Toronto Newsletter</div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="mb-3 text-lg font-semibold">Stay Connected with Toronto's FinTech Scene</h3>
                    <div className="mb-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full bg-blue-100 p-1 dark:bg-blue-800/40">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="text-sm">Latest trends, news, and community contributions</div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full bg-blue-100 p-1 dark:bg-blue-800/40">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="text-sm">Exclusive networking events and conferences</div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full bg-blue-100 p-1 dark:bg-blue-800/40">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="text-sm">Opportunities for visibility and collaboration</div>
                      </div>
                    </div>
                    <Button className="w-full" asChild>
                      <Link href="#newsletter">Subscribe Now</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container px-4 py-12">
        {/* Latest Articles */}
        <section className="py-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
            <div>
              <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-3">
                Featured Content
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Latest Articles</h2>
              <p className="text-muted-foreground max-w-2xl">Insights and analyses from Toronto's fintech industry experts</p>
            </div>
            <Link 
              href="/blog" 
              className="mt-6 md:mt-0 group inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
            >
              View all articles
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog: any, index: number) => {
              // Choose a theme based on index or series
              const themes = ['green', 'purple', 'blue', 'amber', 'indigo'];
              const theme = blog.series ? 
                blog.series.title.toLowerCase().includes('ai') ? 'purple' :
                blog.series.title.toLowerCase().includes('banking') ? 'green' :
                blog.series.title.toLowerCase().includes('blockchain') ? 'blue' :
                themes[index % themes.length] : 
                themes[index % themes.length];
                
              return (
                <ArticleCard
                  key={blog._id}
                  title={blog.title}
                  slug={blog.slug.current}
                  image={blog.image ? urlFor(blog.image).url() : undefined}
                  publishDate={blog.publishDate}
                  authors={blog.authors}
                  series={blog.series ? {
                    title: blog.series.title,
                    slug: blog.series.slug.current
                  } : undefined}
                  theme={theme as any}
                  withHoverEffect={true}
                />
              );
            })}
          </div>
        </section>

        {/* Featured Events */}
        <section className="py-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
            <div>
              <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-3">
                Upcoming Events
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Featured Events</h2>
              <p className="text-muted-foreground max-w-2xl">Connect with Toronto's fintech community at these upcoming events</p>
            </div>
            <Link 
              href="/events" 
              className="mt-6 md:mt-0 group inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
            >
              View all events
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="group relative h-full">
                <Card className="h-full transition-all duration-300 bg-card hover:shadow-lg overflow-hidden">
                  <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <HoverBorderGradient
                      containerClassName="absolute inset-0 rounded-xl"
                      className="hidden"
                      duration={1.5}
                      as="div"
                    />
                  </div>
                  <div className="aspect-video w-full bg-card relative overflow-hidden">
                    <div className="absolute top-3 left-3 z-10">
                      <span className="inline-flex items-center rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium border border-border/40">
                        {i === 1 ? "Workshop" : i === 2 ? "Conference" : "Networking"}
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-3 z-10">
                      <span className="inline-flex items-center rounded-md bg-black/60 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white border border-white/10">
                        {i === 1 ? "May 15" : i === 2 ? "June 7-8" : "June 22"}
                      </span>
                    </div>
                  </div>
                  <CardHeader className="p-6 pb-2">
                    <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                      {i === 1 
                        ? "Open Banking API Integration Workshop" 
                        : i === 2 
                          ? "Toronto Fintech Week 2024" 
                          : "Fintech Founders Mixer"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 py-3 flex-grow">
                    <div className="flex items-center gap-3 mb-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {i === 1 
                            ? "MaRS Discovery District" 
                            : i === 2 
                              ? "Metro Toronto Convention Centre" 
                              : "OneEleven Toronto"}
                        </span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span>
                          {i === 1 
                            ? "9:00 AM - 4:00 PM" 
                            : i === 2 
                              ? "All Day" 
                              : "6:00 PM - 9:00 PM"}
                        </span>
                      </div>
                    </div>
                    <p className="text-muted-foreground line-clamp-3">
                      {i === 1 
                        ? "Hands-on workshop for developers to learn about implementing open banking APIs in their applications." 
                        : i === 2 
                          ? "Toronto's premier fintech conference featuring keynotes, panels, and networking opportunities with industry leaders." 
                          : "An exclusive networking event for fintech founders, investors, and ecosystem partners."}
                    </p>
                  </CardContent>
                  <CardFooter className="border-t px-6 py-4 mt-auto">
                    <Button variant="default" className="w-full" asChild>
                      <Link href={`/events/${i}`}>
                        Register now
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            ))}
          </div>
        </section>

        {/* Community Events */}
        <section className="py-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
            <div>
              <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-3">
                Community Gatherings
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Community Events</h2>
              <p className="text-muted-foreground max-w-2xl">Discover events from the broader Toronto fintech community</p>
            </div>
            <Link 
              href="https://lu.ma/fintechto" 
              className="mt-6 md:mt-0 group inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
              View all community events
              <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:translate-y-[-2px] transition-transform" />
            </Link>
          </div>
          
          <div className="relative rounded-xl border bg-card p-1 shadow-md overflow-hidden group">
            <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <HoverBorderGradient
                containerClassName="absolute inset-0 rounded-xl"
                className="hidden"
                duration={1.5}
                as="div"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
            <div className="relative rounded-lg overflow-hidden aspect-[4/3] md:aspect-[16/9] w-full h-full min-h-[450px]">
              <iframe
                src="https://lu.ma/embed/calendar/cal-Pzt6zGD9ADvy0J5/events"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: '1px solid #bfcbda88', borderRadius: '4px' }}
                allowFullScreen
                aria-hidden="false"
                tabIndex={0}
                className="bg-white dark:bg-gray-900"
              ></iframe>
            </div>
            
            <div className="absolute bottom-4 right-4">
              <div className="flex items-center gap-2 rounded-full bg-background/90 backdrop-blur-sm px-3 py-1.5 text-xs font-medium shadow-sm border border-border">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M3 9h18" />
                  <path d="M9 21V9" />
                </svg>
                <span>Powered by Lu.ma</span>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-center">
            <Button className="rounded-full px-8" asChild>
              <Link href="https://lu.ma/fintechto" target="_blank" rel="noopener noreferrer">
                Submit Your Event
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Newsletter Section */}
        <section id="newsletter" className="py-16">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden relative group">
            <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <HoverBorderGradient
                containerClassName="absolute inset-0 rounded-xl"
                className="hidden"
                duration={1.5}
                as="div"
              />
            </div>
            <div className="flex flex-col lg:flex-row">
              <div className="p-8 lg:p-12 lg:w-3/5">
                <div className="mx-auto max-w-2xl">
                  <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6">
                    Stay in the loop
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight mb-4">Join the FinTech Toronto Newsletter</h2>
                  <p className="text-muted-foreground mb-8 text-lg">Get exclusive insights, event invitations, and the latest updates from Toronto's fintech community delivered straight to your inbox.</p>
                  <Newsletter />
                  <p className="text-xs text-muted-foreground mt-4">
                    By subscribing, you agree to our Privacy Policy. We'll never spam you or share your information.
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 hidden lg:block lg:w-2/5 relative">
                <div className="absolute inset-0 opacity-20">
                  <svg className="h-full w-full" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect width="400" height="400" fill="url(#grid)" />
                  </svg>
                </div>
                <div className="relative h-full flex items-center justify-center p-8">
                  <div className="w-24 h-24 rounded-full bg-primary/90 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6z" />
                      <path d="m22 6-10 7L2 6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Mission Section */}
        <section id="mission" className="py-16 bg-primary/5">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6">
                  Our Vision
                </div>
                <h2 className="text-4xl font-bold tracking-tight mb-6">Building Toronto's Fintech Ecosystem</h2>
                <div className="space-y-6">
                  <p className="text-lg">
                    FinTech Toronto is dedicated to connecting innovators, entrepreneurs, investors, and financial 
                    institutions to build a thriving fintech ecosystem in the Greater Toronto Area.
                  </p>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6 7 17l-5-5" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Knowledge Sharing</h3>
                        <p className="text-muted-foreground">Facilitating the exchange of insights, expertise, and best practices across the fintech industry.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 7.52a6 6 0 0 0-10-.57" />
                          <path d="M14.5 11a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0Z" />
                          <path d="M7.5 11a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0Z" />
                          <path d="M17.5 14c-.13.85-.56 1.62-1.18 2.29a6 6 0 0 1-8.64 0c-.62-.67-1.05-1.44-1.18-2.29" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Community Building</h3>
                        <p className="text-muted-foreground">Creating a vibrant network where professionals can form meaningful connections and collaborations.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2v20" />
                          <path d="m19 15-7 5-7-5" />
                          <path d="M5 9h14" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Innovation Acceleration</h3>
                        <p className="text-muted-foreground">Supporting startups and initiatives that are pushing the boundaries of financial technology.</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button variant="default" className="mt-2" asChild>
                      <Link href="/about">
                        Learn More About Us
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 rounded-xl bg-gradient-to-r from-primary to-primary-foreground opacity-10 blur-lg"></div>
                <div className="relative aspect-video overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 to-primary/30 p-2 relative group">
                  <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <HoverBorderGradient
                      containerClassName="absolute inset-0 rounded-lg"
                      className="hidden"
                      duration={1.5}
                      as="div"
                    />
                  </div>
          <Image
                    src="/images/toronto-fintech.jpg" 
                    alt="Toronto Fintech Ecosystem" 
                    width={600} 
                    height={400}
                    className="rounded-lg h-full w-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-background p-1">
                  <div className="h-full w-full rounded-full bg-primary/10 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xl font-bold text-primary">200+</div>
                      <div className="text-xs">Fintech Startups</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
    </div>
    </>
  )
}
