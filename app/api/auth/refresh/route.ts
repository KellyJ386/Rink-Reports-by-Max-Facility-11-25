import { NextResponse } from 'next/server'
import { refreshAccessToken } from '@/lib/auth'

export async function POST() {
  try {
    const newAccessToken = await refreshAccessToken()

    if (!newAccessToken) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Access token refreshed successfully',
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'An error occurred during token refresh' },
      { status: 500 }
    )
  }
}
