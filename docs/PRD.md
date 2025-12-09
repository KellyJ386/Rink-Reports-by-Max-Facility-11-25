# Product Requirements Document (PRD)
## Max Facility Operations (MFO) - Ice Rink Management SaaS Platform

**Version:** 1.0
**Date:** December 4, 2024
**Status:** Phase 1 Complete, Phase 2 In Planning
**Document Owner:** Product Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [Goals and Objectives](#3-goals-and-objectives)
4. [User Personas and Roles](#4-user-personas-and-roles)
5. [Feature Requirements](#5-feature-requirements)
6. [Technical Requirements](#6-technical-requirements)
7. [Security Requirements](#7-security-requirements)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Implementation Phases](#9-implementation-phases)
10. [Success Metrics](#10-success-metrics)
11. [Risks and Mitigations](#11-risks-and-mitigations)
12. [Appendix](#12-appendix)

---

## 1. Executive Summary

### 1.1 Problem Statement

Ice rink facilities currently rely on paper-based documentation systems for daily operations, leading to:
- **Inefficiency:** Manual data entry, lost paperwork, and time-consuming report generation
- **Compliance Risk:** Difficulty maintaining and retrieving records for regulatory audits
- **Limited Visibility:** Managers lack real-time insight into facility operations
- **Inconsistent Reporting:** Variations in documentation across shifts and staff members
- **Data Loss:** No centralized backup or retention management

### 1.2 Solution

MFO (Max Facility Operations) is a comprehensive SaaS platform designed to digitize and streamline ice rink operations documentation. The platform provides:

- **Seven Core Reporting Modules:** Ice Depth, Ice Operations, Refrigeration, Air Quality, Incidents, Schedule, and Daily Checklist
- **Drag-and-Drop Form Builder:** Allows facilities to customize reports to their specific needs while maintaining compliance requirements
- **Role-Based Access Control:** Granular permissions ensure staff only access relevant features
- **Multi-Facility Support:** Manage multiple rinks and locations from a single platform
- **Offline Capability:** PWA with IndexedDB ensures operations continue during connectivity issues
- **Compliance & Retention:** Automated data retention policies and complete audit trails

### 1.3 Target Market

- Municipal ice rinks and recreation centers
- Private ice skating facilities
- Multi-rink sports complexes
- Hockey training centers
- Figure skating clubs with dedicated facilities

---

## 2. Product Overview

### 2.1 Product Vision

To become the industry-standard digital operations platform for ice rink facilities, replacing paper-based systems with an intuitive, customizable, and compliance-ready solution that improves operational efficiency and safety.

### 2.2 Product Scope

#### In Scope

| Category | Features |
|----------|----------|
| **Reporting** | Ice depth tracking, ice operations logging, refrigeration monitoring, air quality compliance, incident documentation, employee scheduling, daily checklists |
| **Form Builder** | Drag-and-drop interface, conditional logic, calculated fields, specialized visualizations (ice grid, body diagram) |
| **User Management** | Role-based access, permission overrides, multi-facility user assignment |
| **Notifications** | In-app alerts, email notifications, SMS for critical events |
| **Data Management** | Export capabilities, data retention policies, audit logging |
| **Mobile Access** | PWA with offline support, responsive design |

#### Out of Scope (v1.0)

- Point of sale (POS) integration
- Booking/reservation management
- Public-facing customer portal
- Financial reporting
- Equipment inventory management
- Integration with external facility management systems

### 2.3 Key Differentiators

1. **Industry-Specific Design:** Purpose-built for ice rink operations, not a generic form builder
2. **Customizable Yet Compliant:** Form builder allows customization while enforcing required compliance fields
3. **Specialized Visualizations:** Ice depth grid mapping and body diagram for incidents
4. **Offline-First Architecture:** Critical for facilities with inconsistent connectivity
5. **Multi-Rink Support:** Native support for facilities with multiple ice surfaces

---

## 3. Goals and Objectives

### 3.1 Business Goals

| Goal | Success Criteria |
|------|------------------|
| Replace paper-based documentation | 100% of daily reports submitted digitally within 6 months of deployment |
| Improve compliance readiness | Reduce audit preparation time by 80% |
| Reduce operational overhead | Decrease time spent on documentation by 50% |
| Enable data-driven decisions | Provide actionable insights through trend analysis |

### 3.2 User Goals

| User Type | Goals |
|-----------|-------|
| **General Manager** | Real-time visibility into all operations, simplified compliance reporting, reduced administrative burden |
| **Facility Manager** | Easy access to all operational data, streamlined form customization, efficient staff scheduling |
| **Supervisor** | Quick submission of daily reports, visibility into team activities, incident tracking |
| **Operator** | Simple, fast report submission, clear daily checklists, schedule visibility |

### 3.3 Technical Goals

- **Performance:** Page load times under 2 seconds
- **Availability:** 99.9% uptime for critical operations
- **Scalability:** Support 100+ concurrent users per facility
- **Offline:** Full functionality for report submission without connectivity
- **Security:** SOC 2 Type II compliance readiness

---

## 4. User Personas and Roles

### 4.1 Role Definitions

#### General Manager (GM)
**Description:** Overall responsibility for facility operations, compliance, and staff management.

**Key Responsibilities:**
- Approve incident reports
- Manage user accounts and roles
- Configure form templates
- Publish employee schedules
- Review facility-wide reports and analytics

**Permission Level:** Full access to all modules and administrative functions

---

#### Facility Manager
**Description:** Day-to-day operational oversight of the facility.

**Key Responsibilities:**
- Submit and review all operational reports
- Create and edit form templates
- Manage staff schedules (draft)
- Monitor air quality compliance
- Handle routine incident documentation

**Permission Level:** High access with some administrative restrictions (cannot approve incidents or publish schedules)

---

#### Supervisor
**Description:** Shift leader responsible for team operations during their shift.

**Key Responsibilities:**
- Submit reports for their shift
- View team submissions
- Monitor daily checklists completion
- Document incidents
- View complete schedule

**Permission Level:** Medium access focused on operational tasks (no admin functions)

---

#### Operator
**Description:** Front-line staff performing ice maintenance and facility operations.

**Key Responsibilities:**
- Submit daily reports (ice depth, operations, checklists)
- View own submitted reports
- Check personal schedule
- Report incidents

**Permission Level:** Limited access to submission and viewing own data

---

### 4.2 Permission Matrix

| Module | Action | General Manager | Facility Manager | Supervisor | Operator |
|--------|--------|-----------------|------------------|------------|----------|
| **Admin** | Access | Yes | Yes | No | No |
| **Admin** | User Management | Yes | No | No | No |
| **Admin** | Role Management | Yes | No | No | No |
| **Admin** | Form Templates | Yes | Yes | No | No |
| **Ice Depth** | Submit | Yes | Yes | Yes | Yes |
| **Ice Depth** | View Own | Yes | Yes | Yes | Yes |
| **Ice Depth** | View All | Yes | Yes | Yes | No |
| **Ice Depth** | Edit | Yes | Yes | No | No |
| **Ice Depth** | Export | Yes | Yes | No | No |
| **Ice Operations** | Submit | Yes | Yes | Yes | Yes |
| **Ice Operations** | View All | Yes | Yes | Yes | No |
| **Refrigeration** | Submit | Yes | Yes | Yes | No |
| **Refrigeration** | View All | Yes | Yes | Yes | No |
| **Air Quality** | Submit | Yes | Yes | Yes | Yes |
| **Air Quality** | View All | Yes | Yes | Yes | No |
| **Incidents** | Submit | Yes | Yes | Yes | Yes |
| **Incidents** | View All | Yes | Yes | Yes | No |
| **Incidents** | Approve | Yes | No | No | No |
| **Schedule** | View Own | Yes | Yes | Yes | Yes |
| **Schedule** | View All | Yes | Yes | Yes | No |
| **Schedule** | Create | Yes | Yes | No | No |
| **Schedule** | Publish | Yes | No | No | No |
| **Daily Checklist** | Submit | Yes | Yes | Yes | Yes |
| **Daily Checklist** | View All | Yes | Yes | Yes | No |

---

## 5. Feature Requirements

### 5.1 Authentication & Authorization

#### FR-AUTH-001: User Login
**Priority:** P0 (Critical)
**Status:** Implemented

**Description:** Users authenticate using email and password credentials.

**Acceptance Criteria:**
- [x] Email/password login form
- [x] JWT token generation on successful authentication
- [x] Secure httpOnly cookie storage
- [x] Audit log entry for login events
- [x] Invalid credentials error handling
- [x] Account lockout after 5 failed attempts (pending)

---

#### FR-AUTH-002: Session Management
**Priority:** P0 (Critical)
**Status:** Implemented

**Description:** Maintain user sessions securely with automatic expiration.

**Acceptance Criteria:**
- [x] JWT tokens with configurable expiration (default: 7 days)
- [x] Automatic token refresh (pending)
- [x] Session validation on protected routes
- [x] Graceful redirect on expired sessions

---

#### FR-AUTH-003: Role-Based Access Control
**Priority:** P0 (Critical)
**Status:** Implemented

**Description:** Restrict access to features based on user roles.

**Acceptance Criteria:**
- [x] Four default roles (GM, Facility Manager, Supervisor, Operator)
- [x] Permission-based module access
- [x] Per-user permission overrides
- [x] Dynamic navigation based on permissions

---

### 5.2 Form Builder Module

#### FR-FORM-001: Field Type Library
**Priority:** P0 (Critical)
**Status:** Pending (Phase 2)

**Description:** Comprehensive set of field types for form construction.

**Field Types Required:**

| Field Type | Description | Use Cases |
|------------|-------------|-----------|
| Text | Single-line text input | Names, short descriptions |
| Text Area | Multi-line text input | Comments, detailed notes |
| Number | Numeric input with validation | Measurements, counts |
| Decimal | Floating-point numbers | Temperature, pressure |
| Select | Dropdown single selection | Status, category |
| Multi-Select | Multiple choice selection | Applicable conditions |
| Checkbox | Boolean true/false | Yes/no confirmations |
| Date | Date picker | Event dates |
| Time | Time picker | Shift times |
| DateTime | Combined date and time | Timestamps |
| File Upload | Image/document attachment | Photos, signatures |
| Signature | Digital signature capture | Approvals |
| Ice Depth Grid | Specialized ice measurement | Ice depth reports |
| Body Diagram | Human body annotation | Incident injuries |
| Calculated | Auto-calculated values | Totals, averages |

**Acceptance Criteria:**
- [ ] All field types render correctly
- [ ] Validation rules apply per field type
- [ ] Mobile-friendly input controls
- [ ] Accessibility compliance (WCAG 2.1 AA)

---

#### FR-FORM-002: Drag-and-Drop Form Builder
**Priority:** P0 (Critical)
**Status:** Pending (Phase 2)

**Description:** Visual form construction interface using drag-and-drop.

**Acceptance Criteria:**
- [ ] Field palette with all available field types
- [ ] Drag fields onto form canvas
- [ ] Reorder fields via drag-and-drop
- [ ] Delete fields from form
- [ ] Field grouping/sections
- [ ] Form preview mode
- [ ] Undo/redo functionality

---

#### FR-FORM-003: Field Configuration
**Priority:** P0 (Critical)
**Status:** Pending (Phase 2)

**Description:** Configure individual field properties.

**Configuration Options:**
- Label and help text
- Required/optional status
- Default values
- Validation rules (min, max, pattern)
- Conditional visibility
- Read-only/locked status

**Acceptance Criteria:**
- [ ] Configuration panel opens on field selection
- [ ] Changes reflect immediately in preview
- [ ] Validation feedback on invalid configuration

---

#### FR-FORM-004: Conditional Logic
**Priority:** P1 (High)
**Status:** Pending (Phase 3)

**Description:** Show/hide fields based on other field values.

**Acceptance Criteria:**
- [ ] Define conditions using visual builder
- [ ] Support AND/OR logic combinations
- [ ] Multiple conditions per field
- [ ] Nested conditional support

---

#### FR-FORM-005: Calculated Fields
**Priority:** P1 (High)
**Status:** Pending (Phase 3)

**Description:** Auto-calculate values from other fields.

**Acceptance Criteria:**
- [ ] Basic math operations (+, -, *, /)
- [ ] Reference other form fields
- [ ] Date/time calculations
- [ ] Real-time calculation updates

---

#### FR-FORM-006: Form Versioning
**Priority:** P1 (High)
**Status:** Pending (Phase 3)

**Description:** Track changes to form templates over time.

**Acceptance Criteria:**
- [ ] Automatic version increment on save
- [ ] View version history
- [ ] Submissions linked to template version
- [ ] Rollback capability (admin only)

---

### 5.3 Ice Depth Module

#### FR-ICE-001: Ice Depth Report Submission
**Priority:** P0 (Critical)
**Status:** Pending (Phase 4)

**Description:** Submit ice depth measurements at configured points.

**Acceptance Criteria:**
- [ ] Select rink for measurement
- [ ] Universal header (date, time, operator, outside temp)
- [ ] Grid-based measurement input (25/35/47 points or custom)
- [ ] Visual representation of measurement locations
- [ ] Auto-calculate average depth
- [ ] Flag measurements outside acceptable range
- [ ] Attachment support for photos
- [ ] Offline submission capability

---

#### FR-ICE-002: Ice Depth Configuration
**Priority:** P1 (High)
**Status:** Pending (Phase 4)

**Description:** Configure measurement points per rink.

**Acceptance Criteria:**
- [ ] Select preset configurations (25, 35, 47 points)
- [ ] Custom point placement on rink diagram
- [ ] Save configuration per rink
- [ ] Import/export configurations

---

#### FR-ICE-003: Ice Depth History & Trends
**Priority:** P2 (Medium)
**Status:** Pending (Phase 6)

**Description:** View historical ice depth data and trends.

**Acceptance Criteria:**
- [ ] List view of past submissions
- [ ] Trend charts over time
- [ ] Point-specific history
- [ ] Export to CSV/PDF

---

### 5.4 Ice Operations Module

#### FR-OPS-001: Ice Operations Report
**Priority:** P0 (Critical)
**Status:** Pending (Phase 4)

**Description:** Log daily ice operations activities.

**Tracking Items:**
- Ice makes (full, spot)
- Circle checks
- Edging operations
- Blade changes
- Resurfacing activities
- Surface condition notes

**Acceptance Criteria:**
- [ ] Universal header component
- [ ] Customizable operation types
- [ ] Time tracking per operation
- [ ] Rink selection
- [ ] Photo attachments
- [ ] Notes field

---

### 5.5 Refrigeration Module

#### FR-REF-001: Refrigeration Log
**Priority:** P0 (Critical)
**Status:** Pending (Phase 5)

**Description:** Log refrigeration system readings and events.

**Acceptance Criteria:**
- [ ] Customizable reading fields per facility
- [ ] Support for multiple compressor systems
- [ ] Temperature readings (supply, return)
- [ ] Pressure readings
- [ ] Alert integration for out-of-range values
- [ ] Maintenance event logging

---

### 5.6 Air Quality Module

#### FR-AIR-001: Air Quality Monitoring
**Priority:** P0 (Critical)
**Status:** Pending (Phase 5)

**Description:** Track air quality readings for regulatory compliance.

**Measurements:**
- Carbon Monoxide (CO) in ppm
- Nitrogen Dioxide (NO2) in ppm
- Location within facility
- Time of reading

**Acceptance Criteria:**
- [ ] Multiple reading locations
- [ ] Automatic threshold comparison
- [ ] Warning alerts (CO > 20ppm, NO2 > 0.3ppm)
- [ ] Evacuation alerts (CO > 83ppm, NO2 > 2.0ppm)
- [ ] SMS notification for critical levels
- [ ] Compliance report generation

---

#### FR-AIR-002: Air Quality Thresholds
**Priority:** P1 (High)
**Status:** Schema Complete

**Description:** Configure facility-specific air quality thresholds.

**Acceptance Criteria:**
- [ ] Admin-configurable warning levels
- [ ] Admin-configurable evacuation levels
- [ ] Per-facility threshold settings
- [ ] Default values per industry standards

---

### 5.7 Incidents Module

#### FR-INC-001: Incident Report Submission
**Priority:** P0 (Critical)
**Status:** Pending (Phase 5)

**Description:** Document facility incidents and accidents.

**Required Information:**
- Date, time, and location of incident
- Type of incident (injury, property damage, near miss, etc.)
- Person(s) involved
- Description of incident
- Witness information
- Body diagram for injuries
- Photos/attachments
- Immediate actions taken
- Follow-up required

**Acceptance Criteria:**
- [ ] Comprehensive incident form
- [ ] Body diagram for injury annotation
- [ ] Witness signature capture
- [ ] Photo attachment
- [ ] Draft save capability
- [ ] Submit for approval workflow

---

#### FR-INC-002: Incident Approval Workflow
**Priority:** P0 (Critical)
**Status:** Pending (Phase 5)

**Description:** Review and approve incident reports.

**Acceptance Criteria:**
- [ ] Pending approval queue for GM
- [ ] Approve with comments
- [ ] Request revision with notes
- [ ] Reject with reason
- [ ] Email notification on status change
- [ ] Audit trail of approval actions

---

#### FR-INC-003: Incident Reporting
**Priority:** P2 (Medium)
**Status:** Pending (Phase 6)

**Description:** Generate incident reports for compliance.

**Acceptance Criteria:**
- [ ] Incident summary report
- [ ] Trend analysis (type, location, time)
- [ ] Export for insurance/legal
- [ ] 7-year retention compliance

---

### 5.8 Schedule Module

#### FR-SCH-001: Shift Definition
**Priority:** P1 (High)
**Status:** Pending (Phase 5)

**Description:** Define standard shifts for scheduling.

**Acceptance Criteria:**
- [ ] Create named shifts (Morning, Evening, etc.)
- [ ] Set start and end times
- [ ] Assign color coding
- [ ] Facility-wide or rink-specific
- [ ] Active/inactive toggle

---

#### FR-SCH-002: Schedule Creation
**Priority:** P0 (Critical)
**Status:** Pending (Phase 5)

**Description:** Create employee work schedules.

**Acceptance Criteria:**
- [ ] Weekly calendar view
- [ ] Drag-and-drop shift assignment
- [ ] Employee selection
- [ ] Rink assignment
- [ ] Copy previous week
- [ ] Draft status (not visible to operators)
- [ ] Publish to make visible

---

#### FR-SCH-003: Open Shifts
**Priority:** P2 (Medium)
**Status:** Pending (Phase 5)

**Description:** Post unfilled shifts for employee pickup.

**Acceptance Criteria:**
- [ ] Mark shift as open
- [ ] Employee notification
- [ ] Request to fill
- [ ] Manager approval
- [ ] Waitlist management

---

#### FR-SCH-004: Schedule Viewing
**Priority:** P0 (Critical)
**Status:** Pending (Phase 5)

**Description:** View work schedules.

**Acceptance Criteria:**
- [ ] Personal schedule view (operators)
- [ ] Team schedule view (supervisors+)
- [ ] Export/print schedule
- [ ] Mobile-friendly display

---

### 5.9 Daily Checklist Module

#### FR-CHK-001: Checklist Submission
**Priority:** P0 (Critical)
**Status:** Pending (Phase 4)

**Description:** Complete daily operational checklists.

**Acceptance Criteria:**
- [ ] Customizable checklist items
- [ ] Check/uncheck items
- [ ] Notes per item
- [ ] Photo attachment for issues
- [ ] Completion timestamp
- [ ] Incomplete item flagging

---

### 5.10 Notifications

#### FR-NOT-001: In-App Notifications
**Priority:** P1 (High)
**Status:** Pending (Phase 6)

**Description:** Display notifications within the application.

**Notification Types:**
- Incident pending approval
- Air quality alerts
- Schedule changes
- Form submission confirmations
- System announcements

**Acceptance Criteria:**
- [ ] Notification bell with unread count
- [ ] Notification list/dropdown
- [ ] Mark as read
- [ ] Click to navigate to relevant content
- [ ] Notification preferences

---

#### FR-NOT-002: Email Notifications
**Priority:** P1 (High)
**Status:** Pending (Phase 6)

**Description:** Send email notifications for important events.

**Acceptance Criteria:**
- [ ] Configurable email triggers
- [ ] Template-based emails
- [ ] Unsubscribe capability
- [ ] Resend integration

---

#### FR-NOT-003: SMS Notifications
**Priority:** P1 (High)
**Status:** Pending (Phase 6)

**Description:** Send SMS for critical alerts.

**Use Cases:**
- Air quality evacuation alerts
- Emergency schedule changes
- Critical incident notifications

**Acceptance Criteria:**
- [ ] Phone number verification
- [ ] SMS provider integration (Twilio/MessageBird/Vonage)
- [ ] User opt-in/opt-out
- [ ] Quiet hours respect
- [ ] Delivery status tracking

---

### 5.11 Data Export & Reporting

#### FR-EXP-001: Data Export
**Priority:** P1 (High)
**Status:** Pending (Phase 6)

**Description:** Export data for external use.

**Export Formats:**
- CSV (all modules)
- PDF (individual reports, summaries)
- Excel (tabular data)

**Acceptance Criteria:**
- [ ] Date range selection
- [ ] Module/report type filter
- [ ] Column selection
- [ ] Immediate download or email delivery

---

#### FR-EXP-002: Compliance Reports
**Priority:** P2 (Medium)
**Status:** Pending (Phase 6)

**Description:** Generate compliance-ready reports.

**Report Types:**
- Air quality compliance summary
- Incident report archive
- Ice operations log
- Refrigeration maintenance history

**Acceptance Criteria:**
- [ ] Pre-formatted for regulatory submission
- [ ] Date range selection
- [ ] Include all required fields
- [ ] Digital signature on generation

---

### 5.12 Offline Capability

#### FR-OFF-001: Offline Form Submission
**Priority:** P0 (Critical)
**Status:** Pending (Phase 7)

**Description:** Submit reports without internet connectivity.

**Acceptance Criteria:**
- [ ] Form data saved to IndexedDB
- [ ] Clear offline indicator
- [ ] Automatic sync on reconnection
- [ ] Conflict resolution for concurrent edits
- [ ] Sync status visibility
- [ ] Retry failed syncs

---

#### FR-OFF-002: Offline Data Access
**Priority:** P1 (High)
**Status:** Pending (Phase 7)

**Description:** Access previously viewed data offline.

**Acceptance Criteria:**
- [ ] Cache recent submissions
- [ ] Cache current schedule
- [ ] Cache active form templates
- [ ] Storage management (clear old data)

---

## 6. Technical Requirements

### 6.1 Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend Framework** | Next.js 14+ | Server components, API routes, excellent DX |
| **UI Language** | TypeScript | Type safety, better maintainability |
| **Styling** | Tailwind CSS | Utility-first, responsive design |
| **Form Handling** | React Hook Form + Zod | Performance, validation |
| **Drag-and-Drop** | @dnd-kit | Accessibility, touch support |
| **Backend** | Next.js API Routes | Unified deployment, serverless ready |
| **ORM** | Prisma | Type-safe database access |
| **Database** | PostgreSQL | Relational integrity, JSON support |
| **Authentication** | JWT (custom) | Stateless, scalable |
| **Offline Storage** | IndexedDB | Large data, structured queries |

### 6.2 Database Schema

The database schema supports:

**Core Entities:**
- Facilities & Rinks
- Users & Roles
- Form Templates (versioned)
- Submissions & Attachments
- Schedule Entries & Shifts
- Notifications
- Audit Logs
- SMS Logs

**Key Design Decisions:**
- Soft deletes for data archival
- JSON fields for flexible permissions and form schemas
- Proper foreign key relationships
- Timestamps on all records

### 6.3 API Design

**Authentication Endpoints:**
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Current session
- `POST /api/auth/refresh` - Token refresh (pending)

**CRUD Endpoints (per module):**
- `GET /api/{module}` - List items
- `POST /api/{module}` - Create item
- `GET /api/{module}/{id}` - Get item
- `PUT /api/{module}/{id}` - Update item
- `DELETE /api/{module}/{id}` - Delete item

**Special Endpoints:**
- `POST /api/submissions/sync` - Offline sync
- `GET /api/reports/{type}` - Generate reports
- `POST /api/notifications/send` - Trigger notifications

### 6.4 Integration Points

| Integration | Purpose | Priority |
|-------------|---------|----------|
| **Weather API** | Auto-populate outside temperature | P2 |
| **Email (Resend)** | Transactional emails | P1 |
| **SMS (Twilio/MessageBird/Vonage)** | Critical alerts | P1 |
| **File Storage** | Attachment handling | P1 |

---

## 7. Security Requirements

### 7.1 Authentication Security

| Requirement | Implementation |
|-------------|----------------|
| Password Hashing | bcryptjs with 10 salt rounds |
| Token Security | JWT with httpOnly cookies |
| Session Expiration | Configurable (default 7 days) |
| Account Lockout | After 5 failed attempts |
| Password Requirements | Min 8 chars, complexity rules |

### 7.2 Authorization Security

- Role-based access control (RBAC)
- Permission checks on all API endpoints
- Per-user permission overrides
- Audit logging of all access

### 7.3 Data Security

| Requirement | Implementation |
|-------------|----------------|
| Encryption in Transit | HTTPS/TLS 1.3 |
| Encryption at Rest | Database encryption |
| PII Handling | Minimal collection, proper access controls |
| Data Retention | Configurable per data type |
| Backup | Daily automated backups |

### 7.4 Audit Requirements

All actions logged with:
- User ID and role
- Action type (create, update, delete, view)
- Entity type and ID
- Timestamp
- IP address
- User agent
- Before/after values (for updates)

### 7.5 Compliance Readiness

- SOC 2 Type II alignment
- GDPR data handling practices
- Data retention policies per industry standards
- Export capability for audits

---

## 8. Non-Functional Requirements

### 8.1 Performance

| Metric | Target |
|--------|--------|
| Page Load Time | < 2 seconds |
| API Response Time | < 500ms (95th percentile) |
| Time to Interactive | < 3 seconds |
| Lighthouse Score | > 90 |

### 8.2 Availability

| Metric | Target |
|--------|--------|
| Uptime | 99.9% |
| Planned Maintenance Window | < 4 hours/month |
| Recovery Time Objective (RTO) | < 4 hours |
| Recovery Point Objective (RPO) | < 1 hour |

### 8.3 Scalability

| Metric | Target |
|--------|--------|
| Concurrent Users per Facility | 100+ |
| Total Facilities Supported | 500+ |
| Database Size | 10+ TB |
| File Storage | 1+ TB per facility |

### 8.4 Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios
- Focus indicators

### 8.5 Browser Support

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |
| Mobile Safari | 14+ |
| Chrome Mobile | 90+ |

### 8.6 Mobile Support

- Responsive design for all screen sizes
- Touch-friendly controls
- PWA installation capability
- Offline functionality

---

## 9. Implementation Phases

### Phase 1: Foundation (COMPLETE)
**Duration:** Completed
**Status:** Done

**Deliverables:**
- [x] Project setup (Next.js, TypeScript, Tailwind)
- [x] Database schema (Prisma + PostgreSQL)
- [x] Authentication system (JWT)
- [x] Role-based access control
- [x] Basic dashboard and navigation
- [x] Demo seeding data

---

### Phase 2: Form Builder Core
**Duration:** 2-4 sprints
**Dependencies:** Phase 1

**Deliverables:**
- [ ] Basic field type components (text, number, select, checkbox, date/time)
- [ ] Drag-and-drop form canvas
- [ ] Field configuration panel
- [ ] Form template CRUD API
- [ ] Form preview mode
- [ ] Template listing and management UI

**Success Criteria:**
- Create a basic form with 5+ field types
- Preview form before saving
- List and manage form templates

---

### Phase 3: Form Builder Advanced
**Duration:** 2-3 sprints
**Dependencies:** Phase 2

**Deliverables:**
- [ ] Conditional logic builder
- [ ] Calculated fields
- [ ] File upload field
- [ ] Signature capture field
- [ ] Ice depth grid field
- [ ] Body diagram field
- [ ] Form versioning
- [ ] Locked field support (compliance)

**Success Criteria:**
- Create forms with conditional logic
- Auto-calculate values based on inputs
- Track form version history

---

### Phase 4: Core Report Modules
**Duration:** 3-4 sprints
**Dependencies:** Phase 3

**Deliverables:**
- [ ] Universal header component
- [ ] Form renderer (submission mode)
- [ ] Submission CRUD API
- [ ] Ice Depth module
- [ ] Ice Operations module
- [ ] Daily Checklist module
- [ ] Submission history views
- [ ] Basic export (CSV)

**Success Criteria:**
- Submit ice depth report with measurements
- Submit ice operations log
- Complete daily checklist
- View submission history

---

### Phase 5: Advanced Report Modules
**Duration:** 3-4 sprints
**Dependencies:** Phase 4

**Deliverables:**
- [ ] Refrigeration module
- [ ] Air Quality module with alerts
- [ ] Incidents module with approval workflow
- [ ] Schedule module (create, view, publish)
- [ ] Shift definition management

**Success Criteria:**
- Log refrigeration readings
- Submit air quality readings with threshold alerts
- Create and approve incident reports
- Create and publish employee schedules

---

### Phase 6: Notifications & Reporting
**Duration:** 2-3 sprints
**Dependencies:** Phase 5

**Deliverables:**
- [ ] In-app notification system
- [ ] Email notifications (Resend)
- [ ] SMS notifications (Twilio)
- [ ] PDF report generation
- [ ] Excel export
- [ ] Compliance report templates
- [ ] Data retention automation

**Success Criteria:**
- Receive notifications for incidents and air quality
- Export data to PDF/Excel
- Generate compliance-ready reports

---

### Phase 7: Offline & PWA
**Duration:** 2-3 sprints
**Dependencies:** Phase 4

**Deliverables:**
- [ ] Service worker setup
- [ ] IndexedDB data storage
- [ ] Offline form submission
- [ ] Background sync
- [ ] PWA manifest and installation
- [ ] Conflict resolution

**Success Criteria:**
- Submit reports offline
- Automatic sync when online
- Install as native app

---

### Phase 8: Polish & Launch
**Duration:** 2-3 sprints
**Dependencies:** All phases

**Deliverables:**
- [ ] Performance optimization
- [ ] Security audit and fixes
- [ ] Accessibility audit and fixes
- [ ] Documentation (user guides)
- [ ] Admin documentation
- [ ] Load testing
- [ ] Production deployment

**Success Criteria:**
- Pass security audit
- Meet performance targets
- Complete documentation
- Successful production deployment

---

## 10. Success Metrics

### 10.1 Product Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily Active Users | 80% of staff | Analytics |
| Report Submission Rate | 95%+ | Database |
| Form Completion Time | -50% vs paper | User surveys |
| System Adoption | 100% within 3 months | Usage data |

### 10.2 Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load Time | < 2s | Lighthouse |
| API Response Time | < 500ms | APM |
| Error Rate | < 0.1% | Error tracking |
| Uptime | 99.9% | Monitoring |

### 10.3 Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Audit Preparation Time | -80% | Customer feedback |
| Administrative Overhead | -50% | Time tracking |
| Compliance Violations | 0 | Audit results |
| Customer Satisfaction | > 4.5/5 | NPS surveys |

---

## 11. Risks and Mitigations

### 11.1 Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Offline sync conflicts | High | Medium | Implement robust conflict resolution with clear user feedback |
| Performance degradation at scale | High | Low | Load testing, database optimization, caching strategy |
| Browser compatibility issues | Medium | Medium | Comprehensive testing, progressive enhancement |
| Data loss during sync | Critical | Low | Redundant storage, sync verification, audit logs |

### 11.2 Business Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Low user adoption | High | Medium | User training, intuitive UX, phased rollout |
| Regulatory requirements change | Medium | Low | Flexible form builder, quick update capability |
| Integration delays | Medium | Medium | Modular architecture, fallback options |

### 11.3 Security Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Data breach | Critical | Low | Encryption, access controls, security audits |
| Authentication bypass | Critical | Low | Industry-standard auth, regular penetration testing |
| Privilege escalation | High | Low | Strict RBAC, permission verification on every request |

---

## 12. Appendix

### 12.1 Glossary

| Term | Definition |
|------|------------|
| **Ice Make** | Process of adding water to build ice thickness |
| **Circle Check** | Inspection circuit around the ice surface |
| **Edging** | Maintenance of ice edge along boards |
| **Resurfacing** | Complete ice surface smoothing (Zamboni) |
| **ppm** | Parts per million (air quality measurement) |
| **CO** | Carbon Monoxide |
| **NO2** | Nitrogen Dioxide |

### 12.2 Air Quality Standards Reference

| Gas | Warning Level | Evacuation Level | Source |
|-----|---------------|------------------|--------|
| CO | 20 ppm | 83 ppm | OSHA/Industry Standard |
| NO2 | 0.3 ppm | 2.0 ppm | OSHA/Industry Standard |

### 12.3 Data Retention Requirements

| Data Type | Retention Period | Regulatory Basis |
|-----------|------------------|------------------|
| Ice Depth | 3 years | Industry best practice |
| Ice Operations | 3 years | Industry best practice |
| Refrigeration | 3 years | Environmental compliance |
| Air Quality | 3 years | OSHA requirements |
| Incidents | 7 years | Legal/insurance requirements |
| Schedule | 3 years | Labor law compliance |
| Daily Checklist | 3 years | Industry best practice |

### 12.4 Demo Account Information

| Email | Password | Role |
|-------|----------|------|
| gm@demo.com | password123 | General Manager |
| manager@demo.com | password123 | Facility Manager |
| supervisor@demo.com | password123 | Supervisor |
| operator@demo.com | password123 | Operator |

### 12.5 Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/mfo

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Environment
NODE_ENV=development

# Optional: Weather API
OPENWEATHER_API_KEY=

# Optional: Email
RESEND_API_KEY=
EMAIL_FROM=noreply@yourfacility.com

# Optional: SMS (choose one provider)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-04 | Product Team | Initial PRD creation |

---

*This PRD is a living document and will be updated as requirements evolve and new information becomes available.*
