// Configuration CORS pour autoriser l'acc�s depuis le frontend
import { CorsOptions } from 'cors';
import { env } from './env.config';

// Liste des origines autoris�es
const allowedOrigins = [
    env.FRONTEND_URL,
    'http://localhost:3000',    // Frontend en d�veloppement
    'http://127.0.0.1:3000',    // Variante localhost
];

// Configuration CORS compl�te
export const corsOptions: CorsOptions = {
    // Fonction pour v�rifier si l'origine est autoris�e
    origin: (origin, callback) => {
        // Permettre les requ�tes sans origine (Postman, curl, applications mobiles)
        if (!origin) {
            return callback(null, true);
        }

        // V�rifier si l'origine est dans la liste autoris�e
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Non autoris� par la politique CORS'));
        }
    },

    // M�thodes HTTP autoris�es
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

    // Headers autoris�s dans les requ�tes
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
    ],

    // Headers expos�s dans les r�ponses
    exposedHeaders: [
        'Content-Length',
        'Content-Type',
        'X-Request-Id',
    ],

    // Autoriser l'envoi de cookies et credentials
    credentials: true,

    // Dur�e de mise en cache de la pr�flight request (24 heures)
    maxAge: 86400,

    // Permettre les requ�tes preflight
    preflightContinue: false,

    // Code de statut pour les requ�tes OPTIONS r�ussies
    optionsSuccessStatus: 204,
};

// Configuration CORS simplifi�e pour le d�veloppement
export const devCorsOptions: CorsOptions = {
    origin: true,   // Autoriser toutes les origines en dev
    credentials: true,
};

// Export par defaut en fonction de l'environnement
export const corsConfig = process.env.NODE_ENV === 'production' ? corsOptions : devCorsOptions;
