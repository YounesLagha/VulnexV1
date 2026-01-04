-- Migration : Création de la table des rapports PDF
-- À exécuter dans Supabase SQL Editor après 002_add_scans_table.sql

-- Table des rapports PDF générés
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    pdf_url TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Contraintes
    CONSTRAINT pdf_url_not_empty CHECK (char_length(pdf_url) > 0)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_reports_scan_id ON public.reports(scan_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_expires_at ON public.reports(expires_at);

-- RLS (Row Level Security) pour reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Policy : Les utilisateurs authentifiés peuvent créer des rapports
CREATE POLICY "Authenticated users can create reports"
    ON public.reports
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id OR user_id IS NULL
    );

-- Policy : Les utilisateurs peuvent voir leurs propres rapports
CREATE POLICY "Users can view own reports"
    ON public.reports
    FOR SELECT
    USING (
        auth.uid() = user_id OR user_id IS NULL
    );

-- Policy : Les utilisateurs peuvent supprimer leurs propres rapports
CREATE POLICY "Users can delete own reports"
    ON public.reports
    FOR DELETE
    USING (
        auth.uid() = user_id
    );

-- Fonction pour nettoyer automatiquement les rapports expirés
CREATE OR REPLACE FUNCTION public.cleanup_expired_reports()
RETURNS void AS $$
BEGIN
    DELETE FROM public.reports
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires pour documentation
COMMENT ON TABLE public.reports IS 'Rapports PDF générés à partir des scans';
COMMENT ON COLUMN public.reports.scan_id IS 'Référence vers le scan source';
COMMENT ON COLUMN public.reports.pdf_url IS 'URL du fichier PDF (Supabase Storage)';
COMMENT ON COLUMN public.reports.expires_at IS 'Date d''expiration du rapport';
COMMENT ON FUNCTION public.cleanup_expired_reports() IS 'Supprime les rapports expirés (à exécuter périodiquement)';
