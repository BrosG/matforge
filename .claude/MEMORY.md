# MatCraft — Memory Index

> Reference index for Claude sessions. Each entry links to a detailed document.
> Last updated: April 14, 2026.

---

## Core Documents

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Full system diagram, tech stack, Cloud Run services, middleware, Redis keys, env vars, CI/CD pipeline, Docker structure |
| [DATABASE.md](DATABASE.md) | ER diagram, all table schemas, IndexedMaterial 40+ columns, 8 indexes, data quality pipeline, connection pooling |
| [API_REFERENCE.md](API_REFERENCE.md) | Every endpoint across 16 routers, auth, credit costs, request/response schemas, error codes |
| [FEATURES.md](FEATURES.md) | Every feature: routes, auth, credits, descriptions, keyboard shortcuts, Stripe products |
| [DEPLOYMENT.md](DEPLOYMENT.md) | CI/CD pipeline, 18 Secret Manager secrets, Stripe config, troubleshooting runbook, gcloud commands |
| [MATERIALS_DATABASE.md](MATERIALS_DATABASE.md) | Why the materials DB is game-changing, data quality pipeline, Nobel Prize thesis, future roadmap |

## Existing Product Docs

| Document | Description |
|----------|-------------|
| [../PRODUCT.md](../PRODUCT.md) | Complete product documentation (v0.3.0 + v0.4.0 shipped features) |
| [../IP_RADAR.md](../IP_RADAR.md) | IP Radar technical documentation (patent search, AI analysis, caching) |

## Memory Files

| File | Description |
|------|-------------|
| [memory/project.md](memory/project.md) | Current project state for Claude sessions |
| [memory/feedback.md](memory/feedback.md) | User preferences and feedback patterns |

---

## Quick Reference

**Live at**: matcraft.ai (SSL provisioning after domain mapping reset — may take 15-45 min)  
**API**: api.matcraft.ai/api/v1 (live and healthy)  
**Admin**: matcraft.ai/admin (gauthier.bros@gmail.com)  
**Investor**: matcraft.ai/investors (teasing) + matcraft.ai/data-room (password gate)  
**Stack**: Next.js 14 + FastAPI + PostgreSQL + Redis + Celery + Cloud Run + Stripe + Gemini  
**Repo**: github.com/BrosG/matforge  
**GCP Project**: matforge-50499 (us-central1)  
**Stripe Webhook**: we_1TM9G6D2rITmpkEzdOoSgZDq  

**⚠️ Action required**: Rotate `sk_live_` Stripe secret key (was exposed in chat session)
