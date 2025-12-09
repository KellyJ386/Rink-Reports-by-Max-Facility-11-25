# Contributing to Max Facility Operations

Thank you for your interest in contributing to MFO! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Testing](#testing)

## Code of Conduct

Please be respectful and inclusive. We want this project to be a welcoming environment for everyone.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/Rink-Reports-by-Max-Facility-11-25.git`
3. Add upstream remote: `git remote add upstream https://github.com/KellyJ386/Rink-Reports-by-Max-Facility-11-25.git`

## Development Setup

### Prerequisites

- Node.js 20+
- npm 10+
- Docker & Docker Compose (for database)
- Git

### Quick Start

```bash
# Install dependencies
make install

# Start development database
make docker-dev

# Setup database (generate client, migrate, seed)
make db-setup

# Start development server
make dev
```

### Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Configure the required variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Minimum 32 character secret

### Demo Accounts

After seeding, these accounts are available:

| Role | Email | Password |
|------|-------|----------|
| General Manager | gm@demo.com | password123 |
| Facility Manager | manager@demo.com | password123 |
| Supervisor | supervisor@demo.com | password123 |
| Operator | operator@demo.com | password123 |

## Making Changes

### Branch Naming

Use descriptive branch names:
- `feat/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Code refactoring
- `test/description` - Test additions/changes

### Workflow

1. Sync with upstream: `git fetch upstream && git rebase upstream/main`
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Run validation: `make validate`
5. Commit your changes (see Commit Guidelines)
6. Push to your fork: `git push origin feat/my-feature`
7. Open a Pull Request

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, no code change
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `build`: Build system or dependencies
- `ci`: CI configuration
- `chore`: Other changes

### Examples

```
feat(dashboard): add weekly analytics chart
fix(auth): resolve session timeout issue
docs(api): update endpoint documentation
refactor(forms): extract validation logic
```

## Pull Request Process

1. **Title**: Use conventional commit format
2. **Description**: Include:
   - Summary of changes
   - Related issue number (if applicable)
   - Screenshots for UI changes
   - Testing instructions
3. **Checklist**:
   - [ ] Tests pass (`make test`)
   - [ ] Linting passes (`make lint`)
   - [ ] TypeScript compiles (`make typecheck`)
   - [ ] Documentation updated (if needed)
   - [ ] Database migrations included (if needed)

### Review Process

- PRs require at least one approval
- Address all review comments
- Keep PRs focused and reasonably sized
- Squash commits before merge if requested

## Code Style

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Prefer interfaces over types for objects
- Use explicit return types for functions

### React

- Use functional components with hooks
- Prefer named exports
- Keep components focused and small
- Use `'use client'` directive only when needed

### File Organization

```
app/                  # Next.js app router pages
  api/                # API routes
  (routes)/           # Page routes
components/           # React components
  ui/                 # Generic UI components
  [feature]/          # Feature-specific components
lib/                  # Utility functions and services
types/                # TypeScript type definitions
prisma/               # Database schema and migrations
```

### Naming Conventions

- **Files**: `kebab-case.ts` or `PascalCase.tsx` for components
- **Components**: `PascalCase`
- **Functions/Variables**: `camelCase`
- **Constants**: `SCREAMING_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`

## Testing

### Running Tests

```bash
make test           # Run all tests
make test-watch     # Watch mode
make test-coverage  # With coverage report
```

### Test Structure

```
__tests__/
  api/              # API route tests
  components/       # Component tests
  lib/              # Utility tests
  mocks/            # Test mocks and factories
  utils/            # Test utilities
```

### Writing Tests

- Test behavior, not implementation
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies

### Example Test

```typescript
describe('NotificationBell', () => {
  it('should show unread count badge when there are unread notifications', async () => {
    // Arrange
    mockFetch({ notifications: [...], unreadCount: 5 })

    // Act
    render(<NotificationBell />)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument()
    })
  })
})
```

## Database Changes

When modifying the database schema:

1. Update `prisma/schema.prisma`
2. Generate migration: `npx prisma migrate dev --name descriptive-name`
3. Update seed script if needed
4. Test migration rollback
5. Document breaking changes

## Questions?

If you have questions:
1. Check existing issues and discussions
2. Open a new issue with the "question" label
3. Reach out to maintainers

Thank you for contributing!
