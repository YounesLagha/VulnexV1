// Configuration de la connexion � Supabase
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.config';
import { Database } from '../types/database.types';

// Options de configuration du client Supabase
const supabaseOptions = {
    auth: {
        // D�sactiver l'auto-refresh pour le backend (g�r� manuellement)
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
    },
    // Configuration globale
    global: {
        headers: {
            'x-application-name': 'vulnex-backend',
        },
    },
    // Options de la base de donn�es
    db: {
        schema: 'public',
    },
};

// Client Supabase pour les op�rations publiques (avec anon key)
export const supabase = createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    supabaseOptions as any
);

// Client Supabase admin pour les op�rations privil�gi�es (avec service role key)
// � utiliser uniquement pour les op�rations backend qui n�cessitent des privil�ges �lev�s
export const supabaseAdmin = createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
        ...supabaseOptions,
        auth: {
            ...supabaseOptions.auth,
            // Le service role bypass les politiques RLS (Row Level Security)
            autoRefreshToken: false,
            persistSession: false,
        },
    } as any
);

// Fonction pour tester la connexion � la base de donn�es
export async function testDatabaseConnection(): Promise<boolean> {
    try {
        // Tester une requ�te simple
        const { error } = await supabase.from('scans').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('Erreur de connexion � la base de donn�es:', error.message);
            return false;
        }

        console.log('Connexion � Supabase �tablie avec succ�s');
        return true;
    } catch (error) {
        console.error('Impossible de se connecter � Supabase:', error);
        return false;
    }
}

// Export des configurations pour r�utilisation
export const databaseConfig = {
    url: env.SUPABASE_URL,
    // Ne jamais exposer les cl�s dans les logs ou r�ponses
    hasAnonKey: !!env.SUPABASE_ANON_KEY,
    hasServiceKey: !!env.SUPABASE_SERVICE_ROLE_KEY,
};
