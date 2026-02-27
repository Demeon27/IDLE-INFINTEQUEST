import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { ShopService } from './shop.service';
import { InventoryGateway } from './inventory.gateway';
import { EngineModule } from '../engine/engine.module';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * InventoryModule — Gestion de l'inventaire et de la boutique.
 *
 * - InventoryService : CRUD inventaire, équipement, calcul de stats
 * - ShopService : Achat/vente, catalogue dynamique par Tier
 * - InventoryGateway : WebSocket events pour le client
 */
@Module({
    imports: [EngineModule, PrismaModule],
    providers: [InventoryService, ShopService, InventoryGateway],
    exports: [InventoryService, ShopService],
})
export class InventoryModule { }
