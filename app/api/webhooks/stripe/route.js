// app/api/webhooks/stripe/route.js
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Créer le client Supabase seulement si la clé est définie
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL non configurées');
    return null;
  }
  
  return createClient(supabaseUrl, serviceRoleKey);
}

export async function POST(request) {
  const body = await request.text();
  const headersList = headers();
  const signature = headersList.get('stripe-signature');

  if (!signature || !webhookSecret) {
    console.error('Missing signature or webhook secret');
    return NextResponse.json(
      { error: 'Missing signature or webhook secret' },
      { status: 400 }
    );
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Gérer les événements
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.error('Impossible de créer le client Supabase admin');
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      );
    }
    
    try {
      // Mettre à jour la table push_eclair_purchases
      const { error: updateError } = await supabase
        .from('push_eclair_purchases')
        .update({
          status: 'completed',
          stripe_payment_intent_id: session.payment_intent,
          amount_cents: session.amount_total, // en centimes
        })
        .eq('stripe_checkout_id', session.id);

      if (updateError) {
        console.error('Error updating purchase:', updateError);
        return NextResponse.json(
          { error: 'Database update failed' },
          { status: 500 }
        );
      }

      // Ajouter les crédits Push Éclair à l'utilisateur
      const userId = session.metadata?.user_id;
      const quantity = parseInt(session.metadata?.push_quantity || '0', 10);

      if (userId && quantity > 0) {
        // Récupérer le profil de l'utilisateur
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, push_eclair_credits')
          .eq('user_id', userId)
          .single();

        if (!profileError && profile) {
          const currentCredits = profile.push_eclair_credits || 0;
          const newCredits = currentCredits + quantity;

          const { error: creditsError } = await supabase
            .from('profiles')
            .update({ push_eclair_credits: newCredits })
            .eq('user_id', userId);

          if (creditsError) {
            console.error('Error updating credits:', creditsError);
            return NextResponse.json(
              { error: 'Failed to update credits' },
              { status: 500 }
            );
          }

          console.log(
            `✅ Added ${quantity} Push Éclair credits to user ${userId}. New total: ${newCredits}`
          );
        } else {
          console.error('Profile not found for user:', userId);
        }
      } else {
        console.warn('Missing userId or quantity in session metadata');
      }
    } catch (err) {
      console.error('Error processing checkout.session.completed:', err);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  // Gérer d'autres événements si nécessaire
  if (event.type === 'checkout.session.async_payment_failed') {
    const session = event.data.object;
    const supabase = getSupabaseAdmin();
    if (supabase) {
      await supabase
        .from('push_eclair_purchases')
        .update({ status: 'failed' })
        .eq('stripe_checkout_id', session.id);
    }
  }

  return NextResponse.json({ received: true });
}


