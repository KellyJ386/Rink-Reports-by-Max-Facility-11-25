'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const subNavItems = [
  { href: '/dashboard/ice-depth', label: 'Dashboard', exact: true },
  { href: '/dashboard/ice-depth/record', label: 'Record Reading' },
  { href: '/dashboard/ice-depth/history', label: 'History' },
  { href: '/dashboard/ice-depth/configure', label: 'Configure' },
]

export default function IceDepthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sub-navigation */}
      <div className="bg-white border-b px-6 py-3">
        <nav className="flex gap-6">
          {subNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                isActive(item.href, item.exact)
                  ? 'text-blue-600 border-b-2 border-blue-600 pb-2 -mb-3'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
