import {
    WebSocketGateway,
    SubscribeMessage,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { InventoryService } from './inventory.service';
import { ShopService } from './shop.service';
import { GameLoopService } from '../engine/game-loop.service';

/**
 * InventoryGateway — WebSocket events pour l'inventaire et la boutique.
 *
 * Events client → serveur :
 * - inventory:get       → Retourne l'inventaire complet
 * - inventory:equip     → Équipe un item
 * - inventory:unequip   → Déséquipe un item
 * - inventory:sell      → Vend un item
 * - shop:catalog        → Retourne le catalogue de la boutique
 * - shop:buy            → Achète un item
 */
@WebSocketGateway({
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true,
    },
})
export class InventoryGateway {
    private readonly logger = new Logger(InventoryGateway.name);

    constructor(
        private readonly inventoryService: InventoryService,
        private readonly shopService: ShopService,
        private readonly gameLoop: GameLoopService,
    ) { }

    // ============================================================
    // Inventaire
    // ============================================================

    @SubscribeMessage('inventory:get')
    async handleGetInventory(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string },
    ) {
        try {
            const [inventory, equipment, bonus] = await Promise.all([
                this.inventoryService.getInventory(data.userId),
                this.inventoryService.getEquipment(data.userId),
                this.inventoryService.getEquipmentBonus(data.userId),
            ]);

            // Sync with GameLoop
            this.gameLoop.updateEquipmentBonus(data.userId, bonus);

            client.emit('inventory:data', { inventory, equipment, equipmentBonus: bonus });
        } catch (error: any) {
            client.emit('ui:notification', { type: 'error', message: error.message });
        }
    }

    @SubscribeMessage('inventory:equip')
    async handleEquip(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string; instanceId: string },
    ) {
        try {
            const result = await this.inventoryService.equipItem(data.userId, data.instanceId);

            client.emit('inventory:equipped', result);
            client.emit('ui:notification', {
                type: 'success',
                message: `⚔️ ${result.equipped.name} équipé !`,
            });

            // Rafraîchir l'inventaire complet
            const [inventory, bonus] = await Promise.all([
                this.inventoryService.getInventory(data.userId),
                this.inventoryService.getEquipmentBonus(data.userId),
            ]);

            // Sync with GameLoop
            this.gameLoop.updateEquipmentBonus(data.userId, bonus);

            client.emit('inventory:data', { inventory, equipmentBonus: bonus });
        } catch (error: any) {
            client.emit('ui:notification', { type: 'error', message: error.message });
        }
    }

    @SubscribeMessage('inventory:unequip')
    async handleUnequip(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string; instanceId: string },
    ) {
        try {
            const item = await this.inventoryService.unequipItem(data.userId, data.instanceId);

            client.emit('ui:notification', {
                type: 'info',
                message: `📦 ${item.name} déséquipé`,
            });

            // Rafraîchir l'inventaire complet
            const [inventory, bonus] = await Promise.all([
                this.inventoryService.getInventory(data.userId),
                this.inventoryService.getEquipmentBonus(data.userId),
            ]);

            // Sync with GameLoop
            this.gameLoop.updateEquipmentBonus(data.userId, bonus);

            client.emit('inventory:data', { inventory, equipmentBonus: bonus });
        } catch (error: any) {
            client.emit('ui:notification', { type: 'error', message: error.message });
        }
    }

    @SubscribeMessage('inventory:sell')
    async handleSell(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string; instanceId: string; quantity?: number },
    ) {
        try {
            const result = await this.inventoryService.sellItem(
                data.userId,
                data.instanceId,
                data.quantity || 1,
            );

            // Sync avec la boucle de jeu en mémoire
            const session = this.gameLoop.getSession(data.userId);
            if (session) {
                session.gold += result.goldGained;
            }

            client.emit('ui:notification', {
                type: 'success',
                message: `💰 ${result.itemName} vendu pour ${result.goldGained} or !`,
            });

            // Rafraîchir l'inventaire
            const inventory = await this.inventoryService.getInventory(data.userId);
            client.emit('inventory:data', { inventory });
        } catch (error: any) {
            client.emit('ui:notification', { type: 'error', message: error.message });
        }
    }

    // ============================================================
    // Boutique
    // ============================================================

    @SubscribeMessage('shop:catalog')
    async handleCatalog(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { playerTier: number; page?: number },
    ) {
        try {
            const catalog = await this.shopService.getCatalog(data.playerTier, data.page || 1);
            client.emit('shop:catalog', catalog);
        } catch (error: any) {
            client.emit('ui:notification', { type: 'error', message: error.message });
        }
    }

    @SubscribeMessage('shop:buy')
    async handleBuy(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string; templateId: string; quantity?: number },
    ) {
        try {
            const result = await this.shopService.buyItem(
                data.userId,
                data.templateId,
                data.quantity || 1,
            );

            client.emit('shop:purchased', result);
            // Sync avec la boucle de jeu en mémoire
            const session = this.gameLoop.getSession(data.userId);
            if (session) {
                session.gold = result.goldRemaining;
            }

            client.emit('ui:notification', {
                type: 'loot',
                message: `🛒 ${result.item.name} acheté pour ${result.goldSpent} 💰 !`,
            });

            // Rafraîchir l'inventaire
            const inventory = await this.inventoryService.getInventory(data.userId);
            client.emit('inventory:data', { inventory });
        } catch (error: any) {
            client.emit('ui:notification', { type: 'error', message: error.message });
        }
    }
}
