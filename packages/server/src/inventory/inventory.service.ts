import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PluginManager } from '../engine/plugin-manager.service';

// ============================================================
// Types de l'inventaire
// ============================================================

export interface InventoryItemView {
    instanceId: string;
    templateId: string;
    name: string;
    description: string | null;
    slot: string;
    rarity: string;
    isEquipped: boolean;
    quantity: number;
    stats: {
        attack: number;
        defense: number;
        hp: number;
        critChance: number;
        dodge: number;
        haste: number;
    };
    spriteUrl: string | null;
    hueRotate: number | null;
    brightness: number | null;
    saturate: number | null;
    isUGC: boolean;
    creatorId: string | null;
    creatorName: string | null;
}

export interface EquipmentBonus {
    attack: number;
    defense: number;
    hp: number;
    critChance: number;
    dodge: number;
    haste: number;
}

// Les slots d'équipement possibles
const EQUIPMENT_SLOTS = ['HEAD', 'BODY', 'LEGS', 'FEET', 'WEAPON', 'SHIELD', 'RING', 'AMULET', 'CAPE'];

/**
 * InventoryService — Gestion complète de l'inventaire joueur.
 *
 * - Ajout d'items (loot, achat)
 * - Équipement/Déséquipement
 * - Calcul des bonus d'équipement
 * - Vente d'items (retour en or)
 */
@Injectable()
export class InventoryService {
    private readonly logger = new Logger(InventoryService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly pluginManager: PluginManager,
    ) { }

    // ============================================================
    // Lecture de l'inventaire
    // ============================================================

    /**
     * Retourne l'inventaire complet d'un joueur.
     */
    async getInventory(userId: string): Promise<InventoryItemView[]> {
        const instances = await this.prisma.inventoryInstance.findMany({
            where: { userId },
            include: { template: { include: { creator: true } } },
            orderBy: [
                { isEquipped: 'desc' },
                { acquiredAt: 'desc' },
            ],
        });

        return instances.map((inst: any) => ({
            instanceId: inst.id,
            templateId: inst.templateId,
            name: inst.template.name,
            description: inst.template.description,
            slot: inst.template.slot,
            rarity: inst.template.rarity,
            isEquipped: inst.isEquipped,
            quantity: inst.quantity,
            stats: {
                attack: inst.template.attack,
                defense: inst.template.defense,
                hp: inst.template.hp,
                critChance: inst.template.critChance,
                dodge: inst.template.dodge,
                haste: inst.template.haste,
            },
            spriteUrl: inst.template.spriteUrl,
            hueRotate: inst.hueRotate,
            brightness: inst.brightness,
            saturate: inst.saturate,
            isUGC: inst.template.isUGC,
            creatorId: inst.template.creatorId,
            creatorName: (inst.template as any).creator?.username || null,
        }));
    }

    /**
     * Retourne les items équipés d'un joueur.
     */
    async getEquipment(userId: string): Promise<InventoryItemView[]> {
        const inventory = await this.getInventory(userId);
        return inventory.filter(item => item.isEquipped);
    }

    /**
     * Calcule le total des bonus d'équipement.
     */
    async getEquipmentBonus(userId: string): Promise<EquipmentBonus> {
        const equipped = await this.getEquipment(userId);
        const bonus: EquipmentBonus = {
            attack: 0, defense: 0, hp: 0,
            critChance: 0, dodge: 0, haste: 0,
        };

        for (const item of equipped) {
            bonus.attack += item.stats.attack;
            bonus.defense += item.stats.defense;
            bonus.hp += item.stats.hp;
            bonus.critChance += item.stats.critChance;
            bonus.dodge += item.stats.dodge;
            bonus.haste += item.stats.haste;
        }

        return bonus;
    }

    // ============================================================
    // Ajout d'items
    // ============================================================

    /**
     * Ajoute un item à l'inventaire d'un joueur.
     * Si l'item est déjà possédé (non équipé), incrémente la quantité.
     */
    async addItem(userId: string, templateId: string, quantity = 1): Promise<InventoryItemView> {
        // Vérifier que le template existe
        const template = await this.prisma.itemTemplate.findUnique({
            where: { id: templateId },
        });

        if (!template) {
            throw new NotFoundException(`Item template "${templateId}" not found`);
        }

        // Chercher si le joueur possède déjà cet item (non équipé)
        const existing = await this.prisma.inventoryInstance.findFirst({
            where: {
                userId,
                templateId,
                isEquipped: false,
            },
        });

        let instance;
        if (existing) {
            // Incrémenter la quantité
            instance = await this.prisma.inventoryInstance.update({
                where: { id: existing.id },
                data: { quantity: existing.quantity + quantity },
                include: { template: { include: { creator: true } } },
            });
        } else {
            // Créer une nouvelle instance
            instance = await this.prisma.inventoryInstance.create({
                data: {
                    userId,
                    templateId,
                    quantity,
                },
                include: { template: { include: { creator: true } } },
            });
        }

        this.logger.log(`🎒 ${userId} received: ${template.name} (${template.rarity}) x${quantity}`);

        return {
            instanceId: instance.id,
            templateId: instance.templateId,
            name: instance.template.name,
            description: instance.template.description,
            slot: instance.template.slot,
            rarity: instance.template.rarity,
            isEquipped: instance.isEquipped,
            quantity: instance.quantity,
            stats: {
                attack: instance.template.attack,
                defense: instance.template.defense,
                hp: instance.template.hp,
                critChance: instance.template.critChance,
                dodge: instance.template.dodge,
                haste: instance.template.haste,
            },
            spriteUrl: instance.template.spriteUrl,
            hueRotate: instance.hueRotate,
            brightness: instance.brightness,
            saturate: instance.saturate,
            isUGC: instance.template.isUGC,
            creatorId: instance.template.creatorId,
            creatorName: (instance.template as any).creator?.username || null,
        };
    }

