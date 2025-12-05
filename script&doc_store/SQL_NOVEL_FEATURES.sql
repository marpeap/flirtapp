-- ============================================
-- Script SQL pour les nouvelles fonctionnalités ManyLovr
-- ============================================

-- 1. MODE DÉCOUVERTE EN TEMPS RÉEL
-- Ajouter last_seen_at et is_online dans profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

-- Index pour les requêtes de profils actifs
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen_at ON profiles(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON profiles(is_online) WHERE is_online = true;

-- Fonction pour mettre à jour last_seen_at automatiquement
CREATE OR REPLACE FUNCTION update_user_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET last_seen_at = NOW(), is_online = true
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour last_seen_at à chaque connexion
DROP TRIGGER IF EXISTS trigger_update_last_seen ON auth.users;
CREATE TRIGGER trigger_update_last_seen
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at)
  EXECUTE FUNCTION update_user_last_seen();

-- Fonction pour marquer les utilisateurs comme offline après 5 minutes d'inactivité
-- (à exécuter via un cron job ou une fonction périodique)
CREATE OR REPLACE FUNCTION mark_inactive_users_offline()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET is_online = false
  WHERE is_online = true
    AND last_seen_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. POINTS DE RENCONTRE SUGGÉRÉS
-- ============================================

CREATE TABLE IF NOT EXISTS meetup_spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  category TEXT, -- 'cafe', 'park', 'restaurant', 'bar', 'other'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meetup_spots_location ON meetup_spots USING GIST (
  ll_to_earth(lat, lng)
);

-- Fonction pour trouver des spots à mi-chemin entre deux utilisateurs
CREATE OR REPLACE FUNCTION find_meetup_spots_between(
  lat1 DOUBLE PRECISION,
  lng1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lng2 DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 5.0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  category TEXT,
  distance_km DOUBLE PRECISION
) AS $$
DECLARE
  mid_lat DOUBLE PRECISION;
  mid_lng DOUBLE PRECISION;
BEGIN
  -- Calculer le point médian
  mid_lat := (lat1 + lat2) / 2.0;
  mid_lng := (lng1 + lng2) / 2.0;
  
  RETURN QUERY
  SELECT 
    ms.id,
    ms.name,
    ms.address,
    ms.lat,
    ms.lng,
    ms.category,
    (earth_distance(ll_to_earth(mid_lat, mid_lng), ll_to_earth(ms.lat, ms.lng)) / 1000.0) AS distance_km
  FROM meetup_spots ms
  WHERE earth_distance(ll_to_earth(mid_lat, mid_lng), ll_to_earth(ms.lat, ms.lng)) <= radius_km * 1000.0
  ORDER BY distance_km
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. MESSAGES VOCAUX
-- ============================================

-- Ajouter audio_url dans messages
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS audio_duration_seconds INTEGER;

-- Index pour les messages vocaux
CREATE INDEX IF NOT EXISTS idx_messages_audio_url ON messages(audio_url) WHERE audio_url IS NOT NULL;

-- ============================================
-- 4. SPEED DATING VIRTUEL
-- ============================================

CREATE TABLE IF NOT EXISTS speed_dating_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting', 'active', 'completed', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  max_participants INTEGER DEFAULT 8,
  current_participants INTEGER DEFAULT 0,
  session_duration_minutes INTEGER DEFAULT 5
);

CREATE TABLE IF NOT EXISTS speed_dating_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES speed_dating_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  current_match_user_id UUID REFERENCES auth.users(id),
  UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_speed_dating_participants_session ON speed_dating_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_speed_dating_participants_user ON speed_dating_participants(user_id);

-- ============================================
-- 5. SCORE DE COMPATIBILITÉ DYNAMIQUE
-- ============================================

CREATE TABLE IF NOT EXISTS dynamic_compatibility_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  base_score INTEGER, -- Score initial du questionnaire
  interaction_score INTEGER DEFAULT 0, -- Bonus/malus selon interactions
  total_score INTEGER, -- Score total
  last_interaction_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id_1, user_id_2)
);

CREATE INDEX IF NOT EXISTS idx_dynamic_compatibility_user1 ON dynamic_compatibility_scores(user_id_1);
CREATE INDEX IF NOT EXISTS idx_dynamic_compatibility_user2 ON dynamic_compatibility_scores(user_id_2);
CREATE INDEX IF NOT EXISTS idx_dynamic_compatibility_total_score ON dynamic_compatibility_scores(total_score DESC);

