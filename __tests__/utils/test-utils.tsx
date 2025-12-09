import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
}

function AllTheProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllTheProviders, ...options }),
  }
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { customRender as render }
export { userEvent }

// Helper to wait for async operations
export function waitForLoadingToFinish() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

// Mock fetch response helper
export function mockFetchResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response)
}

// Mock fetch error helper
export function mockFetchError(message: string) {
  return Promise.reject(new Error(message))
}

// Create mock request helper for API routes
export function createMockRequest(
  method: string,
  body?: unknown,
  headers?: Record<string, string>
): Request {
  const url = 'http://localhost:3000/api/test'
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  if (body) {
    init.body = JSON.stringify(body)
  }

  return new Request(url, init)
}

// Create mock NextResponse helper
export function createMockNextRequest(
  method: string,
  url: string,
  body?: unknown,
  cookies?: Record<string, string>
): Request {
  const fullUrl = `http://localhost:3000${url}`
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  }

  if (body) {
    init.body = JSON.stringify(body)
  }

  const request = new Request(fullUrl, init)

  // Mock cookies
  if (cookies) {
    Object.defineProperty(request, 'cookies', {
      value: {
        get: (name: string) => cookies[name] ? { value: cookies[name] } : undefined,
      },
    })
  }

  return request
}

// Assert response helper
export async function assertJsonResponse(
  response: Response,
  expectedStatus: number,
  expectedData?: unknown
) {
  expect(response.status).toBe(expectedStatus)

  if (expectedData) {
    const data = await response.json()
    expect(data).toEqual(expectedData)
  }
}

// Date helpers for testing
export function createTestDate(daysAgo = 0): Date {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date
}

// Form submission helper
export async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  fields: Record<string, string>
) {
  for (const [name, value] of Object.entries(fields)) {
    const input = document.querySelector(`[name="${name}"]`) as HTMLInputElement
    if (input) {
      await user.clear(input)
      await user.type(input, value)
    }
  }
}

// Local storage mock
export const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

// IndexedDB mock
export function mockIndexedDB() {
  const stores: Record<string, Map<string, unknown>> = {}

  return {
    open: jest.fn().mockResolvedValue({
      transaction: jest.fn().mockReturnValue({
        objectStore: jest.fn().mockReturnValue({
          get: jest.fn(),
          put: jest.fn(),
          delete: jest.fn(),
          getAll: jest.fn(),
        }),
      }),
    }),
    stores,
  }
}
