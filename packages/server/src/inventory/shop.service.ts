import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from './inventory.service';

// ============================================================
// Types de la boutique
// ============================================================

export interface ShopItemView {
    templateId: string;
    name: string;
    description: string | null;
    slot: string;
    rarity: string;
    price: number;
    stats: {
        attack: number;
        defense: number;
        hp: number;
        critChance: number;
        dodge: number;
        haste: number;
    };
    spriteUrl: string | null;
    isUGC: boolean;
    creatorName: string | null;
}

/**
 * ShopService — Boutique du jeu.
 *
 * - Catalogue dynamique filtré par Tier du joueur
 * - Achat d'items (débit de gold, ajout à l'inventaire)
 * - Items système + UGC approuvés
 * - Prix fixes par template
 */
@Injectable()
export class ShopService {
    private readonly logger = new Logger(ShopService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly inventoryService: InventoryService,
    ) { }

    /**
     * Retourne le catalogue de la boutique filtré par le Tier du joueur.
     * Affiche seulement les items approuvés avec un prix défini.
     */
    async getCatalog(playerTier: number, page = 1, limit = 20): Promise<{
        items: ShopItemView[];
        total: number;
        page: number;
        totalPages: number;
    }> {
        const where = {
            shopPrice: { not: null },
            status: 'APPROVED' as const,
            // Afficher les items dont le dropTier est <= au tier du joueur + 5
            OR: [
                { dropTier: null },
                { dropTier: { lte: playerTier + 5 } },
            ],
        };

        const [items, total] = await Promise.all([
            this.prisma.itemTemplate.findMany({
                where,
                include: { creator: { select: { username: true } } },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: [
                    { rarity: 'asc' },
                    { shopPrice: 'asc' },
                ],
            }),
            this.prisma.itemTemplate.count({ where }),
        ]);

        return {
            items: items.map(item => ({
                templateId: item.id,
                name: item.name,
                description: item.description,
                slot: item.slot,
                rarity: item.rarity,
                price: item.shopPrice!,
                stats: {
                    attack: item.attack,
                    defense: item.defense,
                    hp: item.hp,
                    critChance: item.critChance,
                    dodge: item.dodge,
                    haste: item.haste,
                },
                spriteUrl: item.spriteUrl,
                isUGC: item.isUGC,
                creatorName: item.creator?.username || null,
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Achète un item de la boutique.
     * Valide le prix, débite le gold, ajoute à l'inventaire.
     */
    async buyItem(userId: string, templateId: string, quantity = 1): Promise<{
        item: ShopItemView;
        goldSpent: number;
        goldRemaining: number;
    }> {
        // Récupérer l'item et le joueur
        const [template, user] = await Promise.all([
            this.prisma.itemTemplate.findUnique({
                where: { id: templateId },
                include: { creator: { select: { username: true } } },
            }),
            this.prisma.user.findUnique({ where: { id: userId } }),
        ]);

        if (!template || !template.shopPrice) {
            throw new BadRequestException('Cet item n\'est pas disponible à l\'achat.');
        }

        if (template.status !== 'APPROVED') {
            throw new BadRequestException('Cet item n\'est plus disponible.');
        }

        if (!user) {
            throw new BadRequestException('Joueur non trouvé.');
        }

        const totalCost = template.shopPrice * quantity;

        if (user.gold < totalCost) {
            throw new BadRequestException(
                `Pas assez d'or ! Vous avez ${user.gold} 💰, il faut ${totalCost} 💰.`
            );
        }

        // Transaction : débiter le gold + ajouter à l'inventaire
        await this.prisma.user.update({
            where: { id: userId },
            data: { gold: { decrement: totalCost } },
        });

        await this.inventoryService.addItem(userId, templateId, quantity);

        // Si c'est un item UGC, créditer 10% au créateur
        if (template.isUGC && template.creatorId) {
            const creatorBonus = Math.floor(totalCost * 0.10);
            if (creatorBonus > 0) {
                await this.prisma.user.update({
                    where: { id: template.creatorId },
                    data: { gold: { increment: creatorBonus } },
                });
                this.logger.log(`💎 Creator ${template.creator?.username} earned ${creatorBonus} gold from sale`);
            }
        }

        this.logger.log(`🛒 ${user.username} bought: ${template.name} x${quantity} for ${totalCost} gold`);

        return {
            item: {
                templateId: template.id,
                name: template.name,
                description: template.description,
                slot: template.slot,
                rarity: template.rarity,
                price: template.shopPrice,
                stats: {
                    attack: template.attack,
                    defense: template.defense,
                    hp: template.hp,
                    critChance: template.critChance,
                    dodge: template.dodge,
                    haste: template.haste,
                },
                spriteUrl: template.spriteUrl,
                isUGC: template.isUGC,
                creatorName: template.creator?.username || null,
            },
            goldSpent: totalCost,
            goldRemaining: user.gold - totalCost,
        };
    }

    /**
     * Seed initial de la boutique avec des items de base.
     * Appelé au démarrage pour avoir quelque chose à acheter.
     */
    async seedDefaultItems(): Promise<number> {
        const existingCount = await this.prisma.itemTemplate.count();
        if (existingCount > 0) return existingCount;

        const defaultItems = [
            // --- Tier 1 : Équipement de départ ---
            { name: 'Épée Rouillée', slot: 'WEAPON', rarity: 'COMMON' as const, attack: 5, defense: 0, hp: 0, shopPrice: 10, dropTier: 1 },
            { name: 'Bouclier en Bois', slot: 'SHIELD', rarity: 'COMMON' as const, attack: 0, defense: 3, hp: 10, shopPrice: 8, dropTier: 1 },
            { name: 'Casque de Cuir', slot: 'HEAD', rarity: 'COMMON' as const, attack: 0, defense: 2, hp: 15, shopPrice: 12, dropTier: 1 },
            { name: 'Tunique du Voyageur', slot: 'BODY', rarity: 'COMMON' as const, attack: 0, defense: 4, hp: 20, shopPrice: 15, dropTier: 1 },
            { name: 'Bottes Usées', slot: 'FEET', rarity: 'COMMON' as const, attack: 0, defense: 1, hp: 5, shopPrice: 6, dropTier: 1 },

            // --- Tier 3+ : Uncommon ---
            { name: 'Lame Trempée', slot: 'WEAPON', rarity: 'UNCOMMON' as const, attack: 12, defense: 0, hp: 0, shopPrice: 45, dropTier: 3 },
            { name: 'Cotte de Mailles', slot: 'BODY', rarity: 'UNCOMMON' as const, attack: 0, defense: 9, hp: 40, shopPrice: 55, dropTier: 3 },
            { name: 'Heaume de Fer', slot: 'HEAD', rarity: 'UNCOMMON' as const, attack: 1, defense: 5, hp: 25, shopPrice: 40, dropTier: 3 },
            { name: 'Anneau de Force', slot: 'RING', rarity: 'UNCOMMON' as const, attack: 4, defense: 0, hp: 0, critChance: 0.02, shopPrice: 60, dropTier: 5 },

            // --- Tier 8+ : Rare ---
            { name: 'Épée du Crépuscule', slot: 'WEAPON', rarity: 'RARE' as const, attack: 25, defense: 0, hp: 0, critChance: 0.03, shopPrice: 150, dropTier: 8 },
            { name: 'Armure de Dragon', slot: 'BODY', rarity: 'RARE' as const, attack: 5, defense: 18, hp: 80, shopPrice: 180, dropTier: 8 },
            { name: 'Amulette Mystique', slot: 'AMULET', rarity: 'RARE' as const, attack: 8, defense: 3, hp: 30, haste: 0.05, shopPrice: 200, dropTier: 10 },
            { name: 'Cape de l\'Ombre', slot: 'CAPE', rarity: 'RARE' as const, attack: 0, defense: 6, hp: 20, dodge: 0.05, shopPrice: 170, dropTier: 10 },

            // --- Tier 15+ : Epic ---
            { name: 'Fléau Abyssal', slot: 'WEAPON', rarity: 'EPIC' as const, attack: 50, defense: 0, hp: 0, critChance: 0.05, shopPrice: 500, dropTier: 15 },
            { name: 'Plastron Runique', slot: 'BODY', rarity: 'EPIC' as const, attack: 10, defense: 35, hp: 150, shopPrice: 600, dropTier: 15 },

            // --- Tier 25+ : Legendary ---
            { name: 'Lame Éternelle', slot: 'WEAPON', rarity: 'LEGENDARY' as const, attack: 100, defense: 10, hp: 50, critChance: 0.08, haste: 0.1, shopPrice: 2000, dropTier: 25 },
        ];

        for (const item of defaultItems) {
            await this.prisma.itemTemplate.create({
                data: {
                    name: item.name,
                    slot: item.slot,
                    rarity: item.rarity,
                    attack: item.attack,
                    defense: item.defense,
                    hp: item.hp,
                    critChance: item.critChance || 0,
                    dodge: item.dodge || 0,
                    haste: item.haste || 0,
                    shopPrice: item.shopPrice,
                    dropTier: item.dropTier,
                    status: 'APPROVED',
                    isUGC: false,
                },
            });
        }

        this.logger.log(`🏪 Shop seeded with ${defaultItems.length} default items`);
        return defaultItems.length;
    }
}
