# Stripe Environment Variables - Quick Reference

## 🔑 Required Environment Variables

Add these to your `.env` file or deployment platform:

### Backend (Required)

```bash
# Core Stripe API Key (REQUIRED)
STRIPE_SECRET_KEY=sk_test_... or sk_live_...

# Webhook Secret (REQUIRED for webhook handling)
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs (REQUIRED for subscriptions)
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...
```

### Frontend (Optional - Currently Not Used)

```bash
# Only needed if you add Stripe.js to frontend
# Currently, frontend uses backend API endpoints only
STRIPE_PUBLISHABLE_KEY=pk_test_... or pk_live_...
```

## 📝 How to Get These Values

### 1. Stripe API Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Copy **Secret key** → `STRIPE_SECRET_KEY`
3. Copy **Publishable key** → `STRIPE_PUBLISHABLE_KEY` (optional)

**Note**: Use `sk_test_...` for development, `sk_live_...` for production

### 2. Price IDs

1. Go to https://dashboard.stripe.com/products
2. Create products: Basic, Premium, Enterprise
3. For each product, create a **recurring monthly price**
4. Copy the **Price ID** (starts with `price_...`)
5. Add to environment variables:
   - `STRIPE_BASIC_PRICE_ID`
   - `STRIPE_PREMIUM_PRICE_ID`
   - `STRIPE_ENTERPRISE_PRICE_ID`

### 3. Webhook Secret

**For Local Development:**

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:8000/payments/webhooks`
4. Copy the webhook secret shown (starts with `whsec_...`) → `STRIPE_WEBHOOK_SECRET`

**For Production:**

1. Go to https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. Enter your webhook URL: `https://your-backend-domain.com/payments/webhooks`
   - **Your URL:** `https://quizhub-production-1ddf.up.railway.app/payments/webhooks`
4. Select these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Click on the endpoint to reveal the **Signing secret**
7. Copy the secret (starts with `whsec_...`) → `STRIPE_WEBHOOK_SECRET`

**📖 See `STRIPE_WEBHOOK_SETUP.md` for detailed instructions**

## ✅ Validation

After setting up, you can validate your configuration:

1. **Via Health Check Endpoint**:

   ```bash
   curl http://localhost:8000/payments/health
   ```

   This will show which environment variables are configured.

2. **Via Test Script**:
   ```bash
   cd quiz_backend
   python test_stripe_integration.py
   ```

## 🚨 Important Notes

- **Test vs Live Keys**: Use test keys (`sk_test_...`) for development, live keys (`sk_live_...`) for production
- **Webhook URLs**: For local development, use Stripe CLI to forward webhooks:
  ```bash
  stripe listen --forward-to localhost:8000/payments/webhooks
  ```
- **Price IDs**: Must be created in Stripe Dashboard before they can be used
- **Publishable Key**: Currently not used in the codebase, but keep it for future frontend integration

## 📋 Checklist

- [ ] `STRIPE_SECRET_KEY` set
- [ ] `STRIPE_WEBHOOK_SECRET` set
- [ ] `STRIPE_BASIC_PRICE_ID` set
- [ ] `STRIPE_PREMIUM_PRICE_ID` set
- [ ] `STRIPE_ENTERPRISE_PRICE_ID` set
- [ ] Products and prices created in Stripe Dashboard
- [ ] Webhook endpoint configured in Stripe Dashboard
- [ ] Health check endpoint returns `"stripe_configured": true`
