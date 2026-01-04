-- Migration: Correction de la vue user_scan_stats pour respecter RLS
-- Date: 2024-12-23
-- Description: Supprime SECURITY DEFINER et recrée la vue en mode SECURITY INVOKER
--              pour que les règles RLS de la table scans s'appliquent correctement

-- ============================================================================
-- PROBLÈME IDENTIFIÉ:
-- ============================================================================
-- La vue user_scan_stats originale n'avait pas de contrôle RLS explicite.
-- Par défaut, les vues dans PostgreSQL peuvent contourner RLS si elles ne
-- sont pas correctement configurées avec SECURITY INVOKER.
--
-- SOLUTION:
-- Recréer la vue en mode SECURITY INVOKER pour garantir que:
-- - Chaque utilisateur ne voit que SES propres statistiques
-- - Les règles RLS de la table source (scans) s'appliquent
-- - Aucun contournement de sécurité n'est possible
-- ============================================================================

-- Étape 1: Supprimer l'ancienne vue
DROP VIEW IF EXISTS public.user_scan_stats;

-- Étape 2: Recréer la vue avec SECURITY INVOKER (applique RLS)
CREATE OR REPLACE VIEW public.user_scan_stats
WITH (security_invoker = true)  -- CRITIQUE: Force l'application de RLS
AS
SELECT
    user_id,
    COUNT(*) as total_scans,
    ROUND(AVG(score)::numeric, 2) as average_score,  -- Arrondi à 2 décimales
    MAX(score) as best_score,
    MIN(score) as worst_score,
    COUNT(DISTINCT url) as unique_urls,
    MAX(created_at) as last_scan_at
FROM public.scans
WHERE user_id IS NOT NULL  -- Exclut les scans anonymes
  AND user_id = auth.uid()  -- CRITIQUE: Filtre explicite sur l'utilisateur courant
GROUP BY user_id;

-- Étape 3: Ajouter un commentaire de documentation
COMMENT ON VIEW public.user_scan_stats IS
'Vue sécurisée des statistiques de scan par utilisateur.
SECURITY INVOKER activé: chaque utilisateur ne voit que ses propres stats.
Respecte automatiquement les règles RLS de la table scans.';

-- ============================================================================
-- VÉRIFICATIONS DE SÉCURITÉ
-- ============================================================================
-- Cette vue garantit:
-- ✅ Isolation utilisateur: user_id = auth.uid()
-- ✅ RLS appliqué: security_invoker = true
-- ✅ Pas de SECURITY DEFINER (dangereux)
-- ✅ Pas d'accès aux données d'autres utilisateurs
-- ✅ Compatible avec le frontend sans risque de fuite de données
-- ============================================================================

-- Étape 4: Grant SELECT sur la vue pour les utilisateurs authentifiés
GRANT SELECT ON public.user_scan_stats TO authenticated;

-- Note: Les utilisateurs anonymes (anon) ne peuvent PAS accéder à cette vue
-- car elle nécessite auth.uid() qui retourne NULL pour les non-authentifiés
