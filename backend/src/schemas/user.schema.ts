// Sch�mas de validation Zod pour les utilisateurs
import { z } from 'zod';

// Sch�ma pour valider un email
export const emailSchema = z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide')
    .max(255, 'L\'email ne doit pas d�passer 255 caract�res')
    .toLowerCase()
    .trim();

// Sch�ma pour valider un mot de passe
export const passwordSchema = z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caract�res')
    .max(128, 'Le mot de passe ne doit pas d�passer 128 caract�res')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre');

// Sch�ma pour valider un nom d'utilisateur
export const usernameSchema = z
    .string()
    .min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caract�res')
    .max(30, 'Le nom d\'utilisateur ne doit pas d�passer 30 caract�res')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores')
    .trim();

// Sch�ma pour l'inscription d'un utilisateur
export const registerUserSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    username: usernameSchema.optional(),
}).strict();

// Sch�ma pour la connexion d'un utilisateur
export const loginUserSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Le mot de passe est requis'),
}).strict();

// Sch�ma pour mettre � jour le profil utilisateur
export const updateProfileSchema = z.object({
    username: usernameSchema.optional(),
    avatarUrl: z.string().url('URL d\'avatar invalide').optional(),
}).strict();

// Sch�ma pour changer le mot de passe
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
    newPassword: passwordSchema,
}).strict();

// Sch�ma pour r�initialiser le mot de passe
export const resetPasswordSchema = z.object({
    email: emailSchema,
}).strict();

// Sch�ma pour confirmer la r�initialisation du mot de passe
export const confirmResetPasswordSchema = z.object({
    token: z.string().min(1, 'Le token est requis'),
    newPassword: passwordSchema,
}).strict();

// Export des types TypeScript inf�r�s depuis les sch�mas
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ConfirmResetPasswordInput = z.infer<typeof confirmResetPasswordSchema>;
