'use client'

import { useState } from 'react'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import FormRenderer from '@/components/forms/FormRenderer'
import {
  iceMakeFormSchema,
  circleCheckFormSchema,
  edgingFormSchema,
  bladeChangeFormSchema,
} from '@/lib/sample-forms'
import type { FormData, UniversalHeaderData } from '@/types/forms'

export default function IceOperationsPage() {
  const [activeTab, setActiveTab] = useState('ice-make')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mock header data - in production this would come from the session/API
  const headerData: UniversalHeaderData = {
    userId: 'user-123',
    userName: 'John Doe',
    facilityId: 'facility-demo',
    facilityName: 'Demo Ice Arena',
    rinkId: 'rink-a',
    rinkName: 'Main Rink',
    submittedAt: new Date(),
    outsideTemp: 42,
    outsideTempUnit: 'F',
  }

  const tabs = [
    { id: 'ice-make', label: 'Ice Make', icon: '💧' },
    { id: 'circle-check', label: 'Circle Check', icon: '✓' },
    { id: 'edging', label: 'Edging', icon: '✂️' },
    { id: 'blade-change', label: 'Blade Change', icon: '🔧' },
  ]

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true)

    try {
      // In production, this would call the submissions API
      // POST /api/submissions
      console.log('Form Data:', data)
      console.log('Header Data:', headerData)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Show success message
      alert('Form submitted successfully!')

      // In production, would redirect or refresh
    } catch (error) {
      console.error('Submit error:', error)
      alert('Error submitting form. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-wolf-200 pb-4">
        <h1 className="text-3xl font-bold text-navy">Ice Operations</h1>
        <p className="text-wolf-600 mt-2">
          Track ice make, circle check, edging, and blade changes
        </p>
      </div>

      {/* Tab Navigation */}
      <Tabs tabs={tabs} value={activeTab} onValueChange={setActiveTab} />

      {/* Ice Make Tab */}
      <TabsContent value="ice-make" activeValue={activeTab}>
        <FormRenderer
          schema={iceMakeFormSchema}
          headerData={headerData}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />

        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" type="button" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting}
            onClick={() => {
              // Trigger form submission
              const form = document.querySelector('form')
              if (form) {
                form.requestSubmit()
              }
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </div>
      </TabsContent>

      {/* Circle Check Tab */}
      <TabsContent value="circle-check" activeValue={activeTab}>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-xl font-semibold text-navy mb-2">
              Circle Check
            </h2>
            <p className="text-wolf-600">
              Pre-shift inspection checklist
            </p>
            <p className="text-sm text-wolf-400 mt-4">
              Form schema coming soon
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Edging Tab */}
      <TabsContent value="edging" activeValue={activeTab}>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">✂️</div>
            <h2 className="text-xl font-semibold text-navy mb-2">
              Edging Report
            </h2>
            <p className="text-wolf-600">
              Track edging activities and blade condition
            </p>
            <p className="text-sm text-wolf-400 mt-4">
              Form schema coming soon
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Blade Change Tab */}
      <TabsContent value="blade-change" activeValue={activeTab}>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🔧</div>
            <h2 className="text-xl font-semibold text-navy mb-2">
              Blade Change Log
            </h2>
            <p className="text-wolf-600">
              Track blade changes and maintenance
            </p>
            <p className="text-sm text-wolf-400 mt-4">
              Form schema coming soon
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </div>
  )
}
