import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { SubmissionForm } from '@/components/reports'
import { FormSchema } from '@/types'

export default async function NewRefrigerationPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  const canSubmit = canUserAccess(user, 'refrigeration', 'submit')
  if (!canSubmit) {
    redirect('/dashboard/refrigeration')
  }

  const formTemplate = await prisma.formTemplate.findFirst({
    where: {
      facilityId: user.facilityId,
      moduleType: 'REFRIGERATION',
      isActive: true,
    },
    orderBy: { version: 'desc' },
  })

  if (!formTemplate) {
    return (
      <div className="card p-12 text-center">
        <div className="text-4xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-gray-900">No Form Template Available</h3>
        <p className="text-gray-600 mt-2">
          A Refrigeration form template needs to be created before you can submit reports.
          Please contact your administrator.
        </p>
      </div>
    )
  }

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
        id: formTemplate.id,
        name: formTemplate.name,
        description: formTemplate.description,
        moduleType: formTemplate.moduleType,
        schema: formTemplate.schema as FormSchema,
      }}
      facilityName={user.facility.name}
      rinks={rinks}
    />
  )
}
