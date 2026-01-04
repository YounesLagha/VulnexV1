# Migrations Supabase pour Vulnex

## Configuration de la base de donn�es

### �tape 1 : Cr�er la table `scans`

1. Allez dans votre projet Supabase : https://supabase.com/dashboard
2. Cliquez sur **SQL Editor** (dans le menu de gauche)
3. Cr�ez une nouvelle requ�te
4. Copiez-collez le contenu du fichier `migrations/001_initial_schema.sql`
5. Ex�cutez la requ�te (bouton "Run")

### �tape 2 : V�rifier la cr�ation

Allez dans **Table Editor** et v�rifiez que la table `scans` a bien �t� cr��e avec :
- Colonnes : id, user_id, url, score, scan_type, mode, results, ai_analysis, ai_tokens_used, created_at, updated_at
- Index sur : user_id, created_at, url, score
- Vue : user_scan_stats
- Politiques RLS activ�es

### �tape 3 : Tester l'insertion

Vous pouvez tester manuellement avec :

```sql
INSERT INTO scans (user_id, url, score, scan_type, mode, results)
VALUES (
    auth.uid(), -- Utilise l'utilisateur connect�
    'https://example.com',
    75,
    'headers',
    'full',
    '{"score": 75, "headers": {}}'::jsonb
);
```

## Structure de la table `scans`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique du scan |
| `user_id` | UUID | ID utilisateur (NULL si scan anonyme) |
| `url` | TEXT | URL scann�e |
| `score` | INTEGER | Score de s�curit� (0-100) |
| `scan_type` | VARCHAR(50) | Type: headers, ssl, technologies, full |
| `mode` | VARCHAR(10) | Mode: free ou full |
| `results` | JSONB | R�sultats d�taill�s du scan |
| `ai_analysis` | TEXT | Analyse IA g�n�r�e |
| `ai_tokens_used` | INTEGER | Tokens IA consomm�s |
| `created_at` | TIMESTAMP | Date de cr�ation |
| `updated_at` | TIMESTAMP | Date de mise � jour |

## Politiques RLS (Row Level Security)

Les politiques suivantes sont configur�es :

1. **SELECT** : Les utilisateurs peuvent voir leurs propres scans
2. **INSERT** : Les utilisateurs peuvent cr�er des scans (avec leur user_id ou NULL pour anonyme)
3. **DELETE** : Les utilisateurs peuvent supprimer leurs propres scans
4. **UPDATE** : Les utilisateurs peuvent modifier leurs propres scans

## Vue `user_scan_stats`

⚠️ **IMPORTANT - Sécurité RLS** ⚠️

Cette vue a été corrigée dans la migration `002_fix_user_scan_stats_rls.sql` pour respecter les règles RLS.

**Configuration sécurisée:**
- ✅ `security_invoker = true` (applique RLS)
- ✅ Filtre explicite sur `auth.uid()`
- ✅ Chaque utilisateur ne voit que ses propres stats
- ✅ Pas de `SECURITY DEFINER` (dangereux)

**Colonnes retournées:**
- `user_id` : ID utilisateur (toujours = auth.uid())
- `total_scans` : Nombre total de scans
- `average_score` : Score moyen (arrondi à 2 décimales)
- `best_score` : Meilleur score
- `worst_score` : Pire score
- `unique_urls` : Nombre d'URLs uniques scannées
- `last_scan_at` : Date du dernier scan

**Utilisation:**
```sql
-- Récupère les stats de l'utilisateur connecté uniquement
SELECT * FROM public.user_scan_stats;
```

**Tests de sécurité:**
Voir `TEST_RLS_SECURITY.md` pour valider que la vue est bien sécurisée.

## Notes importantes

- Les scans anonymes (user_id = NULL) sont autoris�s
- La colonne `results` utilise JSONB pour flexibilit�
- Les index optimisent les requ�tes par utilisateur et date
- Le trigger `update_scans_updated_at` met � jour automatiquement `updated_at`
