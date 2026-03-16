# Technical Architecture

## Architecture Principles

- Keep Clairio's internal task model independent from ClickUp
- Treat analytics as a first-class capability, not a reporting afterthought
- Separate current-state operational data from historical reporting data
- Design for gradual migration from read-only sync to native task management

## Recommended Stack

- Frontend: Next.js
- Backend: Next.js server routes or a dedicated Node.js API service
- Database: PostgreSQL
- ORM: Prisma
- Jobs: Trigger.dev, BullMQ, or Temporal
- Auth: NextAuth, Clerk, or Auth0
- Charts: Recharts, Nivo, or ECharts
- Product analytics: PostHog
- Hosting: Vercel plus managed Postgres and a background worker service

## High-Level Components

### 1. Web Application

- Dashboard pages
- Team, initiative, and user views
- Search and filter UI
- Charting components

### 2. API Layer

- Authenticated read endpoints for dashboards
- Aggregation endpoints for charts and KPIs
- Admin endpoints for sync status and data quality

### 3. Sync And Ingestion Layer

- Scheduled ClickUp sync jobs
- Webhook handlers if available and reliable enough
- Normalization pipeline that maps ClickUp fields into internal entities
- Retry and dead-letter handling for sync failures

### 4. Operational Database

- Current state of users, teams, initiatives, tasks, and task assignments
- Source mapping to ClickUp identifiers

### 5. Analytics / History Store

- Daily or event-driven task snapshots
- Status transition history
- Scope change history
- Completion timestamps

## Data Flow

1. Scheduled job requests updates from ClickUp
2. Raw source data is transformed into normalized entities
3. Current-state tables are upserted
4. Historical snapshots are written for reporting
5. Aggregation queries or materialized views power dashboards

## Core Domain Model

### User

- id
- external_source_id
- name
- email
- role
- team_id
- active

### Team

- id
- name
- parent_team_id

### Initiative

- id
- external_source_id
- name
- status
- owner_id
- target_date

### Task

- id
- external_source_id
- title
- description
- status
- priority
- estimate_points
- estimate_hours
- due_date
- start_date
- completed_at
- blocked_flag
- initiative_id
- parent_task_id
- source_system

### Task Assignment

- task_id
- user_id
- assignment_type

### Task Snapshot

- id
- task_id
- snapshot_date
- status
- owner_ids
- estimate_points
- estimate_hours
- due_date
- blocked_flag
- completed_at

### Task Status Event

- id
- task_id
- previous_status
- new_status
- changed_at

## Suggested Database Strategy

- Use normalized relational tables for operational state
- Add summary tables or materialized views for expensive KPI queries
- Partition snapshot tables if history volume grows quickly

## MVP Integrations

- ClickUp API for tasks and metadata
- Company authentication provider
- Slack or email provider for digests, optional near MVP end

## Security And Permissions

- SSO-ready authentication from the start
- Role-based authorization by org role and team scope
- Audit logs for admin actions and sync operations

## Observability

- Sync job success/failure rate
- API latency
- Dashboard query timings
- Data freshness timestamp visible in UI

## Migration Path Beyond MVP

### Stage 1

- Read-only ClickUp sync
- Dashboards and analytics only

### Stage 2

- Native status/blocker updates in Mission Control
- Write-back to ClickUp if needed during transition

### Stage 3

- Native task creation and editing
- ClickUp becomes fallback or import-only source

## Technical Decisions To Make Early

- Whether to use polling only or combine with webhooks
- Whether burndown is based on story points, effort hours, or task counts
- Whether initiatives come from ClickUp folders, lists, or custom fields
- How to define cross-team permissions
