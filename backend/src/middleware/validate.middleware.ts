// Middleware pour valider les requetes avec Zod
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '../services/error.service';
import { Logger } from '../services/logger.service';

// Type pour specifier quelle partie de la requete valider
type RequestPart = 'body' | 'query' | 'params';

// Middleware generique de validation
export function validate(schema: AnyZodObject, part: RequestPart = 'body') {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // Valider la partie specifiee de la requete
            const validated = await schema.parseAsync(req[part]);

            // Remplacer avec les donnees validees
            req[part] = validated;

            Logger.debug(`Validation reussie pour ${part}`, {
                path: req.path,
            });

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                // Formater les erreurs Zod de maniere lisible
                const errors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));

                Logger.warn('Validation echouee', {
                    path: req.path,
                    errors,
                });

                next(new ValidationError('Donnees invalides', errors));
            } else {
                next(error);
            }
        }
    };
}

// Middleware pour valider le body
export function validateBody(schema: AnyZodObject) {
    return validate(schema, 'body');
}

// Middleware pour valider les query params
export function validateQuery(schema: AnyZodObject) {
    return validate(schema, 'query');
}

// Middleware pour valider les params d'URL
export function validateParams(schema: AnyZodObject) {
    return validate(schema, 'params');
}

// Middleware pour valider plusieurs parties en meme temps
export function validateMultiple(schemas: {
    body?: AnyZodObject;
    query?: AnyZodObject;
    params?: AnyZodObject;
}) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const validations: Promise<any>[] = [];

            if (schemas.body) {
                validations.push(
                    schemas.body.parseAsync(req.body).then((data) => {
                        req.body = data;
                    })
                );
            }

            if (schemas.query) {
                validations.push(
                    schemas.query.parseAsync(req.query).then((data) => {
                        req.query = data;
                    })
                );
            }

            if (schemas.params) {
                validations.push(
                    schemas.params.parseAsync(req.params).then((data) => {
                        req.params = data;
                    })
                );
            }

            await Promise.all(validations);

            Logger.debug('Validation multiple reussie', {
                path: req.path,
            });

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));

                Logger.warn('Validation multiple echouee', {
                    path: req.path,
                    errors,
                });

                next(new ValidationError('Donnees invalides', errors));
            } else {
                next(error);
            }
        }
    };
}
