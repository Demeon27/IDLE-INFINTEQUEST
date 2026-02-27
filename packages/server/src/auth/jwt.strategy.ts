import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

/**
 * JwtStrategy — Valide le token JWT sur chaque requête protégée.
 * Extrait le payload et vérifie que l'utilisateur existe toujours en BDD.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly prisma: PrismaService,
        config: ConfigService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.get<string>('JWT_SECRET', 'idle-quest-dev-secret-change-in-prod'),
        });
    }

    async validate(payload: { sub: string; username: string; role: string }) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });

        if (!user) {
            throw new UnauthorizedException('Session invalide. Reconnectez-vous.');
        }

        // L'objet retourné est injecté dans request.user
        return {
            id: user.id,
            username: user.username,
            role: user.role,
        };
    }
}
