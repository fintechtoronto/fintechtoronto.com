import { Button } from "@/components/ui/button"
import { Twitter, Linkedin } from "lucide-react"

interface SocialShareProps {
  title: string
  url: string
}

export function SocialShare({ title, url }: SocialShareProps) {
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const shareToTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      "_blank"
    )
  }

  const shareToLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      "_blank"
    )
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={shareToTwitter}
        aria-label="Share on Twitter"
      >
        <Twitter className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={shareToLinkedIn}
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="h-4 w-4" />
      </Button>
    </div>
  )
} 