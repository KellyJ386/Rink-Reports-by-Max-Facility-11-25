.PHONY: help install dev build start test lint format clean docker-up docker-down db-setup db-reset db-migrate db-seed db-studio

# Default target
help:
	@echo "Max Facility Operations - Development Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make install      - Install dependencies"
	@echo "  make setup        - Full setup (install + db setup)"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start development server"
	@echo "  make build        - Build for production"
	@echo "  make start        - Start production server"
	@echo ""
	@echo "Testing:"
	@echo "  make test         - Run tests"
	@echo "  make test-watch   - Run tests in watch mode"
	@echo "  make test-coverage - Run tests with coverage"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint         - Run ESLint"
	@echo "  make lint-fix     - Fix ESLint issues"
	@echo "  make format       - Format code with Prettier"
	@echo "  make typecheck    - Run TypeScript check"
	@echo "  make validate     - Run all checks"
	@echo ""
	@echo "Database:"
	@echo "  make db-setup     - Generate client, migrate, and seed"
	@echo "  make db-migrate   - Run database migrations"
	@echo "  make db-seed      - Seed the database"
	@echo "  make db-reset     - Reset database (WARNING: destroys data)"
	@echo "  make db-studio    - Open Prisma Studio"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-dev   - Start dev containers (DB, Redis, Mail)"
	@echo "  make docker-up    - Start production containers"
	@echo "  make docker-down  - Stop all containers"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker-logs  - View container logs"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean        - Remove build artifacts"
	@echo "  make clean-all    - Remove all generated files"

# Setup
install:
	npm ci

setup: install db-setup
	@echo "✅ Setup complete!"

# Development
dev:
	npm run dev

build:
	npm run build

start:
	npm run start

# Testing
test:
	npm run test

test-watch:
	npm run test:watch

test-coverage:
	npm run test:coverage

# Code Quality
lint:
	npm run lint

lint-fix:
	npm run lint:fix

format:
	npm run format

typecheck:
	npm run typecheck

validate:
	npm run validate

# Database
db-setup:
	npm run db:setup

db-migrate:
	npm run prisma:migrate

db-seed:
	npm run prisma:seed

db-reset:
	@echo "⚠️  This will destroy all data. Press Ctrl+C to cancel."
	@sleep 3
	npm run prisma:reset

db-studio:
	npm run prisma:studio

# Docker
docker-dev:
	docker-compose -f docker-compose.dev.yml up -d

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down
	docker-compose -f docker-compose.dev.yml down

docker-build:
	docker build -t mfo-ice-rink:latest .

docker-logs:
	docker-compose logs -f

# Cleanup
clean:
	rm -rf .next
	rm -rf out
	rm -rf coverage

clean-all: clean
	rm -rf node_modules
	rm -rf .husky/_
