import { Injectable, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,
    ) { }

    /**
     * Inscription — Crée un nouveau Voyageur (USER)
     */
    async register(dto: RegisterDto) {
        // Vérifier unicité du username
        const existing = await this.prisma.user.findUnique({
            where: { username: dto.username },
        });

        if (existing) {
            throw new ConflictException('Ce nom de héros est déjà pris.');
        }

        // Hash du mot de passe (12 rounds bcrypt)
        const hashedPassword = await bcrypt.hash(dto.password, 12);

        // Création de l'utilisateur
        const user = await this.prisma.user.create({
            data: {
                username: dto.username,
                email: dto.email,
                password: hashedPassword,
                role: 'USER',
            },
        });

        this.logger.log(`⚔️ New hero registered: ${user.username}`);

        // Générer le token JWT
        const token = this.generateToken(user.id, user.username, user.role);

        return {
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
            },
            accessToken: token,
        };
    }

    /**
     * Connexion — Vérifie les identifiants et retourne un JWT
     */
    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { username: dto.username },
        });

        if (!user) {
            throw new UnauthorizedException('Identifiants incorrects.');
        }

        // Vérifier le statut du compte
        this.verifyUserStatus(user);

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Identifiants incorrects.');
        }

        this.logger.log(`🏰 Hero connected: ${user.username}`);

        const token = this.generateToken(user.id, user.username, user.role);

        return {
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
            },
            accessToken: token,
        };
    }

    /**
     * Login Social (Google / Facebook)
     */
    async validateOAuthUser(profile: { id: string, provider: 'google' | 'facebook', email: string, username: string, avatarUrl?: string }) {
        const field = profile.provider === 'google' ? 'googleId' : 'facebookId';

        let user = await this.prisma.user.findFirst({
            where: { [field]: profile.id }
        });

        if (!user) {
            // Tentative de lien par email si l'utilisateur existe déjà sans OAuth
            user = await this.prisma.user.findUnique({ where: { email: profile.email } });

            if (user) {
                // Link l'ID OAuth
                user = await this.prisma.user.update({
                    where: { id: user.id },
                    data: { [field]: profile.id, avatarUrl: profile.avatarUrl }
                });
            } else {
                // Création d'un nouvel utilisateur (pas de password pour OAuth)
                user = await this.prisma.user.create({
                    data: {
                        username: `${profile.username}_${Math.random().toString(36).substring(7)}`,
                        email: profile.email,
                        password: '', // Vide car OAuth
                        [field]: profile.id,
                        avatarUrl: profile.avatarUrl,
                        role: 'USER'
                    }
                });
            }
        }

        this.verifyUserStatus(user);

        const token = this.generateToken(user.id, user.username, user.role);
        return { user, accessToken: token };
    }

    /**
     * Vérifie si l'utilisateur est banni ou suspendu
     */
    verifyUserStatus(user: any) {
        if (user.status === 'BANNED') {
            throw new UnauthorizedException(`Account Banned: ${user.banReason || 'No reason provided'}`);
        }
        if (user.status === 'SUSPENDED' && user.banExpires && user.banExpires > new Date()) {
            throw new UnauthorizedException(`Account Suspended until ${user.banExpires.toISOString()}: ${user.banReason || 'No reason provided'}`);
        }
    }

    /**
     * Génère un JWT avec le payload user
     */
    private generateToken(userId: string, username: string, role: string): string {
        return this.jwt.sign({
            sub: userId,
            username,
            role,
        });
    }
}
