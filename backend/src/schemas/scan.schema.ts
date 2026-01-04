// Schémas de validation Zod pour les scans de sécurité
import { z } from 'zod';
import { LIMITS, REGEX_PATTERNS } from '../config/constants';

// Schéma de validation pour une URL
export const urlSchema = z
    .string()
    .min(1, 'L\'URL est requise')
    .max(LIMITS.MAX_URL_LENGTH, `L'URL ne doit pas dépasser ${LIMITS.MAX_URL_LENGTH} caractères`)
    .regex(REGEX_PATTERNS.URL, 'Format d\'URL invalide (doit commencer par http:// ou https://)');

// Schéma pour les options de scan
export const scanOptionsSchema = z.object({
    includeHeaders: z.boolean().default(true),
    includeSsl: z.boolean().default(true),
    includePorts: z.boolean().default(true),
    includeTechnologies: z.boolean().default(true),
    customPorts: z.array(z.number().min(1).max(65535)).optional(),
    timeout: z.number().min(1000).max(60000).optional(),
}).strict();

// Schéma pour démarrer un nouveau scan
export const startScanSchema = z.object({
    url: urlSchema,
    options: scanOptionsSchema.optional(),
}).strict();

// Schéma pour récupérer un scan par ID
export const getScanByIdSchema = z.object({
    id: z.string().uuid('ID de scan invalide'),
}).strict();

// Schéma pour la pagination
export const paginationSchema = z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(10),
    sortBy: z.enum(['createdAt', 'score', 'url']).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).strict();

// Schéma pour lister les scans avec pagination
export const listScansSchema = z.object({
    userId: z.string().uuid().optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled']).optional(),
    pagination: paginationSchema.optional(),
}).strict();

// Schéma pour filtrer les scans par statut
export const scanStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled']);

// Schéma pour filtrer les scans par URL
export const filterByUrlSchema = z.object({
    url: urlSchema,
}).strict();

// Export des types TypeScript inférés depuis les schémas
export type StartScanInput = z.infer<typeof startScanSchema>;
export type GetScanByIdInput = z.infer<typeof getScanByIdSchema>;
export type ListScansInput = z.infer<typeof listScansSchema>;
export type ScanOptionsInput = z.infer<typeof scanOptionsSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
