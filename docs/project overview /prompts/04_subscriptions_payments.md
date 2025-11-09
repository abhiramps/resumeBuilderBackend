# Tasks 19-23: Subscriptions & Payment Processing

## Overview
Implement complete subscription management and payment processing using Stripe.

---

## Task 19: Stripe Integration Setup

### Objective
Set up Stripe SDK and webhook infrastructure.

### Implementation

#### 1. Install Stripe SDK

```bash
npm install stripe
npm install --save-dev @types/stripe
```

#### 2. Create Stripe Service

Create `src/services/stripe.service.ts`:

```typescript
import Stripe from 'stripe';
import { config } from '../config';

export const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export class StripeService {
  async createCustomer(email: string, name: string, userId: string): Promise<Stripe.Customer> {
    return await stripe.customers.create({
      email,
      name,
      metadata: {
        user_id: userId,
      },
    });
  }
  
  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    return await stripe.customers.retrieve(customerId) as Stripe.Customer;
  }
  
  async updateCustomer(customerId: string, data: Stripe.CustomerUpdateParams): Promise<Stripe.Customer> {
    return await stripe.customers.update(customerId, data);
  }
  
  async verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret
      );
      return true;
    } catch (error) {
      return false;
    }
  }
}
```

#### 3. Create Webhook Handler

Create `src/handlers/webhooks.ts`:

```typescript
import { Router, Request, Response } from 'express';
import { stripe } from '../services/stripe.service';
import { config } from '../config';
import { handleStripeEvent } from '../services/webhook.service';

const router = Router();

router.post('/stripe', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      config.stripe.webhookSecret
    );
    
    // Handle event
    await handleStripeEvent(event);
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

export default router;
```

---

## Task 20: Subscription Plans Management

### Objective
Implement subscription plan logic and feature checking.

### Implementation

Create `src/services/subscription.service.ts`:

```typescript
import { supabase } from '../utils/supabase';
import { SubscriptionPlan, UserSubscription } from '../types/subscription.types';

export class SubscriptionService {
  async getPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    
    if (error) throw error;
    return data || [];
  }
  
  async getPlanById(planId: string): Promise<SubscriptionPlan> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
  
  async checkFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    
    if (!subscription) {
      // Free tier
      const freePlan = await this.getPlanById('free');
      return freePlan.features[feature] === true;
    }
    
    return subscription.plan.features[feature] === true;
  }
  
  async checkUsageLimit(userId: string, limitType: string): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
  }> {
    const subscription = await this.getUserSubscription(userId);
    const plan = subscription?.plan || await this.getPlanById('free');
    
    const limit = plan.features[limitType];
    
    // Get current usage
    let current = 0;
    if (limitType === 'max_resumes') {
      const { count } = await supabase
        .from('resumes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('deleted_at', null);
      current = count || 0;
    } else if (limitType === 'max_exports_per_month') {
      const { data } = await supabase
        .from('resumes')
        .select('export_count')
        .eq('user_id', userId)
        .gte('last_exported_at', new Date(new Date().setDate(1)).toISOString());
      current = data?.reduce((sum, r) => sum + r.export_count, 0) || 0;
    }
    
    // -1 means unlimited
    const allowed = limit === -1 || current < limit;
    
    return { allowed, current, limit };
  }
}
```

Create `src/handlers/subscriptions.ts`:

```typescript
import { Router } from 'express';
import { SubscriptionService } from '../services/subscription.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const subscriptionService = new SubscriptionService();

// Get all plans
router.get('/plans', async (req, res, next) => {
  try {
    const plans = await subscriptionService.getPlans();
    res.json(plans);
  } catch (error) {
    next(error);
  }
});

// Get plan features
router.get('/plans/:id/features', async (req, res, next) => {
  try {
    const plan = await subscriptionService.getPlanById(req.params.id);
    res.json(plan.features);
  } catch (error) {
    next(error);
  }
});

// Get current subscription
router.get('/current', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const subscription = await subscriptionService.getUserSubscription(req.user!.id);
    res.json(subscription);
  } catch (error) {
    next(error);
  }
});

// Check feature access
router.get('/features/:feature', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const hasAccess = await subscriptionService.checkFeatureAccess(
      req.user!.id,
      req.params.feature
    );
    res.json({ hasAccess });
  } catch (error) {
    next(error);
  }
});

// Check usage limits
router.get('/limits/:limitType', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const result = await subscriptionService.checkUsageLimit(
      req.user!.id,
      req.params.limitType
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
```

