// Liste des goodies disponibles
export const GOODIES = [
  {
    id: 'rose',
    name: 'Rose',
    emoji: '🌹',
    price: 99, // en centimes (0,99 €)
    stripePriceId: 'price_rose', // à remplacer par le vrai ID Stripe
  },
  {
    id: 'heart',
    name: 'Cœur',
    emoji: '❤️',
    price: 199, // 1,99 €
    stripePriceId: 'price_heart',
  },
  {
    id: 'kiss',
    name: 'Bisou',
    emoji: '💋',
    price: 299, // 2,99 €
    stripePriceId: 'price_kiss',
  },
  {
    id: 'champagne',
    name: 'Champagne',
    emoji: '🍾',
    price: 499, // 4,99 €
    stripePriceId: 'price_champagne',
  },
  {
    id: 'diamond',
    name: 'Diamant',
    emoji: '💎',
    price: 999, // 9,99 €
    stripePriceId: 'price_diamond',
  },
];

// Récupérer un goodie par son ID
export function getGoodieById(id) {
  return GOODIES.find((g) => g.id === id) || null;
}