-- Fonction pour mettre à jour le score dynamique
CREATE OR REPLACE FUNCTION update_compatibility_score(
  p_user_id_1 UUID,
  p_user_id_2 UUID,
  p_interaction_type TEXT -- 'message', 'reaction', 'match', 'unmatch'
)
RETURNS void AS $$
DECLARE
  v_interaction_bonus INTEGER;
  v_current_score INTEGER;
BEGIN
  -- Déterminer le bonus selon le type d'interaction
  CASE p_interaction_type
    WHEN 'message' THEN v_interaction_bonus := 5;
    WHEN 'reaction' THEN v_interaction_bonus := 3;
    WHEN 'match' THEN v_interaction_bonus := 10;
    WHEN 'unmatch' THEN v_interaction_bonus := -5;
    ELSE v_interaction_bonus := 0;
  END CASE;
  
  -- Récupérer ou créer le score
  INSERT INTO dynamic_compatibility_scores (user_id_1, user_id_2, interaction_score, total_score, last_interaction_at)
  VALUES (p_user_id_1, p_user_id_2, v_interaction_bonus, COALESCE((SELECT base_score FROM dynamic_compatibility_scores WHERE user_id_1 = p_user_id_1 AND user_id_2 = p_user_id_2), 0) + v_interaction_bonus, NOW())
  ON CONFLICT (user_id_1, user_id_2)
  DO UPDATE SET
    interaction_score = dynamic_compatibility_scores.interaction_score + v_interaction_bonus,
    total_score = COALESCE(dynamic_compatibility_scores.base_score, 0) + dynamic_compatibility_scores.interaction_score + v_interaction_bonus,
    last_interaction_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. SYSTÈME DE VIBES
-- ============================================

-- Ajouter vibes dans profiles (tableau de tags)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS vibes TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Index GIN pour les recherches par vibes
CREATE INDEX IF NOT EXISTS idx_profiles_vibes ON profiles USING GIN(vibes);

-- ============================================
-- 7. BADGES ET ACHIEVEMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- 'first_match', '10_matches', 'perfect_match', etc.
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  category TEXT, -- 'matches', 'messages', 'activity', 'social'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);

-- Insérer les badges de base
INSERT INTO badges (code, name, description, category) VALUES
  ('first_match', 'Premier Match', 'Tu as eu ton premier match !', 'matches'),
  ('10_matches', 'Séducteur·se', '10 matchs à ton actif', 'matches'),
  ('50_matches', 'Champion·ne', '50 matchs !', 'matches'),
  ('perfect_match', 'Match Parfait', 'Un match avec un score de compatibilité > 90%', 'matches'),
  ('first_message', 'Premier Pas', 'Tu as envoyé ton premier message', 'messages'),
  ('100_messages', 'Bavard·e', '100 messages envoyés', 'messages'),
  ('streak_7', 'Streak de 7 jours', 'Connecté·e 7 jours d''affilée', 'activity'),
  ('streak_30', 'Streak de 30 jours', 'Connecté·e 30 jours d''affilée', 'activity'),
  ('profile_complete', 'Profil Complet', 'Ton profil est à 100%', 'activity'),
  ('group_creator', 'Organisateur·rice', 'Tu as créé un groupe', 'social'),
  ('ambassador', 'Ambassadeur·rice', 'Tu as parrainé 5 amis', 'social')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 8. RÉCOMPENSES DE FIDÉLITÉ
-- ============================================

CREATE TABLE IF NOT EXISTS user_activity_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  total_points INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_streaks_user ON user_activity_streaks(user_id);

-- Fonction pour mettre à jour le streak
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_last_activity DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
BEGIN
  SELECT last_activity_date, current_streak_days, longest_streak_days
  INTO v_last_activity, v_current_streak, v_longest_streak
  FROM user_activity_streaks
  WHERE user_id = p_user_id;
  
  IF v_last_activity IS NULL THEN
    -- Première activité
    INSERT INTO user_activity_streaks (user_id, current_streak_days, longest_streak_days, last_activity_date)
    VALUES (p_user_id, 1, 1, v_today)
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF v_last_activity = v_today THEN
    -- Déjà mis à jour aujourd'hui
    RETURN;
  ELSIF v_last_activity = v_today - INTERVAL '1 day' THEN
    -- Streak continue
    UPDATE user_activity_streaks
    SET 
      current_streak_days = v_current_streak + 1,
      longest_streak_days = GREATEST(v_longest_streak, v_current_streak + 1),
      last_activity_date = v_today,
      total_points = total_points + 10, -- 10 points par jour de streak
      updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSE
    -- Streak cassé
    UPDATE user_activity_streaks
    SET 
      current_streak_days = 1,
      last_activity_date = v_today,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. GROUPES D'INTÉRÊTS
