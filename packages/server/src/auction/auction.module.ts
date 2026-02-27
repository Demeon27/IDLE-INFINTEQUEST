import { Module } from '@nestjs/common';
import { AuctionService } from './auction.service';
import { AuctionGateway } from './auction.gateway';
import { EngineModule } from '../engine/engine.module'; // GameLoop & PluginManager
import { InventoryModule } from '../inventory/inventory.module'; // Accès au InventoryService pour la gateway

@Module({
    imports: [EngineModule, InventoryModule],
    providers: [AuctionService, AuctionGateway],
    exports: [AuctionService]
})
export class AuctionModule { }
