# Max Facility Operations (MFO)
## Ice Rink Management SaaS Platform

MFO is a comprehensive ice rink management platform designed to digitize daily operations documentation across seven core modules. The Admin module serves as the "brain" of the application, providing a drag-and-drop form builder that allows facilities to customize reports to their specific needs while maintaining compliance with industry regulations.

## 🚀 Current Status

**Phase 1: Foundation - COMPLETE**

✅ Next.js 14+ project with TypeScript
✅ Prisma ORM with comprehensive PostgreSQL schema
✅ JWT-based authentication system
✅ Role-based access control (RBAC)
✅ Basic dashboard layout and navigation

**Phase 2: Form Builder Core - COMPLETE**

✅ Field type components (text, number, select, checkbox, radio, date/time, signature, photo)
✅ Drag-and-drop form canvas with @dnd-kit
✅ Field configuration panel with validation settings
✅ Form template CRUD API routes
✅ Form preview mode with validation

**Phase 3: Form Builder Advanced - COMPLETE**

✅ Conditional logic builder (show/hide/require/disable based on field values)
✅ Calculated fields with formula support
✅ Ice depth grid specialized field (25, 35, 47 point presets)
✅ Body diagram specialized field for incident reports
✅ Form versioning system with version history

**Phase 4: Report Modules - COMPLETE**

✅ Universal header component (rink selector, date/time, temperature)
✅ Form renderer component for data entry
✅ Submission CRUD API routes
✅ Ice Depth module page
✅ Ice Operations module page

**Coming Next:**
- Phase 5: Additional Modules (Refrigeration, Air Quality, Incidents)

## 🏗️ Tech Stack

- **Frontend:** Next.js 14+, React 18+, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL
- **Authentication:** JWT with httpOnly cookies
- **Forms:** React Hook Form
- **Drag & Drop:** @dnd-kit
- **Offline:** IndexedDB (PWA)

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure your database:

```bash
cp .env.example .env
```

Update the `DATABASE_URL` in `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mfo_dev?schema=public"
```

### 3. Initialize Database

Generate Prisma Client:

```bash
npm run prisma:generate
```

Run database migrations:

```bash
npm run prisma:migrate
```

Seed the database with demo data:

```bash
npm run prisma:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## 🔑 Demo Accounts

After seeding, you can log in with:

| Role | Email | Password |
|------|-------|----------|
| General Manager | gm@demo.com | password123 |
| Facility Manager | manager@demo.com | password123 |
| Supervisor | supervisor@demo.com | password123 |
| Operator | operator@demo.com | password123 |

## 📊 Database Schema

The database includes the following main entities:

- **Facilities & Rinks** - Multi-rink facility management
- **Users & Roles** - RBAC with customizable permissions
- **Form Templates** - Dynamic form builder schema
- **Submissions** - User-submitted reports with attachments
- **Schedule** - Employee scheduling with shifts
- **Notifications** - In-app, email, and SMS alerts
- **Audit Logs** - Complete audit trail

See `prisma/schema.prisma` for the complete schema.

## 🔐 Security Features

- JWT tokens with httpOnly cookies
- Password hashing with bcrypt
- Role-based permissions system
- Audit logging for all actions
- Protected API routes
- Middleware authentication

## 📱 Module Overview

### Core Modules

1. **Ice Depth** - Track ice thickness at measurement points
2. **Ice Operations** - Ice make, circle check, edging, blade changes
3. **Refrigeration** - Custom refrigeration system monitoring
4. **Air Quality** - CO/NO2 monitoring with compliance thresholds
5. **Incidents** - Accident reporting with body diagrams
6. **Schedule** - Employee scheduling with shift management
7. **Daily Checklist** - Custom operational checklists

### Admin Module

- Drag-and-drop form builder
- User management
- Role management
- Facility settings
- Data retention policies
- SMS/email configuration

## 🗂️ Project Structure

```
mfo/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   └── form-templates/ # Form template CRUD
│   ├── dashboard/         # Protected dashboard routes
│   │   └── admin/         # Admin pages (forms, users, settings)
│   ├── login/             # Login page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Root page (redirects to login)
├── components/            # React components
│   ├── form-builder/      # Form builder components
│   │   ├── fields/        # Field type components
│   │   ├── FormBuilder.tsx
│   │   ├── FormCanvas.tsx
│   │   ├── FieldPalette.tsx
│   │   └── FieldConfigPanel.tsx
│   └── layout/           # Layout components (Sidebar, etc.)
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication utilities
│   ├── permissions.ts    # Permission checking
│   └── prisma.ts         # Prisma client
├── prisma/               # Prisma configuration
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data
├── types/                # TypeScript types
│   ├── index.ts          # Shared types
│   └── form-builder.ts   # Form builder types
└── middleware.ts         # Route protection middleware
```

## 🔧 Development Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
npm run prisma:seed      # Seed database
```

## 🎯 Default Roles & Permissions

### General Manager
- Full access to all modules
- Can approve incidents
- Can publish schedules
- Full admin access

### Facility Manager
- Full operational access
- Limited admin settings
- Cannot approve incidents or publish schedules

### Supervisor
- Can submit and view reports
- Can view all data
- No admin access
- Cannot export

### Operator
- Can submit reports
- Can view own submissions
- Can view own schedule
- Limited access

## 📖 API Routes

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout current user
- `GET /api/auth/me` - Get current user session

### Form Templates
- `GET /api/form-templates` - List all templates for facility
- `POST /api/form-templates` - Create new template
- `GET /api/form-templates/[id]` - Get single template
- `PUT /api/form-templates/[id]` - Update template
- `DELETE /api/form-templates/[id]` - Delete/deactivate template
- `GET /api/form-templates/[id]/versions` - Get version history
- `POST /api/form-templates/[id]/versions` - Create new version

### Submissions
- `GET /api/submissions` - List submissions with filters
- `POST /api/submissions` - Create new submission
- `GET /api/submissions/[id]` - Get single submission
- `PUT /api/submissions/[id]` - Update submission
- `DELETE /api/submissions/[id]` - Archive submission

### Rinks
- `GET /api/rinks` - List rinks for facility

## 🚧 Roadmap

### Phase 2: Form Builder Core - COMPLETE
- [x] Field type components (text, textarea, number, email, phone, date, time, select, checkbox, radio, toggle, signature, photo, section, divider)
- [x] Drag-and-drop form canvas with @dnd-kit
- [x] Field configuration panel with validation settings
- [x] Form template CRUD API routes
- [x] Form preview mode with validation

### Phase 3: Form Builder Advanced - COMPLETE
- [x] Conditional logic builder (show/hide/require/disable actions)
- [x] Calculated fields with formula evaluation
- [x] Ice depth grid specialized field (25, 35, 47 point presets)
- [x] Body diagram specialized field for incident reports
- [x] Form versioning system with version history UI

### Phase 4: Report Modules - COMPLETE
- [x] Universal header component (rink, date/time, temperature)
- [x] Form renderer component for data entry
- [x] Submission CRUD API routes
- [x] Ice Depth module page with form submission
- [x] Ice Operations module page with quick actions

### Phase 5-8
See `SPEC.md` for complete implementation phases.

## 📄 License

Proprietary - All rights reserved

## 👥 Authors

- Kelly (Syracuse University)
- Claude (Anthropic)

## 🤝 Contributing

This is a proprietary project. Contact the project owner for contribution guidelines.

---

**Note:** This project is under active development. Features and documentation will be updated regularly.