-- ============================================

CREATE TABLE IF NOT EXISTS interest_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'sport', 'art', 'cuisine', 'musique', 'voyage', etc.
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_public BOOLEAN DEFAULT true,
  member_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS interest_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES interest_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  role TEXT DEFAULT 'member', -- 'admin', 'moderator', 'member'
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_interest_group_members_group ON interest_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_interest_group_members_user ON interest_group_members(user_id);

-- Fonction pour mettre à jour le nombre de membres
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE interest_groups
    SET member_count = member_count + 1
    WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE interest_groups
    SET member_count = GREATEST(0, member_count - 1)
    WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_group_member_count
  AFTER INSERT OR DELETE ON interest_group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_group_member_count();

-- ============================================
-- 10. MODÈLE D'ABONNEMENT PREMIUM
-- ============================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- 'free', 'plus', 'premium'
  name TEXT NOT NULL,
  description TEXT,
  price_monthly_cents INTEGER,
  price_yearly_cents INTEGER,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  features JSONB, -- {'unlimited_filters': true, 'incognito_mode': true, etc.}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired', 'trial'
  stripe_subscription_id TEXT UNIQUE,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- Ajouter is_premium dans profiles pour accès rapide
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON profiles(is_premium) WHERE is_premium = true;

-- Fonction pour vérifier si un utilisateur a un abonnement actif
CREATE OR REPLACE FUNCTION is_user_premium(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id
      AND us.status = 'active'
      AND (us.current_period_end IS NULL OR us.current_period_end > NOW())
      AND sp.code != 'free'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insérer les plans de base
INSERT INTO subscription_plans (code, name, description, price_monthly_cents, features) VALUES
  ('free', 'Gratuit', 'Accès de base à ManyLovr', 0, '{"unlimited_filters": false, "incognito_mode": false, "see_who_viewed": false, "priority_support": false}'::jsonb),
  ('plus', 'ManyLovr Plus', 'Accès premium avec fonctionnalités avancées', 999, '{"unlimited_filters": true, "incognito_mode": true, "see_who_viewed": true, "priority_support": true, "monthly_push_credits": 5}'::jsonb),
  ('premium', 'ManyLovr Premium', 'Toutes les fonctionnalités premium', 1999, '{"unlimited_filters": true, "incognito_mode": true, "see_who_viewed": true, "priority_support": true, "monthly_push_credits": 15, "unlimited_boosts": true}'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Activer RLS sur les nouvelles tables
ALTER TABLE meetup_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE speed_dating_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE speed_dating_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE dynamic_compatibility_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies pour meetup_spots (lecture publique)
CREATE POLICY "Anyone can view meetup spots" ON meetup_spots FOR SELECT USING (true);

-- Policies pour speed_dating_sessions
CREATE POLICY "Users can view active sessions" ON speed_dating_sessions FOR SELECT USING (status = 'active' OR status = 'waiting');
CREATE POLICY "Users can join sessions" ON speed_dating_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies pour dynamic_compatibility_scores
CREATE POLICY "Users can view their own compatibility scores" ON dynamic_compatibility_scores FOR SELECT USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Policies pour user_badges
CREATE POLICY "Users can view their own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view public badges" ON badges FOR SELECT USING (true);

-- Policies pour user_activity_streaks
CREATE POLICY "Users can view their own streaks" ON user_activity_streaks FOR SELECT USING (auth.uid() = user_id);

-- Policies pour interest_groups
CREATE POLICY "Anyone can view public groups" ON interest_groups FOR SELECT USING (is_public = true);
CREATE POLICY "Users can create groups" ON interest_groups FOR INSERT WITH CHECK (auth.uid() = created_by_user_id);
CREATE POLICY "Group creators can update their groups" ON interest_groups FOR UPDATE USING (auth.uid() = created_by_user_id);

-- Policies pour interest_group_members
CREATE POLICY "Anyone can view group members" ON interest_group_members FOR SELECT USING (true);
CREATE POLICY "Users can join groups" ON interest_group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON interest_group_members FOR DELETE USING (auth.uid() = user_id);

-- Policies pour subscription_plans (lecture publique)
CREATE POLICY "Anyone can view subscription plans" ON subscription_plans FOR SELECT USING (true);

-- Policies pour user_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- FIN DU SCRIPT
-- ============================================

