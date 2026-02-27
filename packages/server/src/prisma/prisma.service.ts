import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService — Client Prisma injectable dans tout le projet.
 * Se connecte au démarrage, se déconnecte proprement à l'arrêt.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        super({
            log: [
                { level: 'warn', emit: 'stdout' },
                { level: 'error', emit: 'stdout' },
            ],
        });
    }

    async onModuleInit() {
        await this.$connect();
        this.logger.log('🗄️  Connected to PostgreSQL');
    }

    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('🗄️  Disconnected from PostgreSQL');
    }
}
