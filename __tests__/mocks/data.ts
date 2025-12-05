// Test data factories

export function createMockUser(overrides = {}) {
  return {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    password: '$2a$10$hashedpassword',
    roleId: 'role-1',
    rinkId: 'rink-1',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    role: {
      id: 'role-1',
      name: 'Operator',
      permissions: ['ice_resurfacing:read', 'ice_resurfacing:write'],
    },
    rink: {
      id: 'rink-1',
      name: 'Main Arena',
      location: '123 Ice St',
    },
    ...overrides,
  }
}

export function createMockRink(overrides = {}) {
  return {
    id: 'rink-1',
    name: 'Main Arena',
    location: '123 Ice St',
    timezone: 'America/New_York',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }
}

export function createMockRole(overrides = {}) {
  return {
    id: 'role-1',
    name: 'Operator',
    description: 'Standard operator role',
    permissions: [
      'ice_resurfacing:read',
      'ice_resurfacing:write',
      'refrigeration:read',
      'air_quality:read',
    ],
    isSystem: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }
}

export function createMockIceResurfacing(overrides = {}) {
  return {
    id: 'resurfacing-1',
    rinkId: 'rink-1',
    userId: 'user-1',
    timestamp: new Date('2024-01-15T10:00:00'),
    machineId: 'zamboni-1',
    waterTemp: 140,
    bladeCondition: 'good',
    iceThickness: 1.25,
    notes: 'Regular maintenance',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    user: createMockUser(),
    rink: createMockRink(),
    ...overrides,
  }
}

export function createMockRefrigerationLog(overrides = {}) {
  return {
    id: 'refrig-1',
    rinkId: 'rink-1',
    userId: 'user-1',
    timestamp: new Date('2024-01-15T10:00:00'),
    compressorPressure: 150,
    condenserTemp: 85,
    evaporatorTemp: 20,
    brineTemp: 18,
    oilLevel: 'normal',
    refrigerantLevel: 'normal',
    notes: 'All systems normal',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    user: createMockUser(),
    rink: createMockRink(),
    ...overrides,
  }
}

export function createMockAirQualityReading(overrides = {}) {
  return {
    id: 'airquality-1',
    rinkId: 'rink-1',
    userId: 'user-1',
    timestamp: new Date('2024-01-15T10:00:00'),
    co2Level: 450,
    coLevel: 2,
    no2Level: 0.02,
    humidity: 55,
    temperature: 50,
    location: 'main-rink',
    notes: 'Normal readings',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    user: createMockUser(),
    rink: createMockRink(),
    ...overrides,
  }
}

export function createMockIncident(overrides = {}) {
  return {
    id: 'incident-1',
    rinkId: 'rink-1',
    userId: 'user-1',
    timestamp: new Date('2024-01-15T14:30:00'),
    type: 'injury',
    severity: 'minor',
    description: 'Skater fell during public session',
    location: 'main-rink',
    witnesses: 'John Doe',
    actionsTaken: 'First aid provided',
    followUpRequired: false,
    status: 'resolved',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    user: createMockUser(),
    rink: createMockRink(),
    ...overrides,
  }
}

export function createMockNotification(overrides = {}) {
  return {
    id: 'notif-1',
    userId: 'user-1',
    type: 'air_quality_alert',
    title: 'Air Quality Warning',
    message: 'CO levels above threshold',
    priority: 'high',
    isRead: false,
    metadata: { coLevel: 30, threshold: 25 },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    ...overrides,
  }
}

export function createMockFormTemplate(overrides = {}) {
  return {
    id: 'template-1',
    name: 'Custom Inspection',
    description: 'Custom inspection form',
    moduleType: 'custom',
    fields: [
      {
        id: 'field-1',
        type: 'text',
        label: 'Inspector Name',
        required: true,
      },
      {
        id: 'field-2',
        type: 'number',
        label: 'Temperature',
        required: true,
      },
    ],
    isActive: true,
    version: 1,
    createdBy: 'user-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }
}

export function createMockFormSubmission(overrides = {}) {
  return {
    id: 'submission-1',
    templateId: 'template-1',
    userId: 'user-1',
    rinkId: 'rink-1',
    data: {
      'field-1': 'John Smith',
      'field-2': 65,
    },
    status: 'submitted',
    submittedAt: new Date('2024-01-15'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    template: createMockFormTemplate(),
    user: createMockUser(),
    rink: createMockRink(),
    ...overrides,
  }
}

// JWT Token for testing
export const mockAuthToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiT3BlcmF0b3IiLCJwZXJtaXNzaW9ucyI6WyJpY2VfcmVzdXJmYWNpbmc6cmVhZCIsImljZV9yZXN1cmZhY2luZzp3cml0ZSJdLCJpYXQiOjE3MDQwNjcyMDAsImV4cCI6MTcwNDE1MzYwMH0.test'
