# MFO Ice Rink SaaS - Deployment Roadmap

**Current Status:** Phase 1 Complete (Foundation)
**Target:** Production-Ready MVP
**Estimated Phases:** 8 phases

---

## Phase 2: Database & Testing Infrastructure

### 2.1 Database Setup
- [ ] Install and configure PostgreSQL locally
- [ ] Create development and test databases
- [ ] Generate Prisma migrations: `npx prisma migrate dev --name init`
- [ ] Verify all 14 models migrate correctly
- [ ] Run seed script: `npx prisma db seed`
- [ ] Test database connections and queries

### 2.2 Testing Infrastructure
- [ ] Install testing dependencies:
  ```bash
  npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
  ```
- [ ] Create `vitest.config.ts` configuration
- [ ] Create test setup file with mocks
- [ ] Add test scripts to `package.json`
- [ ] Create `/tests` directory structure:
  ```
  /tests
    /unit
    /integration
    /e2e
  ```

### 2.3 Authentication Tests
- [ ] Unit tests for `lib/auth.ts` (password hashing, JWT)
- [ ] Unit tests for `lib/permissions.ts` (permission checking)
- [ ] Integration tests for `/api/auth/*` endpoints
- [ ] Test role-based access scenarios

**Deliverable:** Working database with migrations, test suite foundation

---

## Phase 3: API Foundation & Submission System

### 3.1 Core API Utilities
- [ ] Create `/lib/api-utils.ts`:
  - Standard API response helpers
  - Error handling middleware
  - Request validation with Zod
  - Pagination utilities
- [ ] Create `/lib/validation.ts`:
  - Zod schemas for all entities
  - Reusable validation patterns

### 3.2 Submission API (Universal)
- [ ] `POST /api/submissions` - Create submission
- [ ] `GET /api/submissions` - List submissions (with filters)
- [ ] `GET /api/submissions/[id]` - Get single submission
- [ ] `PUT /api/submissions/[id]` - Update submission
- [ ] `DELETE /api/submissions/[id]` - Soft delete submission
- [ ] `POST /api/submissions/[id]/approve` - Approve submission
- [ ] `POST /api/submissions/[id]/reject` - Reject submission

### 3.3 Facility & Rink APIs
- [ ] `GET /api/facilities` - List user's facilities
- [ ] `GET /api/facilities/[id]` - Get facility details
- [ ] `GET /api/facilities/[id]/rinks` - List rinks
- [ ] `PUT /api/facilities/[id]/settings` - Update settings

### 3.4 Attachment API
- [ ] `POST /api/attachments` - Upload file
- [ ] `GET /api/attachments/[id]` - Get file
- [ ] `DELETE /api/attachments/[id]` - Delete file
- [ ] Configure file storage (local dev, S3 for production)

**Deliverable:** Complete CRUD API for submissions and core entities

---

## Phase 4: Form Builder Core

### 4.1 Field Type Components
Create reusable field components in `/components/form-builder/fields/`:
- [ ] `TextField.tsx` - Text input with variants (short, long, email, phone)
- [ ] `NumberField.tsx` - Number input with min/max/step
- [ ] `SelectField.tsx` - Dropdown with options
- [ ] `CheckboxField.tsx` - Single checkbox
- [ ] `CheckboxGroupField.tsx` - Multiple checkboxes
- [ ] `RadioGroupField.tsx` - Radio button group
- [ ] `DateTimeField.tsx` - Date and time picker
- [ ] `SignatureField.tsx` - Signature capture pad
- [ ] `PhotoField.tsx` - Photo upload with preview
- [ ] `SectionHeader.tsx` - Section divider with title

### 4.2 Form Builder Canvas
- [ ] Create `/components/form-builder/FormCanvas.tsx`:
  - Drag-and-drop zone using @dnd-kit
  - Field reordering
  - Field selection state
  - Visual drop indicators
- [ ] Create `/components/form-builder/FieldPalette.tsx`:
  - Draggable field type buttons
  - Grouped by category
- [ ] Create `/components/form-builder/FieldConfigPanel.tsx`:
  - Field property editor
  - Label, placeholder, required, help text
  - Field-specific options

