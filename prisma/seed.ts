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

  console.log('✅ Database seeded successfully!')
  console.log('\n🔑 Demo accounts created:')
  console.log('  General Manager: gm@demo.com / password123')
  console.log('  Facility Manager: manager@demo.com / password123')
  console.log('  Supervisor: supervisor@demo.com / password123')
  console.log('  Operator: operator@demo.com / password123')
  console.log('\n📋 Form templates created:')
  console.log('  - Ice Make Report (Ice Operations)')
  console.log('\n🚀 Next steps:')
  console.log('  1. Run: npm run dev')
  console.log('  2. Visit: http://localhost:3000/login')
  console.log('  3. Try logging in with any demo account')
  console.log('  4. Navigate to Ice Operations and submit a form')
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
