import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { SubmissionForm } from '@/components/reports'
import { FormSchema } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditIceDepthPage({ params }: PageProps) {
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
          description: true,
          moduleType: true,
          schema: true,
        },
      },
    },
  })

  if (!submission) {
    notFound()
  }

  // Verify facility match
  if (submission.facilityId !== user.facilityId) {
    notFound()
  }

  // Verify module type
  if (submission.formTemplate.moduleType !== 'ICE_DEPTH') {
    redirect('/dashboard/ice-depth')
  }

  // Only drafts can be edited
  if (submission.status !== 'DRAFT') {
    redirect(`/dashboard/ice-depth/${id}`)
  }

  // Check edit permission (owner can edit their own drafts)
  const canEdit = submission.userId === user.id || canUserAccess(user, 'iceDepth', 'edit')
  if (!canEdit) {
    redirect(`/dashboard/ice-depth/${id}`)
  }

  // Get facility rinks
  const rinks = await prisma.rink.findMany({
    where: {
      facilityId: user.facilityId,
      isActive: true,
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <SubmissionForm
      formTemplate={{
        id: submission.formTemplate.id,
        name: submission.formTemplate.name,
        description: submission.formTemplate.description,
        moduleType: submission.formTemplate.moduleType,
        schema: submission.formTemplate.schema as FormSchema,
      }}
      facilityName={user.facility.name}
      rinks={rinks}
      initialData={submission.data as Record<string, unknown>}
      initialRinkId={submission.rinkId || undefined}
      mode="edit"
      submissionId={submission.id}
    />
  )
}
