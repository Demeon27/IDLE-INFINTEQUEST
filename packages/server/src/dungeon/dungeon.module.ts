import { Module, OnModuleInit } from '@nestjs/common';
import { DungeonService } from './dungeon.service';
import { DungeonController } from './dungeon.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [DungeonService],
    controllers: [DungeonController],
    exports: [DungeonService]
})
export class DungeonModule implements OnModuleInit {
    constructor(private dungeonService: DungeonService) { }

    async onModuleInit() {
        await this.seedDungeons();
    }

    private async seedDungeons() {
        const dungeons = await this.dungeonService.listDungeons();
        if (dungeons.length > 0) return;

        console.log('🗝️ Seeding initial dungeons...');

        // 1. Créer les monstres
        const minion = await this.dungeonService.createMonsterTemplate({
            name: 'Squelette de la Crypte',
            spriteUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=skel-minion',
            category: 'MINION',
            isUGC: false
        });

        const boss = await this.dungeonService.createMonsterTemplate({
            name: 'Seigneur Squelette',
            spriteUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=skel-boss',
            category: 'BOSS',
            isUGC: false
        });

        // 2. Créer le Donjon
        await this.dungeonService.createDungeonTemplate({
            name: 'Crypte de l\'Infini',
            description: 'Un lieu sombre où les morts ne reposent jamais.',
            backgroundUrl: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=1000&auto=format&fit=crop',
            minionTemplateId: minion.id,
            bossTemplateId: boss.id,
            isUGC: false
        });

        console.log('✅ Initial dungeon seeded!');
    }
}
