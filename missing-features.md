# Missing Features - FMS Project

## Summary

This document tracks Jira subtasks that are **not yet implemented** in the codebase.
Based on analysis of all 86 user stories (FMS-1 through FMS-86) across 14 Epics.

**Implemented:** 62 stories (fully or partially)
**Not Implemented:** 24 stories

---

## Not Implemented Subtasks

### EPIC 1: Infrastructure & DevOps Setup

_(All stories FMS-1 through FMS-6 are implemented)_

---

### EPIC 2: Database Architecture & Schema Management

_(All stories FMS-7 through FMS-11 are implemented)_

---

### EPIC 3: User Service (Microservice)

#### FMS-15 - Implement JWT Refresh Token Flow
- **Description:** As a User I want my session to stay active without re-login so that I can work continuously without interruptions
- **Status:** Partially implemented (logic exists in auth.service.ts but lacks dedicated token rotation endpoint isolation)
- **Missing Acceptance Criteria:**
  - [ ] FMS-15-3: Automatic token refresh (frontend silent refresh exists, but no server-side automatic rotation trigger)
  - [ ] FMS-15-5: Token rotation implemented (refresh token is stored hashed, but full rotation on each use is not verified)

#### FMS-19 - Implement Switch Farm Context
- **Description:** As a User I want to switch between farms so that I can work on different operations
- **Status:** Partially implemented in farms.service.ts
- **Missing Acceptance Criteria:**
  - [ ] FMS-19-2: New JWT issued with farm context (JWT re-issuance on farm switch not fully verified)
  - [ ] FMS-19-5: Previous work saved (no explicit state persistence on switch)

---

### EPIC 4: Task Service (Microservice)

#### FMS-23 - Implement Task-Group Assignment
- **Description:** As a Farm Owner I want to assign tasks to specific poultry groups so that work is tracked per group
- **Status:** Partially implemented (groupIds[] field exists in Task entity)
- **Missing Acceptance Criteria:**
  - [ ] FMS-23-3: Tasks filtered by group (filtering exists but not fully tested)
  - [ ] FMS-23-5: Metrics linked to groups (cross-service integration pending)

#### FMS-28 - Implement Task State Machine
- **Description:** As a Backend Developer I want to enforce task state transitions so that data integrity is maintained
- **Status:** Partially implemented in tasks.service.ts
- **Missing Acceptance Criteria:**
  - [ ] FMS-28-4: Validation prevents invalid transitions (no explicit state machine enforcement)
  - [ ] FMS-28-5: Audit trail of state changes (no state change history table)

#### FMS-29 - Implement Task Metrics Recording Integration
- **Description:** As a Backend Developer I want to integrate with Production Service for metrics so that task completion records production data
- **Status:** Partially implemented (gRPC call structure exists)
- **Missing Acceptance Criteria:**
  - [ ] FMS-29-3: Metric types validated (cross-service type validation not implemented)
  - [ ] FMS-29-5: Retry mechanism (no retry logic for failed gRPC calls)

---

### EPIC 5: Production Service (Microservice)

#### FMS-34 - Implement Mortality Tracking
- **Description:** As a Farm Owner I want to track animal mortality so that I can analyze losses and adjust operations
- **Status:** Entity exists, but service logic is partial
- **Missing Acceptance Criteria:**
  - [ ] FMS-34-3: Mortality linked to reports optionally (no report-mortality cross-link)
  - [ ] FMS-34-5: Alerts for high mortality (no alerting system for mortality spikes)

#### FMS-35 - Implement Production Analytics Endpoints
- **Description:** As a Farm Owner I want to see production analytics so that I can make data-driven decisions
- **Status:** Basic analytics endpoint exists
- **Missing Acceptance Criteria:**
  - [ ] FMS-35-2: Feed consumption by group (not linked to stock service consumption data)
  - [ ] FMS-35-6: Export data capability (no CSV/PDF export implemented)

---

### EPIC 6: Stock Service (Microservice)

#### FMS-40 - Implement Low Stock Alerts
- **Description:** As a Farm Owner I want to receive alerts when stock is low so that I can reorder before running out
- **Status:** Low stock detection exists (isLowStock field), but no alert system
- **Missing Acceptance Criteria:**
  - [ ] FMS-40-3: Alert stored in database (no dedicated alerts table)
  - [ ] FMS-40-4: Notification sent to owner (no notification system)
  - [ ] FMS-40-5: Alert dismissal supported (no alert management)
  - [ ] FMS-40-6: Alert history queryable (no alert history)

