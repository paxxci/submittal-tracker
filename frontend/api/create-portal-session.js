import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://uxqbkxfctifxrgstxlwf.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service_key'
  );

  try {
    const { organizationId, returnUrl } = req.body;
    
    const { data: org } = await supabase.from('organizations').select('stripe_customer_id').eq('id', organizationId).single();
    if (!org?.stripe_customer_id) {
      return res.status(400).json({ error: 'No Stripe customer attached to this organization' });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: returnUrl,
    });
    res.status(200).json({ url: portalSession.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
