import { client, groq } from '@/lib/sanity'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

async function getSeries() {
  return client.fetch(
    groq`*[_type == "series"] | order(title asc) {
      _id,
      title,
      description,
      slug,
      "articleCount": count(*[_type == "blog" && references(^._id)])
    }`
  )
}

export default async function SeriesPage() {
  const series = await getSeries()

  return (
    <main className="container py-12">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Article Series</h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400">
          Deep dives into specific topics and themes in Toronto's fintech ecosystem.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {series.map((item: any) => (
          <Card key={item._id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="hover:text-blue-600 dark:hover:text-blue-400">
                <Link href={`/series/${item.slug.current}`} className="flex items-center justify-between">
                  {item.title}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </CardTitle>
              <CardDescription>{item.articleCount} Articles</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-neutral-600 dark:text-neutral-400">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {series.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            No series available yet. Check back soon!
          </p>
        </div>
      )}
    </main>
  )
} 