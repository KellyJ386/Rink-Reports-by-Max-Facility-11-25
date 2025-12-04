# Max Facility Operations (MFO)
## Ice Rink Management SaaS Platform

MFO is a comprehensive ice rink management platform designed to digitize daily operations documentation across seven core modules. The Admin module serves as the "brain" of the application, providing a drag-and-drop form builder that allows facilities to customize reports to their specific needs while maintaining compliance with industry regulations.

## Current Status

**Phase 1: Foundation - COMPLETE**
- Next.js 14+ project with TypeScript
- Prisma ORM with comprehensive PostgreSQL schema
- JWT-based authentication system
- Role-based access control (RBAC)
- Basic dashboard layout and navigation

**Phase 2: Form Builder Core - COMPLETE**
- 12 field type components
- Drag-and-drop form canvas with @dnd-kit
- Field configuration panel (General, Validation, Options tabs)
- Form template CRUD API
- Form preview and edit modes
- FormRenderer for dynamic form display

**Phase 3: Form Builder Advanced - IN PROGRESS**
- Conditional logic engine (show/hide fields based on rules)
- Calculated fields with formula evaluation
- Ice Depth diagram component (25/35/47/60 point presets)
- Body diagram for injury location marking
- Ice Depth module page
- Submissions API

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14+ (App Router) |
| **Language** | TypeScript (strict mode) |
| **Database** | PostgreSQL with Prisma ORM |
| **Authentication** | JWT with httpOnly cookies, bcrypt (10 rounds) |
| **Styling** | Tailwind CSS 3.4+ |
| **Forms** | react-hook-form + zod validation |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable |
| **Date Handling** | date-fns |

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Update `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mfo_dev?schema=public"
JWT_SECRET="your-256-bit-secret-key"
JWT_EXPIRES_IN="7d"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Initialize Database

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Demo Accounts

After seeding, log in with:

| Role | Email | Password |
|------|-------|----------|
| General Manager | gm@demo.com | password123 |
| Facility Manager | manager@demo.com | password123 |
| Supervisor | supervisor@demo.com | password123 |
| Operator | operator@demo.com | password123 |

## Project Structure

```
mfo/
├── app/
│   ├── api/
│   │   ├── auth/                  # Login, logout, session
│   │   ├── form-templates/        # Template CRUD
│   │   │   └── [id]/              # Individual template ops
│   │   ├── rinks/                 # Rink management
│   │   │   └── [id]/              # Individual rink ops
│   │   └── submissions/           # Submission CRUD
│   │       └── [id]/              # Individual submission ops
│   ├── dashboard/
│   │   ├── admin/
│   │   │   └── form-templates/    # Form builder UI
│   │   │       ├── new/           # Create template
│   │   │       └── [id]/          # Edit template
│   │   ├── ice-depth/             # Ice depth module
│   │   └── page.tsx               # Main dashboard
│   ├── login/                     # Authentication UI
│   └── layout.tsx                 # Root layout
├── components/
│   ├── forms/
│   │   ├── fields/                # 12 field components
│   │   │   ├── TextField.tsx
│   │   │   ├── TextareaField.tsx
│   │   │   ├── NumberField.tsx
│   │   │   ├── SelectField.tsx
│   │   │   ├── CheckboxField.tsx
│   │   │   ├── CheckboxGroupField.tsx
│   │   │   ├── RadioField.tsx
│   │   │   ├── DateField.tsx
│   │   │   ├── SignatureField.tsx
│   │   │   ├── PhotoField.tsx
│   │   │   ├── SectionHeader.tsx
│   │   │   └── index.tsx          # FieldRenderer
│   │   ├── FormBuilder.tsx        # Drag-drop builder
│   │   ├── FormCanvas.tsx         # Drop zone
│   │   ├── FieldPalette.tsx       # Field type list
│   │   ├── FieldEditor.tsx        # Property panel
│   │   └── FormRenderer.tsx       # Dynamic form display
│   ├── specialized/
│   │   ├── IceDepthDiagram.tsx    # Interactive rink diagram
│   │   └── BodyDiagram.tsx        # Injury marker
│   ├── layout/
│   │   └── Sidebar.tsx            # Navigation
│   └── ui/                        # Shared UI components
├── lib/
│   ├── auth.ts                    # JWT utilities
│   ├── permissions.ts             # RBAC logic
│   ├── prisma.ts                  # Prisma singleton
│   └── formLogic.ts               # Conditional logic engine
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── seed.ts                    # Demo data
├── types/
│   ├── index.ts                   # Core types
│   └── forms.ts                   # Form builder types
├── public/
│   └── manifest.json              # PWA config
└── middleware.ts                  # Route protection
```

## Core Modules

| Module | Status | Description |
|--------|--------|-------------|
| **Ice Depth** | Active | Track ice thickness with visual rink diagram |
| **Ice Operations** | Planned | Resurface logs, edging, maintenance |
| **Refrigeration** | Planned | Compressor readings, brine temps |
| **Air Quality** | Planned | CO/NO2 monitoring with alerts |
| **Incidents** | In Progress | Injury reports with body diagram |
| **Schedule** | Planned | Staff scheduling |
| **Daily Checklist** | Planned | Custom daily checklists |

## Form Builder

### Field Types

| Type | Component | Description |
|------|-----------|-------------|
| `text` | TextField | Single-line input |
| `textarea` | TextareaField | Multi-line input |
| `number` | NumberField | Numeric with units |
| `select` | SelectField | Dropdown menu |
| `checkbox` | CheckboxField | Single checkbox |
| `checkbox_group` | CheckboxGroupField | Multiple options |
| `radio` | RadioField | Radio buttons |
| `date` | DateField | Date/time picker |
| `signature` | SignatureField | Canvas signature |
| `photo` | PhotoField | Multi-photo upload |
| `section_header` | SectionHeader | Visual dividers |

### Conditional Logic

Fields can be shown/hidden based on rules:

```typescript
{
  conditions: [
    { fieldId: 'severity', operator: 'equals', value: 'severe' }
  ],
  action: 'show'
}
```

Operators: `equals`, `not_equals`, `greater_than`, `less_than`, `contains`, `not_empty`, `is_empty`

### Calculated Fields

Auto-compute values with formulas:

```typescript
{
  fieldId: 'average_depth',
  formula: '(point1 + point2 + point3) / 3',
  precision: 2
}
```

## Specialized Components

### IceDepthDiagram

Interactive SVG rink diagram for ice thickness measurements:

- **Presets**: 25, 35, 47, or 60 measurement points
- **Color coding**: Green (on target), Yellow (acceptable), Red (out of range)
- **Statistics**: Auto-calculated average, min, max, range
- **Target depth**: Default 1.25" with 0.125" tolerance
- **Keyboard nav**: Tab/Enter to move between points

### BodyDiagram

Click-to-mark injury location diagram:

- **Views**: Front and back body
- **Auto-detection**: Identifies body part from click position
- **Severity levels**: Minor (yellow), Moderate (orange), Severe (red)
- **20+ body regions**: Head, neck, shoulders, arms, chest, back, legs, etc.

## API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Email/password login |
| `/api/auth/logout` | POST | Clear session |
| `/api/auth/me` | GET | Get current user |

### Form Templates

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/form-templates` | GET | List templates |
| `/api/form-templates` | POST | Create template |
| `/api/form-templates/[id]` | GET | Get template |
| `/api/form-templates/[id]` | PUT | Update template |
| `/api/form-templates/[id]` | DELETE | Delete template |

