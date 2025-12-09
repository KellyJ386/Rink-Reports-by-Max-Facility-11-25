import { NextRequest, NextResponse } from 'next/server'
import { UserInvitation } from '@/types/admin'

// In-memory storage for demo
const invitations = new Map<string, UserInvitation>()

// Initialize with mock data
const initMockData = () => {
  if (invitations.size === 0) {
    const mockInvitations: UserInvitation[] = [
      {
        id: 'invite-1',
        email: 'newtech@icerink.com',
        roleId: 'role-4',
        facilityId: 'facility-1',
        invitedBy: 'user-2',
        invitedAt: '2024-01-20T10:00:00Z',
        expiresAt: '2024-01-27T10:00:00Z',
        status: 'PENDING',
        token: 'token-abc123',
      },
      {
        id: 'invite-2',
        email: 'frontdesk@icerink.com',
        roleId: 'role-5',
        facilityId: 'facility-1',
        invitedBy: 'user-2',
        invitedAt: '2024-01-22T14:30:00Z',
        expiresAt: '2024-01-29T14:30:00Z',
        status: 'PENDING',
        token: 'token-def456',
      },
      {
        id: 'invite-3',
        email: 'supervisor@icerink.com',
        roleId: 'role-3',
        facilityId: 'facility-1',
        invitedBy: 'user-1',
        invitedAt: '2024-01-15T09:00:00Z',
        expiresAt: '2024-01-22T09:00:00Z',
        status: 'EXPIRED',
        token: 'token-ghi789',
      },
    ]

    mockInvitations.forEach((inv) => invitations.set(inv.id, inv))
  }
}

initMockData()

// GET /api/admin/users/invitations - List all invitations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as UserInvitation['status'] | null
    const facilityId = searchParams.get('facilityId')

    let invitationsList = Array.from(invitations.values())

    // Auto-expire old invitations
    const now = new Date()
    invitationsList.forEach((inv) => {
      if (inv.status === 'PENDING' && new Date(inv.expiresAt) < now) {
        const updated = { ...inv, status: 'EXPIRED' as const }
        invitations.set(inv.id, updated)
      }
    })

    // Refresh list after expiration updates
    invitationsList = Array.from(invitations.values())

    // Apply filters
    if (status) {
      invitationsList = invitationsList.filter((i) => i.status === status)
    }
    if (facilityId) {
      invitationsList = invitationsList.filter((i) => i.facilityId === facilityId)
    }

    // Sort by invited date (newest first)
    invitationsList.sort(
      (a, b) => new Date(b.invitedAt).getTime() - new Date(a.invitedAt).getTime()
    )

    return NextResponse.json({
      invitations: invitationsList,
      total: invitationsList.length,
      pending: invitationsList.filter((i) => i.status === 'PENDING').length,
    })
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}

// POST /api/admin/users/invitations - Create new invitation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      roleId,
      facilityId,
      invitedBy,
      expiresInDays = 7,
      personalMessage,
    } = body

    // Validate required fields
    if (!email || !roleId || !invitedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: email, roleId, invitedBy' },
        { status: 400 }
      )
    }

    // Check for existing pending invitation
    const existingInvitation = Array.from(invitations.values()).find(
      (i) =>
        i.email.toLowerCase() === email.toLowerCase() && i.status === 'PENDING'
    )
    if (existingInvitation) {
      return NextResponse.json(
        { error: 'A pending invitation already exists for this email' },
        { status: 400 }
      )
    }

    const now = new Date()
    const newInvitation: UserInvitation = {
      id: `invite-${Date.now()}`,
      email,
      roleId,
      facilityId,
      invitedBy,
      invitedAt: now.toISOString(),
      expiresAt: new Date(
        now.getTime() + expiresInDays * 24 * 60 * 60 * 1000
      ).toISOString(),
      status: 'PENDING',
      token: `token-${Math.random().toString(36).substring(2, 15)}`,
      personalMessage,
    }

    invitations.set(newInvitation.id, newInvitation)

    // In production, send invitation email here
    console.log(`Invitation email would be sent to ${email}`)

    return NextResponse.json(newInvitation, { status: 201 })
  } catch (error) {
    console.error('Error creating invitation:', error)
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/users/invitations - Update invitation (resend, cancel)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action } = body

    if (!id || !action) {
      return NextResponse.json(
        { error: 'id and action are required' },
        { status: 400 }
      )
    }

    const invitation = invitations.get(id)
    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    let updatedInvitation = { ...invitation }

    switch (action) {
      case 'resend':
        // Extend expiration and generate new token
        const now = new Date()
        updatedInvitation = {
          ...invitation,
          expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          token: `token-${Math.random().toString(36).substring(2, 15)}`,
          status: 'PENDING',
        }
        console.log(`Resending invitation to ${invitation.email}`)
        break

      case 'cancel':
        updatedInvitation = {
          ...invitation,
          status: 'CANCELLED',
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "resend" or "cancel"' },
          { status: 400 }
        )
    }

    invitations.set(id, updatedInvitation)

    return NextResponse.json(updatedInvitation)
  } catch (error) {
    console.error('Error updating invitation:', error)
    return NextResponse.json(
      { error: 'Failed to update invitation' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/invitations - Delete invitation
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      )
    }

    if (!invitations.has(id)) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    invitations.delete(id)

    return NextResponse.json({ success: true, deleted: id })
  } catch (error) {
    console.error('Error deleting invitation:', error)
    return NextResponse.json(
      { error: 'Failed to delete invitation' },
      { status: 500 }
    )
  }
}