### 4.3 Form Template CRUD
- [ ] `POST /api/form-templates` - Create template
- [ ] `GET /api/form-templates` - List templates
- [ ] `GET /api/form-templates/[id]` - Get template
- [ ] `PUT /api/form-templates/[id]` - Update template
- [ ] `POST /api/form-templates/[id]/publish` - Publish version
- [ ] `DELETE /api/form-templates/[id]` - Archive template

### 4.4 Form Builder Page
- [ ] Create `/app/admin/forms/page.tsx` - Template list
- [ ] Create `/app/admin/forms/new/page.tsx` - New template
- [ ] Create `/app/admin/forms/[id]/edit/page.tsx` - Edit template
- [ ] Create `/app/admin/forms/[id]/preview/page.tsx` - Preview mode

**Deliverable:** Working drag-and-drop form builder with 10 field types

---

## Phase 5: Form Builder Advanced Features

### 5.1 Conditional Logic
- [ ] Create `/components/form-builder/ConditionalLogicBuilder.tsx`:
  - "Show field when" rules
  - Condition operators (equals, not equals, contains, greater than, etc.)
  - Multiple conditions with AND/OR
- [ ] Implement conditional rendering in form renderer
- [ ] Add conditional logic storage to FormTemplate schema

### 5.2 Calculated Fields
- [ ] Create `/components/form-builder/CalculatedFieldBuilder.tsx`:
  - Formula builder UI
  - Field references
  - Math operations
- [ ] Implement calculation engine
- [ ] Real-time calculation in form renderer

### 5.3 Specialized Fields
- [ ] `IceDepthGridField.tsx`:
  - Visual rink diagram
  - Configurable measurement points (25/35/47)
  - Touch-friendly number inputs
  - Average/min/max display
- [ ] `BodyDiagramField.tsx`:
  - Human body outline SVG
  - Tap-to-mark injury locations
  - Notes per location
- [ ] `WeatherField.tsx`:
  - Auto-fetch from OpenWeather API
  - Manual override option

### 5.4 Form Versioning
- [ ] Implement version history storage
- [ ] Add version comparison view
- [ ] Handle submissions with old form versions
- [ ] Version rollback functionality

**Deliverable:** Full-featured form builder with conditional logic and specialized fields

---

## Phase 6: Report Modules Implementation

### 6.1 Universal Report Components
- [ ] Create `/components/reports/UniversalHeader.tsx`:
  - Facility/rink selector
  - Date/time (auto or manual)
  - Outside temperature (auto-fetch or manual)
  - Submitted by (auto from session)
- [ ] Create `/components/reports/FormRenderer.tsx`:
  - Render form from template
  - Handle all field types
  - Validation display
  - Submit handling
- [ ] Create `/components/reports/SubmissionView.tsx`:
  - Read-only submission display
  - Approval/rejection actions
  - Audit trail display

### 6.2 Ice Depth Module
- [ ] Create `/app/dashboard/ice-depth/page.tsx` - List view
- [ ] Create `/app/dashboard/ice-depth/new/page.tsx` - New reading
- [ ] Create `/app/dashboard/ice-depth/[id]/page.tsx` - View submission
- [ ] Create `/app/dashboard/ice-depth/config/page.tsx` - Configure measurement points
- [ ] API: `GET/POST /api/ice-depth/configuration`
- [ ] Ice depth grid visualization component
- [ ] Historical trend charts

### 6.3 Ice Operations Module
- [ ] Create `/app/dashboard/ice-operations/page.tsx` - List view
- [ ] Create `/app/dashboard/ice-operations/new/page.tsx` - New report
- [ ] Create `/app/dashboard/ice-operations/[id]/page.tsx` - View submission
- [ ] Default form template for ice operations
- [ ] Ice make tracking
- [ ] Circle check logging
- [ ] Edging records

### 6.4 Refrigeration Module
- [ ] Create `/app/dashboard/refrigeration/page.tsx` - List view
- [ ] Create `/app/dashboard/refrigeration/new/page.tsx` - New report
- [ ] Create `/app/dashboard/refrigeration/[id]/page.tsx` - View submission
- [ ] Compressor log template
- [ ] Temperature monitoring fields

