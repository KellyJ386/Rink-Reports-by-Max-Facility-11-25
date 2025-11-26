# MFO Ice Rink Management - API Documentation

## Overview
This document provides comprehensive API documentation for the MFO Ice Rink Management platform.

## Base URL
```
http://localhost:3000/api (development)
https://your-domain.com/api (production)
```

## Authentication
All API requests require authentication via JWT token in headers:
```
Authorization: Bearer <jwt_token>
x-user-id: <user_id>
```

## Endpoints

### Health & Status
- `GET /api/health` - Health check endpoint
- `GET /api/status` - Detailed system status

### Facilities
- `GET /api/facilities` - List all facilities
- `POST /api/facilities` - Create facility
- `GET /api/facilities/[id]` - Get facility
- `PATCH /api/facilities/[id]` - Update facility
- `DELETE /api/facilities/[id]` - Delete facility (soft delete)

### Users
- `GET /api/users/[id]` - Get user details
- `PATCH /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user (soft delete)

### Form Templates
- `GET /api/form-templates` - List form templates
- `POST /api/form-templates` - Create form template
- `GET /api/form-templates/[id]` - Get form template
- `PATCH /api/form-templates/[id]` - Update form template
- `DELETE /api/form-templates/[id]` - Delete form template

### Submissions
- `GET /api/submissions` - List submissions
- `POST /api/submissions` - Create submission
- `GET /api/submissions/[id]` - Get submission
- `PATCH /api/submissions/[id]` - Update submission

### Audit Logs
- `GET /api/audit-logs` - List audit logs with filtering
- `GET /api/audit-logs/stats` - Get audit log statistics

### Compliance
- `GET /api/compliance/reports` - Generate compliance report
  - Types: incident-summary, air-quality-compliance, safety-metrics, audit-trail, user-activity

### Export
- `GET /api/export/submissions` - Export submissions (CSV/Excel)
- `GET /api/export/compliance-report` - Export compliance report (PDF/Excel/CSV)

### Scheduled Reports
- `GET /api/scheduled-reports` - List scheduled reports
- `POST /api/scheduled-reports` - Create scheduled report
- `GET /api/scheduled-reports/[id]` - Get scheduled report
- `PATCH /api/scheduled-reports/[id]` - Update scheduled report
- `DELETE /api/scheduled-reports/[id]` - Delete scheduled report

### Webhooks
- `POST /api/webhooks/notifications` - Create notification via webhook (requires API key)

## Error Responses
All endpoints return standardized error responses with appropriate HTTP status codes:
- 200 OK - Success
- 201 Created - Resource created
- 400 Bad Request - Invalid request
- 401 Unauthorized - Missing/invalid auth
- 403 Forbidden - Insufficient permissions
- 404 Not Found - Resource not found
- 500 Internal Server Error - Server error

For detailed request/response examples, see the inline code documentation in each API route file.
