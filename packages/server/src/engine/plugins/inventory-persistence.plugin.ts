import { Logger } from '@nestjs/common';
import { IGamePlugin, LootDropEvent, GoldGainEvent, XpGainEvent, PluginManager } from '../plugin-manager.service';
import { InventoryService } from '../../inventory/inventory.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * InventoryPersistencePlugin — Sauvegarde persistante des gains du joueur.
 * 
 * Écoute les événements Gold, XP et Loot pour les inscrire en Base de Données.
 */
export class InventoryPersistencePlugin implements IGamePlugin {
    name = 'InventoryPersistence';
    description = 'Sauvegarde persistante de l"inventaire, de l"or et de l"XP';
    version = '1.0.0';
    private readonly logger = new Logger('InventoryPersistencePlugin');

    constructor(
        private readonly inventoryService: InventoryService,
        private readonly prisma: PrismaService
    ) { }

    private handlers: Array<{ event: string; handler: (...args: any[]) => void }> = [];

    onEnable(manager: PluginManager): void {
        const lootHandler = this.handleLootDrop.bind(this);
        const goldHandler = this.handleGoldGain.bind(this);
        const xpHandler = this.handleXpGain.bind(this);

        manager.on('loot:drop', lootHandler);
        manager.on('gold:gain', goldHandler);
        manager.on('xp:gain', xpHandler);

        this.handlers = [
            { event: 'loot:drop', handler: lootHandler },
            { event: 'gold:gain', handler: goldHandler },
            { event: 'xp:gain', handler: xpHandler },
        ];

        this.logger.log('📦 Inventory Persistence enabled');
    }

    onDisable(manager: PluginManager): void {
        for (const { event, handler } of this.handlers) {
            manager.off(event as any, handler);
        }
        this.handlers = [];
        this.logger.log('📦 Inventory Persistence disabled');
    }

    /**
     * Sauvegarde le loot dans l'inventaire du joueur.
     */
    private async handleLootDrop(event: LootDropEvent) {
        if (!event.drops || event.drops.length === 0) return;

        for (const drop of event.drops) {
            // Uniquement si on a un vrai templateId (pas 'generated_...')
            if (drop.templateId && !drop.templateId.startsWith('generated_')) {
                try {
                    await this.inventoryService.addItem(event.playerId, drop.templateId, drop.quantity);
                    this.logger.debug(`💎 Saved loot [${drop.name}] for player ${event.playerId}`);
                } catch (err) {
                    this.logger.error(`❌ Failed to save loot ${drop.templateId}: ${err.message}`);
                }
            } else {
                this.logger.warn(`⚠️ Ignoring virtual loot: ${drop.name} (${drop.templateId})`);
            }
        }
    }

    /**
     * Sauvegarde l'or gagné.
     */
    private async handleGoldGain(event: GoldGainEvent) {
        try {
            await this.prisma.user.update({
                where: { id: event.playerId },
                data: { gold: { increment: event.amount } }
            });
        } catch (err) {
            this.logger.error(`❌ Failed to save gold for ${event.playerId}: ${err.message}`);
        }
    }

    /**
     * Sauvegarde l'XP gagnée.
     */
    private async handleXpGain(event: XpGainEvent) {
        try {
            await this.prisma.user.update({
                where: { id: event.playerId },
                data: { xp: { increment: Math.floor(event.amount * event.multiplier) } }
            });
        } catch (err) {
            this.logger.error(`❌ Failed to save XP for ${event.playerId}: ${err.message}`);
        }
    }
}