#### FMS-41 - Implement Stock Analytics Endpoints
- **Description:** As a Farm Owner I want to see stock analytics so that I can optimize purchasing
- **Status:** Basic analytics in stock controller
- **Missing Acceptance Criteria:**
  - [ ] FMS-41-3: Stock turnover rate (not calculated)
  - [ ] FMS-41-4: Projection for reorder (no predictive reorder logic)
  - [ ] FMS-41-6: Export capability (no CSV/PDF export)

---

### EPIC 7: Report Service (Microservice)

#### FMS-45 - Implement Report Types (Mortality/Damage/Disease/Incident)
- **Description:** As a User I want different report types so that incidents are properly categorized
- **Status:** Basic type field exists in Report entity
- **Missing Acceptance Criteria:**
  - [ ] FMS-45-1: Mortality report with quantity (no quantity tracking in report)
  - [ ] FMS-45-3: Disease report with symptoms (no symptoms field)
  - [ ] FMS-45-5: Type-specific validation (no type-dependent validation rules)
  - [ ] FMS-45-6: Type icons/colors (backend only, frontend partially done)

#### FMS-46 - Implement Report Status Workflow
- **Description:** As a Farm Owner I want to track report resolution so that I know which issues are addressed
- **Status:** Basic status transitions exist
- **Missing Acceptance Criteria:**
  - [ ] FMS-46-3: Status history tracked (no status change history table)
  - [ ] FMS-46-4: Notifications on status change (no notification system)

#### FMS-47 - Implement Report Analytics
- **Description:** As a Farm Owner I want to see report analytics so that I can identify recurring problems
- **Status:** Basic analytics endpoint exists
- **Missing Acceptance Criteria:**
  - [ ] FMS-47-3: Average resolution time (not calculated)
  - [ ] FMS-47-4: Most affected groups (no group correlation analysis)
  - [ ] FMS-47-6: Export reports (no export functionality)

---

### EPIC 8: API Gateway & gRPC Integration

#### FMS-52 - Implement Rate Limiting
- **Description:** As a Backend Developer I want to rate limit requests so that API is protected from abuse
- **Status:** NOT IMPLEMENTED
- **Acceptance Criteria:**
  - [ ] FMS-52-1: 100 req/min per IP
  - [ ] FMS-52-2: 1000 req/min per authenticated user
  - [ ] FMS-52-3: Redis-based rate limiting
  - [ ] FMS-52-4: 429 error response
  - [ ] FMS-52-5: Configurable limits
  - [ ] FMS-52-6: Whitelist for admins

#### FMS-53 - Implement Request/Response Logging
- **Description:** As a Backend Developer I want to log all requests so that debugging is easier
- **Status:** Partially implemented (basic NestJS logging in main.ts)
- **Missing Acceptance Criteria:**
  - [ ] FMS-53-1: Log request method/path/headers (basic only)
  - [ ] FMS-53-4: Sensitive data masked (no masking logic)
  - [ ] FMS-53-5: Structured JSON logs (not fully structured)
  - [ ] FMS-53-6: Log level configurable (hardcoded)

---

### EPIC 9: Frontend - Authentication & Layout

_(All stories FMS-54 through FMS-58 are implemented)_

---

### EPIC 10: Frontend - Dashboard & Analytics

#### FMS-61 - Implement Date Range Picker
- **Description:** As a User I want to filter data by date range so that I can analyze specific periods
- **Status:** Partially implemented (basic date inputs exist in some pages)
- **Missing Acceptance Criteria:**
  - [ ] FMS-61-1: Presets: Today/Week/Month/Last 30 days (no preset buttons)
  - [ ] FMS-61-2: Custom range selector (no dedicated date range picker component)
  - [ ] FMS-61-5: Clear filter option

