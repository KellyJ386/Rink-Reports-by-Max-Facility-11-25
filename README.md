# Max Facility Operations (MFO)
## Ice Rink Management SaaS Platform

MFO is a comprehensive ice rink management platform designed to digitize daily operations documentation across seven core modules. The platform provides multi-facility management, automated notifications, compliance reporting, and advanced data export capabilities.

## 🚀 Current Status

**Phase 1-11: COMPLETE**

✅ Next.js 14+ with TypeScript and Tailwind CSS
✅ Prisma ORM with comprehensive PostgreSQL schema
✅ JWT-based authentication with middleware protection
✅ Role-based access control (RBAC) with granular permissions
✅ Multi-facility & admin management (SaaS ready)
✅ Automated notifications & webhooks
✅ Progressive Web App (PWA) with offline support
✅ Security enhancements & compliance features
✅ Advanced reporting & data export (PDF, Excel, CSV)
✅ Comprehensive audit logging
✅ Health check & status endpoints

## 🏗️ Tech Stack

**Frontend:**
- Next.js 14+ (App Router)
- React 18+ with TypeScript
- Tailwind CSS for styling
- PWA with Service Workers
- @react-pdf/renderer for PDF generation

**Backend:**
- Next.js API Routes
- Prisma ORM with PostgreSQL
- JWT authentication
- Role-based access control (RBAC)

**Export & Reporting:**
- PDF generation (@react-pdf/renderer)
- Excel export (xlsx)
- CSV export (papaparse)

**Security:**
- AES-256-GCM encryption
- PBKDF2 password hashing
- OWASP security headers
- Comprehensive audit logging

**DevOps:**
- Health monitoring
- Audit trail
- Environment-based configuration

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- (Optional) SMTP server for email notifications
- (Optional) Twilio account for SMS notifications

## 🛠️ Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd Rink-Reports-by-Max-Facility-11-25
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and configure the following critical variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mfo_dev?schema=public"

# Security (IMPORTANT: Generate secure values for production)
JWT_SECRET="your-super-secret-jwt-key"
ENCRYPTION_KEY="your-encryption-key-32-chars-minimum"

# Application
NODE_ENV="development"
APP_URL="http://localhost:3000"

