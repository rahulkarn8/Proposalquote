# AI Quote Generator

A full-stack subscription quote generator for AI/software services with PDF proposal generation.

## Tech Stack

- **Backend**: Node.js + Express + TypeScript + Prisma (SQLite)
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui
- **PDF**: PDFKit
- **Validation**: Zod + react-hook-form

## Quick Start

```bash
# Install dependencies
npm install

# Set up database
npm run db:push
npm run db:generate

# Start dev servers (API on :3001, UI on :5173)
npm run dev
```

## Docker (Production)

```bash
cp .env.docker.example .env   # set JWT_SECRET and passwords
docker compose up --build -d
open http://localhost:8080
```

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for full AWS deployment (ECS Fargate, EC2, ECR, Cognito, HTTPS).

## User Guide (PDF)

A detailed end-user manual is available at:

**[docs/Motherson-AI-Quote-Generator-User-Guide.pdf](./docs/Motherson-AI-Quote-Generator-User-Guide.pdf)**

Regenerate after feature changes:

```bash
npm run generate:user-guide
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/quotes/calculate` | Calculate pricing without saving |
| POST | `/api/quotes/compare` | Compare pricing scenarios |
| POST | `/api/quotes` | Save quote to database |
| GET | `/api/quotes` | List all quotes |
| GET | `/api/quotes/:id` | Get quote by ID |
| POST | `/api/quotes/:id/generate-pdf` | Generate PDF proposal |
| GET | `/api/quotes/:id/pdf` | Download PDF |
| GET | `/api/exchange-rates` | Currency exchange rates |
| GET | `/api/problem-types` | List all problem types |
| GET | `/api/problem-types/:type/factors` | Get factors for problem type |
| GET | `/api/admin/settings` | Get admin configuration |
| PUT | `/api/admin/settings` | Update admin configuration |
| POST | `/api/admin/problem-types` | Add new problem type |
| DELETE | `/api/admin/problem-types/:type` | Remove problem type |
| GET | `/api/admin/analytics` | Quote analytics dashboard |
| POST | `/api/admin/seed` | Seed 3 sample quotes |
| POST | `/api/admin/reset-settings` | Reset settings to defaults |

## Admin Panel

Navigate to **http://localhost:5173/admin** to access the hidden admin configuration panel:

- **Analytics** — View all quotes, revenue, TCV averages, breakdowns by type/currency
- **Hourly Rates** — Edit rates per complexity (default: $50/$100/$150/$250)
- **Coverage** — Edit solution coverage multipliers
- **Support** — Edit support tier pricing and SLA multipliers
- **Problem Types** — Add/remove custom problem types
- **General** — Default currency, tax rate, cloud markup, volume tiers

### Volume Tier Discounts

| Volume | Discount |
|--------|----------|
| 1–1,000 | Base price |
| 1,001–10,000 | 10% off |
| 10,001–100,000 | 20% off |
| 100,000+ | Custom pricing flag |

### Seed Sample Data

```bash
npm run db:seed
```

Creates 3 demonstration quotes (OCR, Defect Detection, Pattern Matching).

## Features

- Multi-step form wizard (6 steps)
- Real-time quote preview with pricing breakdown
- 4 problem types: OCR, Defect Detection, CAD, Pattern Matching
- Configurable warranty, support, cloud infrastructure
- PDF proposal generation with terms & conditions
- Save/load draft quotes
- Scenario comparison tool
- Currency conversion (USD/EUR/GBP/INR)
- Email quote via mailto link

## Project Structure

```
├── backend/
│   ├── prisma/schema.prisma
│   └── src/
│       ├── data/problemTypes.ts
│       ├── services/ (pricing, PDF, quotes, exchange rates)
│       ├── routes/
│       └── validation/
└── frontend/
    └── src/
        ├── components/ (wizard, steps, UI)
        ├── lib/ (api, schema, utils)
        └── types/
```
