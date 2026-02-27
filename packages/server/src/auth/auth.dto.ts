import { IsString, IsEmail, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * DTO d'inscription — Validation stricte côté serveur.
 */
export class RegisterDto {
    @IsString()
    @MinLength(3, { message: 'Le nom du héros doit contenir au moins 3 caractères.' })
    @MaxLength(20, { message: 'Le nom du héros ne peut pas dépasser 20 caractères.' })
    @Matches(/^[a-zA-Z0-9_-]+$/, {
        message: 'Le nom du héros ne peut contenir que des lettres, chiffres, tirets et underscores.',
    })
    username: string;

    @IsEmail({}, { message: 'Adresse email invalide.' })
    email: string;

    @IsString()
    @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
    @MaxLength(128)
    password: string;
}

/**
 * DTO de connexion
 */
export class LoginDto {
    @IsString()
    username: string;

    @IsString()
    password: string;
}
