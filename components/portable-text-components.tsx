import Link from 'next/link'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'

export const components = {
  block: {
    h1: ({children}: any) => (
      <h1 id={children.toString().toLowerCase().replace(/\s+/g, '-')} 
        className="scroll-m-20 text-4xl font-bold tracking-tight mt-12 mb-4">
        {children}
      </h1>
    ),
    h2: ({children}: any) => (
      <h2 id={children.toString().toLowerCase().replace(/\s+/g, '-')} 
        className="scroll-m-20 text-3xl font-semibold tracking-tight mt-10 mb-3">
        {children}
      </h2>
    ),
    h3: ({children}: any) => (
      <h3 id={children.toString().toLowerCase().replace(/\s+/g, '-')} 
        className="scroll-m-20 text-2xl font-semibold tracking-tight mt-8 mb-2">
        {children}
      </h3>
    ),
    h4: ({children}: any) => (
      <h4 id={children.toString().toLowerCase().replace(/\s+/g, '-')} 
        className="scroll-m-20 text-xl font-semibold tracking-tight mt-6 mb-2">
        {children}
      </h4>
    ),
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
  types: {
    image: ({value}: any) => {
      if (!value?.asset?._ref) {
        return null
      }
      return (
        <div className="my-8 relative">
          <Image 
            src={urlFor(value).url()}
            alt={value.alt || 'Blog image'}
            width={800}
            height={500}
            className="rounded-lg mx-auto"
          />
          {value.caption && (
            <figcaption className="text-center text-sm text-muted-foreground mt-2">
              {value.caption}
            </figcaption>
          )}
        </div>
      )
    },
    callout: ({value}: any) => {
      return (
        <div className="bg-muted border-l-4 border-primary p-4 my-4 rounded-r-lg">
          <p className="text-sm font-medium mb-1">{value.title}</p>
          <p className="text-sm">{value.text}</p>
        </div>
      )
    },
  },
} 