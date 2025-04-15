import { client, groq, urlFor } from '@/lib/sanity'
import { PortableText } from '@portabletext/react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CalendarIcon, Clock, BookOpen, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TableOfContents } from '@/components/blog/table-of-contents'

// Custom PortableText components
const myPortableTextComponents = {
  block: {
    h1: ({children}: any) => <h1 id={children.toString().toLowerCase().replace(/\s+/g, '-')} className="scroll-m-20 text-4xl font-bold tracking-tight mt-12 mb-4">{children}</h1>,
    h2: ({children}: any) => <h2 id={children.toString().toLowerCase().replace(/\s+/g, '-')} className="scroll-m-20 text-3xl font-semibold tracking-tight mt-10 mb-3">{children}</h2>,
    h3: ({children}: any) => <h3 id={children.toString().toLowerCase().replace(/\s+/g, '-')} className="scroll-m-20 text-2xl font-semibold tracking-tight mt-8 mb-2">{children}</h3>,
    h4: ({children}: any) => <h4 id={children.toString().toLowerCase().replace(/\s+/g, '-')} className="scroll-m-20 text-xl font-semibold tracking-tight mt-6 mb-2">{children}</h4>,
    normal: ({children}: any) => <p className="leading-7 mb-4">{children}</p>,
  },
  list: {
    bullet: ({children}: any) => <ul className="my-6 ml-6 list-disc [&>li]:mt-2">{children}</ul>,
    number: ({children}: any) => <ol className="my-6 ml-6 list-decimal [&>li]:mt-2">{children}</ol>,
  },
  marks: {
    link: ({children, value}: any) => {
      const rel = !value.href.startsWith('/') ? 'noreferrer noopener' : undefined
      return (
        <Link 
          href={value.href}
          rel={rel}
          className="text-primary underline underline-offset-4 hover:text-primary/80"
        >
          {children}
        </Link>
      )
    },
    strong: ({children}: any) => <strong className="font-semibold">{children}</strong>,
    em: ({children}: any) => <em className="italic">{children}</em>,
    code: ({children}: any) => <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">{children}</code>,
  },
}

