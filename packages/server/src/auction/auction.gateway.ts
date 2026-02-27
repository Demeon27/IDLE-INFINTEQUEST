import {
    WebSocketGateway,
    SubscribeMessage,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { AuctionService } from './auction.service';
import { GameLoopService } from '../engine/game-loop.service';
import { InventoryService } from '../inventory/inventory.service';

/**
 * AuctionGateway — WebSocket events pour l'Hôtel de Vente.
 */
@WebSocketGateway({
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true,
    },
})
export class AuctionGateway {
    private readonly logger = new Logger(AuctionGateway.name);

    constructor(
        private readonly auctionService: AuctionService,
        private readonly gameLoop: GameLoopService,
        private readonly inventoryService: InventoryService
    ) { }

    @SubscribeMessage('auction:get')
    async handleGetAuctions(
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const listings = await this.auctionService.getActiveListings();
            client.emit('auction:data', { listings });
        } catch (error: any) {
            client.emit('ui:notification', { type: 'error', message: error.message });
        }
    }

    @SubscribeMessage('auction:sell')
    async handleListForSale(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string; instanceId: string; price: number; quantity?: number },
    ) {
        try {
            await this.auctionService.listObjectForSale(data.userId, data.instanceId, data.price, data.quantity || 1);

            client.emit('ui:notification', {
                type: 'success',
                message: `⚖️ L'objet est maintenant en vente sur le marché privé !`,
            });

            // Mettre à jour l'inventaire
            const inventory = await this.inventoryService.getInventory(data.userId);
            client.emit('inventory:data', { inventory });

            // Mettre à jour le marché en l'emettant globalement ? Plus tard
            // Pour l'instant on renvoie juste à l'utilisateur
            const listings = await this.auctionService.getActiveListings();
            client.emit('auction:data', { listings });

        } catch (error: any) {
            client.emit('ui:notification', { type: 'error', message: error.message });
        }
    }

    @SubscribeMessage('auction:buy')
    async handleBuyAuction(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string; listingId: string },
    ) {
        try {
            const result = await this.auctionService.buyListedItem(data.userId, data.listingId);

            client.emit('ui:notification', {
                type: 'success',
                message: `⚖️ Achat validé : ${result.item.name} pour ${result.paid} 💰 !`,
            });

            // Mettre à jour l'inventaire
            const inventory = await this.inventoryService.getInventory(data.userId);
            client.emit('inventory:data', { inventory });

            // Rafraîchir les enchères actives
            const listings = await this.auctionService.getActiveListings();
            client.emit('auction:data', { listings });

        } catch (error: any) {
            client.emit('ui:notification', { type: 'error', message: error.message });
        }
    }
}