    // ============================================================
    // Équipement
    // ============================================================

    /**
     * Équipe un item de l'inventaire.
     * Déséquipe automatiquement l'item précédent du même slot.
     */
    async equipItem(userId: string, instanceId: string): Promise<{ equipped: InventoryItemView; unequipped: InventoryItemView | null }> {
        const instance = await this.prisma.inventoryInstance.findUnique({
            where: { id: instanceId },
            include: { template: { include: { creator: true } } },
        });

        if (!instance || instance.userId !== userId) {
            throw new NotFoundException('Item non trouvé dans votre inventaire.');
        }

        if (instance.isEquipped) {
            throw new BadRequestException('Cet item est déjà équipé.');
        }

        if (!EQUIPMENT_SLOTS.includes(instance.template.slot)) {
            throw new BadRequestException(`Le slot "${instance.template.slot}" ne peut pas être équipé.`);
        }

        // Déséquiper l'item actuel du même slot
        const currentlyEquipped = await this.prisma.inventoryInstance.findFirst({
            where: {
                userId,
                isEquipped: true,
                template: { slot: instance.template.slot },
            },
            include: { template: { include: { creator: true } } },
        });

        let unequipped: InventoryItemView | null = null;
        if (currentlyEquipped) {
            await this.prisma.inventoryInstance.update({
                where: { id: currentlyEquipped.id },
                data: { isEquipped: false },
            });
            unequipped = {
                instanceId: currentlyEquipped.id,
                templateId: currentlyEquipped.templateId,
                name: currentlyEquipped.template.name,
                description: currentlyEquipped.template.description,
                slot: currentlyEquipped.template.slot,
                rarity: currentlyEquipped.template.rarity,
                isEquipped: false,
                quantity: currentlyEquipped.quantity,
                stats: {
                    attack: currentlyEquipped.template.attack,
                    defense: currentlyEquipped.template.defense,
                    hp: currentlyEquipped.template.hp,
                    critChance: currentlyEquipped.template.critChance,
                    dodge: currentlyEquipped.template.dodge,
                    haste: currentlyEquipped.template.haste,
                },
                spriteUrl: currentlyEquipped.template.spriteUrl,
                hueRotate: currentlyEquipped.hueRotate,
                brightness: currentlyEquipped.brightness,
                saturate: currentlyEquipped.saturate,
                isUGC: currentlyEquipped.template.isUGC,
                creatorId: currentlyEquipped.template.creatorId,
                creatorName: (currentlyEquipped.template as any).creator?.username || null,
            };
        }

        // Équiper le nouvel item
        // Si quantité > 1, séparer en 2 instances (1 équipée, le reste en inventaire)
        if (instance.quantity > 1) {
            await this.prisma.inventoryInstance.update({
                where: { id: instanceId },
                data: { quantity: instance.quantity - 1 },
            });
            const newEquipped = await this.prisma.inventoryInstance.create({
                data: {
                    userId,
                    templateId: instance.templateId,
                    isEquipped: true,
                    quantity: 1,
                },
                include: { template: { include: { creator: true } } },
            });
            this.logger.log(`⚔️ ${userId} equipped: ${instance.template.name}`);
            return {
                equipped: {
                    instanceId: newEquipped.id,
                    templateId: newEquipped.templateId,
                    name: newEquipped.template.name,
                    description: newEquipped.template.description,
                    slot: newEquipped.template.slot,
                    rarity: newEquipped.template.rarity,
                    isEquipped: true,
                    quantity: 1,
                    stats: {
                        attack: newEquipped.template.attack,
                        defense: newEquipped.template.defense,
                        hp: newEquipped.template.hp,
                        critChance: newEquipped.template.critChance,
                        dodge: newEquipped.template.dodge,
                        haste: newEquipped.template.haste,
                    },
                    spriteUrl: newEquipped.template.spriteUrl,
                    hueRotate: newEquipped.hueRotate,
                    brightness: newEquipped.brightness,
                    saturate: newEquipped.saturate,
                    isUGC: newEquipped.template.isUGC,
                    creatorId: newEquipped.template.creatorId,
                    creatorName: (newEquipped.template as any).creator?.username || null,
                },
                unequipped,
            };
        }

        // Quantité = 1, simplement marquer comme équipé
        const updated = await this.prisma.inventoryInstance.update({
            where: { id: instanceId },
            data: { isEquipped: true },
            include: { template: { include: { creator: true } } },
        });

        this.logger.log(`⚔️ ${userId} equipped: ${instance.template.name}`);

        return {
            equipped: {
                instanceId: updated.id,
                templateId: updated.templateId,
                name: updated.template.name,
                description: updated.template.description,
                slot: updated.template.slot,
                rarity: updated.template.rarity,
                isEquipped: true,
                quantity: 1,
                stats: {
                    attack: updated.template.attack,
                    defense: updated.template.defense,
                    hp: updated.template.hp,
                    critChance: updated.template.critChance,
                    dodge: updated.template.dodge,
                    haste: updated.template.haste,
                },
                spriteUrl: updated.template.spriteUrl,
                hueRotate: updated.hueRotate,
                brightness: updated.brightness,
                saturate: updated.saturate,
                isUGC: updated.template.isUGC,
                creatorId: updated.template.creatorId,
                creatorName: (updated.template as any).creator?.username || null,
            },
            unequipped,
        };
    }

