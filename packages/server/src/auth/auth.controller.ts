import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';

/**
 * AuthController — Points d'entrée HTTP pour l'authentification.
 * POST /api/auth/register
 * POST /api/auth/login
 *
 * Ce sont les SEULES routes HTTP du jeu (avec /api/health).
 * Tout le reste passe par WebSocket.
 */
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth(@Req() req: Request) {
        // Enclenche le flux d'authentification Google
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
        const { accessToken } = await this.authService.validateOAuthUser(req.user as any);
        // Redirection vers le client avec le token (en prod, préférez un paramètre d'URL sécurisé ou cookie)
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        return res.redirect(`${clientUrl}?token=${accessToken}`);
    }
}
