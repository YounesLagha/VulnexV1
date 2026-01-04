-- Schema initial pour Vulnex
-- Table des scans de securite

-- Table: scans
-- Stocke tous les scans effectues (avec ou sans authentification)
CREATE TABLE IF NOT EXISTS public.scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    scan_type VARCHAR(50) NOT NULL CHECK (scan_type IN ('headers', 'ssl', 'technologies', 'full')),
    mode VARCHAR(10) NOT NULL CHECK (mode IN ('free', 'full')),

    -- Resultats du scan (JSON)
    results JSONB NOT NULL,

    -- Analyse IA (si disponible)
    ai_analysis TEXT,
    ai_tokens_used INTEGER,

    -- Metadonnees
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Index pour recherches rapides
    CONSTRAINT valid_score CHECK (score >= 0 AND score <= 100)
);

-- Index pour optimiser les requetes
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON public.scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON public.scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_url ON public.scans(url);
CREATE INDEX IF NOT EXISTS idx_scans_score ON public.scans(score);

-- Fonction pour mettre a jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER update_scans_updated_at
    BEFORE UPDATE ON public.scans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leurs propres scans
CREATE POLICY "Users can view their own scans"
    ON public.scans
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR user_id IS NULL  -- Scans anonymes visibles par tous (optionnel)
    );

-- Politique: Les utilisateurs peuvent inserer leurs propres scans
CREATE POLICY "Users can insert their own scans"
    ON public.scans
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        OR user_id IS NULL  -- Permettre scans anonymes
    );

-- Politique: Les utilisateurs peuvent supprimer leurs propres scans
CREATE POLICY "Users can delete their own scans"
    ON public.scans
    FOR DELETE
    USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent mettre a jour leurs propres scans
CREATE POLICY "Users can update their own scans"
    ON public.scans
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Vue pour statistiques utilisateur
CREATE OR REPLACE VIEW public.user_scan_stats AS
SELECT
    user_id,
    COUNT(*) as total_scans,
    AVG(score) as average_score,
    MAX(score) as best_score,
    MIN(score) as worst_score,
    COUNT(DISTINCT url) as unique_urls,
    MAX(created_at) as last_scan_at
FROM public.scans
WHERE user_id IS NOT NULL
GROUP BY user_id;

-- Commentaires pour documentation
COMMENT ON TABLE public.scans IS 'Stocke tous les scans de securite effectues par les utilisateurs';
COMMENT ON COLUMN public.scans.user_id IS 'ID utilisateur (NULL pour scans anonymes)';
COMMENT ON COLUMN public.scans.url IS 'URL scanee';
COMMENT ON COLUMN public.scans.score IS 'Score de securite (0-100)';
COMMENT ON COLUMN public.scans.scan_type IS 'Type de scan: headers, ssl, technologies, full';
COMMENT ON COLUMN public.scans.mode IS 'Mode: free ou full';
COMMENT ON COLUMN public.scans.results IS 'Resultats detailles du scan en JSON';
COMMENT ON COLUMN public.scans.ai_analysis IS 'Analyse IA generee';