---

## Task 21: Subscription Lifecycle

### Objective
Implement subscription creation, cancellation, and plan changes.

### Implementation

Update `src/services/subscription.service.ts`:

```typescript
async createCheckoutSession(
  userId: string,
  planId: string,
  billingCycle: 'monthly' | 'yearly'
): Promise<{ sessionId: string; url: string }> {
  const plan = await this.getPlanById(planId);
  
  // Get or create Stripe customer
  const { data: user } = await supabase
    .from('users')
    .select('email, full_name, stripe_customer_id')
    .eq('id', userId)
    .single();
  
  let customerId = user.stripe_customer_id;
  
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.full_name,
      metadata: { user_id: userId },
    });
    customerId = customer.id;
    
    await supabase
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId);
  }
  
  // Create checkout session
  const priceId = billingCycle === 'monthly' 
    ? plan.stripe_price_id_monthly 
    : plan.stripe_price_id_yearly;
  
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{
      price: priceId,
      quantity: 1,
    }],
    success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
    metadata: {
      user_id: userId,
      plan_id: planId,
    },
  });
  
  return {
    sessionId: session.id,
    url: session.url!,
  };
}

async cancelSubscription(userId: string): Promise<void> {
  const subscription = await this.getUserSubscription(userId);
  
  if (!subscription) {
    throw new Error('No active subscription found');
  }
  
  // Cancel at period end
  await stripe.subscriptions.update(subscription.stripe_subscription_id, {
    cancel_at_period_end: true,
  });
  
  // Update database
  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', subscription.id);
}

async changePlan(
  userId: string,
  newPlanId: string
): Promise<void> {
  const currentSubscription = await this.getUserSubscription(userId);
  
  if (!currentSubscription) {
    throw new Error('No active subscription found');
  }
  
  const newPlan = await this.getPlanById(newPlanId);
  
  // Update Stripe subscription
  const stripeSubscription = await stripe.subscriptions.retrieve(
    currentSubscription.stripe_subscription_id
  );
  
  await stripe.subscriptions.update(currentSubscription.stripe_subscription_id, {
    items: [{
      id: stripeSubscription.items.data[0].id,
      price: newPlan.stripe_price_id_monthly,
    }],
    proration_behavior: 'create_prorations',
  });
  
  // Update database
  await supabase
    .from('subscriptions')
    .update({ plan_id: newPlanId })
    .eq('id', currentSubscription.id);
}
```

Update `src/handlers/subscriptions.ts`:

```typescript
// Create checkout session
router.post('/checkout', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { planId, billingCycle } = req.body;
    const result = await subscriptionService.createCheckoutSession(
      req.user!.id,
      planId,
      billingCycle
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Cancel subscription
router.post('/cancel', authenticate, async (req: AuthRequest, res, next) => {
  try {
    await subscriptionService.cancelSubscription(req.user!.id);
    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    next(error);
  }
});

// Change plan
router.post('/change-plan', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { planId } = req.body;
    await subscriptionService.changePlan(req.user!.id, planId);
    res.json({ message: 'Plan changed successfully' });
  } catch (error) {
    next(error);
  }
});
```

---

## Task 22: Payment Processing

### Objective
Handle payment transactions and history.

### Implementation

Create `src/services/payment.service.ts`:

