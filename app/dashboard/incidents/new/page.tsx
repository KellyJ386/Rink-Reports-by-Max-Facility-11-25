'use client'

import { ModuleForm } from '@/components/reports/ModuleForm'

export default function NewIncidentPage() {
  return (
    <ModuleForm
      moduleType="INCIDENT"
      title="New Incident Report"
      description="Document facility incidents, injuries, and safety concerns"
      basePath="/dashboard/incidents"
    >
      {({ customData, setCustomData, submitting }: { customData: Record<string, unknown>; setCustomData: (data: Record<string, unknown>) => void; submitting: boolean }) => (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Incident Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Incident Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={(customData.incidentType as string) || ''}
                  onChange={(e) => setCustomData({ ...customData, incidentType: e.target.value })}
                  disabled={submitting}
                  className="input w-full"
                  required
                >
                  <option value="">Select type...</option>
                  <option value="INJURY">Injury</option>
                  <option value="PROPERTY_DAMAGE">Property Damage</option>
                  <option value="NEAR_MISS">Near Miss</option>
                  <option value="SAFETY_CONCERN">Safety Concern</option>
                  <option value="EQUIPMENT_FAILURE">Equipment Failure</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity <span className="text-red-500">*</span>
                </label>
                <select
                  value={(customData.severity as string) || ''}
                  onChange={(e) => setCustomData({ ...customData, severity: e.target.value })}
                  disabled={submitting}
                  className="input w-full"
                  required
                >
                  <option value="">Select severity...</option>
                  <option value="MINOR">Minor</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="SEVERE">Severe</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location in Facility
                </label>
                <select
                  value={(customData.locationInFacility as string) || ''}
                  onChange={(e) => setCustomData({ ...customData, locationInFacility: e.target.value })}
                  disabled={submitting}
                  className="input w-full"
                >
                  <option value="">Select location...</option>
                  <option value="ICE_SURFACE">Ice Surface</option>
                  <option value="PLAYERS_BENCH">Player&apos;s Bench</option>
                  <option value="PENALTY_BOX">Penalty Box</option>
                  <option value="LOCKER_ROOM">Locker Room</option>
                  <option value="BLEACHERS">Bleachers/Seating</option>
                  <option value="LOBBY">Lobby</option>
                  <option value="PARKING_LOT">Parking Lot</option>
                  <option value="ZAMBONI_AREA">Zamboni Area</option>
                  <option value="RESTROOMS">Restrooms</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time of Incident
                </label>
                <input
                  type="time"
                  value={(customData.incidentTime as string) || ''}
                  onChange={(e) => setCustomData({ ...customData, incidentTime: e.target.value })}
                  disabled={submitting}
                  className="input w-full"
                />
              </div>
            </div>
          </div>

          {/* Injured Party (if injury) */}
          {customData.incidentType === 'INJURY' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Injured Party Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={(customData.injuredPartyName as string) || ''}
                    onChange={(e) => setCustomData({ ...customData, injuredPartyName: e.target.value })}
                    disabled={submitting}
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={(customData.injuredPartyPhone as string) || ''}
                    onChange={(e) => setCustomData({ ...customData, injuredPartyPhone: e.target.value })}
                    disabled={submitting}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={(customData.injuredPartyAge as number) || ''}
                    onChange={(e) => setCustomData({ ...customData, injuredPartyAge: parseInt(e.target.value) || 0 })}
                    disabled={submitting}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship to Facility
                  </label>
                  <select
                    value={(customData.injuredPartyType as string) || ''}
                    onChange={(e) => setCustomData({ ...customData, injuredPartyType: e.target.value })}
                    disabled={submitting}
                    className="input w-full"
                  >
                    <option value="">Select...</option>
                    <option value="PLAYER">Player</option>
                    <option value="SPECTATOR">Spectator</option>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="CONTRACTOR">Contractor</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nature of Injury
                  </label>
                  <textarea
                    value={(customData.injuryDescription as string) || ''}
                    onChange={(e) => setCustomData({ ...customData, injuryDescription: e.target.value })}
                    disabled={submitting}
                    rows={3}
                    className="input w-full"
                    placeholder="Describe the injury..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={(customData.medicalAttentionRequired as boolean) || false}
                      onChange={(e) => setCustomData({ ...customData, medicalAttentionRequired: e.target.checked })}
                      disabled={submitting}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Medical attention was required</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Witnesses */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Witnesses</h2>
            <textarea
              value={(customData.witnesses as string) || ''}
              onChange={(e) => setCustomData({ ...customData, witnesses: e.target.value })}
              disabled={submitting}
              rows={3}
              className="input w-full"
              placeholder="List any witnesses with contact information..."
            />
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Incident Description</h2>
            <textarea
              value={(customData.description as string) || ''}
              onChange={(e) => setCustomData({ ...customData, description: e.target.value })}
              disabled={submitting}
              rows={6}
              className="input w-full"
              placeholder="Provide a detailed description of what happened..."
              required
            />
          </div>

          {/* Actions Taken */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions Taken</h2>
            <textarea
              value={(customData.actionsTaken as string) || ''}
              onChange={(e) => setCustomData({ ...customData, actionsTaken: e.target.value })}
              disabled={submitting}
              rows={4}
              className="input w-full"
              placeholder="What actions were taken immediately following the incident..."
            />
          </div>
        </div>
      )}
    </ModuleForm>
  )
}
