# Quiz Hub - AI-Powered Educational Platform

**Quiz Hub** is an AI-powered educational platform that transforms study materials (PDFs, web articles) into interactive learning tools. It helps students, educators, and learners create personalized study content automatically using AI.

## 📋 Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Stripe Integration](#stripe-integration)
- [Deployment](#deployment)
- [Admin Dashboard](#admin-dashboard)
- [API Endpoints](#api-endpoints)
- [Key Features](#key-features)

---

## 🏗️ Architecture

### System Overview

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │────────▶│   Backend    │────────▶│   Database  │
│  (Next.js)  │  HTTP   │  (FastAPI)   │  SQLite │   (SQLite)  │
└─────────────┘         └──────────────┘         └─────────────┘
     Port 3000              Port 8000
                              │
                              ▼
                        ┌──────────────┐
                        │  Groq API    │
                        │  (AI/LLM)    │
                        └──────────────┘
                              │
                              ▼
                        ┌──────────────┐
                        │  Stripe API  │
                        │  (Payments)  │
                        └──────────────┘
```

### Component Structure

**Backend (`quiz_backend/`):**

- FastAPI application with SQLAlchemy ORM
- SQLite database (development) / PostgreSQL (production)
- AI content generation via Groq API
- Stripe payment integration
- JWT-based authentication
- Alembic database migrations

**Frontend (`quiz_frontend/`):**

- Next.js 16 with App Router
- TypeScript + Tailwind CSS
- React Query for data fetching
- Protected routes with authentication
- Responsive design

---

## 🛠️ Tech Stack

### Backend

- **Framework**: FastAPI (Python 3.11+)
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **ORM**: SQLAlchemy
- **Migrations**: Alembic
- **AI**: Groq API (OpenAI-compatible)
- **Payments**: Stripe
- **Auth**: JWT tokens

### Frontend

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React Query
- **HTTP Client**: Axios
- **Icons**: Lucide React

### 🎨 Brand Color Palette

| Token | Hex | Usage |
| --- | --- | --- |
| Deep Navy | `#0e1f47` | Primary text, dark accents |
| Core Blue | `#163172` | Navigation, headings, emphasis |
| Secondary Blue | `#1e439d` | Focus rings, hover states |
| Bright Blue | `#2756c7` | Primary buttons, CTAs |
| Cloud White | `#ffffff` | Surfaces, cards |
| Soft Gray | `#e6e6e6` | Backgrounds, dividers |

These shades are defined as CSS variables in `quiz_frontend/app/globals.css` and applied across shared components (layout, navigation, buttons, and footer) so the entire frontend stays consistent with the logo palette.

---

## 🚀 Setup & Installation

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (optional, for containerized deployment)

### Local Development

#### Backend Setup

```bash
cd quiz_backend

# Install dependencies
pip install -e .

# Set up environment variables (see Environment Variables section)
cp env_template.txt .env
# Edit .env with your API keys

# Initialize database
python init_db.py

# Run migrations
alembic upgrade head

# Start development server
uvicorn backend.api:app --reload
```

Backend will be available at `http://localhost:8000`

- API docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

#### Frontend Setup

```bash
cd quiz_frontend

# Install dependencies
npm install

# Set up environment variables
# Create .env.local with:
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:3000`

### Docker Setup

```bash
# Start both services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 🔐 Environment Variables

### Backend Environment Variables

#### Required

```bash
# AI API Key (Groq/OpenAI-compatible)
OPENAI_API_KEY=your_groq_api_key_here

# Database (optional, defaults to SQLite)
DATABASE_URL=sqlite:///quiz_database.db
```

#### Optional (with defaults)

```bash
HOST=0.0.0.0
PORT=8000
DEBUG=False
OPENAI_MODEL=gpt-4.1-2025-04-14
ENABLE_RATE_LIMITING=true

# Admin emails (comma-separated)
ADMIN_EMAILS=admin@example.com,another@example.com

# PDF storage directory
PDF_STORAGE_DIR=/app/data/student_project_pdfs
```

#### Stripe Integration (see [Stripe Integration](#stripe-integration) section)

```bash
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...
```

### Frontend Environment Variables

#### Required

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000  # or your production backend URL
```

---

## 💳 Stripe Integration

### Required Environment Variables

```bash
# Core Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... or sk_live_...  # REQUIRED
STRIPE_WEBHOOK_SECRET=whsec_...               # REQUIRED

# Price IDs (REQUIRED for subscriptions)
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...
```

### How to Get Stripe Keys

1. **API Keys**: https://dashboard.stripe.com/apikeys

   - Copy **Secret key** → `STRIPE_SECRET_KEY`
   - Use `sk_test_...` for development, `sk_live_...` for production

2. **Price IDs**: https://dashboard.stripe.com/products

   - Create products: Basic, Premium, Enterprise
   - For each product, create a **recurring monthly price**
   - Copy the **Price ID** (starts with `price_...`)

3. **Webhook Secret**: https://dashboard.stripe.com/webhooks
   - Add endpoint: `https://your-backend-domain.com/payments/webhooks`
   - **Your production URL**: `https://quizhub-production-1ddf.up.railway.app/payments/webhooks`
   - Select events:
     - ✅ `checkout.session.completed` ⭐ **REQUIRED for Checkout**
     - ✅ `payment_intent.succeeded`
     - ✅ `payment_intent.payment_failed`
     - ✅ `customer.subscription.created`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
     - ✅ `invoice.payment_succeeded`
     - ✅ `invoice.payment_failed`
   - Copy the **Signing secret** (starts with `whsec_...`) → `STRIPE_WEBHOOK_SECRET`

### Local Development Webhook Setup

For local development, use Stripe CLI to forward webhooks:

```bash
# Install Stripe CLI
# Windows: scoop install stripe
# Or download from: https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:8000/payments/webhooks

# Copy the webhook secret shown (starts with whsec_...)
# Use it as STRIPE_WEBHOOK_SECRET in your .env file
```

### Stripe Service Implementation

**Location**: `quiz_backend/backend/services/stripe_service.py`

**Key Features**:

- Customer management
- Payment intents (one-time payments)
- Subscriptions (create, cancel, get)
- Checkout sessions
- Webhook event handling
- Transaction tracking

**Webhook Events Handled**:

- `checkout.session.completed` - Critical for Stripe Checkout subscriptions
- `payment_intent.succeeded` - One-time payment success
- `payment_intent.payment_failed` - Payment failure
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Subscription changes
- `customer.subscription.deleted` - Subscription cancellation

**Validation**:

- Health check endpoint: `GET /payments/health`
- Returns Stripe configuration status

---

## 🚢 Deployment

### Railway Deployment (Recommended)

#### Quick Start via Dashboard

1. Go to [railway.app](https://railway.app)
2. Create new project
3. Add 2 services:
   - **Backend**: Connect GitHub repo, set root directory to `quiz_backend`
   - **Frontend**: Connect GitHub repo, set root directory to `quiz_frontend`

#### Backend Deployment

1. **Service Setup**:

   - Root directory: `quiz_backend`
   - Railway auto-detects Python and uses Dockerfile

2. **Environment Variables**:

   ```bash
   OPENAI_API_KEY=your_key
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_BASIC_PRICE_ID=price_...
   STRIPE_PREMIUM_PRICE_ID=price_...
   STRIPE_ENTERPRISE_PRICE_ID=price_...
   ```

3. **Database Volume**:

   - Go to backend service → Settings → Volumes
   - Create volume, mount at `/app/quiz_database.db`
   - This ensures database persists across deployments

4. **Get Backend URL**:
   - Service → Settings → Domains
   - Copy the URL (e.g., `https://quizhub-production-1ddf.up.railway.app`)

#### Frontend Deployment

1. **Service Setup**:

   - Root directory: `quiz_frontend`
   - Railway auto-detects Node.js

2. **Environment Variables**:

   ```bash
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
   ```

3. **Get Frontend URL**:
   - Service → Settings → Domains
   - Copy the URL

#### Railway CLI Deployment

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy Backend
cd quiz_backend
railway init
railway link
railway variables set OPENAI_API_KEY=your_key
railway up

# Deploy Frontend
cd ../quiz_frontend
railway service create frontend
railway link
railway variables set NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
railway up
```

### Verification Checklist

- [ ] Backend service is running (check `/health` endpoint)
- [ ] Frontend service is running
- [ ] Frontend can connect to backend (check browser console)
- [ ] Database volume is mounted (backend)
- [ ] All environment variables are set
- [ ] Stripe webhook endpoint configured
- [ ] CORS is configured (backend allows frontend origin)

---

## 👨‍💼 Admin Dashboard

### Setup

1. **Create Admin Account**:

   - Register a new user account at `/register`
   - Or use an existing account

2. **Set Admin Email**:

   - Add email to `ADMIN_EMAILS` environment variable (comma-separated):
     ```bash
     ADMIN_EMAILS=admin@example.com,another-admin@example.com
     ```
   - Restart backend to load the new environment variable

3. **Access Dashboard**:
   - Log in with the admin account
   - Navigate to "Admin" link in navigation bar
   - Dashboard will load if you have admin privileges

### Features

- View all users (name, email, account type, status)
- View quiz statistics per user
- Overall statistics (total users, Pro users, Free users, Active users, Total quizzes)
- User management capabilities

**Note**: Admin accounts use the same password as regular user accounts. Admin status is determined by email only.

---

## 🔌 API Endpoints

### Authentication (`/auth`)

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login (returns JWT token)
- `GET /auth/me` - Get current user info
- `GET /auth/me/subscription` - Get current user subscription

### Quizzes (`/quizzes`)

- `POST /quizzes` - Generate quiz from URL or PDF
- `GET /quizzes` - List user's quizzes
- `GET /quizzes/{id}` - Get quiz details
- `POST /quizzes/{id}/attempts` - Submit quiz attempt
- `GET /quizzes/{id}/attempts` - Get quiz attempts

### Flashcards (`/flashcards`)

- `POST /flashcards` - Generate flashcards from URL or PDF
- `GET /flashcards` - List user's flashcards
- `GET /flashcards/{id}` - Get flashcard set details

### Essays (`/essays`)

- `POST /essays` - Generate essay Q&A from URL or PDF
- `GET /essays` - List user's essays
- `GET /essays/{id}` - Get essay details

### Student Projects (`/student-projects`)

- `POST /student-projects` - Create new project
- `GET /student-projects` - List user's projects
- `GET /student-projects/{id}` - Get project details
- `POST /student-projects/{id}/pdf` - Upload PDF to project
- `POST /student-projects/{id}/chat` - Chat with project PDF

### Payments (`/payments`)

- `GET /payments/plans` - Get available subscription plans
- `POST /payments/checkout-session` - Create Stripe checkout session
- `POST /payments/webhooks` - Stripe webhook endpoint
- `GET /payments/health` - Payment service health check
- `POST /payments/subscriptions/{id}/cancel` - Cancel subscription

### Admin (`/admin`)

- `GET /admin/users` - Get all users (admin only)
- `GET /admin/stats` - Get overall statistics (admin only)

### Health & Config

- `GET /health` - Health check
- `GET /config` - Get app configuration
- `GET /config/pricing` - Get pricing configuration

---

## ✨ Key Features

### AI Content Generation

- **Quizzes**: Generate multiple-choice questions from PDFs or URLs with customizable difficulty (easy/medium/hard)
- **Flashcards**: Create interactive flashcard sets for memorization
- **Essay Q&A**: Generate essay questions with detailed answers and key information points
- **AI Chat**: Interactive chat with uploaded PDFs for Q&A sessions

### Student Hub

- Organize study materials into projects
- Upload and manage PDF documents
- Generate all content types (quizzes, flashcards, essays) from project PDFs
- Track generated content per project
- Chat with PDFs to get instant answers

### User Management

- JWT-based authentication
- Free tier with configurable generation quota (default: 10 free generations)
- Token-based usage tracking
- Pro subscription with unlimited generations
- Personal content library

### Subscription System

- **Free Tier**: Limited generations (configurable, default: 10)
- **Pro Tier**: Unlimited generations, unlimited projects
- Stripe integration for payments
- Subscription management (cancel, view next payment date)
- Webhook-based subscription activation

### Analytics & Tracking

- Performance dashboard with quiz statistics
- Track quiz attempts and scores
- Category-based performance breakdown
- Progress visualization over time

---

## 📁 Project Structure

```
quiz - python/
├── quiz_backend/              # FastAPI backend
│   ├── backend/
│   │   ├── api_routers/       # API route handlers
│   │   ├── config/           # Configuration
│   │   ├── database/         # Database models & DAL
│   │   ├── generation/       # AI generation templates
│   │   ├── services/         # Business logic (Stripe, etc.)
│   │   └── utils/            # Utilities (auth, credits, etc.)
│   ├── alembic/              # Database migrations
│   ├── config/               # App configuration (YAML)
│   └── Dockerfile
├── quiz_frontend/            # Next.js frontend
│   ├── app/                  # Next.js App Router pages
│   ├── components/           # React components
│   ├── lib/                  # API clients & utilities
│   └── Dockerfile
├── docker-compose.yml        # Local development
└── README.md                 # This file
```

---

## 🔧 Configuration

### App Configuration (`quiz_backend/config/app_config.yaml`)

Controls:

- Free generation quota
- Pricing tiers
- Feature flags

### Database Migrations

```bash
cd quiz_backend

# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## 🐛 Troubleshooting

### Backend Issues

- **Port conflicts**: Ensure port 8000 is available, or set `PORT` env var
- **Database not persisting**: For Railway, ensure volume is mounted at `/app/quiz_database.db`
- **Migrations failing**: Check Alembic configuration and database connection

### Frontend Issues

- **API connection errors**: Verify `NEXT_PUBLIC_API_URL` matches backend URL
- **Build failures**: Check Node.js version (should be 18+)
- **CORS errors**: Ensure backend CORS allows frontend origin

### Stripe Issues

- **Webhook not receiving events**:
  - Verify webhook URL is correct and accessible
  - Check webhook secret matches `STRIPE_WEBHOOK_SECRET`
  - For local dev, use Stripe CLI to forward webhooks
- **Subscription not activating**:
  - Ensure `checkout.session.completed` event is selected in Stripe Dashboard
  - Check backend logs for webhook processing errors
- **Invalid signature**: Webhook secret doesn't match

---

## 📝 Important Notes

1. **Pro Users**: Users with active subscriptions have:

   - Unlimited generations (no token consumption)
   - Unlimited projects (no 3-project limit)
   - Access to all Pro features

2. **Token System**: Free users consume tokens from `free_tokens` balance. Pro users bypass token consumption.

3. **Database**: SQLite for development, PostgreSQL recommended for production. Use Railway volumes for persistence.

4. **Stripe Webhooks**: Critical for subscription activation. Must configure `checkout.session.completed` event.

5. **Admin Access**: Determined by `ADMIN_EMAILS` environment variable. No separate admin password.

---

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Railway Documentation](https://docs.railway.app)
- [Groq API Documentation](https://console.groq.com/docs)

---

## 🎯 Quick Reference

**Start Backend**: `cd quiz_backend && uvicorn backend.api:app --reload`  
**Start Frontend**: `cd quiz_frontend && npm run dev`  
**Backend URL**: `http://localhost:8000`  
**Frontend URL**: `http://localhost:3000`  
**API Docs**: `http://localhost:8000/docs`  
**Health Check**: `http://localhost:8000/health`  
**Stripe Webhook URL**: `https://your-backend-domain.com/payments/webhooks`

---

**Last Updated**: 2025-01-11