# Email (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@example.com"
SMTP_PASSWORD="your-app-password"
```

See `.env.example` for all available configuration options.

### 3. Initialize Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## 🔑 Demo Accounts

After seeding, log in with:

| Role | Email | Password |
|------|-------|----------|
| General Manager | gm@demo.com | password123 |
| Facility Manager | manager@demo.com | password123 |
| Supervisor | supervisor@demo.com | password123 |
| Operator | operator@demo.com | password123 |

## 📊 Key Features

### Multi-Facility Management (Phase 7)
- SaaS-ready multi-tenant architecture
- Subscription tier management (Trial, Basic, Enterprise)
- Usage limits enforcement (users, rinks)
- Facility and user administration
- Form template management per facility

### Automated Notifications (Phase 8)
- Incident-based alerts (ambulance, injuries)
- Air quality monitoring (CO/NO2 thresholds)
- Refrigeration alarm notifications
- Email and SMS delivery
- Webhook API for external integrations

### Progressive Web App (Phase 9)
- Install to home screen on mobile devices
- Offline support with service workers
- Background sync for offline submissions
- Push notification support
- Offline indicator and install prompts

### Security & Compliance (Phase 10)
- Comprehensive audit logging (all user actions)
- Data encryption for sensitive information
- OWASP security headers
- Role-based access control enforcement
- Multi-tenant data isolation
- IP address and User-Agent tracking

### Advanced Reporting (Phase 11)
- Professional PDF generation
- Excel exports with multiple sheets
- CSV exports for data analysis
- Scheduled automated reports (daily/weekly/monthly/quarterly)
- 5 compliance report types:
  - Incident Summary (OSHA compliant)
  - Air Quality Compliance
  - Safety Metrics
  - Audit Trail
  - User Activity

### Production Readiness (Phase 12)
- Health check endpoints (`/api/health`)
- System status monitoring (`/api/status`)
- Comprehensive environment configuration
- API documentation
- Deployment guides

## 📖 API Documentation

See [docs/API.md](docs/API.md) for complete API documentation.

### Quick Reference

**Health & Monitoring:**
- `GET /api/health` - Health check
- `GET /api/status` - System status

**Core Resources:**
- `/api/facilities` - Facility management
- `/api/users/[id]` - User management
- `/api/form-templates` - Form templates
- `/api/submissions` - Form submissions

**Compliance & Security:**
- `/api/audit-logs` - Audit trail
- `/api/compliance/reports` - Generate compliance reports
- `/api/export/*` - Data export endpoints

**Automation:**
- `/api/scheduled-reports` - Scheduled report management
- `/api/webhooks/notifications` - External notification triggers

## 🗂️ Project Structure

```
mfo/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── audit-logs/           # Audit log endpoints
│   │   ├── compliance/           # Compliance reporting
│   │   ├── export/               # Data export
│   │   ├── facilities/           # Facility management
│   │   ├── form-templates/       # Form builder
│   │   ├── health/               # Health check
│   │   ├── scheduled-reports/    # Scheduled reports
│   │   ├── status/               # System status
│   │   ├── submissions/          # Form submissions
│   │   ├── users/                # User management
│   │   └── webhooks/             # Webhook integrations
│   ├── dashboard/                # Protected dashboard
│   │   └── admin/                # Admin UI
│   ├── offline/                  # PWA offline page
│   └── layout.tsx                # Root layout with PWA
├── components/                   # React components
│   ├── OfflineIndicator.tsx      # Offline status UI
│   ├── PWAInstallPrompt.tsx      # PWA install prompt
│   └── PWARegistration.tsx       # Service worker registration
├── lib/                          # Utility libraries
│   ├── export/                   # Export utilities
│   │   ├── csvExport.ts          # CSV generation
│   │   ├── excelExport.ts        # Excel generation
│   │   ├── pdfGenerator.ts       # PDF orchestration
│   │   └── pdfTemplates/         # React-PDF templates
│   ├── security/                 # Security utilities
│   │   ├── auditLogger.ts        # Audit logging
│   │   ├── encryption.ts         # Data encryption
│   │   └── rbac.ts               # Access control
│   ├── services/                 # Business logic
│   │   └── notificationTriggers.ts  # Automated notifications
│   ├── auth.ts                   # Authentication
│   └── prisma.ts                 # Prisma client
├── prisma/                       # Database
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Migration history
├── public/                       # Static assets
│   ├── manifest.json             # PWA manifest
│   └── sw.js                     # Service worker
├── docs/                         # Documentation
│   └── API.md                    # API documentation
├── .env.example                  # Environment template
└── middleware.ts                 # Route protection + security headers
```

## 🔧 Development Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npx prisma generate      # Generate Prisma Client
npx prisma migrate dev   # Create and run migration
npx prisma studio        # Open Prisma Studio
npx prisma db seed       # Seed database
```

## 🔐 Security Features

- **Authentication**: JWT tokens with httpOnly cookies
- **Encryption**: AES-256-GCM for sensitive data
- **Passwords**: PBKDF2 with 100,000 iterations
- **Access Control**: Role-based permissions with module-level granularity
- **Audit Logging**: Complete audit trail of all actions
- **Security Headers**: OWASP-compliant headers (CSP, X-Frame-Options, etc.)
- **Data Isolation**: Multi-tenant data isolation enforcement
- **PII Protection**: Automatic masking and sanitization

## 📱 Module Overview

### Core Operational Modules
1. **Ice Depth** - Track ice thickness at measurement points
2. **Ice Operations** - Ice make, circle check, edging, blade changes
3. **Refrigeration** - Refrigeration system monitoring with alarms
4. **Air Quality** - CO/NO2 monitoring with compliance thresholds
5. **Incidents** - Accident reporting with automated notifications
6. **Schedule** - Employee scheduling with shift management
7. **Daily Checklist** - Custom operational checklists

### Admin & Management
- Multi-facility management
- User and role management
- Form template builder
- Subscription tier management
- Compliance reporting
- Data export and scheduled reports
- Audit log viewer

## 🌐 PWA Features

The application works as a Progressive Web App:

- **Installable**: Add to home screen on mobile and desktop
- **Offline-first**: Continue working without internet
- **Background sync**: Submissions sync when back online
- **App shortcuts**: Quick access to common forms
- **Offline indicator**: Visual feedback for connection status

## 📊 Compliance & Reporting

### Compliance Reports
1. **Incident Summary** - OSHA-compliant incident tracking
2. **Air Quality Compliance** - Safety threshold monitoring
3. **Safety Metrics** - Overall facility safety statistics
4. **Audit Trail** - Security and compliance audit log
5. **User Activity** - User accountability tracking

### Export Formats
- **PDF**: Professional reports with branding
- **Excel**: Multi-sheet workbooks with summaries
- **CSV**: Data analysis and integration

### Scheduled Reports
- Automated generation (daily, weekly, monthly, quarterly)
- Email distribution to multiple recipients
- Configurable report types and formats

## 🚀 Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for deployment instructions.

### Environment Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Generate secure `JWT_SECRET` and `ENCRYPTION_KEY`
- [ ] Configure production `DATABASE_URL`
- [ ] Set up SMTP for email notifications
- [ ] Configure CORS origins
- [ ] Enable HTTPS (`FORCE_HTTPS=true`)
- [ ] Set up error tracking (optional: Sentry)

### Health Monitoring
Monitor your deployment:
- `GET /api/health` - Quick health check (returns 200 if healthy, 503 if unhealthy)
- `GET /api/status` - Detailed system statistics

## 📄 License

Proprietary - All rights reserved

## 👥 Authors

- Kelly (Syracuse University)
- Claude (Anthropic)

## 🤝 Support

For issues and questions:
- Check [docs/API.md](docs/API.md) for API documentation
- Review `.env.example` for configuration options
- Monitor `/api/health` and `/api/status` endpoints

---

**Current Version**: 1.0.0
**Last Updated**: December 2024
**Status**: Production Ready
