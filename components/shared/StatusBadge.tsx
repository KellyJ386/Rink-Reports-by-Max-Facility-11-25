type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

interface StatusBadgeProps {
  status: string
  variant?: BadgeVariant
  size?: 'sm' | 'md'
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
}

// Auto-detect variant from common status strings
function getVariantFromStatus(status: string): BadgeVariant {
  const lower = status.toLowerCase()
  if (['approved', 'completed', 'published', 'filled', 'delivered', 'active'].includes(lower)) {
    return 'success'
  }
  if (['pending', 'pending_review', 'draft', 'queued'].includes(lower)) {
    return 'warning'
  }
  if (['rejected', 'cancelled', 'failed', 'undelivered', 'inactive'].includes(lower)) {
    return 'danger'
  }
  if (['submitted', 'sent', 'in_progress'].includes(lower)) {
    return 'info'
  }
  return 'default'
}

// Format status string for display
function formatStatus(status: string): string {
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function StatusBadge({ status, variant, size = 'sm' }: StatusBadgeProps) {
  const resolvedVariant = variant ?? getVariantFromStatus(status)

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variantClasses[resolvedVariant]} ${sizeClasses[size]}`}
    >
      {formatStatus(status)}
    </span>
  )
}
