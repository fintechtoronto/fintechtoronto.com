import Link from 'next/link'
import { Github, Linkedin, Twitter } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container px-4 py-12 md:py-16 lg:py-20">
        <div className="xl:grid xl:grid-cols-5 xl:gap-8">
          <div className="xl:col-span-2">
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <span className="text-sm font-bold text-primary-foreground">FT</span>
                </div>
                <span className="text-lg font-semibold">FintechToronto</span>
              </div>
              <p className="max-w-sm text-sm text-muted-foreground">
                Your community hub for fintech and AI enthusiasts in Toronto. Stay updated with the latest trends, events, and insights.
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://twitter.com/fintechtoronto"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href="https://linkedin.com/company/fintechtoronto"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
                <a
                  href="https://github.com/fintechtoronto"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-3 xl:col-span-3 xl:mt-0">
            <div>
              <h3 className="text-sm font-semibold">Resources</h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/events" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Events
                  </Link>
                </li>
                <li>
                  <Link href="/series" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Series
                  </Link>
                </li>
                <li>
                  <Link href="/newsletter" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Newsletter
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Community</h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link href="/contribute" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Contribute
                  </Link>
                </li>
                <li>
                  <Link href="/code-of-conduct" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Code of Conduct
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Topics</h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link href="/topics/open-banking" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Open Banking
                  </Link>
                </li>
                <li>
                  <Link href="/topics/blockchain" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Blockchain
                  </Link>
                </li>
                <li>
                  <Link href="/topics/ai" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    AI in Finance
                  </Link>
                </li>
                <li>
                  <Link href="/topics/regulation" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Regulation
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border">
          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} FintechToronto.com. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
} 