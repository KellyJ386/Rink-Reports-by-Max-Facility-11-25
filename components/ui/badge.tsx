import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-action focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-navy text-white',
        secondary:
          'border-transparent bg-action text-white',
        outline:
          'border-navy text-navy bg-white',
        success:
          'border-transparent bg-action-600 text-white',
        warning:
          'border-transparent bg-yellow-500 text-white',
        danger:
          'border-transparent bg-red-600 text-white',
        info:
          'border-transparent bg-wolf text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