```typescript
import { supabase } from '../utils/supabase';
import { stripe } from './stripe.service';
import { Payment } from '../types/payment.types';

export class PaymentService {
  async recordPayment(data: {
    userId: string;
    subscriptionId: string;
    amount: number;
    currency: string;
    stripePaymentIntentId: string;
    status: string;
  }): Promise<Payment> {
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        user_id: data.userId,
        subscription_id: data.subscriptionId,
        amount: data.amount,
        currency: data.currency,
        stripe_payment_intent_id: data.stripePaymentIntentId,
        status: data.status,
        paid_at: data.status === 'succeeded' ? new Date().toISOString() : null,
      })
      .select()
      .single();
    
    if (error) throw error;
    return payment;
  }
  
  async getPaymentHistory(userId: string, options: {
    page?: number;
    limit?: number;
  } = {}): Promise<{ payments: Payment[]; total: number }> {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;
    
    const { data, error, count } = await supabase
      .from('payments')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    return {
      payments: data || [],
      total: count || 0,
    };
  }
  
  async getInvoice(paymentId: string, userId: string): Promise<any> {
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .eq('user_id', userId)
      .single();
    
    if (!payment) throw new Error('Payment not found');
    
    // Get Stripe invoice
    const paymentIntent = await stripe.paymentIntents.retrieve(
      payment.stripe_payment_intent_id
    );
    
    if (paymentIntent.invoice) {
      const invoice = await stripe.invoices.retrieve(paymentIntent.invoice as string);
      return invoice;
    }
    
    return null;
  }
  
  async refundPayment(paymentId: string, userId: string): Promise<void> {
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .eq('user_id', userId)
      .single();
    
    if (!payment) throw new Error('Payment not found');
    
    // Create refund in Stripe
    await stripe.refunds.create({
      payment_intent: payment.stripe_payment_intent_id,
    });
    
    // Update database
    await supabase
      .from('payments')
      .update({
        status: 'refunded',
        refunded_at: new Date().toISOString(),
      })
      .eq('id', paymentId);
  }
}
```

Create `src/handlers/payments.ts`:

```typescript
import { Router } from 'express';
import { PaymentService } from '../services/payment.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const paymentService = new PaymentService();

// Get payment history
router.get('/history', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await paymentService.getPaymentHistory(req.user!.id, {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get invoice
router.get('/:id/invoice', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const invoice = await paymentService.getInvoice(req.params.id, req.user!.id);
    res.json(invoice);
  } catch (error) {
    next(error);
  }
});

export default router;
```

---

## Task 23: Stripe Webhooks

### Objective
Handle Stripe webhook events for subscription lifecycle.

### Implementation

Create `src/services/webhook.service.ts`:

```typescript
import Stripe from 'stripe';
import { supabase } from '../utils/supabase';
import { PaymentService } from './payment.service';

const paymentService = new PaymentService();

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
      break;
    
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;
    
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata.user_id;
  const planId = subscription.metadata.plan_id;
  
  await supabase.from('subscriptions').insert({
    user_id: userId,
    plan_id: planId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    status: 'active',
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  });
  
  // Update user subscription tier
  await supabase
    .from('users')
    .update({
      subscription_tier: planId,
      subscription_status: 'active',
      subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('id', userId);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata.user_id;
  
  await supabase
    .from('subscriptions')
    .update({ status: 'expired' })
    .eq('stripe_subscription_id', subscription.id);
  
  // Downgrade to free tier
  await supabase
    .from('users')
    .update({
      subscription_tier: 'free',
      subscription_status: 'expired',
    })
    .eq('id', userId);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const subscription = await supabase
    .from('subscriptions')
    .select('*')
    .eq('stripe_subscription_id', invoice.subscription)
    .single();
  
  if (subscription.data) {
    await paymentService.recordPayment({
      userId: subscription.data.user_id,
      subscriptionId: subscription.data.id,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      stripePaymentIntentId: invoice.payment_intent as string,
      status: 'succeeded',
    });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  // Handle failed payment - send notification, update status, etc.
  console.log('Payment failed:', invoice.id);
}
```

---

## Testing

Test webhooks locally using Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/webhooks/stripe

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

---

## Deliverables

✅ Stripe integration
✅ Subscription plans management
✅ Checkout session creation
✅ Subscription lifecycle (create, cancel, change)
✅ Payment processing
✅ Payment history
✅ Invoice generation
✅ Webhook handling
✅ Feature access control
✅ Usage limit checking

**Subscriptions & Payments Complete! Ready for Task 24: Feature Flags**
