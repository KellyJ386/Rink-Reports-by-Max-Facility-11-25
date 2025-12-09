'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Flag,
  Save,
  Send,
  ChevronDown,
  ChevronRight,
  User,
  Calendar,
  MapPin,
  Eye,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Local types for this component
interface ChecklistItemTemplate {
  id: string
  label: string
  description?: string
  type: 'checkbox' | 'number' | 'text'
  required: boolean
  order: number
  validation?: { min?: number; max?: number }
}

interface ChecklistSection {
  id: string
  name: string
  description?: string
  order: number
  items: ChecklistItemTemplate[]
}

interface ChecklistTemplate {
  id: string
  name: string
  description?: string
  category: string
  sections: ChecklistSection[]
  estimatedDuration: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

interface CompletedItem {
  itemId: string
  itemLabel: string
  completed: boolean
  required: boolean
  value?: string
  notes?: string
  flagged?: boolean
  completedAt?: Date
}

interface CompletedSection {
  sectionId: string
  sectionName: string
  items: CompletedItem[]
}

interface ChecklistIssue {
  id: string
  itemId: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'resolved'
  reportedAt: Date
  reportedBy: string
}

interface ChecklistInstance {
  id: string
  templateId: string
  templateName: string
  status: 'in_progress' | 'completed'
  assignedTo?: string
  assignedToId?: string
  startedAt?: Date
  completedAt?: Date
  sections: CompletedSection[]
  issues: ChecklistIssue[]
  location?: string
  scheduledFor?: Date
}

// Mock template data
const mockTemplate: ChecklistTemplate = {
  id: 'tpl-001',
  name: 'Pre-Game Ice Inspection',
  description: 'Complete ice surface and safety inspection before games',
  category: 'ice_resurfacing',
  sections: [
    {
      id: 'sec-1',
      name: 'Ice Surface Quality',
      description: 'Inspect the ice surface for quality and safety',
      order: 1,
      items: [
        {
          id: 'item-1-1',
          label: 'Check ice thickness at center ice',
          description: 'Use depth gauge to measure. Should be 1.0-1.25 inches',
          type: 'checkbox',
          required: true,
          order: 1,
        },
        {
          id: 'item-1-2',
          label: 'Check ice thickness at corners',
          description: 'Measure all four corners. Should be within 0.1 inch of center',
          type: 'checkbox',
          required: true,
          order: 2,
        },
        {
          id: 'item-1-3',
          label: 'Ice surface temperature',
          description: 'Record temperature in Fahrenheit. Target: 22-24°F',
          type: 'number',
          required: true,
          order: 3,
          validation: { min: 18, max: 30 },
        },
        {
          id: 'item-1-4',
          label: 'Visual inspection for cracks or damage',
          type: 'checkbox',
          required: true,
          order: 4,
        },
        {
          id: 'item-1-5',
          label: 'Line visibility rating',
          description: 'Rate from 1-5 (5 = excellent)',
          type: 'number',
          required: false,
          order: 5,
          validation: { min: 1, max: 5 },
        },
      ],
    },
    {
      id: 'sec-2',
      name: 'Boards and Glass',
      description: 'Inspect all boards and protective glass',
      order: 2,
      items: [
        {
          id: 'item-2-1',
          label: 'Check all boards are secure',
          type: 'checkbox',
          required: true,
          order: 1,
        },
        {
          id: 'item-2-2',
          label: 'Inspect glass panels for cracks',
          type: 'checkbox',
          required: true,
          order: 2,
        },
        {
          id: 'item-2-3',
          label: 'Check penalty box doors',
          type: 'checkbox',
          required: true,
          order: 3,
        },
        {
          id: 'item-2-4',
          label: 'Verify player bench gates work',
          type: 'checkbox',
          required: true,
          order: 4,
        },
      ],
    },
    {
      id: 'sec-3',
      name: 'Goals and Nets',
      description: 'Inspect both goal structures',
      order: 3,
      items: [
        {
          id: 'item-3-1',
          label: 'Check goal posts are secure',
          type: 'checkbox',
          required: true,
          order: 1,
        },
        {
          id: 'item-3-2',
          label: 'Inspect nets for tears or damage',
          type: 'checkbox',
          required: true,
          order: 2,
        },
        {
          id: 'item-3-3',
          label: 'Verify goal pegs are in place',
          type: 'checkbox',
          required: true,
          order: 3,
        },
        {
          id: 'item-3-4',
          label: 'Check goal line cameras (if applicable)',
          type: 'checkbox',
          required: false,
          order: 4,
        },
      ],
    },
    {
      id: 'sec-4',
      name: 'Safety Equipment',
      description: 'Verify all safety equipment is in place',
      order: 4,
      items: [
        {
          id: 'item-4-1',
          label: 'First aid kit fully stocked',
          type: 'checkbox',
          required: true,
          order: 1,
        },
        {
          id: 'item-4-2',
          label: 'AED device checked and accessible',
          type: 'checkbox',
          required: true,
          order: 2,
        },
        {
          id: 'item-4-3',
          label: 'Emergency exits clear and marked',
          type: 'checkbox',
          required: true,
          order: 3,
        },
        {
          id: 'item-4-4',
          label: 'Fire extinguisher accessible',
          type: 'checkbox',
          required: true,
          order: 4,
        },
        {
          id: 'item-4-5',
          label: 'Notes or observations',
          type: 'text',
          required: false,
          order: 5,
        },
      ],
    },
  ],
  estimatedDuration: 30,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
  createdBy: 'admin',
}

// Initialize empty instance from template
function createInstanceFromTemplate(template: ChecklistTemplate, mode: 'new' | 'view'): ChecklistInstance {
  const baseInstance: ChecklistInstance = {
    id: `inst-${Date.now()}`,
    templateId: template.id,
    templateName: template.name,
    status: mode === 'view' ? 'completed' : 'in_progress',
    assignedTo: 'John Smith',
    assignedToId: 'user-1',
    startedAt: new Date(),
    completedAt: mode === 'view' ? new Date() : undefined,
    sections: template.sections.map((section) => ({
      sectionId: section.id,
      sectionName: section.name,
      items: section.items.map((item) => ({
        itemId: item.id,
        itemLabel: item.label,
        completed: mode === 'view',
        required: item.required,
        value: mode === 'view' && item.type === 'number' ? '23' : undefined,
        completedAt: mode === 'view' ? new Date() : undefined,
      })),
    })),
    issues: [],
    location: 'Rink A - Main Arena',
    scheduledFor: new Date(),
  }
  return baseInstance
}

// Calculate completion percentage
function calculateCompletionPercentage(instance: ChecklistInstance): number {
  let totalItems = 0
  let completedItems = 0

  for (const section of instance.sections) {
    for (const item of section.items) {
      totalItems++
      if (item.completed) {
        completedItems++
      }
    }
  }

  return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
}

export default function ChecklistCompletionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const checklistId = id