async function getBlogPost(slug: string) {
  return client.fetch(
    groq`*[_type == "blog" && slug.current == $slug][0]{
      _id,
      title,
      slug,
      publishDate,
      content,
      image,
      excerpt,
      series->{
        title,
        slug,
        description
      },
      authors[]->{
        _id,
        name,
        slug,
        image,
        bio
      },
      "estimatedReadingTime": round(length(pt::text(content)) / 5 / 180)
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

// Add revalidation for fresh content
export const revalidate = 3600 // Revalidate every hour

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string }
}) {
  const post = await getBlogPost(params.slug)

  if (!post) {
    notFound()
  }

  // Extract headings from content for table of contents
  const headings: { text: string; level: number; slug: string }[] = [];
  
  if (post.content) {
    post.content.forEach((block: any) => {
      if (block._type === 'block' && ['h1', 'h2', 'h3', 'h4'].includes(block.style)) {
        const text = block.children
          .filter((child: any) => child._type === 'span')
          .map((span: any) => span.text)
          .join('');
          
        if (text) {
          const slug = text.toLowerCase().replace(/\s+/g, '-');
          const level = parseInt(block.style.substring(1));
          headings.push({ text, level, slug });
        }
      }
    });
  }

  return (
    <div className="bg-white dark:bg-background">
      {/* Featured Image - Full Width */}
      {post.image && (
        <div className="relative w-full h-[50vh] lg:h-[60vh] mb-8">
          <Image
            src={urlFor(post.image).url()}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          
          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 container max-w-4xl p-6 md:p-8 text-white">
            {post.series && (
              <Link
                href={`/series/${post.series.slug.current}`}
                className="inline-block mb-4 text-sm md:text-base font-medium bg-primary/80 text-white px-3 py-1 rounded-full hover:bg-primary transition-colors"
              >
                {post.series.title}
              </Link>
            )}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">{post.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm md:text-base">
              {post.authors && post.authors.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {post.authors.slice(0, 3).map((author: any) => (
                      <Avatar key={author._id} className="h-6 w-6 border-2 border-background">
                        {author.image ? (
                          <AvatarImage src={urlFor(author.image).url()} alt={author.name} />
                        ) : (
                          <AvatarFallback className="text-[10px]">{author.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                        )}
                      </Avatar>
                    ))}
                  </div>
                  <span className="text-white/90">
                    {post.authors.map((author: any) => author.name).join(', ')}
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4" />
                <time dateTime={post.publishDate}>
                  {new Date(post.publishDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
              </div>
              
              {post.estimatedReadingTime && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{post.estimatedReadingTime} min read</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!post.image && (
        <div className="relative w-full h-[40vh] mb-8 bg-gradient-to-r from-primary/5 to-primary/20 dark:from-primary/10 dark:to-primary/30">
          <div className="absolute inset-0 flex items-center justify-center">
            {post.series ? (
              <div className="text-center max-w-4xl px-6">
                <span className="inline-block mb-4 text-sm md:text-base font-medium bg-primary text-white px-4 py-2 rounded-full">
                  {post.series.title}
                </span>
                <div className="bg-background/80 dark:bg-background/90 backdrop-blur-sm p-8 rounded-xl shadow-lg">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">{post.title}</h1>
                  
                  <div className="flex flex-wrap items-center justify-center gap-6 text-sm md:text-base text-muted-foreground">
                    {post.authors && post.authors.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {post.authors.slice(0, 3).map((author: any) => (
                            <Avatar key={author._id} className="h-8 w-8 border-2 border-background">
                              {author.image ? (
                                <AvatarImage src={urlFor(author.image).url()} alt={author.name} />
                              ) : (
                                <AvatarFallback>{author.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                              )}
                            </Avatar>
                          ))}
                        </div>
                        <span>
                          {post.authors.map((author: any) => author.name).join(', ')}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="h-4 w-4" />
                      <time dateTime={post.publishDate}>
                        {new Date(post.publishDate).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </time>
                    </div>
                    
                    {post.estimatedReadingTime && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span>{post.estimatedReadingTime} min read</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center max-w-4xl px-6">
                <div className="bg-background/80 dark:bg-background/90 backdrop-blur-sm p-8 rounded-xl shadow-lg">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">{post.title}</h1>
                  
                  <div className="flex flex-wrap items-center justify-center gap-6 text-sm md:text-base text-muted-foreground">
                    {post.authors && post.authors.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {post.authors.slice(0, 3).map((author: any) => (
                            <Avatar key={author._id} className="h-8 w-8 border-2 border-background">
                              {author.image ? (
                                <AvatarImage src={urlFor(author.image).url()} alt={author.name} />
                              ) : (
                                <AvatarFallback>{author.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                              )}
                            </Avatar>
                          ))}
                        </div>
                        <span>
                          {post.authors.map((author: any) => author.name).join(', ')}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="h-4 w-4" />
                      <time dateTime={post.publishDate}>
                        {new Date(post.publishDate).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </time>
                    </div>
                    
                    {post.estimatedReadingTime && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span>{post.estimatedReadingTime} min read</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="container max-w-6xl py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Table of Contents - Visible on desktop */}
          {headings.length > 0 && (
            <aside className="hidden lg:block lg:col-span-3 relative">
              <div className="sticky top-24">
                <div className="flex items-center gap-2 mb-4 text-sm font-medium text-primary">
                  <BookOpen className="h-4 w-4" />
                  <span>Table of Contents</span>
                </div>
                <TableOfContents headings={headings} />
                
                <div className="mt-8 pt-6 border-t border-border">
                  <div className="flex items-center gap-2 mb-4 text-sm font-medium">
                    <Share2 className="h-4 w-4" />
                    <span>Share this article</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                      <span className="sr-only">Share on Twitter</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                      <span className="sr-only">Share on LinkedIn</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                      <span className="sr-only">Share on Facebook</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                    </Button>
                  </div>
                </div>
              </div>
            </aside>
          )}
          
          {/* Article Content */}
          <article className={`${headings.length > 0 ? 'lg:col-span-9' : 'lg:col-span-8 lg:col-start-3'}`}>
            {/* Mobile Table of Contents */}
            {headings.length > 0 && (
              <Card className="mb-8 lg:hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4 text-sm font-medium text-primary">
                    <BookOpen className="h-4 w-4" />
                    <span>Table of Contents</span>
                  </div>
                  <TableOfContents headings={headings} />
                </CardContent>
              </Card>
            )}
            
            {/* Article excerpt/summary */}
            {post.excerpt && (
              <div className="mb-10 text-xl text-muted-foreground italic border-l-4 border-primary/20 pl-4 py-2">
                {post.excerpt}
              </div>
            )}
            
            {/* Main Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <PortableText value={post.content} components={myPortableTextComponents} />
            </div>

            {/* Author Section */}
            {post.authors && post.authors.length > 0 && (
              <div className="mt-16 pt-8 border-t">
                <h2 className="text-2xl font-bold mb-6">About the Author{post.authors.length > 1 ? 's' : ''}</h2>
                <div className="grid gap-8 md:grid-cols-2">
                  {post.authors.map((author: any) => (
                    <div key={author._id} className="flex gap-4 bg-muted/30 p-5 rounded-lg">
                      <Avatar className="h-16 w-16">
                        {author.image ? (
                          <AvatarImage src={urlFor(author.image).url()} alt={author.name} />
                        ) : (
                          <AvatarFallback>{author.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-lg">{author.name}</h3>
                        <p className="text-muted-foreground mt-1">{author.bio}</p>
                        {author.slug && (
                          <Link href={`/authors/${author.slug.current}`} className="mt-3 text-sm text-primary font-medium inline-block hover:underline">
                            View all articles
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>
      </div>
    </div>
  )
} 