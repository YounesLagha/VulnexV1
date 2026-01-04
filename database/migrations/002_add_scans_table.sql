-- Migration : Création de la table des scans de sécurité
-- À exécuter dans Supabase SQL Editor après 001_initial_schema.sql

-- Type ENUM pour les statuts de scan
CREATE TYPE scan_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'failed',
    'cancelled'
);

-- Table des scans de sécurité
CREATE TABLE IF NOT EXISTS public.scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    status scan_status NOT NULL DEFAULT 'pending',
    results JSONB,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    grade TEXT CHECK (grade IN ('A+', 'A', 'B', 'C', 'D', 'F')),
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- Contraintes
    CONSTRAINT url_not_empty CHECK (char_length(url) > 0),
    CONSTRAINT url_max_length CHECK (char_length(url) <= 2048)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON public.scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_status ON public.scans(status);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON public.scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_url ON public.scans(url);

-- Index GIN pour recherches dans les résultats JSON
CREATE INDEX IF NOT EXISTS idx_scans_results ON public.scans USING gin(results);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_scans_updated_at
    BEFORE UPDATE ON public.scans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) pour scans
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- Policy : Les utilisateurs authentifiés peuvent créer des scans
CREATE POLICY "Authenticated users can create scans"
    ON public.scans
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id OR user_id IS NULL
    );

-- Policy : Les utilisateurs peuvent voir leurs propres scans
CREATE POLICY "Users can view own scans"
    ON public.scans
    FOR SELECT
    USING (
        auth.uid() = user_id OR user_id IS NULL
    );

-- Policy : Les utilisateurs peuvent mettre à jour leurs propres scans
CREATE POLICY "Users can update own scans"
    ON public.scans
    FOR UPDATE
    USING (
        auth.uid() = user_id OR user_id IS NULL
    );

-- Policy : Les utilisateurs peuvent supprimer leurs propres scans
CREATE POLICY "Users can delete own scans"
    ON public.scans
    FOR DELETE
    USING (
        auth.uid() = user_id
    );

-- Vue pour les statistiques de scans
CREATE OR REPLACE VIEW public.scan_statistics AS
SELECT
    user_id,
    COUNT(*) as total_scans,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_scans,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_scans,
    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_scans,
    AVG(score) FILTER (WHERE status = 'completed') as average_score,
    MIN(created_at) as first_scan_date,
    MAX(created_at) as last_scan_date
FROM public.scans
GROUP BY user_id;

-- Commentaires pour documentation
COMMENT ON TABLE public.scans IS 'Scans de sécurité effectués par les utilisateurs';
COMMENT ON COLUMN public.scans.url IS 'URL du site web scanné';
COMMENT ON COLUMN public.scans.status IS 'Statut actuel du scan';
COMMENT ON COLUMN public.scans.results IS 'Résultats détaillés du scan au format JSON';
COMMENT ON COLUMN public.scans.score IS 'Score de sécurité sur 100';
COMMENT ON COLUMN public.scans.grade IS 'Note de sécurité (A+ à F)';
COMMENT ON COLUMN public.scans.error IS 'Message d''erreur si le scan a échoué';
