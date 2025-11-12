# Your Stripe Webhook URL

## 🔗 Your Webhook URL

Based on your backend URL, your Stripe webhook endpoint is:

```
https://quizhub-production-1ddf.up.railway.app/payments/webhooks
```

## 🚀 Setup Steps

### Step 1: Add Webhook in Stripe Dashboard

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"** (or **"Add webhook endpoint"**)
3. In the **"Endpoint URL"** field, enter:
   ```
   https://quizhub-production-1ddf.up.railway.app/payments/webhooks
   ```
4. Make sure to use **HTTPS** (not HTTP)

### Step 2: Select Events

Select these 8 events:

- ✅ `checkout.session.completed` ⭐ **REQUIRED for Checkout**
- ✅ `payment_intent.succeeded`
- ✅ `payment_intent.payment_failed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

### Step 3: Save and Get Secret

1. Click **"Add endpoint"**
2. After the endpoint is created, click on it in the list
3. Find the **"Signing secret"** section
4. Click **"Reveal"** or **"Click to reveal"**
5. Copy the secret (starts with `whsec_...`)

### Step 4: Add to Environment Variables

Add the webhook secret to your Railway environment variables:

1. Go to your Railway project dashboard
2. Click on your backend service
3. Go to **"Variables"** tab
4. Add new variable:
   - **Key:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** `whsec_...` (paste the secret you copied)
5. Click **"Add"**

Or add to your `.env` file for local development:

```bash
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

## ✅ Verify Setup

### Test 1: Check Health Endpoint

```bash
curl https://quizhub-production-1ddf.up.railway.app/payments/health
```

Should return:

```json
{
  "status": "healthy",
  "service": "payments",
  "stripe_configured": true,
  "configuration": {
    "stripe_secret_key": true,
    "stripe_webhook_secret": true,
    "basic_price_id": true,
    "premium_price_id": true,
    "enterprise_price_id": true
  }
}
```

### Test 2: Send Test Webhook

1. Go to Stripe Dashboard → Webhooks
2. Click on your webhook endpoint
3. Click **"Send test webhook"**
4. Select `payment_intent.succeeded`
5. Click **"Send test webhook"**
6. Check your Railway logs to see if webhook was received

## 📋 Quick Checklist

- [ ] Webhook endpoint added in Stripe Dashboard
- [ ] URL is: `https://quizhub-production-1ddf.up.railway.app/payments/webhooks`
- [ ] All 7 events are selected
- [ ] Webhook secret copied (`whsec_...`)
- [ ] `STRIPE_WEBHOOK_SECRET` added to Railway environment variables
- [ ] Health check shows `"stripe_configured": true`
- [ ] Test webhook sent successfully

## 🐛 Troubleshooting

### If webhook is not working:

1. **Check your backend is accessible:**

   ```bash
   curl https://quizhub-production-1ddf.up.railway.app/payments/health
   ```

2. **Check webhook logs in Stripe:**

   - Go to Stripe Dashboard → Webhooks
   - Click on your endpoint
   - View **"Recent deliveries"** tab
   - Check if requests are being sent and what response codes you're getting

3. **Check Railway logs:**

   - Go to Railway dashboard
   - Click on your service
   - View **"Deployments"** → Click on latest deployment → View logs
   - Look for webhook-related errors

4. **Verify environment variables:**
   - Make sure `STRIPE_WEBHOOK_SECRET` is set in Railway
   - The secret must match the one in Stripe Dashboard

## 🔐 Important Notes

- ✅ Use **HTTPS** (not HTTP) - Railway provides HTTPS automatically
- ✅ The webhook secret is different for **test mode** vs **live mode**
- ✅ Make sure you're using the correct secret for your current Stripe mode
- ✅ Railway automatically handles HTTPS, so your URL is secure

## 📞 Need Help?

If you encounter issues:

1. Check Railway logs for errors
2. Check Stripe webhook delivery logs
3. Verify all environment variables are set correctly
4. Make sure your backend service is running and accessible
