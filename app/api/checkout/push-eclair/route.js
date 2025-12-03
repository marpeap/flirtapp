// app/api/checkout/push-eclair/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getStripeServer } from '@/lib/stripe/stripe-server';

export async function POST(request) {
  try {
    const { packId } = await request.json();

    // Selon packId, tu peux définir plusieurs quantités/prix si tu veux
    // Ici, on prend un seul pack pour l'exemple (ex: 5 Push pour 4,99 €)
    const quantity = 5;
    const priceId = process.env.STRIPE_PUSH_ECLAIR_PRICE_ID; // Price créé dans Stripe

    if (!priceId) {
      return NextResponse.json(
        { error: 'Prix Stripe non configuré côté serveur.' },
        { status: 500 }
      );
    }

    const cookieStore = cookies();
    const supabaseAccessToken =
      cookieStore.get('sb-access-token')?.value || null;

    if (!supabaseAccessToken) {
      return NextResponse.json(
        { error: 'Non authentifié.' },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: `Bearer ${supabaseAccessToken}`,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable." },
        { status: 401 }
      );
    }

    const stripe = getStripeServer();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/profiles?push_success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/profiles?push_canceled=true`,
      metadata: {
        user_id: user.id,
        feature: 'push_eclair',
        push_quantity: String(quantity),
      },
      customer_email: user.email ?? undefined,
    });

    // Enregistrement côté base en "pending"
    await supabase.from('push_eclair_purchases').insert({
      user_id: user.id,
      stripe_checkout_id: session.id,
      quantity,
      amount_cents: 0, // on mettra à jour via le webhook
      status: 'pending',
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Erreur création Checkout Push Éclair', err);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création du paiement.' },
      { status: 500 }
    );
  }
}