### 6.5 Air Quality Module
- [ ] Create `/app/dashboard/air-quality/page.tsx` - List view
- [ ] Create `/app/dashboard/air-quality/new/page.tsx` - New reading
- [ ] Create `/app/dashboard/air-quality/[id]/page.tsx` - View submission
- [ ] CO/NO2 level inputs with threshold warnings
- [ ] Real-time threshold checking
- [ ] Visual warning/evacuation alerts
- [ ] Compliance status dashboard

### 6.6 Incidents Module
- [ ] Create `/app/dashboard/incidents/page.tsx` - List view
- [ ] Create `/app/dashboard/incidents/new/page.tsx` - New incident
- [ ] Create `/app/dashboard/incidents/[id]/page.tsx` - View incident
- [ ] Create `/app/dashboard/incidents/[id]/review/page.tsx` - Manager review
- [ ] Body diagram integration
- [ ] Witness information fields
- [ ] Photo attachment support
- [ ] Approval workflow UI

### 6.7 Daily Checklist Module
- [ ] Create `/app/dashboard/checklists/page.tsx` - List view
- [ ] Create `/app/dashboard/checklists/new/page.tsx` - New checklist
- [ ] Create `/app/dashboard/checklists/[id]/page.tsx` - View submission
- [ ] Default opening/closing checklist templates
- [ ] Completion percentage tracking

**Deliverable:** All 7 report modules functional with form rendering

---

## Phase 7: Schedule Module

### 7.1 Shift Management
- [ ] Create `/app/dashboard/schedule/page.tsx` - Calendar view
- [ ] Create `/app/dashboard/schedule/shifts/page.tsx` - Shift definitions
- [ ] API: `GET/POST/PUT/DELETE /api/shifts`
- [ ] Shift template CRUD
- [ ] Shift color coding

### 7.2 Schedule Calendar
- [ ] Create `/components/schedule/CalendarView.tsx`:
  - Week/month views
  - Drag-to-create shifts
  - Shift assignment UI
- [ ] Create `/components/schedule/ShiftCard.tsx`:
  - Shift display with status
  - Employee assignment
  - Action buttons

### 7.3 Schedule Workflow
- [ ] Draft/publish workflow
- [ ] Employee availability tracking
- [ ] Shift swap requests
- [ ] Waitlist management
- [ ] Open shift notifications

### 7.4 Schedule APIs
- [ ] `GET /api/schedule` - Get schedule entries
- [ ] `POST /api/schedule` - Create entry
- [ ] `PUT /api/schedule/[id]` - Update entry
- [ ] `POST /api/schedule/publish` - Publish schedule
- [ ] `POST /api/schedule/[id]/claim` - Claim open shift

**Deliverable:** Complete scheduling system with calendar UI

---

## Phase 8: Notifications & Communications

### 8.1 Notification Service
- [ ] Create `/lib/notifications.ts`:
  - In-app notification creation
  - Notification preferences checking
  - Broadcast vs targeted notifications
- [ ] Create `/components/notifications/NotificationBell.tsx`:
  - Unread count badge
  - Dropdown notification list
- [ ] Create `/app/dashboard/notifications/page.tsx`:
  - Full notification history
  - Mark as read/unread
  - Notification settings

### 8.2 Email Integration (Resend)
- [ ] Create `/lib/email.ts`:
  - Email service wrapper
  - Template rendering
- [ ] Create email templates:
  - Incident submitted notification
  - Shift assignment notification
  - Air quality alert
  - Schedule published
- [ ] API: `POST /api/notifications/email`

### 8.3 SMS Integration (Twilio)
- [ ] Create `/lib/sms.ts`:
  - Twilio client wrapper
  - SMS sending with logging
  - Quiet hours checking
- [ ] Create `/api/webhooks/twilio/route.ts`:
  - Incoming SMS handling
  - Delivery status updates
- [ ] SMS templates for alerts
- [ ] Emergency shift fill notifications

### 8.4 Notification Triggers
- [ ] Air quality threshold alerts (auto)
- [ ] Incident submission notifications
- [ ] Schedule published notifications
- [ ] Open shift alerts
- [ ] Emergency notifications

**Deliverable:** Complete notification system with email and SMS

