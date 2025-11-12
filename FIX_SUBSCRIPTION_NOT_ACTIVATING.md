# Fix: Subscription Not Activating After Payment

## 🔍 Problem

You tested payment with card `4242` and got confirmed, but you still have the free version. This means:

- ✅ Payment went through in Stripe
- ❌ Subscription wasn't created in your database
- ❌ Webhook event wasn't handled properly

## 🐛 Root Cause

When using **Stripe Checkout**, Stripe sends a `checkout.session.completed` event, but your webhook handler was missing this event. The code has been fixed, but you need to:

1. **Add the missing webhook event** in Stripe Dashboard
2. **Redeploy your backend** with the updated code
3. **Test again** or **manually trigger the webhook** for your existing payment

## ✅ Solution Steps

### Step 1: Add Missing Webhook Event

1. Go to https://dashboard.stripe.com/webhooks
2. Click on your webhook endpoint
3. Click **"Add events"** or **"Edit"**
4. Make sure `checkout.session.completed` is selected ⭐
5. Click **"Save"**

**Required Events:**

- ✅ `checkout.session.completed` ⭐ **CRITICAL - This was missing!**
- ✅ `payment_intent.succeeded`
- ✅ `payment_intent.payment_failed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

### Step 2: Redeploy Backend

The code has been updated to handle `checkout.session.completed`. You need to:

1. **Commit and push** the updated code:

   ```bash
   git add quiz_backend/backend/services/stripe_service.py
   git commit -m "Add checkout.session.completed webhook handler"
   git push
   ```

2. **Redeploy on Railway** (should happen automatically if auto-deploy is enabled)

### Step 3: Test Again

#### Option A: Make a New Test Payment

1. Go to your pricing page
2. Select a plan
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. Check if subscription is activated

#### Option B: Manually Trigger Webhook for Existing Payment

If you want to activate your existing payment without paying again:

1. Go to Stripe Dashboard → **Payments**
2. Find your test payment
3. Go to Stripe Dashboard → **Webhooks**
4. Click on your webhook endpoint
5. Click **"Send test webhook"**
6. Select `checkout.session.completed`
7. Click **"Send test webhook"**
8. Check your Railway logs to see if it was processed

**Note:** This might not work if the checkout session doesn't exist anymore. Better to make a new test payment.

### Step 4: Verify Subscription is Active

1. **Check via API:**

   ```bash
   # Get your auth token first, then:
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://quizhub-production-1ddf.up.railway.app/auth/me/subscription
   ```

2. **Check in Stripe Dashboard:**

   - Go to Stripe Dashboard → **Customers**
   - Find your customer
   - Check **Subscriptions** tab
   - Should show active subscription

3. **Check in your app:**
   - Log in to your app
   - Go to profile/subscription page
   - Should show active subscription

## 🔍 Debugging

### Check Webhook Logs in Stripe

1. Go to Stripe Dashboard → **Webhooks**
2. Click on your endpoint
3. View **"Recent deliveries"** tab
4. Check if `checkout.session.completed` events are being sent
5. Check response codes (should be 200)

### Check Railway Logs

1. Go to Railway dashboard
2. Click on your backend service
3. View **"Deployments"** → Latest deployment → **Logs**
4. Look for:
   - `Created subscription ... for user ...`
   - `Updated existing subscription ...`
   - Any error messages

### Check Database

If you have database access, check if subscription was created:

```sql
SELECT * FROM subscriptions WHERE user_id = 'YOUR_USER_ID';
```

Should show a row with `status = 'active'`.

## 🚨 Common Issues

### Issue 1: Webhook Event Not Selected

**Symptom:** Payment succeeds but subscription not created
**Fix:** Make sure `checkout.session.completed` is selected in Stripe Dashboard

### Issue 2: Webhook Not Reaching Backend

**Symptom:** No webhook logs in Railway
**Fix:**

- Check webhook URL is correct
- Check Railway service is running
- Check webhook secret matches

### Issue 3: User Not Found

**Symptom:** Webhook received but subscription not created
**Fix:**

- Make sure user has `stripe_customer_id` set
- Check if customer ID in Stripe matches `stripe_customer_id` in database

### Issue 4: Plan Type Not Set

**Symptom:** Subscription created but plan_type is "unknown"
**Fix:**

- Make sure price IDs are set in environment variables
- Check metadata in checkout session includes plan_type

## ✅ Verification Checklist

After fixing:

- [ ] `checkout.session.completed` event is selected in Stripe Dashboard
- [ ] Backend code is updated and deployed
- [ ] Webhook URL is correct: `https://quizhub-production-1ddf.up.railway.app/payments/webhooks`
- [ ] Webhook secret is set in Railway environment variables
- [ ] Test payment completed successfully
- [ ] Webhook event received (check Stripe Dashboard → Webhooks → Recent deliveries)
- [ ] Subscription created in database (check via API or database)
- [ ] User shows as "pro" instead of "free" (check `/auth/me` endpoint)

## 📞 Still Not Working?

If subscription still isn't activating:

1. **Check Railway logs** for errors
2. **Check Stripe webhook logs** for delivery status
3. **Verify all environment variables** are set correctly
4. **Test with a fresh payment** (don't reuse old checkout sessions)
5. **Check if user has `stripe_customer_id`** set in database

## 🎯 Quick Test

After fixing, make a quick test:

1. Go to pricing page
2. Select a plan
3. Use test card: `4242 4242 4242 4242`
4. Expiry: Any future date (e.g., `12/34`)
5. CVC: Any 3 digits (e.g., `123`)
6. Complete checkout
7. Check subscription status immediately

The subscription should be active within seconds after payment completes.
