'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'

type TimeLeft = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export default function EventCountdown({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  useEffect(() => {
    // Calculate time left
    const calculateTimeLeft = () => {
      const difference = +targetDate - +new Date()
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        })
      } else {
        // Event has started
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0
        })
      }
    }

    // Calculate immediately then set interval
    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    // Clear interval on component unmount
    return () => clearInterval(timer)
  }, [targetDate])

  // Format with leading zeros
  const formatNumber = (num: number): string => {
    return num.toString().padStart(2, '0')
  }

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <h2 className="text-xl font-semibold">Event starts in</h2>
        </div>
        <div className="flex justify-center gap-4 text-center">
          <div className="bg-background p-3 rounded-lg shadow-sm min-w-16">
            <div className="text-3xl font-bold">{formatNumber(timeLeft.days)}</div>
            <div className="text-xs text-muted-foreground uppercase mt-1">Days</div>
          </div>
          <div className="bg-background p-3 rounded-lg shadow-sm min-w-16">
            <div className="text-3xl font-bold">{formatNumber(timeLeft.hours)}</div>
            <div className="text-xs text-muted-foreground uppercase mt-1">Hours</div>
          </div>
          <div className="bg-background p-3 rounded-lg shadow-sm min-w-16">
            <div className="text-3xl font-bold">{formatNumber(timeLeft.minutes)}</div>
            <div className="text-xs text-muted-foreground uppercase mt-1">Minutes</div>
          </div>
          <div className="bg-background p-3 rounded-lg shadow-sm min-w-16">
            <div className="text-3xl font-bold">{formatNumber(timeLeft.seconds)}</div>
            <div className="text-xs text-muted-foreground uppercase mt-1">Seconds</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 