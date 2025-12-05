'use client'

import { SubmissionStatus } from '@/types'

interface ReportHeaderProps {
  title: string
  moduleType: string
  facilityName: string
  rinkName?: string
  submittedBy?: string
  submittedAt?: Date | string
  status?: SubmissionStatus
  onBack?: () => void
  actions?: React.ReactNode
}

const moduleLabels: Record<string, string> = {
  ICE_DEPTH: 'Ice Depth',
  ICE_OPERATIONS: 'Ice Operations',
  REFRIGERATION: 'Refrigeration',
  AIR_QUALITY: 'Air Quality',
  INCIDENT: 'Incident Report',
  SCHEDULE: 'Schedule',
  DAILY_CHECKLIST: 'Daily Checklist',
}

const moduleIcons: Record<string, string> = {
  ICE_DEPTH: '🧊',
  ICE_OPERATIONS: '⛸️',
  REFRIGERATION: '❄️',
  AIR_QUALITY: '💨',
  INCIDENT: '🚨',
  SCHEDULE: '📅',
  DAILY_CHECKLIST: '✅',
}

const statusStyles: Record<SubmissionStatus, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' },
  SUBMITTED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Submitted' },
  APPROVED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
  ARCHIVED: { bg: 'bg-gray-200', text: 'text-gray-600', label: 'Archived' },
}

export function ReportHeader({
  title,
  moduleType,
  facilityName,
  rinkName,
  submittedBy,
  submittedAt,
  status,
  onBack,
  actions,
}: ReportHeaderProps) {
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const statusConfig = status ? statusStyles[status] : null

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Top bar with back button and actions */}
      <div className="px-6 py-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Back</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="text-2xl">{moduleIcons[moduleType] || '📋'}</span>
            <span className="text-sm font-medium text-gray-500">
              {moduleLabels[moduleType] || moduleType}
            </span>
          </div>
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Main header content */}
      <div className="px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>{facilityName}</span>
              </div>
              {rinkName && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{rinkName}</span>
                </div>
              )}
              {submittedAt && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDate(submittedAt)}</span>
                </div>
              )}
              {submittedAt && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{formatTime(submittedAt)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {submittedBy && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Submitted by</p>
                <p className="text-sm font-medium text-gray-900">{submittedBy}</p>
              </div>
            )}
            {statusConfig && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                {statusConfig.label}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
