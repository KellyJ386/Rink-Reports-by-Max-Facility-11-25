'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Rink {
  id: string
  name: string
}

const CHECKLIST_TEMPLATES = {
  opening: {
    label: 'Opening Checklist',
    icon: '🌅',
    items: [
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
  },
  closing: {
    label: 'Closing Checklist',
    icon: '🌙',
    items: [
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
  },
  safety: {
    label: 'Safety Inspection',
    icon: '🛡️',
    items: [
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
  },
  equipment: {
    label: 'Equipment Check',
    icon: '🔧',
    items: [
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
  },
  maintenance: {
    label: 'Maintenance Check',
    icon: '🔨',
    items: [
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
  },
}

export default function NewChecklistPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialType = searchParams.get('type') || ''

  const [rinks, setRinks] = useState<Rink[]>([])
  const [formTemplateId, setFormTemplateId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    rinkId: '',
    checklistType: initialType,
    checkedItems: {} as Record<string, boolean>,
    notes: {} as Record<string, string>,
    generalNotes: '',
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const [rinksRes, formsRes] = await Promise.all([
        fetch('/api/rinks'),
        fetch('/api/forms?moduleType=DAILY_CHECKLIST'),
      ])

      if (rinksRes.ok) {
        const rinksData = await rinksRes.json()
        setRinks(rinksData.rinks)
        if (rinksData.rinks.length === 1) {
          setFormData((prev) => ({ ...prev, rinkId: rinksData.rinks[0].id }))
        }
      } else {
        setError('Failed to load rinks')
      }

      if (formsRes.ok) {
        const formsData = await formsRes.json()
        if (formsData.forms && formsData.forms.length > 0) {
          setFormTemplateId(formsData.forms[0].id)
        }
      }
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const template = CHECKLIST_TEMPLATES[formData.checklistType as keyof typeof CHECKLIST_TEMPLATES]

  const toggleItem = (itemId: string) => {
    setFormData((prev) => ({
      ...prev,
      checkedItems: {
        ...prev.checkedItems,
        [itemId]: !prev.checkedItems[itemId],
      },
    }))
  }

  const setItemNote = (itemId: string, note: string) => {
    setFormData((prev) => ({
      ...prev,
      notes: {
        ...prev.notes,
        [itemId]: note,
      },
    }))
  }

  const checkedCount = template ? Object.values(formData.checkedItems).filter(Boolean).length : 0
  const totalCount = template?.items.length || 0
  const completionPercentage = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.rinkId) {
      setError('Please select a rink')
      return
    }

    if (!formData.checklistType) {
      setError('Please select a checklist type')
      return
    }

    if (!formTemplateId) {
      setError('No form template configured for checklists. Please contact an administrator.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formTemplateId,
          rinkId: formData.rinkId,
          data: {
            checklistType: formData.checklistType,
            checkedItems: formData.checkedItems,
            notes: formData.notes,
            generalNotes: formData.generalNotes,
            completedItems: checkedCount,
            totalItems: totalCount,
            completionPercentage,
            allItemsChecked: checkedCount === totalCount,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit')
      }

      router.push('/dashboard/checklists')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  // Group items by category
  const itemsByCategory = template?.items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, typeof template.items>)

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/checklists" className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Checklist</h1>
          <p className="text-gray-600 text-sm mt-1">Complete a daily checklist</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Setup */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Setup</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rink <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.rinkId}
                onChange={(e) => setFormData({ ...formData, rinkId: e.target.value })}
                className="input"
                required
              >
                <option value="">Select rink...</option>
                {rinks.map((rink) => (
                  <option key={rink.id} value={rink.id}>{rink.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Checklist Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.checklistType}
                onChange={(e) => setFormData({ ...formData, checklistType: e.target.value, checkedItems: {}, notes: {} })}
                className="input"
                required
              >
                <option value="">Select type...</option>
                {Object.entries(CHECKLIST_TEMPLATES).map(([key, tmpl]) => (
                  <option key={key} value={key}>{tmpl.icon} {tmpl.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {template && (
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-500">{checkedCount} / {totalCount} items</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  completionPercentage === 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Checklist Items */}
        {template && itemsByCategory && (
          <div className="space-y-4">
            {Object.entries(itemsByCategory).map(([category, items]) => (
              <div key={category} className="card">
                <h3 className="text-md font-semibold text-gray-800 mb-3">{category}</h3>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.checkedItems[item.id] || false}
                          onChange={() => toggleItem(item.id)}
                          className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600"
                        />
                        <span className={`flex-1 ${formData.checkedItems[item.id] ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                          {item.label}
                        </span>
                      </label>
                      {formData.checkedItems[item.id] === false && (
                        <div className="ml-8 mt-2">
                          <input
                            type="text"
                            value={formData.notes[item.id] || ''}
                            onChange={(e) => setItemNote(item.id, e.target.value)}
                            className="input text-sm"
                            placeholder="Note why this item wasn't completed..."
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* General Notes */}
        {template && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">General Notes</h2>
            <textarea
              value={formData.generalNotes}
              onChange={(e) => setFormData({ ...formData, generalNotes: e.target.value })}
              className="input"
              rows={3}
              placeholder="Any additional observations or issues to report..."
            />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/checklists" className="btn btn-secondary">Cancel</Link>
          <button
            type="submit"
            disabled={submitting || !template}
            className="btn btn-primary"
          >
            {submitting ? 'Submitting...' : 'Submit Checklist'}
          </button>
        </div>
      </form>
    </div>
  )
}
