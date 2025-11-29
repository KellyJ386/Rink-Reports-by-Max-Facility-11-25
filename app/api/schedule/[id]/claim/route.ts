import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // In production:
    // 1. Check if the shift is still open
    // 2. Check if user is qualified for this shift
    // 3. Assign user to shift
    // 4. Create notification for admin
    // 5. Update shift status

    const entry = {
      id,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      isOpenShift: false,
      status: 'FILLED',
      claimedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      entry,
      message: 'Shift claimed successfully',
    })
  } catch (error) {
    console.error('Error claiming shift:', error)
    return NextResponse.json(
      { error: 'Failed to claim shift' },
      { status: 500 }
    )
  }
}
