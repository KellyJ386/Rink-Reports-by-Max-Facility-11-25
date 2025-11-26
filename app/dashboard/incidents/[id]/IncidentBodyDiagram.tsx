'use client'

import { useState } from 'react'
import BodyDiagram from '@/components/incidents/BodyDiagram'

interface InjuryMarker {
  id: string
  x: number
  y: number
  label: string
  description?: string
}

interface IncidentBodyDiagramProps {
  markers: InjuryMarker[]
}

export default function IncidentBodyDiagram({ markers }: IncidentBodyDiagramProps) {
  const [view, setView] = useState<'front' | 'back'>('front')

  return (
    <BodyDiagram
      markers={markers}
      view={view}
      onViewChange={setView}
      readOnly
    />
  )
}