### Submissions

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/submissions` | GET | List submissions (filterable) |
| `/api/submissions` | POST | Create submission |
| `/api/submissions/[id]` | GET | Get submission |
| `/api/submissions/[id]` | PUT | Update submission |
| `/api/submissions/[id]` | DELETE | Archive submission |

Query params: `moduleType`, `rinkId`, `status`, `startDate`, `endDate`, `limit`, `offset`

### Rinks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rinks` | GET | List facility rinks |
| `/api/rinks` | POST | Create rink (admin) |
| `/api/rinks/[id]` | GET | Get rink details |
| `/api/rinks/[id]` | PUT | Update rink (admin) |
| `/api/rinks/[id]` | DELETE | Deactivate rink (admin) |

## RBAC Permissions

### Roles

| Role | Description |
|------|-------------|
| **Administrator** | Full system access |
| **Manager** | Approve reports, manage templates |
| **Operator** | Submit reports, view own data |
| **Viewer** | Read-only access |

### Module Permissions

Each module has granular permissions:
- `access` - Can view module
- `submit` - Can create submissions
- `viewAll` - Can see all submissions (not just own)
- `approve` - Can approve/reject submissions
- `export` - Can export data

## Air Quality Thresholds

Default values (configurable per facility):

| Gas | Warning | Evacuation |
|-----|---------|------------|
| CO (Carbon Monoxide) | 20 ppm | 83 ppm |
| NO2 (Nitrogen Dioxide) | 0.3 ppm | 2.0 ppm |

## Data Retention

Default periods (configurable):

| Module | Retention |
|--------|-----------|
| Ice Depth | 3 years |
| Ice Operations | 3 years |
| Refrigeration | 3 years |
| Air Quality | 3 years |
| **Incidents** | **7 years** |
| Schedule | 3 years |
| Daily Checklist | 3 years |

## Color Palette

```css
/* Primary */
--blue-600: #2563eb    /* Actions, links */
--blue-100: #dbeafe    /* Badges */

/* Status */
--green-500: #22c55e   /* Success */
--yellow-500: #eab308  /* Warning */
--red-500: #ef4444     /* Error */
--orange-500: #f97316  /* Moderate */

/* Neutral */
--gray-900: #111827    /* Primary text */
--gray-600: #4b5563    /* Secondary text */
--gray-100: #f3f4f6    /* Backgrounds */
```

## Typography

Font: Inter, system-ui, sans-serif

| Size | Usage |
|------|-------|
| `text-3xl` (1.875rem) | Page titles |
| `text-2xl` (1.5rem) | Section headers |
| `text-xl` (1.25rem) | Card titles |
| `text-lg` (1.125rem) | Subheadings |
| `text-sm` (0.875rem) | Labels |
| `text-xs` (0.75rem) | Badges |

## Security

- **Password hashing**: bcrypt with 10 salt rounds
- **Session tokens**: JWT in httpOnly cookies
- **Cookie attributes**: SameSite, Secure (production)
- **Input validation**: Zod schemas on all APIs
- **Permission checks**: Every endpoint verifies access
- **Audit logging**: All changes tracked

## Scripts

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production
npm run lint             # Run ESLint
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
npm run prisma:seed      # Seed database
```

## Roadmap

### Phase 4: Report Modules
- [ ] Incidents module page
- [ ] Air Quality module with alerts
- [ ] Refrigeration module
- [ ] Ice Operations module

### Phase 5: Advanced Features
- [ ] Daily Checklist module
- [ ] Schedule module
- [ ] SMS notifications (Twilio)
- [ ] Offline sync (IndexedDB)

### Phase 6: Reporting
- [ ] PDF export
- [ ] Analytics dashboard
- [ ] Trend charts
- [ ] Compliance reports

## License

Proprietary - All rights reserved

## Authors

- Kelly (Syracuse University)
- Claude (Anthropic)

---

**Note:** This project is under active development. Features and documentation are updated regularly.
