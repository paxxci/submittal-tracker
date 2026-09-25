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
    
    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID || 'price_dummy', quantity: 1 }],
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: `${returnUrl}?success=true`,
      cancel_url: `${returnUrl}?canceled=true`,
      client_reference_id: organizationId,
    };
    
    if (org?.stripe_customer_id) {
      sessionConfig.customer = org.stripe_customer_id;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    res.status(200).json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
