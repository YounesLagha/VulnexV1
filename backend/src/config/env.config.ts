// Configuration et validation des variables d'environnement
import dotenv from 'dotenv';
import { z } from 'zod';

// Charger les variables d'environnement depuis le fichier .env
dotenv.config();

// Sch�ma de validation des variables d'environnement avec Zod
const envSchema = z.object({
    // Configuration du serveur
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('4000'),

    // URLs
    FRONTEND_URL: z.string().url().default('http://localhost:3000'),
    BACKEND_URL: z.string().url().default('http://localhost:4000'),

    // Configuration Supabase
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

    // API externes (optionnelles)
    WAPPALYZER_API_KEY: z.string().optional(),
    GROQ_API_KEY: z.string().optional(), // Groq pour l'analyse IA

    // Configuration de s�curit�
    JWT_SECRET: z.string().min(32).optional(),

    // Logging
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

// Type TypeScript d�duit du sch�ma Zod
export type EnvConfig = z.infer<typeof envSchema>;

// Fonction pour valider et charger les variables d'environnement
function loadEnvConfig(): EnvConfig {
    try {
        // Validation des variables d'environnement
        const env = envSchema.parse(process.env);
        return env;
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('Erreur de validation des variables d\'environnement:');
            console.error(error.errors);
            throw new Error('Configuration invalide des variables d\'environnement');
        }
        throw error;
    }
}

// Export de la configuration valid�e
export const env = loadEnvConfig();

// Fonction helper pour v�rifier si on est en production
export const isProduction = (): boolean => env.NODE_ENV === 'production';

// Fonction helper pour v�rifier si on est en d�veloppement
export const isDevelopment = (): boolean => env.NODE_ENV === 'development';

// Fonction helper pour v�rifier si on est en test
export const isTest = (): boolean => env.NODE_ENV === 'test';
