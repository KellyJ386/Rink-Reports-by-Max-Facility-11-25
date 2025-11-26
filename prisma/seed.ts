import { PrismaClient, ModuleType } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create default system roles
  console.log('Creating default roles...')

  const generalManagerRole = await prisma.role.upsert({
    where: { id: 'role-general-manager' },
    update: {},
    create: {
      id: 'role-general-manager',
      name: 'General Manager',
      description: 'Full system access with all permissions',
      isSystemDefault: true,
      permissions: {
        admin: {
          access: true,
          editForms: true,
          editUsers: true,
          editSettings: true,
        },
        iceDepth: {
          access: true,
          submit: true,
          viewAll: true,
          viewOwn: true,
          edit: true,
          delete: true,
          export: true,
          approve: true,
        },
        iceOperations: {
          access: true,
          submit: true,
          viewAll: true,
          viewOwn: true,
          edit: true,
          delete: true,
          export: true,
        },
        refrigeration: {
          access: true,
          submit: true,
          viewAll: true,
          viewOwn: true,
          edit: true,
          delete: true,
          export: true,
        },
        airQuality: {
          access: true,
          submit: true,
          viewAll: true,
          viewOwn: true,
          edit: true,
          delete: true,
          export: true,
        },
        incidents: {
          access: true,
          submit: true,
          viewAll: true,
          viewOwn: true,
          edit: true,
          delete: true,
          export: true,
          approve: true,
        },
        schedule: {
          access: true,
          viewOwn: true,
          viewAll: true,
          create: true,
          publish: true,
        },
        dailyChecklist: {
          access: true,
          submit: true,
          viewAll: true,
          export: true,
          createTemplates: true,
        },
      },
    },
  })

  const facilityManagerRole = await prisma.role.upsert({
    where: { id: 'role-facility-manager' },
    update: {},
    create: {
      id: 'role-facility-manager',
      name: 'Facility Manager',
      description: 'Full operational access, limited admin settings',
      isSystemDefault: true,
      permissions: {
        admin: {
          access: true,
          editForms: false,
          editUsers: false,
          editSettings: false,
        },
        iceDepth: {
          access: true,
          submit: true,
          viewAll: true,
          export: true,
        },
        iceOperations: {
          access: true,
          submit: true,
          viewAll: true,
          export: true,
        },
        refrigeration: {
          access: true,
          submit: true,
          viewAll: true,
          export: true,
        },
        airQuality: {
          access: true,
          submit: true,
          viewAll: true,
          export: true,
        },
        incidents: {
          access: true,
          submit: true,
          viewAll: true,
          export: true,
          approve: false,
        },
        schedule: {
          access: true,
          viewOwn: true,
          viewAll: true,
          create: true,
          publish: false,
        },
        dailyChecklist: {
          access: true,
          submit: true,
          viewAll: true,
          export: true,
          createTemplates: true,
        },
      },
    },
  })

  const supervisorRole = await prisma.role.upsert({
    where: { id: 'role-supervisor' },
    update: {},
    create: {
      id: 'role-supervisor',
      name: 'Supervisor',
      description: 'Can submit and view reports, no admin access',
      isSystemDefault: true,
      permissions: {
        admin: {
          access: false,
          editForms: false,
          editUsers: false,
          editSettings: false,
        },
        iceDepth: {
          access: true,
          submit: true,
          viewAll: true,
          export: false,
        },
        iceOperations: {
          access: true,
          submit: true,
          viewAll: true,
          export: false,
        },
        refrigeration: {
          access: true,
          submit: true,
          viewAll: true,
          export: false,
        },
        airQuality: {
          access: true,
          submit: true,
          viewAll: true,
          export: false,
        },
        incidents: {
          access: true,
          submit: true,
          viewAll: true,
          export: false,
          approve: false,
        },
        schedule: {
          access: true,
          viewOwn: true,
          viewAll: true,
          create: false,
          publish: false,
        },
        dailyChecklist: {
          access: true,
          submit: true,
          viewAll: false,
          export: false,
          createTemplates: false,
        },
      },
    },
  })

  const operatorRole = await prisma.role.upsert({
    where: { id: 'role-operator' },
    update: {},
    create: {
      id: 'role-operator',
      name: 'Operator',
      description: 'Can submit reports and view own schedule',
      isSystemDefault: true,
      permissions: {
        admin: {
          access: false,
          editForms: false,
          editUsers: false,
          editSettings: false,
        },
        iceDepth: {
          access: true,
          submit: true,
          viewAll: false,
          export: false,
        },
        iceOperations: {
          access: true,
          submit: true,
          viewAll: false,
          export: false,
        },
        refrigeration: {
          access: true,
          submit: true,
          viewAll: false,
          export: false,
        },
        airQuality: {
          access: true,
          submit: true,
          viewAll: false,
          export: false,
        },
        incidents: {
          access: true,
          submit: true,
          viewAll: false,
          export: false,
          approve: false,
        },
        schedule: {
          access: true,
          viewOwn: true,
          viewAll: false,
          create: false,
          publish: false,
        },
        dailyChecklist: {
          access: true,
          submit: true,
          viewAll: false,
          export: false,
          createTemplates: false,
        },
      },
    },
  })

  // Create a demo facility
  console.log('Creating demo facility...')

  const facility = await prisma.facility.upsert({
    where: { id: 'facility-demo' },
    update: {},
    create: {
      id: 'facility-demo',
      name: 'Demo Ice Arena',
      address: '123 Hockey Lane',
      city: 'Minneapolis',
      state: 'MN',
      zipCode: '55401',
      country: 'US',
      timezone: 'America/Chicago',
    },
  })

  // Create facility settings
  await prisma.facilitySettings.upsert({
    where: { facilityId: facility.id },
    update: {},
    create: {
      facilityId: facility.id,
      iceDepthRetention: 1095,
      iceOpsRetention: 1095,
      refrigerationRetention: 1095,
      airQualityRetention: 1095,
      incidentRetention: 2555,
      scheduleRetention: 1095,
      checklistRetention: 1095,
      coWarningPpm: 20,
      coEvacuationPpm: 83,
      no2WarningPpm: 0.3,
      no2EvacuationPpm: 2.0,
      enableAirQualityAlerts: true,
      smsEnabled: false,
    },
  })

  // Create demo rinks
  console.log('Creating demo rinks...')

  const rinkA = await prisma.rink.upsert({
    where: { id: 'rink-a' },
    update: {},
    create: {
      id: 'rink-a',
      facilityId: facility.id,
      name: 'Main Rink',
      dimensions: '200x85',
      surfaceType: 'ice',
      isActive: true,
    },
  })

  const rinkB = await prisma.rink.upsert({
    where: { id: 'rink-b' },
    update: {},
    create: {
      id: 'rink-b',
      facilityId: facility.id,
      name: 'Studio Rink',
      dimensions: '85x50',
      surfaceType: 'ice',
      isActive: true,
    },
  })

  // Create demo users
  console.log('Creating demo users...')

  const passwordHash = await hashPassword('password123')

  await prisma.user.upsert({
    where: { email: 'gm@demo.com' },
    update: {},
    create: {
      email: 'gm@demo.com',
      passwordHash,
      firstName: 'John',
      lastName: 'Manager',
      phone: '+15555551000',
      facilityId: facility.id,
      roleId: generalManagerRole.id,
      isActive: true,
    },
  })

  await prisma.user.upsert({
    where: { email: 'manager@demo.com' },
    update: {},
    create: {
      email: 'manager@demo.com',
      passwordHash,
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+15555551001',
      facilityId: facility.id,
      roleId: facilityManagerRole.id,
      isActive: true,
    },
  })

  await prisma.user.upsert({
    where: { email: 'supervisor@demo.com' },
    update: {},
    create: {
      email: 'supervisor@demo.com',
      passwordHash,
      firstName: 'Mike',
      lastName: 'Johnson',
      phone: '+15555551002',
      facilityId: facility.id,
      roleId: supervisorRole.id,
      isActive: true,
    },
  })

  await prisma.user.upsert({
    where: { email: 'operator@demo.com' },
    update: {},
    create: {
      email: 'operator@demo.com',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Wilson',
      phone: '+15555551003',
      facilityId: facility.id,
      roleId: operatorRole.id,
      isActive: true,
    },
  })

  // Create form templates
  console.log('Creating form templates...')

  const iceMakeForm = await prisma.formTemplate.upsert({
    where: { id: 'form-ice-make-v1' },
    update: {},
    create: {
      id: 'form-ice-make-v1',
      facilityId: facility.id,
      moduleType: ModuleType.ICE_OPERATIONS,
      name: 'Ice Make Report',
      description: 'Track water usage, temperature, and ice quality during ice making',
      version: 1,
      isActive: true,
      isLocked: false,
      createdBy: generalManagerRole.id,
      schema: {
        header: {
          includeUser: true,
          includeFacility: true,
          includeRink: true,
          includeDateTime: true,
          includeOutsideTemp: true,
        },
        sections: [
          {
            id: 'water-section',
            title: 'Water & Temperature',
            order: 1,
            fields: [
              { id: 'water-used', type: 'number', label: 'Water Used', required: true, min: 0, max: 500, order: 1 },
              { id: 'water-type', type: 'dropdown', label: 'Water Type', required: true, options: ['Hot Water', 'Cold Water', 'Mixed'], order: 2 },
              { id: 'ice-temp-before', type: 'temperature', label: 'Ice Temperature (Before)', required: true, min: -20, max: 40, unit: 'F', order: 3 },
              { id: 'ice-temp-after', type: 'temperature', label: 'Ice Temperature (After)', required: false, min: -20, max: 40, unit: 'F', order: 4 },
            ],
          },
          {
            id: 'surface-section',
            title: 'Surface Condition',
            order: 2,
            fields: [
              { id: 'snow-removed', type: 'number', label: 'Snow Removed', required: false, min: 0, max: 50, order: 1 },
              { id: 'surface-quality', type: 'dropdown', label: 'Surface Quality', required: true, options: ['Excellent', 'Good', 'Fair', 'Poor'], order: 2 },
              { id: 'has-issues', type: 'toggle', label: 'Surface Issues Present', required: false, defaultValue: false, order: 3 },
              { id: 'notes', type: 'textarea', label: 'Notes', required: false, rows: 4, maxLength: 500, order: 4 },
            ],
          },
        ],
      },
      conditionalRules: {
        rules: [
          {
            id: 'rule-require-notes',
            conditions: [{ fieldId: 'has-issues', operator: 'equals', value: true }],
            conditionLogic: 'AND',
            actions: [{ type: 'require', targetFieldId: 'notes' }],
          },
        ],
      },
    },
  })

  const iceDepthForm = await prisma.formTemplate.upsert({
    where: { id: 'form-ice-depth-v1' },
    update: {},
    create: {
      id: 'form-ice-depth-v1',
      facilityId: facility.id,
      moduleType: ModuleType.ICE_DEPTH,
      name: 'Ice Depth Measurement',
      description: 'Measure ice depth across the rink surface using grid measurements',
      version: 1,
      isActive: true,
      isLocked: false,
      createdBy: generalManagerRole.id,
      schema: {
        header: {
          includeUser: true,
          includeFacility: true,
          includeRink: true,
          includeDateTime: true,
          includeOutsideTemp: true,
        },
        sections: [
          {
            id: 'measurement-section',
            title: 'Ice Depth Measurements',
            description: 'Measure ice depth at designated points across the rink surface',
            order: 1,
            fields: [
              {
                id: 'ice-depth-grid',
                type: 'iceDepthGrid',
                label: 'Ice Depth Grid',
                required: true,
                preset: '35',
                minDepth: 0.5,
                maxDepth: 2.0,
                unit: 'inches',
                helpText: 'Click on grid points to record measurements. Green = good, Red = too thin, Yellow = too thick',
                order: 1,
              },
            ],
          },
          {
            id: 'conditions-section',
            title: 'Rink Conditions',
            order: 2,
            fields: [
              {
                id: 'ice-temp',
                type: 'temperature',
                label: 'Ice Surface Temperature',
                required: true,
                min: -20,
                max: 40,
                unit: 'F',
                order: 1,
              },
              {
                id: 'surface-quality',
                type: 'dropdown',
                label: 'Surface Quality',
                required: true,
                options: ['Excellent', 'Good', 'Fair', 'Poor'],
                order: 2,
              },
              {
                id: 'has-thin-spots',
                type: 'toggle',
                label: 'Thin Spots Detected',
                required: false,
                defaultValue: false,
                order: 3,
              },
              {
                id: 'action-taken',
                type: 'textarea',
                label: 'Action Taken',
                required: false,
                rows: 3,
                maxLength: 500,
                placeholder: 'Describe any actions taken for thin spots or other issues...',
                order: 4,
              },
            ],
          },
        ],
      },
      conditionalRules: {
        rules: [
          {
            id: 'rule-require-action',
            conditions: [{ fieldId: 'has-thin-spots', operator: 'equals', value: true }],
            conditionLogic: 'AND',
            actions: [{ type: 'require', targetFieldId: 'action-taken' }],
          },
        ],
      },
    },
  })

  const refrigerationForm = await prisma.formTemplate.upsert({
    where: { id: 'form-refrigeration-v1' },
    update: {},
    create: {
      id: 'form-refrigeration-v1',
      facilityId: facility.id,
      moduleType: ModuleType.REFRIGERATION,
      name: 'Refrigeration System Report',
      description: 'Monitor refrigeration equipment performance and maintenance',
      version: 1,
      isActive: true,
      isLocked: false,
      createdBy: generalManagerRole.id,
      schema: {
        header: {
          includeUser: true,
          includeFacility: true,
          includeRink: true,
          includeDateTime: true,
          includeOutsideTemp: true,
        },
        sections: [
          {
            id: 'equipment-section',
            title: 'Equipment Status',
            description: 'Record refrigeration equipment readings and status',
            order: 1,
            fields: [
              {
                id: 'compressor-temp',
                type: 'temperature',
                label: 'Compressor Temperature',
                required: true,
                min: -40,
                max: 120,
                unit: 'F',
                order: 1,
              },
              {
                id: 'evaporator-temp',
                type: 'temperature',
                label: 'Evaporator Temperature',
                required: true,
                min: -40,
                max: 60,
                unit: 'F',
                order: 2,
              },
              {
                id: 'condenser-temp',
                type: 'temperature',
                label: 'Condenser Temperature',
                required: true,
                min: -20,
                max: 120,
                unit: 'F',
                order: 3,
              },
              {
                id: 'brine-temp',
                type: 'temperature',
                label: 'Brine Temperature',
                required: true,
                min: -40,
                max: 40,
                unit: 'F',
                order: 4,
              },
              {
                id: 'system-pressure',
                type: 'number',
                label: 'System Pressure (PSI)',
                required: true,
                min: 0,
                max: 500,
                order: 5,
              },
            ],
          },
          {
            id: 'performance-section',
            title: 'System Performance',
            order: 2,
            fields: [
              {
                id: 'system-status',
                type: 'dropdown',
                label: 'Overall System Status',
                required: true,
                options: ['Optimal', 'Normal', 'Degraded', 'Critical'],
                order: 1,
              },
              {
                id: 'compressor-running',
                type: 'toggle',
                label: 'Compressor Running',
                required: false,
                defaultValue: true,
                order: 2,
              },
              {
                id: 'has-alarms',
                type: 'toggle',
                label: 'Active Alarms',
                required: false,
                defaultValue: false,
                order: 3,
              },
              {
                id: 'alarm-details',
                type: 'textarea',
                label: 'Alarm Details',
                required: false,
                rows: 3,
                maxLength: 500,
                placeholder: 'Describe any active alarms or warnings...',
                order: 4,
              },
            ],
          },
          {
            id: 'maintenance-section',
            title: 'Maintenance & Notes',
            order: 3,
            fields: [
              {
                id: 'maintenance-performed',
                type: 'toggle',
                label: 'Maintenance Performed',
                required: false,
                defaultValue: false,
                order: 1,
              },
              {
                id: 'maintenance-notes',
                type: 'textarea',
                label: 'Maintenance Notes',
                required: false,
                rows: 4,
                maxLength: 1000,
                placeholder: 'Describe maintenance performed, parts replaced, etc...',
                order: 2,
              },
              {
                id: 'photos',
                type: 'photo',
                label: 'Equipment Photos',
                required: false,
                maxPhotos: 5,
                order: 3,
              },
            ],
          },
        ],
      },
      conditionalRules: {
        rules: [
          {
            id: 'rule-require-alarm-details',
            conditions: [{ fieldId: 'has-alarms', operator: 'equals', value: true }],
            conditionLogic: 'AND',
            actions: [{ type: 'require', targetFieldId: 'alarm-details' }],
          },
          {
            id: 'rule-require-maintenance-notes',
            conditions: [{ fieldId: 'maintenance-performed', operator: 'equals', value: true }],
            conditionLogic: 'AND',
            actions: [{ type: 'require', targetFieldId: 'maintenance-notes' }],
          },
        ],
      },
    },
  })

  const airQualityForm = await prisma.formTemplate.upsert({
    where: { id: 'form-air-quality-v1' },
    update: {},
    create: {
      id: 'form-air-quality-v1',
      facilityId: facility.id,
      moduleType: ModuleType.AIR_QUALITY,
      name: 'Air Quality Monitoring',
      description: 'Monitor CO and NO2 levels for safety compliance',
      version: 1,
      isActive: true,
      isLocked: false,
      createdBy: generalManagerRole.id,
      schema: {
        header: {
          includeUser: true,
          includeFacility: true,
          includeRink: true,
          includeDateTime: true,
          includeOutsideTemp: false,
        },
        sections: [
          {
            id: 'gas-levels-section',
            title: 'Gas Level Readings',
            description: 'Record CO and NO2 levels in parts per million (PPM)',
            order: 1,
            fields: [
              {
                id: 'co-level',
                type: 'number',
                label: 'Carbon Monoxide (CO) Level',
                required: true,
                min: 0,
                max: 200,
                decimalPlaces: 1,
                helpText: 'Normal: < 9 PPM, Warning: 9-35 PPM, Critical: > 35 PPM',
                order: 1,
              },
              {
                id: 'no2-level',
                type: 'number',
                label: 'Nitrogen Dioxide (NO2) Level',
                required: true,
                min: 0,
                max: 10,
                decimalPlaces: 2,
                helpText: 'Normal: < 0.5 PPM, Warning: 0.5-3 PPM, Critical: > 3 PPM',
                order: 2,
              },
              {
                id: 'reading-location',
                type: 'dropdown',
                label: 'Reading Location',
                required: true,
                options: [
                  'Ice Surface - Center',
                  'Ice Surface - Near Zamboni Door',
                  'Spectator Area',
                  'Locker Rooms',
                  'Lobby',
                  'Other',
                ],
                order: 3,
              },
              {
                id: 'ventilation-status',
                type: 'dropdown',
                label: 'Ventilation System Status',
                required: true,
                options: ['Operating Normally', 'Partially Operating', 'Not Operating'],
                order: 4,
              },
            ],
          },
          {
            id: 'safety-section',
            title: 'Safety Assessment',
            order: 2,
            fields: [
              {
                id: 'levels-exceeded',
                type: 'toggle',
                label: 'Threshold Levels Exceeded',
                required: false,
                defaultValue: false,
                order: 1,
              },
              {
                id: 'action-taken',
                type: 'textarea',
                label: 'Action Taken',
                required: false,
                rows: 4,
                maxLength: 1000,
                placeholder: 'Describe actions taken (e.g., increased ventilation, evacuated area, contacted maintenance)...',
                order: 2,
              },
              {
                id: 'evacuation-needed',
                type: 'toggle',
                label: 'Evacuation Required',
                required: false,
                defaultValue: false,
                order: 3,
              },
              {
                id: 'evacuation-notes',
                type: 'textarea',
                label: 'Evacuation Notes',
                required: false,
                rows: 3,
                maxLength: 500,
                placeholder: 'Document evacuation procedures and timing...',
                order: 4,
              },
            ],
          },
          {
            id: 'documentation-section',
            title: 'Documentation',
            order: 3,
            fields: [
              {
                id: 'photos',
                type: 'photo',
                label: 'Monitoring Equipment Photos',
                required: false,
                maxPhotos: 3,
                order: 1,
              },
              {
                id: 'additional-notes',
                type: 'textarea',
                label: 'Additional Notes',
                required: false,
                rows: 4,
                maxLength: 1000,
                placeholder: 'Any additional observations or concerns...',
                order: 2,
              },
            ],
          },
        ],
      },
      conditionalRules: {
        rules: [
          {
            id: 'rule-require-action',
            conditions: [{ fieldId: 'levels-exceeded', operator: 'equals', value: true }],
            conditionLogic: 'AND',
            actions: [{ type: 'require', targetFieldId: 'action-taken' }],
          },
          {
            id: 'rule-require-evacuation-notes',
            conditions: [{ fieldId: 'evacuation-needed', operator: 'equals', value: true }],
            conditionLogic: 'AND',
            actions: [{ type: 'require', targetFieldId: 'evacuation-notes' }],
          },
        ],
      },
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log('\n🔑 Demo accounts created:')
  console.log('  General Manager: gm@demo.com / password123')
  console.log('  Facility Manager: manager@demo.com / password123')
  console.log('  Supervisor: supervisor@demo.com / password123')
  console.log('  Operator: operator@demo.com / password123')
  console.log('\n📋 Form templates created:')
  console.log('  - Ice Make Report (Ice Operations)')
  console.log('  - Ice Depth Measurement (Ice Depth)')
  console.log('  - Refrigeration System Report (Refrigeration)')
  console.log('  - Air Quality Monitoring (Air Quality)')
  console.log('\n🚀 Next steps:')
  console.log('  1. Run: npm run dev')
  console.log('  2. Visit: http://localhost:3000/login')
  console.log('  3. Try logging in with any demo account')
  console.log('  4. Navigate to any module and submit a form')
  console.log('  5. View data in Prisma Studio: npx prisma studio')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