---

## Phase 9: Admin & User Management

### 9.1 User Management UI
- [ ] Create `/app/admin/users/page.tsx` - User list
- [ ] Create `/app/admin/users/new/page.tsx` - Create user
- [ ] Create `/app/admin/users/[id]/page.tsx` - Edit user
- [ ] User CRUD APIs
- [ ] Permission override UI
- [ ] Password reset flow
- [ ] User invitation system

### 9.2 Role Management
- [ ] Create `/app/admin/roles/page.tsx` - Role list
- [ ] Create `/app/admin/roles/[id]/page.tsx` - Edit role
- [ ] Role permission matrix UI
- [ ] Custom role creation

### 9.3 Facility Settings
- [ ] Create `/app/admin/settings/page.tsx`:
  - General settings
  - Data retention policies
  - Air quality thresholds
  - SMS configuration
  - Quiet hours

### 9.4 Audit Logs
- [ ] Create `/app/admin/audit/page.tsx`:
  - Searchable audit log viewer
  - Filter by action, user, entity
  - Date range filtering
  - Export functionality

**Deliverable:** Complete admin panel for system management

---

## Phase 10: Offline Support & PWA

### 10.1 Service Worker
- [ ] Create service worker for caching
- [ ] Cache static assets
- [ ] Cache API responses
- [ ] Background sync setup

### 10.2 IndexedDB Storage
- [ ] Create `/lib/offline-storage.ts`:
  - IndexedDB wrapper
  - Submission queue
  - Form template cache
- [ ] Offline submission creation
- [ ] Sync indicator UI

### 10.3 Sync Mechanism
- [ ] Create `/lib/sync.ts`:
  - Pending submission sync
  - Conflict detection
  - Conflict resolution UI
- [ ] Background sync on reconnection
- [ ] Sync status in header

### 10.4 PWA Configuration
- [ ] Update `/public/manifest.json`
- [ ] Add iOS splash screens
- [ ] Configure install prompt
- [ ] Add offline fallback page

**Deliverable:** Fully functional offline-capable PWA

---

## Phase 11: Reporting & Analytics

### 11.1 Dashboard Analytics
- [ ] Create `/components/dashboard/StatsCards.tsx`:
  - Today's submissions count
  - Pending approvals
  - Air quality status
  - Open shifts
- [ ] Create `/components/dashboard/RecentActivity.tsx`:
  - Recent submissions feed
  - Quick actions

### 11.2 Module Reports
- [ ] Ice depth trending charts
- [ ] Air quality compliance reports
- [ ] Incident statistics
- [ ] Schedule coverage analysis

### 11.3 Data Export
- [ ] CSV export for all modules
- [ ] PDF report generation
- [ ] Date range filtering
- [ ] Scheduled report emails

**Deliverable:** Analytics dashboard and export functionality

---

## Phase 12: Security Hardening & Performance

### 12.1 Security Enhancements
- [ ] Add rate limiting middleware
- [ ] Implement CSRF protection
- [ ] Add Content Security Policy headers
- [ ] Security audit of all endpoints
- [ ] Input sanitization review
- [ ] SQL injection prevention verification

### 12.2 Performance Optimization
- [ ] Add API response caching
- [ ] Implement database query optimization
- [ ] Add lazy loading for components
- [ ] Image optimization
- [ ] Bundle size analysis and reduction

### 12.3 Error Handling
- [ ] Global error boundary
- [ ] API error standardization
- [ ] User-friendly error messages
- [ ] Error logging service (Sentry)

**Deliverable:** Hardened, production-ready application

---

## Phase 13: Deployment Infrastructure

### 13.1 Environment Configuration
- [ ] Create production environment variables
- [ ] Set up secrets management
- [ ] Configure different environments (dev, staging, prod)

### 13.2 Database Deployment
- [ ] Set up production PostgreSQL (e.g., Supabase, Railway, AWS RDS)
- [ ] Configure connection pooling
- [ ] Set up automated backups
- [ ] Create migration deployment script

