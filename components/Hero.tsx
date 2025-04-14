import Link from 'next/link'
import { ArrowRight, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Hero() {
  return (
    <div className="relative isolate overflow-hidden bg-gradient-to-b from-neutral-100/20 dark:from-neutral-900/20">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-br from-neutral-900 to-neutral-600 dark:from-neutral-100 dark:to-neutral-400 bg-clip-text text-transparent">
            Toronto's Fintech & AI Community
          </h1>
          <p className="mt-6 text-lg leading-8 text-neutral-600 dark:text-neutral-400">
            Join a vibrant community of fintech professionals, entrepreneurs, and enthusiasts. Stay updated with the latest trends, events, and insights in Toronto's growing fintech ecosystem.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild size="lg">
              <Link href="/newsletter" className="flex items-center gap-2">
                Subscribe to Newsletter
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/auth/register" className="flex items-center gap-2">
                Join the Community
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 -z-10 transform-gpu overflow-hidden blur-3xl" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-500 to-purple-500 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'}} />
      </div>
    </div>
  )
} 