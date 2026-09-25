require('dotenv').config()
const express = require('express')
const path = require('path')
const cors = require('cors')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy')
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://uxqbkxfctifxrgstxlwf.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service_key'
)

const app = express()
const PORT = process.env.PORT || 3002

app.use(cors())

// Webhook endpoint needs raw body
app.post('/api/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature']
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy'

  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook error:', err.message)
    // Accept dummy events if we don't have a real webhook secret setup yet
    if (endpointSecret === 'whsec_dummy') {
      try { event = JSON.parse(req.body.toString()) } catch (e) { return res.status(400).send() }
    } else {
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const orgId = session.client_reference_id
        if (orgId) {
          await supabase.from('organizations').update({
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            subscription_status: 'active'
          }).eq('id', orgId)
        }
        break;
      }
      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const status = subscription.status
        await supabase.from('organizations').update({
          subscription_status: status
        }).eq('stripe_subscription_id', subscription.id)
        break;
      }
    }
  } catch (err) {
    console.error('Database update error:', err)
  }

  res.send()
})

app.use(express.json())

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { organizationId, returnUrl } = req.body
    
    // Check if they already have a customer ID
    const { data: org } = await supabase.from('organizations').select('stripe_customer_id').eq('id', organizationId).single()
    
    // For dummy testing, just pretend we return a URL
    if ((process.env.STRIPE_SECRET_KEY || 'sk_test_dummy') === 'sk_test_dummy') {
      return res.json({ url: returnUrl + '?dummy_checkout=true' })
    }

    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID || 'price_dummy',
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${returnUrl}?success=true`,
      cancel_url: `${returnUrl}?canceled=true`,
      client_reference_id: organizationId,
    }
    
    if (org?.stripe_customer_id) {
      sessionConfig.customer = org.stripe_customer_id
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)
    res.json({ url: session.url })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/create-portal-session', async (req, res) => {
  try {
    const { organizationId, returnUrl } = req.body
    
    const { data: org } = await supabase.from('organizations').select('stripe_customer_id').eq('id', organizationId).single()
    if (!org?.stripe_customer_id) {
      return res.status(400).json({ error: 'No Stripe customer attached to this organization' })
    }
    
    if ((process.env.STRIPE_SECRET_KEY || 'sk_test_dummy') === 'sk_test_dummy') {
      return res.json({ url: returnUrl + '?dummy_portal=true' })
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: returnUrl,
    })
    res.json({ url: portalSession.url })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Serve frontend build
app.use(express.static(path.join(__dirname, 'frontend', 'dist')))

// ─── Health check ──────────────────────────────
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', service: 'Submittal Tracker', version: '1.0.0' })
})

// ─── SPA fallback ──────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`
  ✦ Submittal Tracker running at http://localhost:${PORT}
`)
})
