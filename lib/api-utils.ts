import { NextResponse } from 'next/server'
import { ZodError, ZodSchema } from 'zod'
import { getSession } from './auth'
import { canUserAccess, requirePermission } from './permissions'
import type { UserWithRole, ModuleType, ModulePermissions } from '@/types'

// Standard API response types
export interface ApiSuccessResponse<T> {
  success: true
  data: T
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

// Error codes
export const ErrorCodes = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Rate limiting
  RATE_LIMITED: 'RATE_LIMITED',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

// HTTP status code mapping
const errorStatusCodes: Record<ErrorCode, number> = {
  [ErrorCodes.UNAUTHORIZED]: 401,
  [ErrorCodes.FORBIDDEN]: 403,
  [ErrorCodes.SESSION_EXPIRED]: 401,
  [ErrorCodes.VALIDATION_ERROR]: 400,
  [ErrorCodes.INVALID_INPUT]: 400,
  [ErrorCodes.NOT_FOUND]: 404,
  [ErrorCodes.ALREADY_EXISTS]: 409,
  [ErrorCodes.CONFLICT]: 409,
  [ErrorCodes.INTERNAL_ERROR]: 500,
  [ErrorCodes.DATABASE_ERROR]: 500,
  [ErrorCodes.SERVICE_UNAVAILABLE]: 503,
  [ErrorCodes.RATE_LIMITED]: 429,
}

// Success response helper
export function successResponse<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data }, { status })
}

// Error response helper
export function errorResponse(
  code: ErrorCode,
  message: string,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const status = errorStatusCodes[code] || 500
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status }
  )
}

// Validation helper
export function validateBody<T>(schema: ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body)
  if (!result.success) {
    throw new ValidationError(result.error)
  }
  return result.data
}

// Custom error classes
export class ValidationError extends Error {
  public zodError: ZodError

  constructor(zodError: ZodError) {
    const messages = zodError.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
    super(`Validation failed: ${messages.join(', ')}`)
    this.name = 'ValidationError'
    this.zodError = zodError
  }
}

export class ApiError extends Error {
  public code: ErrorCode
  public details?: unknown

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details
  }
}

// Error handler for API routes
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  console.error('API Error:', error)

  if (error instanceof ValidationError) {
    return errorResponse(
      ErrorCodes.VALIDATION_ERROR,
      error.message,
      error.zodError.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
    )
  }

  if (error instanceof ApiError) {
    return errorResponse(error.code, error.message, error.details)
  }

  if (error instanceof Error) {
    if (error.message === 'Unauthorized') {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }
    if (error.message.startsWith('Insufficient permissions')) {
      return errorResponse(ErrorCodes.FORBIDDEN, error.message)
    }
  }

  return errorResponse(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred')
}

// Auth middleware wrapper
export async function withAuth<T>(
  handler: (user: UserWithRole) => Promise<NextResponse<T>>
): Promise<NextResponse<T | ApiErrorResponse>> {
  const user = await getSession()
  if (!user) {
    return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
  }
  return handler(user)
}

// Auth + permission middleware wrapper
export async function withPermission<T>(
  module: ModuleType,
  action: keyof ModulePermissions,
  handler: (user: UserWithRole) => Promise<NextResponse<T>>
): Promise<NextResponse<T | ApiErrorResponse>> {
  const user = await getSession()
  if (!user) {
    return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
  }

  if (!canUserAccess(user, module, action)) {
    return errorResponse(
      ErrorCodes.FORBIDDEN,
      `You don't have permission to ${action} in ${module}`
    )
  }

  return handler(user)
}

// Pagination helpers
export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export function parsePagination(
  searchParams: URLSearchParams,
  defaultLimit = 20,
  maxLimit = 100
): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(searchParams.get('limit') || String(defaultLimit), 10))
  )
  const offset = (page - 1) * limit

  return { page, limit, offset }
}

export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / params.limit)

  return {
    items,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  }
}

// Parse and validate query parameters
export function parseQueryParams(
  searchParams: URLSearchParams,
  allowedParams: string[]
): Record<string, string | undefined> {
  const params: Record<string, string | undefined> = {}

  for (const param of allowedParams) {
    const value = searchParams.get(param)
    if (value !== null) {
      params[param] = value
    }
  }

  return params
}

// Sort parameter parsing
export interface SortParams {
  field: string
  direction: 'asc' | 'desc'
}

export function parseSortParams(
  searchParams: URLSearchParams,
  allowedFields: string[],
  defaultField: string,
  defaultDirection: 'asc' | 'desc' = 'desc'
): SortParams {
  const sortBy = searchParams.get('sortBy') || defaultField
  const sortDir = (searchParams.get('sortDir') || defaultDirection) as 'asc' | 'desc'

  // Validate sort field
  const field = allowedFields.includes(sortBy) ? sortBy : defaultField
  const direction = ['asc', 'desc'].includes(sortDir) ? sortDir : defaultDirection

  return { field, direction }
}

// Date range parsing
export interface DateRange {
  from?: Date
  to?: Date
}

export function parseDateRange(searchParams: URLSearchParams): DateRange {
  const fromStr = searchParams.get('from')
  const toStr = searchParams.get('to')

  const range: DateRange = {}

  if (fromStr) {
    const from = new Date(fromStr)
    if (!isNaN(from.getTime())) {
      range.from = from
    }
  }

  if (toStr) {
    const to = new Date(toStr)
    if (!isNaN(to.getTime())) {
      range.to = to
    }
  }

  return range
}

// Request body parsing helper
export async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    return await request.json()
  } catch (error) {
    throw new ApiError(ErrorCodes.INVALID_INPUT, 'Invalid JSON body')
  }
}

// Common filters for Prisma queries
export function buildWhereClause(filters: Record<string, unknown>): Record<string, unknown> {
  const where: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      where[key] = value
    }
  }

  return where
}
