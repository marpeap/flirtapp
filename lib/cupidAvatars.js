export const CUPID_AVATAR_COUNT = 263;

// Retourne un chemin du type "/cupids/42.png"
export function getRandomCupidAvatarPath() {
  const index = Math.floor(Math.random() * CUPID_AVATAR_COUNT) + 1;
  return `/cupids/${index}.png`;
}