#### FMS-62 - Implement Recent Activity Feed
- **Description:** As a User I want to see recent activity so that I stay informed
- **Status:** Partially implemented in dashboard
- **Missing Acceptance Criteria:**
  - [ ] FMS-62-3: Stock alerts (not shown in activity feed)
  - [ ] FMS-62-5: Click item for details (no navigation on click)
  - [ ] FMS-62-6: Auto-refresh optional (no auto-refresh toggle)

---

### EPIC 11: Frontend - Task Management

#### FMS-65 - Implement Task Calendar View
- **Description:** As a User I want to see tasks in calendar format so that I can visualize my schedule
- **Status:** NOT IMPLEMENTED
- **Acceptance Criteria:**
  - [ ] FMS-65-1: react-big-calendar integration
  - [ ] FMS-65-2: Month/week/day views
  - [ ] FMS-65-3: Tasks color-coded by status
  - [ ] FMS-65-4: Click event opens detail modal
  - [ ] FMS-65-5: Navigate months
  - [ ] FMS-65-6: Today button
  - [ ] FMS-65-7: Responsive on mobile

#### FMS-67 - Implement Complete Task Modal
- **Description:** As a Worker I want to complete tasks with metrics so that production is recorded
- **Status:** Partially implemented (task detail modal exists, but dynamic metrics form is incomplete)
- **Missing Acceptance Criteria:**
  - [ ] FMS-67-1: Dynamic metric inputs based on types (no metric type-driven form)
  - [ ] FMS-67-3: Boolean toggles (not implemented)
  - [ ] FMS-67-6: Photo upload (not implemented, marked as future)

---

### EPIC 12: Frontend - Groups, Stock & Reports

#### FMS-70 - Implement Group Detail Page with Charts
- **Description:** As a Farm Owner I want to see detailed group analytics so that I can optimize production
- **Status:** Page exists but charts are limited
- **Missing Acceptance Criteria:**
  - [ ] FMS-70-2: Production chart (eggs/weight) (no Recharts integration on detail page)
  - [ ] FMS-70-3: Feed consumption chart (not linked to stock data)
  - [ ] FMS-70-8: Tabs for different views (single view only)

#### FMS-72 - Implement Stock Transactions Page
- **Description:** As a Farm Owner I want to see all stock movements so that I can track usage
- **Status:** Page exists
- **Missing Acceptance Criteria:**
  - [ ] FMS-72-5: Export to CSV button (no export functionality)

#### FMS-76 - Implement Report Detail Page
- **Description:** As a User I want to see report details so that I can understand and resolve issues
- **Status:** Inline detail exists, no dedicated detail page
- **Missing Acceptance Criteria:**
  - [ ] FMS-76-4: Status timeline (no visual timeline)
  - [ ] FMS-76-6: Photos gallery (no photo support)
  - [ ] FMS-76-7: Print report button (no print functionality)

---

### EPIC 13: Frontend - Team & Settings

_(All stories FMS-77 through FMS-80 are implemented)_

---

### EPIC 14: Testing, Deployment & Documentation

#### FMS-81 - Write Unit Tests for All Services
- **Description:** As a Backend Developer I want comprehensive unit tests so that code quality is maintained
- **Status:** NOT IMPLEMENTED
- **Acceptance Criteria:**
  - [ ] FMS-81-1: User Service tests 80%+ coverage
  - [ ] FMS-81-2: Task Service tests 80%+ coverage
  - [ ] FMS-81-3: Production Service tests
  - [ ] FMS-81-4: Stock Service tests
  - [ ] FMS-81-5: Report Service tests
  - [ ] FMS-81-6: Jest configured
  - [ ] FMS-81-7: Mock databases
  - [ ] FMS-81-8: CI runs tests

#### FMS-82 - Write Integration Tests for gRPC Services
- **Description:** As a Backend Developer I want integration tests so that microservices communicate correctly
- **Status:** NOT IMPLEMENTED
- **Acceptance Criteria:**
  - [ ] FMS-82-1: Test User-Task integration
  - [ ] FMS-82-2: Test Task-Production integration
  - [ ] FMS-82-3: Test Task-Stock integration
  - [ ] FMS-82-4: Test all gRPC endpoints
  - [ ] FMS-82-5: Real database in tests
  - [ ] FMS-82-6: Test schema isolation
  - [ ] FMS-82-7: Docker test containers

