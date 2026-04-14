---
name: MatCraft project state
description: Current state of the MatCraft platform — stack, features, critical context for new sessions
type: project
---

MatCraft is a materials science platform at matcraft.ai. Built in Marseille, France (2024). 

**How to apply:** Always check this before starting work on MatCraft.

## Stack
- Frontend: Next.js 14.2.30, React Three Fiber, Recharts, NextAuth, TypeScript
- Backend: FastAPI 0.104, SQLAlchemy 2.0, Celery 5.3, Python 3.12
- DB: PostgreSQL (Cloud SQL) + Redis (Memorystore)
- Infra: Google Cloud Run (3 services), Secret Manager, Artifact Registry
- Payments: Stripe (7 products created 2026-04-14)
- AI: Gemini 2.0 Flash (GEMINI_API_KEY in Secret Manager)

## Current deployment
- Staging auto-deploys on push to main
- matcraft.ai domain: domain mapping recreated 2026-04-13, SSL cert may still be provisioning
- api.matcraft.ai: live and healthy
- Direct Cloud Run URL: matforge-frontend-staging-566252948932.us-central1.run.app (always works)

## Admin
- Only admin: gauthier.bros@gmail.com (ADMIN_EMAILS whitelist in security.py)
- Admin dashboard: /admin

## Credit system
- New users get 10 free credits on signup
- IP Radar search: 1 credit (or 3 free/day anonymous)
- Deep Scan: max_patents ÷ 100 credits
- Stripe Webhook: we_1TM9G6D2rITmpkEzdOoSgZDq → https://api.matcraft.ai/api/v1/stripe/webhook

## Critical issues / tech debt
- Stripe sk_live_ key was exposed in chat — MUST ROTATE via Stripe dashboard and update Secret Manager
- CI lint failures are pre-existing (ruff 334 errors in src/materia/, ESLint not configured) — not blocking deployment
- matcraft.ai SSL cert may be pending (if domain mapping was recently recreated)
- JARVIS ingestion (~76k materials) not yet in DB — requires separate trigger
- Google Patents XHR may be blocked from Cloud Run IPs → EPO OPS fallback kicks in

## Key files to understand
- Backend models: backend/app/db/models.py
- Main API entry: backend/app/api/v1/api.py (16 routers)
- IP Radar: backend/app/api/v1/endpoints/ip_radar.py
- Stripe: backend/app/api/v1/endpoints/stripe_payments.py
- Admin: backend/app/api/v1/endpoints/admin.py
- Material detail: frontend/src/app/(public)/materials/[id]/page.tsx
- IP Radar UI: frontend/src/components/ip-radar/IPRadar.tsx
- Material Builder: frontend/src/components/material-builder/MaterialBuilder.tsx (2547 lines)

## Versioning strategy
- generateBuildId: git SHA-12 per build
- Middleware: Cache-Control no-store, s-maxage=0 on all HTML
- VersionGuard component: polls /api/version every 60s, shows "Update now" banner

## Why: NullPool for DB connections
Cloud Run auto-scales → multiple instances × pool_size = connection exhaustion.
NullPool (one connection per request, no persistence) is the Google-recommended pattern.