    /**
     * Déséquipe un item.
     */
    async unequipItem(userId: string, instanceId: string): Promise<InventoryItemView> {
        const instance = await this.prisma.inventoryInstance.findUnique({
            where: { id: instanceId },
            include: { template: { include: { creator: true } } },
        });

        if (!instance || instance.userId !== userId) {
            throw new NotFoundException('Item non trouvé.');
        }

        if (!instance.isEquipped) {
            throw new BadRequestException('Cet item n\'est pas équipé.');
        }

        const updated = await this.prisma.inventoryInstance.update({
            where: { id: instanceId },
            data: { isEquipped: false },
            include: { template: { include: { creator: true } } },
        });

        this.logger.log(`📦 ${userId} unequipped: ${instance.template.name}`);

        return {
            instanceId: updated.id,
            templateId: updated.templateId,
            name: updated.template.name,
            description: updated.template.description,
            slot: updated.template.slot,
            rarity: updated.template.rarity,
            isEquipped: false,
            quantity: updated.quantity,
            stats: {
                attack: updated.template.attack,
                defense: updated.template.defense,
                hp: updated.template.hp,
                critChance: updated.template.critChance,
                dodge: updated.template.dodge,
                haste: updated.template.haste,
            },
            spriteUrl: updated.template.spriteUrl,
            hueRotate: updated.hueRotate,
            brightness: updated.brightness,
            saturate: updated.saturate,
            isUGC: updated.template.isUGC,
            creatorId: updated.template.creatorId,
            creatorName: (updated.template as any).creator?.username || null,
        };
    }

    // ============================================================
    // Vente
    // ============================================================

    /**
     * Vend un item de l'inventaire. Retourne la moitié du prix boutique, ou 1 gold minimum.
     */
    async sellItem(userId: string, instanceId: string, quantity = 1): Promise<{ goldGained: number; itemName: string }> {
        const instance = await this.prisma.inventoryInstance.findUnique({
            where: { id: instanceId },
            include: { template: true },
        });

        if (!instance || instance.userId !== userId) {
            throw new NotFoundException('Item non trouvé.');
        }

        if (instance.isEquipped) {
            throw new BadRequestException('Déséquipez l\'item avant de le vendre.');
        }

        if (quantity > instance.quantity) {
            throw new BadRequestException(`Vous n'avez que ${instance.quantity} de cet item.`);
        }

        // Calcul du prix de vente (50% du prix boutique, minimum 1 gold par rareté)
        const basePrice = instance.template.shopPrice || this.getDefaultSellPrice(instance.template.rarity);
        const sellPrice = Math.max(1, Math.floor(basePrice * 0.5)) * quantity;

        // Retirer de l'inventaire
        if (quantity >= instance.quantity) {
            await this.prisma.inventoryInstance.delete({ where: { id: instanceId } });
        } else {
            await this.prisma.inventoryInstance.update({
                where: { id: instanceId },
                data: { quantity: instance.quantity - quantity },
            });
        }

        // Créditer le joueur
        await this.prisma.user.update({
            where: { id: userId },
            data: { gold: { increment: sellPrice } },
        });

        this.logger.log(`💰 ${userId} sold: ${instance.template.name} x${quantity} for ${sellPrice} gold`);

        return { goldGained: sellPrice, itemName: instance.template.name };
    }

    /**
     * Prix de vente par défaut selon la rareté.
     */
    private getDefaultSellPrice(rarity: string): number {
        const prices: Record<string, number> = {
            COMMON: 2,
            UNCOMMON: 8,
            RARE: 25,
            EPIC: 80,
            LEGENDARY: 300,
        };
        return prices[rarity] || 2;
    }
}