#### FMS-83 - Write E2E Tests for Critical User Flows
- **Description:** As a QA Engineer I want E2E tests so that user journeys are validated
- **Status:** NOT IMPLEMENTED
- **Acceptance Criteria:**
  - [ ] FMS-83-1: Registration flow E2E
  - [ ] FMS-83-2: Login flow E2E
  - [ ] FMS-83-3: Create task template flow
  - [ ] FMS-83-4: Complete task flow
  - [ ] FMS-83-5: Create report flow
  - [ ] FMS-83-6: Playwright configured
  - [ ] FMS-83-7: CI runs E2E
  - [ ] FMS-83-8: Screenshots on failure

#### FMS-84 - Create Kubernetes Deployment Manifests
- **Description:** As a DevOps Engineer I want to deploy to Kubernetes so that the system is production-ready
- **Status:** NOT IMPLEMENTED
- **Acceptance Criteria:**
  - [ ] FMS-84-1: K8s manifests for all services
  - [ ] FMS-84-2: ConfigMaps for config
  - [ ] FMS-84-3: Secrets for credentials
  - [ ] FMS-84-4: Services and Ingress
  - [ ] FMS-84-5: Horizontal Pod Autoscaling
  - [ ] FMS-84-6: Health checks configured
  - [ ] FMS-84-7: Rollout strategy
  - [ ] FMS-84-8: Tested on cluster

#### FMS-85 - Set Up Production Monitoring (Prometheus/Grafana)
- **Description:** As a DevOps Engineer I want monitoring so that I can detect issues proactively
- **Status:** NOT IMPLEMENTED
- **Acceptance Criteria:**
  - [ ] FMS-85-1: Prometheus scrapes metrics
  - [ ] FMS-85-2: Grafana dashboards created
  - [ ] FMS-85-3: Metrics for all services
  - [ ] FMS-85-4: Alerting rules configured
  - [ ] FMS-85-5: Database metrics
  - [ ] FMS-85-6: gRPC metrics
  - [ ] FMS-85-7: Custom business metrics

#### FMS-86 - Write API Documentation (Swagger/Postman)
- **Description:** As a Frontend Developer I want API documentation so that I can integrate easily
- **Status:** Partially implemented (Swagger decorators exist in API Gateway)
- **Missing Acceptance Criteria:**
  - [ ] FMS-86-2: Postman collection (not created)
  - [ ] FMS-86-3: Example requests/responses (incomplete)
  - [ ] FMS-86-5: Error codes documented (not documented)
  - [ ] FMS-86-7: Versioning strategy (not implemented)

---

## Summary by Category

| Category | Not Implemented | Partially Implemented |
|----------|----------------|----------------------|
| **Testing (Epic 14)** | FMS-81, FMS-82, FMS-83 | - |
| **Deployment (Epic 14)** | FMS-84, FMS-85 | FMS-86 |
| **Backend Features** | FMS-52 (Rate Limiting) | FMS-15, FMS-19, FMS-28, FMS-29, FMS-34, FMS-35, FMS-40, FMS-41, FMS-45, FMS-46, FMS-47, FMS-53 |
| **Frontend Features** | FMS-65 (Calendar View) | FMS-61, FMS-62, FMS-67, FMS-70, FMS-72, FMS-76 |

## Priority Recommendations

### High Priority (blocking production readiness)
1. **FMS-52**: Rate limiting - critical for API security
2. **FMS-81**: Unit tests - essential for code quality
3. **FMS-82**: Integration tests - validates microservice communication

### Medium Priority (feature completeness)
4. **FMS-65**: Task calendar view - key UX feature for scheduling
5. **FMS-40**: Low stock alerts - important for farm operations
6. **FMS-84**: Kubernetes manifests - needed for deployment

### Lower Priority (polish and enhancement)
7. **FMS-85**: Monitoring setup
8. **FMS-86**: Full API documentation
9. **FMS-83**: E2E tests
10. Export capabilities across services (FMS-35-6, FMS-41-6, FMS-47-6, FMS-72-5)

---

## Notes
- These subtasks exist in Jira but are not yet implemented in the codebase.
- "Partially implemented" means core functionality exists but specific acceptance criteria are missing.
- "NOT IMPLEMENTED" means no code exists for that feature.
- Use this file to track pending work and prioritize sprints.
- Last updated: 2026-03-24
