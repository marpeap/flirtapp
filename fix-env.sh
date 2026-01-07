#!/bin/bash

echo "🔧 Correction de la configuration Supabase..."

# Aller dans le répertoire web
cd "$(dirname "$0")"

# Vérifier que .env.local existe
if [ ! -f .env.local ]; then
    echo "❌ Erreur: Le fichier .env.local n'existe pas!"
    exit 1
fi

echo "✅ Fichier .env.local trouvé"

# Afficher la configuration actuelle
echo ""
echo "📋 Configuration actuelle:"
grep "NEXT_PUBLIC_SUPABASE_URL" .env.local | head -1

# Nettoyer le cache Next.js
echo ""
echo "🧹 Nettoyage du cache Next.js..."
rm -rf .next
echo "✅ Cache nettoyé"

# Vérifier que les variables sont correctes
URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" .env.local | cut -d '=' -f2)
if [[ "$URL" != *"yomlhagujagscbsfxmyi"* ]]; then
    echo "⚠️  Attention: L'URL Supabase ne semble pas correcte: $URL"
    echo "   Elle devrait contenir 'yomlhagujagscbsfxmyi'"
fi

echo ""
echo "✅ Prêt! Vous pouvez maintenant démarrer le serveur avec:"
echo "   npm run dev"
echo ""
echo "⚠️  IMPORTANT: Assurez-vous d'avoir arrêté le serveur avant de le redémarrer!"


