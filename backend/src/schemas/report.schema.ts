// Schémas de validation Zod pour les rapports PDF
import { z } from 'zod';

// Schéma pour les options de génération de PDF
export const pdfOptionsSchema = z.object({
    includeRecommendations: z.boolean().default(true),
    includeCharts: z.boolean().default(true),
    includeDetailedAnalysis: z.boolean().default(true),
    language: z.enum(['fr', 'en']).default('fr'),
}).strict();

// Schéma pour générer un rapport PDF
export const generatePdfSchema = z.object({
    scanId: z.string().uuid('ID de scan invalide'),
    options: pdfOptionsSchema.optional(),
}).strict();

// Schéma pour récupérer un rapport par ID
export const getReportByIdSchema = z.object({
    reportId: z.string().uuid('ID de rapport invalide'),
}).strict();

// Schéma pour lister les rapports d'un utilisateur
export const listReportsSchema = z.object({
    userId: z.string().uuid('ID utilisateur invalide').optional(),
    scanId: z.string().uuid('ID de scan invalide').optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(50).default(10),
}).strict();

// Export des types TypeScript inférés depuis les schémas
export type GeneratePdfInput = z.infer<typeof generatePdfSchema>;
export type PdfOptionsInput = z.infer<typeof pdfOptionsSchema>;
export type GetReportByIdInput = z.infer<typeof getReportByIdSchema>;
export type ListReportsInput = z.infer<typeof listReportsSchema>;
