import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { SubmissionView } from '@/components/reports'
import { FormSchema, SubmissionStatus } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ViewAirQualityPage({ params }: PageProps) {
  const { id } = await params
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      formTemplate: {
        select: {
          id: true,
          name: true,
          moduleType: true,
          schema: true,
        },
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      rink: {
        select: {
          id: true,
          name: true,
        },
      },
      reviewer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  if (!submission) {
    notFound()
  }

  if (submission.facilityId !== user.facilityId) {
    notFound()
  }

  if (submission.formTemplate.moduleType !== 'AIR_QUALITY') {
    redirect('/dashboard/air-quality')
  }

  const canViewAll = canUserAccess(user, 'airQuality', 'viewAll')
  const canViewOwn = canUserAccess(user, 'airQuality', 'viewOwn')

  if (!canViewAll && (!canViewOwn || submission.userId !== user.id)) {
    redirect('/dashboard/air-quality')
  }

  const canApprove = canUserAccess(user, 'airQuality', 'approve')
  const canEdit = submission.userId === user.id && submission.status === 'DRAFT'
  const canDelete = submission.userId === user.id && submission.status === 'DRAFT' ||
    canUserAccess(user, 'airQuality', 'delete')

  return (
    <SubmissionView
      submission={{
        id: submission.id,
        status: submission.status as SubmissionStatus,
        data: submission.data as Record<string, unknown>,
        createdAt: submission.createdAt.toISOString(),
        submittedAt: submission.submittedAt?.toISOString() || null,
        reviewedAt: submission.reviewedAt?.toISOString() || null,
        reviewNotes: submission.reviewNotes,
        formTemplate: {
          id: submission.formTemplate.id,
          name: submission.formTemplate.name,
          moduleType: submission.formTemplate.moduleType,
          schema: submission.formTemplate.schema as FormSchema,
        },
        user: submission.user,
        rink: submission.rink,
        reviewer: submission.reviewer,
      }}
      facilityName={user.facility.name}
      canApprove={canApprove}
      canEdit={canEdit}
      canDelete={canDelete}
      baseUrl="/dashboard/air-quality"
    />
  )
}
