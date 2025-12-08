# Rink Reports by Max Facility
## Ice Rink Management Platform

Rink Reports is a comprehensive ice rink management platform designed to digitize daily operations documentation across seven core modules. The Admin module provides a drag-and-drop form builder that allows facilities to customize reports to their specific needs.

## Tech Stack

- **Frontend:** Next.js 14+, React 18+, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL
- **Authentication:** JWT with httpOnly cookies
- **Forms:** React Hook Form, @dnd-kit (drag & drop)
- **Notifications:** Email + SMS (Twilio)

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Update the `DATABASE_URL` in `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/rink_reports?schema=public"
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

| Role | Email | Password |
|------|-------|----------|
| General Manager | gm@demo.com | password123 |
| Facility Manager | manager@demo.com | password123 |
| Supervisor | supervisor@demo.com | password123 |
| Operator | operator@demo.com | password123 |
| Worker | worker@demo.com | password123 |

## Modules

1. **Ice Depth** - Track ice thickness at measurement points with visual rink diagram
2. **Ice Operations** - Ice make, circle check, edging, blade changes
3. **Refrigeration** - Refrigeration system monitoring with threshold alerts
4. **Air Quality** - CO/NO2 monitoring with compliance thresholds
5. **Incidents** - Accident reporting with body diagrams
6. **Schedule** - Employee scheduling with shift management
7. **Daily Checklist** - Custom operational checklists

## Admin Features

- Drag-and-drop form builder
- User management (5 roles)
- Facility settings
- Data retention policies
- SMS/email notification configuration

## Roles & Permissions

| Role | Access Level |
|------|-------------|
| **General Manager** | Full access, approve incidents, publish schedules, admin |
| **Facility Manager** | Full operations, limited admin, no approvals |
| **Supervisor** | Submit/view all reports, no admin, no export |
| **Operator** | Submit reports, view own data, view own schedule |
| **Worker** | Basic submit access, view own schedule |

## Development Scripts

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
npm run prisma:seed      # Seed database
```

## License

Proprietary - All rights reserved
