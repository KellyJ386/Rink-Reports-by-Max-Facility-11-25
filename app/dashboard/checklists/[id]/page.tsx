import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canUserAccess } from '@/lib/permissions'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const CHECKLIST_TYPES = {
  opening: { label: 'Opening Checklist', icon: '🌅', color: 'bg-yellow-100 text-yellow-800' },
  closing: { label: 'Closing Checklist', icon: '🌙', color: 'bg-indigo-100 text-indigo-800' },
  safety: { label: 'Safety Inspection', icon: '🛡️', color: 'bg-red-100 text-red-800' },
  equipment: { label: 'Equipment Check', icon: '🔧', color: 'bg-blue-100 text-blue-800' },
  maintenance: { label: 'Maintenance Check', icon: '🔨', color: 'bg-orange-100 text-orange-800' },
}

const CHECKLIST_ITEMS: Record<string, Array<{ id: string; label: string; category: string }>> = {
  opening: [
    { id: 'lights', label: 'Turn on all lights', category: 'Facility' },
    { id: 'hvac', label: 'Check HVAC system', category: 'Facility' },
    { id: 'ice_inspect', label: 'Inspect ice surface condition', category: 'Ice' },
    { id: 'boards_check', label: 'Check boards and glass for damage', category: 'Ice' },
    { id: 'goals_check', label: 'Inspect and position goals', category: 'Ice' },
    { id: 'locker_rooms', label: 'Unlock and inspect locker rooms', category: 'Facility' },
    { id: 'restrooms', label: 'Check restrooms - stocked and clean', category: 'Facility' },
    { id: 'first_aid', label: 'Verify first aid kit is stocked', category: 'Safety' },
    { id: 'aed_check', label: 'Check AED device', category: 'Safety' },
    { id: 'emergency_exits', label: 'Verify emergency exits clear', category: 'Safety' },
    { id: 'zamboni_check', label: 'Pre-shift Zamboni inspection', category: 'Equipment' },
    { id: 'skate_rental', label: 'Set up skate rental area', category: 'Operations' },
  ],
  closing: [
    { id: 'clear_ice', label: 'Clear all persons from ice', category: 'Ice' },
    { id: 'final_resurface', label: 'Complete final ice resurface', category: 'Ice' },
    { id: 'locker_check', label: 'Check all locker rooms empty', category: 'Facility' },
    { id: 'lost_found', label: 'Collect lost and found items', category: 'Operations' },
    { id: 'lights_off', label: 'Turn off non-essential lights', category: 'Facility' },
    { id: 'hvac_adjust', label: 'Adjust HVAC for overnight', category: 'Facility' },
    { id: 'doors_locked', label: 'Lock all exterior doors', category: 'Security' },
    { id: 'alarm_set', label: 'Set security alarm', category: 'Security' },
    { id: 'cash_secure', label: 'Secure cash drawer/deposits', category: 'Operations' },
    { id: 'refrigeration_log', label: 'Log refrigeration readings', category: 'Equipment' },
  ],
  safety: [
    { id: 'fire_extinguishers', label: 'Check fire extinguisher locations and dates', category: 'Fire Safety' },
    { id: 'emergency_lighting', label: 'Test emergency lighting', category: 'Fire Safety' },
    { id: 'exit_signs', label: 'Verify all exit signs illuminated', category: 'Fire Safety' },
    { id: 'first_aid_full', label: 'First aid kit fully stocked', category: 'Medical' },
    { id: 'aed_operational', label: 'AED operational with fresh pads', category: 'Medical' },
    { id: 'spill_kit', label: 'Spill kit available and stocked', category: 'Hazmat' },
    { id: 'wet_floor_signs', label: 'Wet floor signs available', category: 'Slip/Fall' },
    { id: 'handrails_secure', label: 'All handrails secure', category: 'Slip/Fall' },
    { id: 'mats_condition', label: 'Floor mats in good condition', category: 'Slip/Fall' },
    { id: 'glass_intact', label: 'All glass panels intact', category: 'Structural' },
    { id: 'boards_secure', label: 'Boards properly secured', category: 'Structural' },
    { id: 'bench_doors', label: 'Bench doors functioning', category: 'Equipment' },
  ],
  equipment: [
    { id: 'zamboni_fuel', label: 'Zamboni fuel level checked', category: 'Resurfacer' },
    { id: 'zamboni_blade', label: 'Blade condition inspected', category: 'Resurfacer' },
    { id: 'zamboni_towel', label: 'Towel condition checked', category: 'Resurfacer' },
    { id: 'zamboni_water', label: 'Water tank filled', category: 'Resurfacer' },
    { id: 'edger_condition', label: 'Edger operational', category: 'Ice Tools' },
    { id: 'scraper_condition', label: 'Ice scraper condition', category: 'Ice Tools' },
    { id: 'compressor_visual', label: 'Compressor visual inspection', category: 'Refrigeration' },
    { id: 'brine_level', label: 'Brine level checked', category: 'Refrigeration' },
    { id: 'rental_skates', label: 'Rental skates inspected', category: 'Rentals' },
    { id: 'helmets_sanitized', label: 'Rental helmets sanitized', category: 'Rentals' },
  ],
  maintenance: [
    { id: 'light_bulbs', label: 'Replace burnt out bulbs', category: 'Lighting' },
    { id: 'hvac_filters', label: 'Check HVAC filters', category: 'HVAC' },
    { id: 'drain_clear', label: 'Floor drains clear', category: 'Plumbing' },
    { id: 'toilet_function', label: 'All toilets functioning', category: 'Plumbing' },
    { id: 'faucets_check', label: 'Faucets not leaking', category: 'Plumbing' },
    { id: 'door_hardware', label: 'Door hardware functioning', category: 'Doors' },
    { id: 'paint_touch_up', label: 'Note areas needing paint', category: 'General' },
    { id: 'ceiling_tiles', label: 'Ceiling tiles intact', category: 'General' },
    { id: 'seating_condition', label: 'Seating in good condition', category: 'Furniture' },
    { id: 'signage_visible', label: 'All signage visible', category: 'General' },
  ],
}

