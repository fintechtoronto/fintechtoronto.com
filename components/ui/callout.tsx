import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CalloutProps {
  icon?: ReactNode
  children?: ReactNode
  variant?: 'default' | 'info' | 'warning' | 'error' | 'success'
  className?: string
}

export default function Callout({
  children,
  icon,
  variant = 'default',
  className,
}: CalloutProps) {
  const variantStyles = {
    default: 'bg-muted border-muted-foreground/20',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300',
    warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-300',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/50 dark:border-red-800 dark:text-red-300',
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/50 dark:border-green-800 dark:text-green-300',
  }

  return (
    <div
      className={cn(
        'relative border p-4 rounded-lg my-4',
        variantStyles[variant],
        className
      )}
    >
      {icon && <div className="absolute left-4 top-4">{icon}</div>}
      <div className={cn('prose max-w-none dark:prose-invert', icon && 'pl-6')}>
        {children}
      </div>
    </div>
  )
} 