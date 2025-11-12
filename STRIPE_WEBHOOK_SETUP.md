# Stripe Webhook URL Setup Guide

## 🔗 What is the Webhook URL?

The webhook URL is **your backend endpoint** where Stripe sends payment events. It's not something you "get" from Stripe - it's **your application's URL** that you provide to Stripe.

## 📍 Your Webhook Endpoint Path

Based on your codebase, your webhook endpoint is:

```
POST /payments/webhooks
```

The full URL depends on where your backend is running:

### For Local Development:

```
http://localhost:8000/payments/webhooks
```

### For Production (Railway/Deployed):

```
https://your-backend-domain.com/payments/webhooks
```

## 🚀 Setup Instructions

### Option 1: Local Development (Using Stripe CLI)

For local development, Stripe can't reach `localhost`, so you need to use **Stripe CLI** to forward webhooks:

#### Step 1: Install Stripe CLI

```bash
# Windows (using Scoop)
scoop install stripe

# Or download from: https://stripe.com/docs/stripe-cli
```

#### Step 2: Login to Stripe CLI

```bash
stripe login
```

This will open your browser to authenticate.

#### Step 3: Forward Webhooks to Your Local Server

```bash
# Make sure your backend is running on port 8000
# Then run:
stripe listen --forward-to localhost:8000/payments/webhooks
```

This will:

- Forward all Stripe events to your local endpoint
- Display a **webhook signing secret** (starts with `whsec_...`)
- Copy this secret → use it as `STRIPE_WEBHOOK_SECRET` in your `.env` file

**Example output:**

```
> Ready! Your webhook signing secret is whsec_1234567890abcdef (^C to quit)
```

#### Step 4: Test Webhooks

In another terminal, trigger a test event:

```bash
stripe trigger payment_intent.succeeded
```

### Option 2: Production Setup (Stripe Dashboard)

For production, you need a publicly accessible URL:

#### Step 1: Deploy Your Backend

Make sure your backend is deployed and accessible via HTTPS:

```
https://your-backend-domain.com
```

#### Step 2: Get Your Full Webhook URL

Your webhook URL will be:

```
https://your-backend-domain.com/payments/webhooks
```

**Examples:**

- Railway: `https://your-app-name.up.railway.app/payments/webhooks`
- Heroku: `https://your-app-name.herokuapp.com/payments/webhooks`
- Custom domain: `https://api.yourdomain.com/payments/webhooks`

#### Step 3: Add Webhook in Stripe Dashboard

1. Go to https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"** (or **"Add webhook endpoint"**)
3. Enter your webhook URL:
   ```
   https://quizhub-production-1ddf.up.railway.app/payments/webhooks
   ```
4. Select the events to listen to:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
5. Click **"Add endpoint"**

#### Step 4: Get the Webhook Secret

1. After creating the endpoint, click on it in the webhooks list
2. Find the **"Signing secret"** section
3. Click **"Reveal"** or **"Click to reveal"**
4. Copy the secret (starts with `whsec_...`)
5. Add it to your environment variables:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

## 🔍 How to Find Your Production URL

### If Using Railway:

1. Go to your Railway project dashboard
2. Click on your backend service
3. Go to the **"Settings"** tab
4. Find **"Public Domain"** or **"Custom Domain"**
5. Your URL will be: `https://your-service-name.up.railway.app`

### If Using Heroku:

1. Go to your Heroku app dashboard
2. Click **"Settings"**
3. Find **"Domains"** section
4. Your URL will be: `https://your-app-name.herokuapp.com`

### If Using Custom Domain:

Use your custom domain: `https://api.yourdomain.com`

## ✅ Testing Your Webhook

### Test Locally:

```bash
# Terminal 1: Start your backend
cd quiz_backend
python -m uvicorn backend.api:app --reload

# Terminal 2: Forward webhooks
stripe listen --forward-to localhost:8000/payments/webhooks

# Terminal 3: Trigger test event
stripe trigger payment_intent.succeeded
```

### Test Production:

1. Go to Stripe Dashboard → Webhooks
2. Click on your webhook endpoint
3. Click **"Send test webhook"**
4. Select an event type (e.g., `payment_intent.succeeded`)
5. Click **"Send test webhook"**
6. Check your backend logs to see if the webhook was received

## 🐛 Troubleshooting

### Webhook Not Receiving Events?

1. **Check your backend is running:**

   ```bash
   curl https://your-domain.com/payments/health
   ```

2. **Check webhook URL is correct:**

   - Must be HTTPS (not HTTP) for production
   - Must include `/payments/webhooks` path
   - No trailing slash

3. **Check webhook secret matches:**

   - The secret in Stripe Dashboard must match `STRIPE_WEBHOOK_SECRET`
   - For local development, use the secret from `stripe listen` command

4. **Check webhook logs in Stripe:**

   - Go to Stripe Dashboard → Webhooks
   - Click on your endpoint
   - View **"Recent deliveries"** to see if requests are being sent
   - Check response codes (should be 200)

5. **Check CORS settings:**
   - Make sure your backend allows requests from Stripe
   - Stripe webhooks come from Stripe's IP addresses

### Common Errors:

**"Invalid signature"**

- Webhook secret doesn't match
- Make sure you're using the correct secret for your environment (test vs live)

**"Webhook secret not configured"**

- `STRIPE_WEBHOOK_SECRET` environment variable is not set
- Add it to your `.env` file

**"Connection refused" (local)**

- Backend is not running
- Wrong port number
- Use Stripe CLI to forward webhooks locally

## 📋 Quick Checklist

- [ ] Backend is deployed and accessible (for production)
- [ ] Webhook URL is correct: `https://your-domain.com/payments/webhooks`
- [ ] Webhook endpoint added in Stripe Dashboard
- [ ] All required events are selected
- [ ] Webhook secret copied from Stripe Dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` added to environment variables
- [ ] Test webhook sent successfully
- [ ] Backend logs show webhook received

## 🔗 Quick Reference

**Your Webhook Endpoint Code:**

```python
# Located at: backend/api_routers/routers/payment_router.py
@router.post("/webhooks")
async def handle_webhook(request: Request, db: Session = Depends(get_db)):
    # Handles Stripe webhook events
```

**Full URL Format:**

```
{your-backend-url}/payments/webhooks
```

**Local Development:**

```
http://localhost:8000/payments/webhooks
```

**Production:**

```
https://your-backend-domain.com/payments/webhooks
```
