'use client'

import { use } from 'react'
import { ModuleView } from '@/components/reports/ModuleView'

export default function IncidentViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <ModuleView
      submissionId={id}
      title="Incident Report"
      basePath="/dashboard/incidents"
      renderData={(data) => {
        const severity = data.severity as string
        const severityColors: Record<string, string> = {
          MINOR: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          MODERATE: 'bg-orange-100 text-orange-800 border-orange-300',
          SEVERE: 'bg-red-100 text-red-800 border-red-300',
        }

        return (
          <div className="space-y-6">
            {/* Severity Banner */}
            {Boolean(severity) && (
              <div className={`rounded-lg p-4 border ${severityColors[severity] || ''}`}>
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <span className="font-semibold">{severity} Severity</span>
                    <span className="mx-2">•</span>
                    <span>{String(data.incidentType || '').replace(/_/g, ' ')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Incident Details */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Incident Details</h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="text-sm text-gray-900 mt-1">{String(data.incidentType || '-').replace(/_/g, ' ')}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="text-sm text-gray-900 mt-1">{String(data.locationInFacility || '-').replace(/_/g, ' ')}</dd>
                </div>
                {Boolean(data.incidentTime) && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Time</dt>
                    <dd className="text-sm text-gray-900 mt-1">{String(data.incidentTime)}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Injured Party */}
            {Boolean(data.injuredPartyName) && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Injured Party</h2>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="text-sm text-gray-900 mt-1">{String(data.injuredPartyName)}</dd>
                  </div>
                  {Boolean(data.injuredPartyPhone) && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Phone</dt>
                      <dd className="text-sm text-gray-900 mt-1">{String(data.injuredPartyPhone)}</dd>
                    </div>
                  )}
                  {Boolean(data.injuredPartyAge) && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Age</dt>
                      <dd className="text-sm text-gray-900 mt-1">{String(data.injuredPartyAge)}</dd>
                    </div>
                  )}
                  {Boolean(data.injuredPartyType) && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Relationship</dt>
                      <dd className="text-sm text-gray-900 mt-1">{String(data.injuredPartyType)}</dd>
                    </div>
                  )}
                </dl>
                {Boolean(data.injuryDescription) && (
                  <div className="mt-4">
                    <dt className="text-sm font-medium text-gray-500">Injury Description</dt>
                    <dd className="text-sm text-gray-900 mt-1">{String(data.injuryDescription)}</dd>
                  </div>
                )}
                {Boolean(data.medicalAttentionRequired) && (
                  <div className="mt-4 flex items-center gap-2 text-orange-700 bg-orange-50 rounded p-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Medical attention was required
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {Boolean(data.description) && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{String(data.description)}</p>
              </div>
            )}

            {/* Witnesses */}
            {Boolean(data.witnesses) && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Witnesses</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{String(data.witnesses)}</p>
              </div>
            )}

            {/* Actions Taken */}
            {Boolean(data.actionsTaken) && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Actions Taken</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{String(data.actionsTaken)}</p>
              </div>
            )}
          </div>
        )
      }}
    />
  )
}
