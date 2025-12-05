-- ============================================
-- Table pour les achats de crédits Push Éclair via Stripe
-- ============================================
-- 
-- Cette table enregistre tous les achats de crédits Push Éclair
-- et leur statut de paiement via Stripe
--
-- À exécuter dans Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS push_eclair_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_checkout_id TEXT NOT NULL UNIQUE,
  stripe_payment_intent_id TEXT,
  quantity INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_push_eclair_purchases_user_id ON push_eclair_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_push_eclair_purchases_status ON push_eclair_purchases(status);
CREATE INDEX IF NOT EXISTS idx_push_eclair_purchases_stripe_checkout_id ON push_eclair_purchases(stripe_checkout_id);
CREATE INDEX IF NOT EXISTS idx_push_eclair_purchases_created_at ON push_eclair_purchases(created_at DESC);

-- Trigger pour updated_at (utilise la fonction existante si elle existe déjà)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $function$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $function$ LANGUAGE plpgsql;
  END IF;
END $$;

-- Créer le trigger pour updated_at
DROP TRIGGER IF EXISTS update_push_eclair_purchases_updated_at ON push_eclair_purchases;
CREATE TRIGGER update_push_eclair_purchases_updated_at
  BEFORE UPDATE ON push_eclair_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Politique RLS : Les utilisateurs peuvent voir uniquement leurs propres achats
ALTER TABLE push_eclair_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own purchases" ON push_eclair_purchases;
CREATE POLICY "Users can view their own purchases"
ON push_eclair_purchases FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Les admins peuvent tout voir (via service role key)
-- Les utilisateurs ne peuvent pas insérer directement (seul le webhook le fait)

-- ============================================
-- Vérification
-- ============================================
-- Pour vérifier que la table a été créée :
-- SELECT * FROM push_eclair_purchases LIMIT 10;

