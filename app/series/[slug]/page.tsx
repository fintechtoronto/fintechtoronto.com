import { client, groq, urlFor } from '@/lib/sanity'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

async function getSeriesWithArticles(slug: string) {
  return client.fetch(
    groq`*[_type == "series" && slug.current == $slug][0]{
      _id,
      title,
      description,
      "articles": *[_type == "blog" && references(^._id)] | order(publishDate desc) {
        _id,
        title,
        slug,
        publishDate,
        excerpt,
        image,
        authors[]->{
          name,
          slug
        }
      }
    }`,
    { slug }
  )
}

export default async function SeriesDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const series = await getSeriesWithArticles(params.slug)

  if (!series) {
    notFound()
  }

  return (
    <main className="container py-12">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">{series.title}</h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400">
          {series.description}
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {series.articles.map((article: any) => (
          <Card key={article._id} className="flex flex-col">
            <div className="relative aspect-[16/9] overflow-hidden rounded-t-lg">
              <Image
                src={urlFor(article.image).url()}
                alt={article.title}
                fill
                className="object-cover transition-transform hover:scale-105"
              />
            </div>
            <CardHeader>
              <CardTitle className="line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400">
                <Link href={`/blog/${article.slug.current}`}>{article.title}</Link>
              </CardTitle>
              <CardDescription>
                {new Date(article.publishDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
                {' • '}
                {article.authors.map((author: any) => author.name).join(', ')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-neutral-600 dark:text-neutral-400 line-clamp-3">
                {article.excerpt}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {series.articles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            No articles in this series yet. Check back soon!
          </p>
        </div>
      )}
    </main>
  )
} 