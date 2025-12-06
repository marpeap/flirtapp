// app/api/checkout/push-eclair/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStripeServer } from '@/lib/stripe/stripe-server';

export async function POST(request) {
  try {
    const { packId } = await request.json();

    // Configuration des packs disponibles
    const packs = {
      '1x': {
        priceId: process.env.STRIPE_PUSH_ECLAIR_1X_PRICE_ID,
        quantity: 1,
        label: '1x Push Éclair',
      },
      '3x': {
        priceId: process.env.STRIPE_PUSH_ECLAIR_3X_PRICE_ID,
        quantity: 3,
        label: '3x Push Éclair',
      },
    };

    // Valider le packId
    if (!packId || !packs[packId]) {
      return NextResponse.json(
        { error: 'Pack invalide. Choisis entre "1x" ou "3x".' },
        { status: 400 }
      );
    }

    const selectedPack = packs[packId];
    const priceId = selectedPack.priceId;
    const quantity = selectedPack.quantity;

    if (!priceId) {
      return NextResponse.json(
        { error: `Prix Stripe non configuré pour le pack ${packId}.` },
        { status: 500 }
      );
    }

    // Récupérer le token d'authentification depuis le header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Non authentifié. Token manquant.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Créer un client Supabase avec le token utilisateur
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
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

    // Vérifier que la clé Stripe est configurée
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY non configurée');
      return NextResponse.json(
        { error: 'Configuration Stripe manquante. Contacte le support.' },
        { status: 500 }
      );
    }

    const stripe = getStripeServer();

    if (!stripe) {
      console.error('Impossible d\'initialiser Stripe');
      return NextResponse.json(
        { error: 'Erreur d\'initialisation Stripe. Contacte le support.' },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/push-success?pack=${packId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/push-canceled`,
      metadata: {
        user_id: user.id,
        feature: 'push_eclair',
        push_quantity: String(quantity),
        pack_id: packId,
      },
      customer_email: user.email ?? undefined,
    });

    // Enregistrement côté base en "pending"
    // Utiliser le service role key pour insérer dans la table
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY non configurée');
      // On continue quand même car le webhook pourra créer l'entrée
    } else {
      const supabaseAdmin = createClient(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { error: insertError } = await supabaseAdmin
        .from('push_eclair_purchases')
        .insert({
          user_id: user.id,
          stripe_checkout_id: session.id,
          quantity,
          amount_cents: 0, // on mettra à jour via le webhook
          status: 'pending',
        });

      if (insertError) {
        console.error('Erreur insertion achat:', insertError);
        // On continue quand même car le webhook pourra créer l'entrée
      }
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Erreur création Checkout Push Éclair:', err);
    console.error('Détails de l\'erreur:', {
      message: err.message,
      type: err.type,
      code: err.code,
      statusCode: err.statusCode,
    });
    
    // Retourner un message plus détaillé en développement
    const errorMessage = process.env.NODE_ENV === 'development'
      ? `Erreur serveur: ${err.message || 'Erreur inconnue'}`
      : 'Erreur serveur lors de la création du paiement.';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