export default async function ChecklistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  if (!canUserAccess(user, 'dailyChecklist', 'access')) {
    redirect('/dashboard')
  }

  const canViewAll = canUserAccess(user, 'dailyChecklist', 'viewAll')

  const submission = await prisma.submission.findFirst({
    where: {
      id,
      formTemplate: {
        facilityId: user.facilityId,
        moduleType: 'DAILY_CHECKLIST',
      },
      ...(canViewAll ? {} : { submittedById: user.id }),
      archivedAt: null,
    },
    include: {
      rink: { select: { id: true, name: true } },
      submittedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  if (!submission) {
    notFound()
  }

  const data = submission.data as any
  const checklistType = data?.checklistType as keyof typeof CHECKLIST_TYPES
  const typeInfo = CHECKLIST_TYPES[checklistType] || { label: 'General', icon: '📋', color: 'bg-gray-100 text-gray-800' }
  const items = CHECKLIST_ITEMS[checklistType] || []
  const checkedItems = data?.checkedItems || {}
  const notes = data?.notes || {}
  const completionPercentage = data?.completionPercentage || 0

  // Group items by category
  const itemsByCategory = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, typeof items>)

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/checklists" className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{typeInfo.label}</h1>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${typeInfo.color}`}>
              <span>{typeInfo.icon}</span>
              {typeInfo.label}
            </span>
          </div>
          <p className="text-gray-600 text-sm mt-1">
            {submission.rink.name} - {new Date(submission.submittedAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Completion Status */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Completion Status</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            completionPercentage === 100 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {completionPercentage}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full ${completionPercentage === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {data?.completedItems || 0} of {data?.totalItems || 0} items completed
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-4">
        {Object.entries(itemsByCategory).map(([category, categoryItems]) => (
          <div key={category} className="card">
            <h3 className="text-md font-semibold text-gray-800 mb-3">{category}</h3>
            <div className="space-y-2">
              {categoryItems.map((item) => {
                const isChecked = checkedItems[item.id]
                const itemNote = notes[item.id]

                return (
                  <div key={item.id} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      isChecked ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {isChecked ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <span className={isChecked ? 'text-gray-700' : 'text-red-700'}>{item.label}</span>
                      {itemNote && (
                        <div className="mt-1 text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded">
                          Note: {itemNote}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* General Notes */}
      {data?.generalNotes && (
        <div className="card mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">General Notes</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{data.generalNotes}</p>
        </div>
      )}

      {/* Report Info */}
      <div className="card mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Information</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-500">Completed By</dt>
            <dd className="font-medium">{submission.submittedBy.firstName} {submission.submittedBy.lastName}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Location</dt>
            <dd className="font-medium">{submission.rink.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Date & Time</dt>
            <dd className="text-sm text-gray-700">{new Date(submission.submittedAt).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Report ID</dt>
            <dd className="font-mono text-sm text-gray-600">{submission.id.slice(0, 8)}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
