import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function BlogLoading() {
  return (
    <main className="container py-12">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <Skeleton className="h-10 w-[200px] mx-auto mb-4" />
        <Skeleton className="h-6 w-[400px] mx-auto" />
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="flex flex-col">
            <Skeleton className="aspect-[16/9] rounded-t-lg" />
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="flex-grow">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-4/5" />
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
} 