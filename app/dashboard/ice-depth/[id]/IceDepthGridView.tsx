'use client'

import IceDepthGrid from '@/components/ice-depth/IceDepthGrid'

interface MeasurementPoint {
  id: string
  x: number
  y: number
  label: string
  value?: number
}

interface IceDepthGridViewProps {
  measurements: MeasurementPoint[]
}

export default function IceDepthGridView({ measurements }: IceDepthGridViewProps) {
  return (
    <IceDepthGrid
      points={measurements}
      onPointUpdate={() => {}} // No-op for read-only view
      readOnly
      unit="in"
    />
  )
}
