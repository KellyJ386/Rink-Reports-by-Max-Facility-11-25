# Max Facility Operations (MFO)

## Ice Rink Management SaaS Platform

MFO is a comprehensive ice rink management platform designed to digitize daily operations documentation across seven core modules. The Admin module serves as the "brain" of the application, providing a drag-and-drop form builder that allows facilities to customize reports to their specific needs while maintaining compliance with industry regulations.

## Current Status: **Production Ready** (78%)

### Completed Features

- Next.js 14 with TypeScript and App Router
- PostgreSQL database with Prisma ORM (21 models)
- JWT authentication with role-based access control
- Complete form builder with drag-and-drop
- All 7 core reporting modules
- Staff scheduling with conflict detection
- Incident reporting with escalation workflows
- Equipment tracking and maintenance
- Analytics dashboard with CSV export
- Push notifications system
- PWA support for mobile

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | JWT with httpOnly cookies |
| Testing | Vitest (163 test files) |
| Forms | React Hook Form + Zod |
| Drag & Drop | @dnd-kit |

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your database URL and secrets

# 3. Setup database
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| General Manager | gm@demo.com | password123 |
| Manager | manager@demo.com | password123 |
| Supervisor | supervisor@demo.com | password123 |
| Operator | operator@demo.com | password123 |

## Core Modules

### Reporting Modules
- **Ice Depth** - Track ice thickness measurements with Bluetooth sensor support
- **Ice Operations** - Resurfacing, edging, blade changes, circle checks
- **Refrigeration** - Compressor monitoring and temperature logs
- **Air Quality** - CO/CO2 monitoring with compliance thresholds
- **Incidents** - Accident reporting with body diagrams and follow-up workflows
- **Daily Checklist** - Customizable operational checklists

### Management Modules
- **Schedule** - Shift management with conflict detection and swap requests
- **Equipment** - Inventory tracking and maintenance scheduling
- **Analytics** - Real-time metrics with date filtering and CSV export
- **Notifications** - Push, email, and SMS alerts

### Admin Module
- Drag-and-drop form builder with 15+ field types
- Conditional logic and calculated fields
- Form versioning
- User and role management
- Facility settings
- Audit logging

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # 41 API endpoints
│   ├── dashboard/         # Protected pages (34 pages)
│   └── login/             # Authentication
├── components/            # 64 React components
│   ├── form-builder/      # Drag-and-drop builder
│   ├── reports/           # Report viewing/editing
│   ├── schedule/          # Scheduling UI
│   └── ui/                # shadcn/ui components
├── contexts/              # React contexts (Auth)
├── hooks/                 # Custom hooks (useApi, useBluetooth)
├── lib/                   # Utilities and helpers
├── prisma/                # Schema and migrations
├── public/                # Static assets + PWA icons
└── types/                 # TypeScript definitions
```

## Environment Variables

```env
# Required
DATABASE_URL="postgresql://user:pass@localhost:5432/mfo"
JWT_SECRET="min-32-character-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional - Email (Resend)
RESEND_API_KEY=""
EMAIL_FROM=""

# Optional - SMS (Twilio)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""

# Optional - Weather
OPENWEATHER_API_KEY=""
```

## Scripts

```bash
npm run dev              # Development server
npm run build            # Production build
npm run start            # Production server
npm run lint             # ESLint
npm run test             # Vitest watch mode
npm run test:run         # Vitest single run
npm run test:coverage    # Coverage report
npm run prisma:studio    # Database GUI
```

## API Overview

| Endpoint | Description |
|----------|-------------|
| `/api/auth/*` | Authentication (login, logout, me) |
| `/api/submissions` | Form submissions CRUD |
| `/api/incidents` | Incident reports with follow-ups |
| `/api/checklists` | Checklist instances and templates |
| `/api/equipment` | Equipment and maintenance |
| `/api/schedules` | Staff scheduling |
| `/api/analytics` | Dashboard metrics |
| `/api/notifications` | Push notifications |
| `/api/admin/*` | User/role management |

## Role Permissions

| Capability | Operator | Supervisor | Manager | GM |
|------------|:--------:|:----------:|:-------:|:--:|
| Submit reports | ✅ | ✅ | ✅ | ✅ |
| View all reports | ❌ | ✅ | ✅ | ✅ |
| Export data | ❌ | ❌ | ✅ | ✅ |
| Manage schedule | ❌ | ✅ | ✅ | ✅ |
| Admin access | ❌ | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ✅ |

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

### Docker
```bash
docker build -t mfo .
docker run -p 3000:3000 --env-file .env.local mfo
```

## Security Features

- JWT tokens with httpOnly cookies
- Password hashing (bcrypt)
- Role-based access control
- Middleware route protection
- Input validation (Zod)
- Complete audit logging
- XSS/CSRF protection

## License

Proprietary - All rights reserved

## Authors

- Kelly (Syracuse University)
- Claude (Anthropic)
