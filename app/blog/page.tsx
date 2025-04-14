import { client, groq, urlFor } from '@/lib/sanity'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'

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

export default async function BlogPage() {
  const posts = await getBlogPosts()

  return (
    <main className="container py-12">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Latest Articles</h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400">
          Insights, analysis, and perspectives from Toronto's fintech community.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post: any) => (
          <Card key={post._id} className="flex flex-col">
            <div className="relative aspect-[16/9] overflow-hidden rounded-t-lg">
              <Image
                src={urlFor(post.image).url()}
                alt={post.title}
                fill
                className="object-cover transition-transform hover:scale-105"
              />
            </div>
            <CardHeader>
              {post.series && (
                <Link
                  href={`/series/${post.series.slug.current}`}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {post.series.title}
                </Link>
              )}
              <CardTitle className="line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400">
                <Link href={`/blog/${post.slug.current}`}>{post.title}</Link>
              </CardTitle>
              <CardDescription>
                {new Date(post.publishDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
                {' • '}
                {post.authors.map((author: any) => author.name).join(', ')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-neutral-600 dark:text-neutral-400 line-clamp-3">
                {post.excerpt}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
} 