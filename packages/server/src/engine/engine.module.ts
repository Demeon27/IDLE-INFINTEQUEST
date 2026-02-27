import { Module } from '@nestjs/common';
import { PluginManager } from './plugin-manager.service';
import { GameLoopService } from './game-loop.service';
import { MonsterRepository } from './monster.repository';
import { LootService } from './loot.service';
import { EngineGateway } from './engine.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * EngineModule — Le moteur de jeu central.
 *
 * Contient :
 * - PluginManager : EventEmitter typé, les modules s'abonnent aux Hooks
 * - GameLoopService : Boucle de jeu par joueur (combat, XP, mort)
 * - MonsterRepository : Données des monstres par Tier (scaling infini)
 * - LootService : Génération de loot après la mort d'un monstre
 * - EngineGateway : WebSocket bridge pour pousser le GameState au client
 *
 * Règle absolue : JAMAIS de logique métier hardcodée ici.
 * Tout passe par les Hooks du PluginManager.
 */
@Module({
    imports: [
        PrismaModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get('JWT_SECRET') || 'super-secret-key-change-me',
                signOptions: { expiresIn: '7d' },
            }),
        }),
    ],
    providers: [
        PluginManager,
        GameLoopService,
        MonsterRepository,
        LootService,
        EngineGateway,
    ],
    exports: [PluginManager, GameLoopService],
})
export class EngineModule { }
