import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // --- Servir les dossiers de sprites locaux (UGC Workshop) ---
    app.useStaticAssets(join(__dirname, '..', 'uploads'), {
        prefix: '/uploads/', // URL d'accès http://localhost:3000/uploads/sprites/xyz.png
    });

    // --- CORS (autorise le client Vite en dev) ---
    app.enableCors({
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true,
    });

    // --- Validation globale des DTOs ---
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,        // Supprime les propriétés non déclarées
            forbidNonWhitelisted: true, // Rejette les requêtes avec des champs inconnus
            transform: true,        // Transforme les payloads en instances de classes DTO
        }),
    );

    // --- Préfixe global API ---
    app.setGlobalPrefix('api');

    const port = process.env.PORT || 3000;
    await app.listen(port);

    logger.log(`⚔️  IDLE Infinite Quest — Server running on port ${port}`);
    logger.log(`📡 WebSocket Gateway ready`);
    logger.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
}

bootstrap();
