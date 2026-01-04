# Base de Données Vulnex - Supabase

Ce dossier contient les migrations SQL pour configurer la base de données Supabase de Vulnex.

## Structure des Tables

### 1. `profiles`
Extension de la table `auth.users` de Supabase pour stocker des informations supplémentaires sur les utilisateurs.

**Colonnes principales :**
- `user_id` : Référence vers auth.users
- `username` : Nom d'utilisateur unique
- `avatar_url` : URL de l'avatar

### 2. `scans`
Stocke tous les scans de sécurité effectués.

**Colonnes principales :**
- `url` : URL du site scanné
- `status` : Statut du scan (pending, in_progress, completed, failed, cancelled)
- `results` : Résultats détaillés au format JSON
- `score` : Score de sécurité sur 100
- `grade` : Note de A+ à F

### 3. `reports`
Stocke les rapports PDF générés.

**Colonnes principales :**
- `scan_id` : Référence vers le scan
- `pdf_url` : URL du fichier PDF dans Supabase Storage
- `expires_at` : Date d'expiration du rapport

## Instructions d'Installation

### Prérequis
1. Compte Supabase créé sur [supabase.com](https://supabase.com)
2. Projet Supabase créé

### Étape 1 : Récupérer les clés Supabase

1. Allez dans votre projet Supabase
2. Cliquez sur Settings ’ API
3. Copiez :
   - `Project URL` ’ `SUPABASE_URL`
   - `anon public` key ’ `SUPABASE_ANON_KEY`
   - `service_role` key ’ `SUPABASE_SERVICE_ROLE_KEY`

### Étape 2 : Configurer les variables d'environnement

Mettez à jour le fichier `backend/.env` :

```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

### Étape 3 : Exécuter les migrations

1. Allez dans Supabase Dashboard
2. Cliquez sur `SQL Editor` dans le menu gauche
3. Exécutez les migrations **dans l'ordre** :

#### Migration 1 : Schema initial
```sql
-- Copiez et collez le contenu de migrations/001_initial_schema.sql
```

#### Migration 2 : Table scans
```sql
-- Copiez et collez le contenu de migrations/002_add_scans_table.sql
```

#### Migration 3 : Table reports
```sql
-- Copiez et collez le contenu de migrations/003_add_reports_table.sql
```

### Étape 4 : Vérifier l'installation

Exécutez cette requête dans le SQL Editor :

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Vous devriez voir :
- profiles
- scans
- reports

## Sécurité (RLS - Row Level Security)

Toutes les tables ont des politiques RLS activées :

- **profiles** : Les utilisateurs peuvent seulement voir/modifier leur propre profil
- **scans** : Les utilisateurs peuvent gérer uniquement leurs propres scans
- **reports** : Les utilisateurs peuvent gérer uniquement leurs propres rapports

## Maintenance

### Nettoyer les rapports expirés

Exécutez périodiquement (ou configurez un cron job) :

```sql
SELECT public.cleanup_expired_reports();
```

### Voir les statistiques

```sql
SELECT * FROM public.scan_statistics;
```

## Développement Local

Pour régénérer les types TypeScript depuis Supabase :

```bash
npx supabase gen types typescript --project-id "votre-project-id" > backend/src/types/database.types.ts
```

## Support

Si vous rencontrez des problèmes :
1. Vérifiez que toutes les migrations ont été exécutées dans l'ordre
2. Vérifiez les logs dans Supabase Dashboard ’ Logs
3. Assurez-vous que RLS est bien activé pour chaque table
