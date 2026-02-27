import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EngineModule } from './engine/engine.module';
import { InventoryModule } from './inventory/inventory.module';
import { WorkshopModule } from './workshop/workshop.module';
import { AuctionModule } from './auction/auction.module';
import { AdminModule } from './admin/admin.module';
import { SocialModule } from './social/social.module';
import { DungeonModule } from './dungeon/dungeon.module';
import { ChatModule } from './chat/chat.module';
import { HealthController } from './health.controller';
import { PluginManager } from './engine/plugin-manager.service';
import { GlobalMultiplierPlugin } from './engine/plugins/global-multiplier.plugin';
import { CombatLogPlugin } from './engine/plugins/combat-log.plugin';
import { ShopService } from './inventory/shop.service';
import { AdminService } from './admin/admin.service';
import { InventoryPersistencePlugin } from './engine/plugins/inventory-persistence.plugin';
import { InventoryService } from './inventory/inventory.service';
import { PrismaService } from './prisma/prisma.service';

/**
 * AppModule — Module racine de l'application.
 *
 * Architecture par Domaine :
 * - PrismaModule : Accès base de données (injectable partout)
 * - AuthModule   : Authentification JWT (register, login)
 * - EngineModule    : Moteur de jeu (PluginManager, GameLoop, Monstres, Loot)
 * - InventoryModule : Inventaire + Boutique
 *
 * Les futurs modules (GuildModule, WorkshopModule, etc.) seront
 * ajoutés ici sans jamais modifier les modules existants.
 */
@Module({
    imports: [
        // --- Config globale (.env) ---
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),

        // --- Rate Limiting (anti-abus : max 10 req/sec) ---
        ThrottlerModule.forRoot({
            throttlers: [
                {
                    ttl: 1000,   // 1 seconde
                    limit: 10,   // Max 10 requêtes
                },
            ],
        }),

        // --- Modules métier ---
        PrismaModule,
        AuthModule,
        EngineModule,
        InventoryModule,
        WorkshopModule,
        AuctionModule,
        AdminModule,
        SocialModule,
        DungeonModule,
        ChatModule,
    ],
    controllers: [HealthController],
})
export class AppModule implements OnModuleInit {
    constructor(
        private readonly pluginManager: PluginManager,
        private readonly shopService: ShopService,
        private readonly adminService: AdminService,
        private readonly inventoryService: InventoryService,
        private readonly prisma: PrismaService,
    ) { }

    onModuleInit() {
        // --- Enregistrement des plugins de base ---
        this.pluginManager.register(new GlobalMultiplierPlugin(this.adminService));
        this.pluginManager.register(new CombatLogPlugin());
        this.pluginManager.register(new InventoryPersistencePlugin(this.inventoryService, this.prisma));

        // --- Activation par défaut ---
        this.pluginManager.enable('GlobalMultiplier');
        this.pluginManager.enable('CombatLog');
        this.pluginManager.enable('InventoryPersistence');

        // --- Seed de la boutique ---
        this.shopService.seedDefaultItems();
    }
}