  // Determine if this is a view mode or edit mode
  const isViewMode = checklistId.startsWith('completed-') || checklistId.startsWith('view-')

  const [instance, setInstance] = useState<ChecklistInstance | null>(null)
  const [template, setTemplate] = useState<ChecklistTemplate | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [showIssueDialog, setShowIssueDialog] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [issueDescription, setIssueDescription] = useState('')
  const [issuePriority, setIssuePriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')

  useEffect(() => {
    // In production, fetch the checklist instance and template from API
    // For now, use mock data
    setTemplate(mockTemplate)
    const newInstance = createInstanceFromTemplate(mockTemplate, isViewMode ? 'view' : 'new')
    // Expand first section by default (or all in view mode)
    if (isViewMode) {
      setExpandedSections(new Set(mockTemplate.sections.map(s => s.id)))
    } else {
      setExpandedSections(new Set([mockTemplate.sections[0]?.id]))
    }
    setInstance(newInstance)
  }, [checklistId, isViewMode])

  if (!instance || !template) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading checklist...</p>
        </div>
      </div>
    )
  }

  const completionPercentage = calculateCompletionPercentage(instance)
  const totalItems = instance.sections.reduce((acc, sec) => acc + sec.items.length, 0)
  const completedItems = instance.sections.reduce(
    (acc, sec) => acc + sec.items.filter((item) => item.completed).length,
    0
  )
  const requiredItems = instance.sections.reduce(
    (acc, sec) => acc + sec.items.filter((item) => item.required).length,
    0
  )
  const completedRequiredItems = instance.sections.reduce(
    (acc, sec) => acc + sec.items.filter((item) => item.required && item.completed).length,
    0
  )

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const toggleItem = (sectionId: string, itemId: string) => {
    if (isViewMode) return
    setInstance((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        sections: prev.sections.map((section) => {
          if (section.sectionId !== sectionId) return section
          return {
            ...section,
            items: section.items.map((item) => {
              if (item.itemId !== itemId) return item
              return {
                ...item,
                completed: !item.completed,
                completedAt: !item.completed ? new Date() : undefined,
              }
            }),
          }
        }),
      }
    })
  }

  const updateItemValue = (sectionId: string, itemId: string, value: string) => {
    if (isViewMode) return
    setInstance((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        sections: prev.sections.map((section) => {
          if (section.sectionId !== sectionId) return section
          return {
            ...section,
            items: section.items.map((item) => {
              if (item.itemId !== itemId) return item
              return {
                ...item,
                value,
                completed: value.length > 0,
                completedAt: value.length > 0 ? new Date() : undefined,
              }
            }),
          }
        }),
      }
    })
  }

  const updateItemNotes = (sectionId: string, itemId: string, notes: string) => {
    if (isViewMode) return
    setInstance((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        sections: prev.sections.map((section) => {
          if (section.sectionId !== sectionId) return section
          return {
            ...section,
            items: section.items.map((item) => {
              if (item.itemId !== itemId) return item
              return { ...item, notes }
            }),
          }
        }),
      }
    })
  }

  const addIssue = () => {
    if (!selectedItemId || !issueDescription) return

    const newIssue: ChecklistIssue = {
      id: `issue-${Date.now()}`,
      itemId: selectedItemId,
      description: issueDescription,
      priority: issuePriority,
      status: 'open',
      reportedAt: new Date(),
      reportedBy: instance.assignedTo || 'Unknown',
    }

    setInstance((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        issues: [...prev.issues, newIssue],
        sections: prev.sections.map((section) => ({
          ...section,
          items: section.items.map((item) => {
            if (item.itemId !== selectedItemId) return item
            return { ...item, flagged: true }
          }),
        })),
      }
    })

    setShowIssueDialog(false)
    setSelectedItemId(null)
    setIssueDescription('')
    setIssuePriority('medium')
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API save
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
  }

  const handleSubmit = async () => {
    if (completedRequiredItems < requiredItems) {
      alert('Please complete all required items before submitting.')
      return
    }

    setIsSaving(true)
    // Simulate API submission
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setInstance((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        status: 'completed',
        completedAt: new Date(),
      }
    })
    setIsSaving(false)
    router.push('/dashboard/checklists')
  }

  const getTemplateItem = (sectionId: string, itemId: string) => {
    const section = template.sections.find((s) => s.id === sectionId)
    return section?.items.find((i) => i.id === itemId)
  }

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/checklists')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Checklists
            </Button>
            {!isViewMode && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Draft
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isSaving || completedRequiredItems < requiredItems}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Submit
                </Button>
              </div>
            )}
            {isViewMode && (
              <Badge variant="outline" className="gap-1">
                <Eye className="h-3 w-3" />
                View Only
              </Badge>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{instance.templateName}</h1>
              {isViewMode && (
                <Badge className="bg-green-100 text-green-700">Completed</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {instance.assignedTo}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {instance.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {instance.startedAt?.toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                ~{template.estimatedDuration} min
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">
                Progress: {completedItems} of {totalItems} items
              </span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            {!isViewMode && completedRequiredItems < requiredItems && (
              <p className="text-xs text-amber-600 mt-1">
                {requiredItems - completedRequiredItems} required items remaining
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Issues Summary */}
        {instance.issues.length > 0 && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                {instance.issues.length} Issue{instance.issues.length !== 1 ? 's' : ''} Flagged
              </CardTitle>
            </CardHeader>
            <CardContent className="py-0 pb-3">
              <div className="space-y-2">
                {instance.issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-center justify-between bg-white rounded p-2 text-sm"
                  >
                    <span>{issue.description}</span>
                    <Badge className={priorityColors[issue.priority]}>{issue.priority}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sections */}
        <div className="space-y-4">
          {instance.sections.map((section, sectionIndex) => {
            const templateSection = template.sections.find((s) => s.id === section.sectionId)
            const sectionCompleted = section.items.filter((i) => i.completed).length
            const sectionTotal = section.items.length
            const isExpanded = expandedSections.has(section.sectionId)
            const allComplete = sectionCompleted === sectionTotal

            return (
              <Card key={section.sectionId} className={allComplete ? 'border-green-200' : ''}>
                <CardHeader
                  className="cursor-pointer py-4"
                  onClick={() => toggleSection(section.sectionId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {section.sectionName}
                          {allComplete && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        </CardTitle>
                        {templateSection?.description && (
                          <p className="text-sm text-gray-500 mt-0.5">
                            {templateSection.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={allComplete ? 'default' : 'secondary'}>
                      {sectionCompleted}/{sectionTotal}
                    </Badge>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {section.items.map((item) => {
                        const templateItem = getTemplateItem(section.sectionId, item.itemId)
                        const itemType = templateItem?.type || 'checkbox'

                        return (
                          <div
                            key={item.itemId}
                            className={`p-3 rounded-lg border ${
                              item.completed
                                ? 'bg-green-50 border-green-200'
                                : item.flagged
                                  ? 'bg-amber-50 border-amber-200'
                                  : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {itemType === 'checkbox' && (
                                <button
                                  onClick={() => toggleItem(section.sectionId, item.itemId)}
                                  className={`mt-0.5 flex-shrink-0 ${isViewMode ? 'cursor-default' : ''}`}
                                  disabled={isViewMode}
                                >
                                  {item.completed ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-gray-400" />
                                  )}
                                </button>
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <span
                                      className={`text-sm font-medium ${
                                        item.completed ? 'text-green-700' : 'text-gray-900'
                                      }`}
                                    >
                                      {item.itemLabel}
                                      {item.required && (
                                        <span className="text-red-500 ml-1">*</span>
                                      )}
                                    </span>
                                    {templateItem?.description && (
                                      <p className="text-xs text-gray-500 mt-0.5">
                                        {templateItem.description}
                                      </p>
                                    )}
                                  </div>

                                  {!isViewMode && (
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => {
                                          setSelectedItemId(item.itemId)
                                          setShowIssueDialog(true)
                                        }}
                                      >
                                        <Flag
                                          className={`h-4 w-4 ${
                                            item.flagged ? 'text-amber-500' : 'text-gray-400'
                                          }`}
                                        />
                                      </Button>
                                    </div>
                                  )}
                                </div>

                                {/* Input fields for non-checkbox items */}
                                {itemType === 'number' && (
                                  <div className="mt-2">
                                    <Input
                                      type="number"
                                      placeholder={`Enter value${
                                        templateItem?.validation
                                          ? ` (${templateItem.validation.min}-${templateItem.validation.max})`
                                          : ''
                                      }`}
                                      value={item.value || ''}
                                      onChange={(e) =>
                                        updateItemValue(section.sectionId, item.itemId, e.target.value)
                                      }
                                      className="max-w-[200px] h-8 text-sm"
                                      min={templateItem?.validation?.min}
                                      max={templateItem?.validation?.max}
                                      readOnly={isViewMode}
                                    />
                                  </div>
                                )}

                                {itemType === 'text' && (
                                  <div className="mt-2">
                                    <Textarea
                                      placeholder="Enter notes..."
                                      value={item.value || ''}
                                      onChange={(e) =>
                                        updateItemValue(section.sectionId, item.itemId, e.target.value)
                                      }
                                      className="text-sm min-h-[60px]"
                                      readOnly={isViewMode}
                                    />
                                  </div>
                                )}

                                {/* Notes input for checkbox items */}
                                {itemType === 'checkbox' && item.completed && !isViewMode && (
                                  <div className="mt-2">
                                    <Input
                                      placeholder="Add notes (optional)"
                                      value={item.notes || ''}
                                      onChange={(e) =>
                                        updateItemNotes(section.sectionId, item.itemId, e.target.value)
                                      }
                                      className="h-8 text-sm bg-white"
                                    />
                                  </div>
                                )}

                                {/* Show notes in view mode */}
                                {isViewMode && item.notes && (
                                  <p className="text-xs text-gray-500 mt-1 italic">
                                    Note: {item.notes}
                                  </p>
                                )}

                                {/* Show completion time in view mode */}
                                {isViewMode && item.completedAt && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    Completed at {item.completedAt.toLocaleTimeString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Section navigation */}
                    {!isViewMode && (
                      <div className="flex justify-between mt-4 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={sectionIndex === 0}
                          onClick={() => {
                            const prevSection = instance.sections[sectionIndex - 1]
                            if (prevSection) {
                              setExpandedSections(new Set([prevSection.sectionId]))
                            }
                          }}
                        >
                          Previous Section
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={sectionIndex === instance.sections.length - 1}
                          onClick={() => {
                            const nextSection = instance.sections[sectionIndex + 1]
                            if (nextSection) {
                              setExpandedSections(new Set([nextSection.sectionId]))
                            }
                          }}
                        >
                          Next Section
                        </Button>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>

        {/* Submit Footer */}
        {!isViewMode && (
          <div className="mt-8 p-4 bg-white rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Ready to submit?</p>
                <p className="text-sm text-gray-500">
                  {completedRequiredItems === requiredItems
                    ? 'All required items have been completed.'
                    : `Complete ${requiredItems - completedRequiredItems} more required items to submit.`}
                </p>
              </div>
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={isSaving || completedRequiredItems < requiredItems}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Submit Checklist
              </Button>
            </div>
          </div>
        )}

        {/* View mode footer */}
        {isViewMode && instance.completedAt && (
          <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Checklist Completed</p>
                <p className="text-sm text-green-700">
                  Submitted by {instance.assignedTo} on {instance.completedAt.toLocaleDateString()} at{' '}
                  {instance.completedAt.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Issue Dialog */}
      <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag an Issue</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="issue-description">Description</Label>
              <Textarea
                id="issue-description"
                placeholder="Describe the issue..."
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="issue-priority">Priority</Label>
              <Select value={issuePriority} onValueChange={(v) => setIssuePriority(v as typeof issuePriority)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowIssueDialog(false)}>
                Cancel
              </Button>
              <Button onClick={addIssue} disabled={!issueDescription}>
                Flag Issue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
