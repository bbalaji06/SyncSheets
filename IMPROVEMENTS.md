# SheetSync Improvements

## Purpose

This document captures the highest-value improvements that would make SheetSync more user-friendly, easier to use repeatedly, and safer to trust with production data.

It is based on the current implementation in:

- `app/login/page.tsx`
- `app/dashboard/page.tsx`
- `app/sync/new/page.tsx`
- `app/api/sheets/route.ts`
- `app/api/sync/route.ts`
- `lib/auth.ts`
- `lib/auth.config.ts`
- `lib/googleSheets.ts`
- `lib/supabaseExecutor.ts`
- `lib/schemaInference.ts`
- `db/schema.ts`

## Current State Summary

The app already has a promising core flow:

- Google OAuth login
- spreadsheet tab discovery
- schema inference
- automatic table creation
- batch sync into Supabase
- live sync logs in the UI

However, it still behaves more like a prototype than a polished product:

- users must paste sensitive credentials for every sync
- there is no real sync history page even though the UI links to one
- saved connections and job tables exist in the schema but are not used
- there is little validation, guardrail, or recovery support around destructive or sensitive actions
- the app currently optimizes for getting a sync done, not for repeatability, supportability, or least-privilege security

## Priorities

## 1. User Experience Improvements

### 1.1 Build a real dashboard

Current issue:

- the dashboard is mostly placeholder content
- stats are hard-coded
- "Recent Sync Jobs" does not reflect actual runs

Improve by:

- showing recent sync runs from `ss_sync_jobs`
- showing success/failure state and timestamps
- showing saved connections and recently used spreadsheets
- surfacing the last synced table and row count

Why it matters:

- users should land somewhere informative after login
- the app feels much more trustworthy when it remembers what happened

### 1.2 Add a real history page

Current issue:

- the sidebar links to `/history`, but no page exists

Improve by:

- creating a `/history` page
- listing each sync job with:
  - spreadsheet name/id
  - sheet tab
  - target table
  - status
  - start/end time
  - rows inserted
  - error message if failed

Why it matters:

- repeat usage depends on being able to answer "what ran?" and "what failed?"

### 1.3 Save and reuse target connections

Current issue:

- users paste Supabase URL, service role key, and DB URL every time
- `ss_connections` exists in the schema, but is not being used

Improve by:

- letting users save named target connections
- encrypting stored secrets before persistence
- allowing one-click reuse on future syncs
- making "paste raw secrets each run" the fallback path, not the default path

Why it matters:

- this removes repetition and lowers the chance of copy-paste mistakes

### 1.4 Improve the sync form flow

Current issue:

- the form is powerful but asks for too much at once
- there is not much inline guidance once something goes wrong

Improve by:

- converting the sync form into a step-based workflow:
  1. pick spreadsheet
  2. pick tab
  3. choose saved target or add new target
  4. review inferred schema
  5. run sync
- validating fields before the request starts
- showing example inputs and common failure explanations near the fields

Why it matters:

- multi-step flows reduce intimidation and improve completion rate

### 1.5 Add a review screen before execution

Current issue:

- the app infers schema and creates tables immediately during execution

Improve by:

- showing a "preview" before running:
  - inferred columns
  - inferred types
  - target table name
  - estimated row count
- allowing the user to rename columns or override types before sync

Why it matters:

- this prevents bad table creation from weak inference
- it makes the app feel much safer for real data

### 1.6 Improve error UX

Current issue:

- failures are surfaced mostly as raw technical logs

Improve by:

- translating common backend failures into user-facing messages
- grouping errors into:
  - Google auth problem
  - invalid spreadsheet/tab
  - invalid Supabase credentials
  - schema mismatch
  - network timeout
- adding suggested next steps next to errors

Why it matters:

- raw stack-shaped error output is useful for developers but stressful for users

## 2. Accessibility and Ease-of-Access Improvements

### 2.1 Improve keyboard accessibility

Current issue:

- the app likely works partially with keyboard navigation, but it does not appear intentionally designed for it

Improve by:

- ensuring every form field and action is reachable in a clean tab order
- adding visible focus states
- making log and progress areas screen-reader friendly

### 2.2 Improve semantic UI and image usage

Current issue:

- user avatar rendering uses plain `<img>` in the shell
- UI relies heavily on visual styling and emoji-like symbols

Improve by:

- replacing raw images with framework-appropriate image handling where needed
- using more explicit labels and semantic headings
- ensuring decorative icons do not carry essential meaning alone

### 2.3 Improve small-screen usability

Current issue:

- the shell is desktop-first
- a fixed sidebar plus dense form is likely awkward on smaller screens

Improve by:

- adding a mobile nav pattern
- collapsing nonessential information
- making sync progress and logs easier to inspect on narrow screens

## 3. Security Improvements

### 3.1 Stop sending high-privilege secrets from the browser for every sync

Current issue:

- the browser sends `serviceRoleKey` and `dbUrl` to `/api/sync`
- even over HTTPS, this is a high-risk design for a product expected to feel safe

Improve by:

- storing connections server-side after encryption
- letting the browser send only a connection ID during sync
- resolving the actual secret values on the server

Why it matters:

- the current flow exposes too much sensitive material too often

### 3.2 Actually use encryption for persisted secrets

Current issue:

- `lib/encrypt.ts` exists
- `encrypted_service_key` exists in `ss_connections`
- there is no evidence that this storage path is wired into the app yet

Improve by:

- using `encrypt()` before storing service role keys
- decrypting only inside server-side execution paths
- never returning decrypted secrets to the client

### 3.3 Reduce reliance on Supabase service role where possible

Current issue:

- the sync uses elevated privileges for writes

Improve by:

- separating DDL permissions from row-write permissions where possible
- using tighter scopes for repeated sync operations
- considering a server-managed integration credential rather than user-pasted root-style credentials

Why it matters:

- service-role style access is powerful, but its blast radius is large

### 3.4 Validate and constrain target table names more strictly

Current issue:

- table names are normalized client-side, but server-side trust should not depend on client sanitization

Improve by:

- revalidating table names on the server
- applying explicit allow-rules for names and length
- blocking reserved keywords or suspicious patterns

### 3.5 Add rate limiting and abuse controls

Current issue:

- API routes do not appear to be rate-limited

Improve by:

- limiting sync starts per user per minute
- limiting sheet tab enumeration requests
- adding request size and runtime guards

Why it matters:

- protects the app from accidental hammering and intentional misuse

### 3.6 Add authorization boundaries around persisted resources

Current issue:

- once history, saved connections, and jobs are wired in, they must be scoped tightly to the current user

Improve by:

- enforcing ownership checks for every connection and sync record
- never trusting client-provided IDs without verifying `userId`

### 3.7 Harden secret management and environment handling

Current issue:

- the app depends on several sensitive environment variables
- local `.env.local` handling may be acceptable for development, but production needs stricter discipline

Improve by:

- documenting required secrets clearly
- rotating keys regularly
- using a proper secret manager in production
- validating environment configuration at startup

## 4. Reliability and Operational Improvements

### 4.1 Persist sync jobs and outcomes

Current issue:

- `ss_sync_jobs` and `ss_synced_tables` exist but are not connected to the actual sync flow

Improve by:

- creating a sync job when the run starts
- updating status throughout execution
- storing completion time, row counts, and error reason

Why it matters:

- this is the backbone for history, retries, and observability

### 4.2 Move sync work into background jobs

Current issue:

- sync runs inline with the request lifecycle

Improve by:

- starting a background job
- returning a job id immediately
- polling or subscribing for status updates

Why it matters:

- improves reliability for long-running syncs
- reduces browser sensitivity and local server instability

### 4.3 Add retry and resume support

Current issue:

- a failed sync appears to require a full restart by the user

Improve by:

- supporting retry on the last failed job
- resuming from the failed batch where possible
- separating "schema setup failed" from "batch 7 failed"

### 4.4 Add structured logging and observability

Current issue:

- current logs are useful during development but not yet a support-quality audit trail

Improve by:

- adding structured logs with job id and user id
- separating internal logs from user-facing progress messages
- tracking timings, failure categories, and row counts consistently

### 4.5 Add stronger server-side validation

Current issue:

- required fields are checked, but deeper validation is light

Improve by:

- validating URLs, IDs, and field lengths server-side
- rejecting clearly invalid spreadsheet IDs or DB URLs before execution
- validating schema inference output before DDL

## 5. Product and Workflow Improvements

### 5.1 Add connection testing

Current issue:

- users find out credentials are wrong only when sync starts failing

Improve by:

- adding a "Test Connection" action for Supabase
- adding a "Preview Sheet" action for Google tabs

### 5.2 Support safer schema management

Current issue:

- inferred schema is applied directly to production targets

Improve by:

- offering:
  - create new table
  - append to existing table
  - map into existing schema
- warning before changing an existing table structure

### 5.3 Add sync modes

Current issue:

- the app currently behaves like one kind of sync

Improve by:

- supporting explicit modes:
  - upsert by row hash
  - replace table
  - append only
  - preview only

### 5.4 Add onboarding and empty-state help

Current issue:

- the product expects users to know what a spreadsheet ID, service role key, and direct DB URL are

Improve by:

- adding guided onboarding
- showing example screenshots for where to find each credential
- explaining the difference between Supabase URL, anon key, service role key, and DB URL

## 6. Codebase and Developer Experience Improvements

### 6.1 Replace placeholder README with project-specific documentation

Current issue:

- the current README is still the default Next.js starter text

Improve by:

- documenting setup, env vars, auth flow, database requirements, and sync flow

### 6.2 Normalize encoding and copy quality

Current issue:

- several files still show garbled characters from encoding issues

Improve by:

- normalizing file encoding to UTF-8
- replacing garbled symbols in UI and logs
- reviewing user-facing copy for clarity and consistency

### 6.3 Add tests for the critical path

Current issue:

- there is no visible test coverage for schema inference, sync orchestration, or auth-sensitive routes

Improve by:

- unit tests for:
  - schema inference
  - date sanitization
  - table name validation
- integration tests for:
  - `/api/sheets`
  - `/api/sync`
  - auth redirects

### 6.4 Add explicit data access boundaries

Current issue:

- the code is still fairly direct in how it reaches auth, database, and external services

Improve by:

- creating a small DAL/service layer for:
  - saved connections
  - sync jobs
  - sync history

Why it matters:

- cleaner authorization and easier maintenance as the app grows

## Suggested Roadmap

### Phase 1: Fastest Product Wins

- build real history page
- save encrypted connections
- test connection flow
- improve dashboard with recent jobs
- replace starter README

### Phase 2: Safety and Trust

- stop sending raw secrets from browser on each run
- add server-side validation for table names and target config
- wire in `ss_sync_jobs` and `ss_synced_tables`
- improve error messages and retry UX

### Phase 3: Production Readiness

- move sync execution to background jobs
- add structured logging and metrics
- add tests
- add role/ownership enforcement across all persisted resources

## Highest-Impact Recommendations

If only a few things are tackled next, these will provide the biggest improvement:

1. Save encrypted Supabase connections and stop pasting secrets on every sync.
2. Implement real sync history backed by `ss_sync_jobs`.
3. Add a preview-and-confirm step before creating or changing tables.
4. Move long-running syncs to background jobs.
5. Replace the placeholder dashboard with real user data.

## Closing Note

The app already has a compelling core idea and a useful first-run flow. The next big step is to shift from "one successful sync" toward "a product people can trust repeatedly with real data." Most of the pieces for that are already hinted at in the schema; they now need to be connected into the actual user experience.