### 13.3 Application Deployment
- [ ] Choose hosting platform (Vercel recommended for Next.js)
- [ ] Configure build settings
- [ ] Set up CI/CD pipeline:
  ```yaml
  # Example GitHub Actions workflow
  - Run tests
  - Run linting
  - Build application
  - Run database migrations
  - Deploy to staging
  - Run E2E tests
  - Deploy to production
  ```
- [ ] Configure custom domain
- [ ] Set up SSL certificates

### 13.4 External Services
- [ ] Configure Twilio for SMS
- [ ] Configure Resend for email
- [ ] Configure OpenWeather API
- [ ] Set up file storage (AWS S3 or similar)
- [ ] Configure monitoring (Vercel Analytics, LogRocket)

### 13.5 Pre-Launch Checklist
- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] Seed data for production (roles only)
- [ ] SSL configured
- [ ] Error tracking enabled
- [ ] Performance monitoring enabled
- [ ] Backup system verified
- [ ] Load testing completed

**Deliverable:** Fully deployed production application

---

## Phase 14: Launch & Post-Launch

### 14.1 Soft Launch
- [ ] Deploy to production
- [ ] Create initial admin user
- [ ] Verify all modules functional
- [ ] Test with real data
- [ ] Monitor error rates

### 14.2 Documentation
- [ ] User guide for operators
- [ ] Admin guide for managers
- [ ] API documentation
- [ ] Troubleshooting guide

### 14.3 Training
- [ ] Admin training session
- [ ] Operator training materials
- [ ] Quick reference cards

### 14.4 Post-Launch Monitoring
- [ ] Daily error log review (first 2 weeks)
- [ ] Performance monitoring
- [ ] User feedback collection
- [ ] Bug fix prioritization

**Deliverable:** Live production system with documentation

---

## Quick Reference: Phase Dependencies

```
Phase 2 (DB & Tests)
    ↓
Phase 3 (API Foundation)
    ↓
Phase 4 (Form Builder Core)
    ↓
Phase 5 (Form Builder Advanced)
    ↓
Phase 6 (Report Modules) ←──┐
    ↓                       │
Phase 7 (Schedule) ─────────┤
    ↓                       │
Phase 8 (Notifications) ────┘
    ↓
Phase 9 (Admin)
    ↓
Phase 10 (Offline/PWA)
    ↓
Phase 11 (Analytics)
    ↓
Phase 12 (Security)
    ↓
Phase 13 (Deployment)
    ↓
Phase 14 (Launch)
```

---

## Priority Order for MVP (Minimal Viable Product)

If targeting a faster launch, prioritize in this order:

### MVP Phase 1: Core Functionality
1. Phase 2: Database setup
2. Phase 3: API foundation
3. Phase 4: Form Builder (basic fields only)
4. Phase 6.1-6.2: Universal components + Ice Depth module

### MVP Phase 2: Essential Modules
5. Phase 6.5: Air Quality (compliance critical)
6. Phase 6.6: Incidents (liability critical)
7. Phase 8.1: In-app notifications only

### MVP Phase 3: Full Launch
8. Remaining Phase 6 modules
9. Phase 7: Schedule
10. Phase 9: Admin panel
11. Phase 12-14: Security, deployment, launch

---

## Estimated Effort Summary

| Phase | Description | Complexity |
|-------|-------------|------------|
| 2 | Database & Testing | Medium |
| 3 | API Foundation | Medium |
| 4 | Form Builder Core | High |
| 5 | Form Builder Advanced | High |
| 6 | Report Modules (7) | High |
| 7 | Schedule Module | Medium |
| 8 | Notifications | Medium |
| 9 | Admin Panel | Medium |
| 10 | Offline/PWA | Medium |
| 11 | Analytics | Low |
| 12 | Security | Medium |
| 13 | Deployment | Medium |
| 14 | Launch | Low |

---

## Next Immediate Steps

1. **Run `npm install`** to ensure all dependencies are ready
2. **Set up PostgreSQL** database locally
3. **Create `.env`** file from `.env.example`
4. **Run `npx prisma migrate dev`** to create database
5. **Run `npx prisma db seed`** to add demo data
6. **Start development server** with `npm run dev`
7. **Begin Phase 2** - Add testing infrastructure

---

*Last Updated: Phase 1 Complete*
*Document Version: 1.0*
