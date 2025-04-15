import { client, groq, urlFor } from '@/lib/sanity'
import Link from 'next/link'
import Image from 'next/image'
import { ArticleCard } from '@/components/cards/article-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, ArrowRight } from 'lucide-react'

// Map for determining series themes based on title keywords
const seriesThemeMap: Record<string, string> = {
  'blockchain': 'blue',
  'crypto': 'blue',
  'open banking': 'green',
  'finance': 'green',
  'ai': 'purple',
  'machine learning': 'purple',
  'data': 'indigo',
  'analytics': 'indigo',
  'innovation': 'amber',
  'startup': 'amber',
  'regulation': 'pink',
  'policy': 'pink'
}

// Function to determine theme based on series title
function getSeriesTheme(title: string): string {
  const lowercaseTitle = title.toLowerCase();
  let theme = 'blue'; // Default theme
  
  for (const [keyword, color] of Object.entries(seriesThemeMap)) {
    if (lowercaseTitle.includes(keyword)) {
      theme = color;
      break;
    }
  }
  
  return theme;
}

async function getBlogPosts() {
  return client.fetch(
    groq`*[_type == "blog"] | order(publishDate desc) {
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
        slug,
        image
      }
    }`
  )
}

async function getAllSeries() {
  return client.fetch(
    groq`*[_type == "series"] {
      _id,
      title,
      description,
      slug,
      coverImage,
      "articleCount": count(*[_type == "blog" && references(^._id)])
    } | order(articleCount desc)`
  )
}

export const revalidate = 3600 // Revalidate every hour

export default async function BlogPage() {
  const posts = await getBlogPosts()
  const allSeries = await getAllSeries()
  
  // Group posts by series
  const postsBySeries: Record<string, any[]> = {}
  
  // Add an "All" category
  postsBySeries["all"] = posts
  
  // Add posts to their respective series
  posts.forEach((post: any) => {
    if (post.series) {
      const seriesId = post.series._id
      if (!postsBySeries[seriesId]) {
        postsBySeries[seriesId] = []
      }
      postsBySeries[seriesId].push(post)
    }
  })

  return (
    <main>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-background">
        <div className="container py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Blog & Insights
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Expert analysis, perspectives, and news from Toronto's fintech industry leaders.
            </p>
            
            <div className="relative w-full max-w-md mx-auto">
              <form className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="search"
                  placeholder="Search articles..."
                  className="w-full rounded-full border border-input px-10 py-2 bg-background"
                />
                <Button type="submit" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full h-7 px-3">
                  Search
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
      
      {/* Featured Series Section */}
      <section className="container py-12">
        <h2 className="text-2xl font-bold mb-6">Featured Series</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allSeries.slice(0, 4).map((series: any) => (
            <Link 
              href={`/series/${series.slug.current}`} 
              key={series._id}
              className="group"
            >
              <Card className="overflow-hidden h-full hover:shadow-md transition-all">
                <div className="relative h-32 w-full bg-muted">
                  {series.coverImage && (
                    <Image
                      src={urlFor(series.coverImage).url()}
                      alt={series.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <div className="p-4 text-white">
                      <h3 className="font-medium text-sm">{series.title}</h3>
                      <p className="text-xs opacity-90">{series.articleCount} articles</p>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
        
        <div className="flex justify-end mt-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/series" className="flex items-center text-sm">
              View all series
              <ArrowRight className="ml-1.5 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </section>
      
      {/* Articles Section with Tabs */}
      <section className="container py-12">
        <h2 className="text-2xl font-bold mb-6">Articles</h2>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-8 flex flex-nowrap overflow-x-auto hide-scrollbar pb-2">
            <TabsTrigger value="all" className="flex-shrink-0">All Articles</TabsTrigger>
            {allSeries.map((series: any) => (
              <TabsTrigger 
                key={series._id} 
                value={series._id}
                className="flex-shrink-0"
              >
                {series.title}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post: any, index: number) => {
                const seriesTheme = post.series 
                  ? getSeriesTheme(post.series.title) 
                  : ['blue', 'indigo', 'purple', 'green', 'amber'][index % 5];

                return (
                  <ArticleCard
                    key={post._id}
                    title={post.title}
                    slug={post.slug.current}
                    excerpt={post.excerpt}
                    imageUrl={post.image ? urlFor(post.image).url() : undefined}
                    publishDate={post.publishDate}
                    authors={post.authors}
                    series={post.series ? {
                      title: post.series.title,
                      slug: post.series.slug.current
                    } : undefined}
                    theme={seriesTheme as any}
                  />
                );
              })}
            </div>
          </TabsContent>
          
          {allSeries.map((series: any) => (
            <TabsContent key={series._id} value={series._id} className="mt-0">
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {postsBySeries[series._id]?.map((post: any, index: number) => {
                  const seriesTheme = getSeriesTheme(series.title);
                  
                  return (
                    <ArticleCard
                      key={post._id}
                      title={post.title}
                      slug={post.slug.current}
                      excerpt={post.excerpt}
                      imageUrl={post.image ? urlFor(post.image).url() : undefined}
                      publishDate={post.publishDate}
                      authors={post.authors}
                      series={{
                        title: series.title,
                        slug: series.slug.current
                      }}
                      theme={seriesTheme as any}
                    />
                  );
                })}
              </div>
              
              {(!postsBySeries[series._id] || postsBySeries[series._id].length === 0) && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No articles in this series yet.</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </section>
    </main>
  )
} 