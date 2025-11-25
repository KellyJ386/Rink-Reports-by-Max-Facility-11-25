'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
  icon?: string
}

interface TabsProps {
  tabs: Tab[]
  value: string
  onValueChange: (value: string) => void
  className?: string
}

export function Tabs({ tabs, value, onValueChange, className }: TabsProps) {
  return (
    <div className={cn('border-b border-wolf-200', className)}>
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onValueChange(tab.id)}
            className={cn(
              'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors',
              value === tab.id
                ? 'border-action text-action'
                : 'border-transparent text-wolf-600 hover:border-wolf-300 hover:text-navy'
            )}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

interface TabsContentProps {
  value: string
  activeValue: string
  children: React.ReactNode
}

export function TabsContent({ value, activeValue, children }: TabsContentProps) {
  if (value !== activeValue) return null
  return <div className="py-6">{children}</div>
}
