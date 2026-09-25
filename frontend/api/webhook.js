import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: { bodyParser: false }
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://uxqbkxfctifxrgstxlwf.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service_key'
  );

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy';

  const buf = await buffer(req);
  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook error:', err.message);
    if (endpointSecret === 'whsec_dummy') {
      try { event = JSON.parse(buf.toString()); } catch (e) { return res.status(400).send('Error'); }
    } else {
      return res.status(400).send();
    }
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const orgId = session.client_reference_id;
        if (orgId) {
          await supabase.from('organizations').update({
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            subscription_status: 'active'
          }).eq('id', orgId);
        }
        break;
      }
      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const status = subscription.status;
        await supabase.from('organizations').update({
          subscription_status: status
        }).eq('stripe_subscription_id', subscription.id);
        break;
      }
    }
  } catch (err) {
    console.error('Database update error:', err);
  }

  res.status(200).send('OK');
}
