import { client, groq, urlFor } from '@/lib/sanity'
import { PortableText } from '@portabletext/react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

async function getBlogPost(slug: string) {
  return client.fetch(
    groq`*[_type == "blog" && slug.current == $slug][0]{
      _id,
      title,
      slug,
      publishDate,
      content,
      image,
      series->{
        title,
        slug,
        description
      },
      authors[]->{
        name,
        slug,
        image,
        bio
      }
    }`,
    { slug }
  )
}

// Generate static params for all blog posts
export async function generateStaticParams() {
  const posts = await client.fetch(
    groq`*[_type == "blog" && defined(slug.current)][]{
      "slug": slug.current
    }`
  )
  
  return posts.map((post: { slug: string }) => ({
    slug: post.slug,
  }))
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string }
}) {
  const post = await getBlogPost(params.slug)

  if (!post) {
    notFound()
  }

  return (
    <article className="container max-w-4xl py-12">
      {/* Series Banner */}
      {post.series && (
        <div className="mb-8 p-6 rounded-lg bg-neutral-50 dark:bg-neutral-900">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
            Part of the series
          </p>
          <Link
            href={`/series/${post.series.slug.current}`}
            className="text-xl font-bold hover:text-blue-600 dark:hover:text-blue-400"
          >
            {post.series.title}
          </Link>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            {post.series.description}
          </p>
        </div>
      )}

      {/* Article Header */}
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <div className="flex items-center justify-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
          <time dateTime={post.publishDate}>
            {new Date(post.publishDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </time>
        </div>
      </header>

      {/* Featured Image */}
      <div className="relative aspect-[16/9] mb-8 overflow-hidden rounded-lg">
        <Image
          src={urlFor(post.image).url()}
          alt={post.title}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Article Content */}
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <PortableText value={post.content} />
      </div>

      {/* Author Section */}
      <div className="mt-12 pt-8 border-t">
        <h2 className="text-2xl font-bold mb-6">About the Author{post.authors.length > 1 ? 's' : ''}</h2>
        <div className="grid gap-8 md:grid-cols-2">
          {post.authors.map((author: any) => (
            <div key={author._id} className="flex gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={author.image ? urlFor(author.image).url() : undefined} alt={author.name} />
                <AvatarFallback>{author.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{author.name}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{author.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  )
} 