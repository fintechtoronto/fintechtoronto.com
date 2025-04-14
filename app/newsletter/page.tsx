import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Newsletter - FinTech Toronto",
  description: "Subscribe to our newsletter for the latest fintech news, events, and insights.",
}

export default function NewsletterPage() {
  return (
    <div className="container py-12 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Newsletter</h1>
      <p className="text-lg mb-8">
        Subscribe to our newsletter to receive the latest fintech news, event announcements, and insights from the Toronto fintech community.
      </p>
      
      <div className="bg-neutral-100 dark:bg-neutral-800 p-8 rounded-lg">
        <h2 className="text-2xl font-medium mb-4">Stay Connected</h2>
        <p className="mb-6">
          Join our mailing list and be the first to know about upcoming events, industry trends, and opportunities in the fintech ecosystem.
        </p>
        
        <form className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className="w-full p-3 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900"
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm">
                I agree to receive emails from FinTech Toronto
              </span>
            </label>
          </div>
          
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-3 rounded-md font-medium"
          >
            Subscribe
          </button>
        </form>
      </div>
    </div>
  )
} 