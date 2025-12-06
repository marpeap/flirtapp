import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { GOODIES } from '@/lib/goodies';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { goodieId, recipientUserId, conversationId } = await request.json();

    if (!goodieId || !recipientUserId || !conversationId) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    const goodie = GOODIES.find((g) => g.id === goodieId);
    if (!goodie) {
      return NextResponse.json(
        { error: 'Goodie introuvable' },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${goodie.emoji} ${goodie.name}`,
              description: `Goodie ManyLovr - ${goodie.name}`,
            },
            unit_amount: goodie.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/messages/${conversationId}?goodie_sent=${goodieId}`,
      cancel_url: `${baseUrl}/messages/${conversationId}`,
      metadata: {
        type: 'goodie_purchase',
        goodie_id: goodieId,
        recipient_user_id: recipientUserId,
        conversation_id: conversationId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Erreur checkout goodie:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
