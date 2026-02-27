import { Injectable, Logger } from '@nestjs/common';
import { PluginManager, LootDropEvent } from './plugin-manager.service';
import { MonsterData } from './monster.repository';
import { PrismaService } from '../prisma/prisma.service';

// ============================================================
// Tables de probabilité de rareté par Tier
// ============================================================

interface RarityWeight {
    rarity: string;
    weight: number;
}

const BASE_DROP_CHANCE = 0.35; // 35% de chance de drop par monstre

/**
 * LootService — Génère le loot après la mort d'un monstre.
 * Les probabilités sont calculées mathématiquement selon le Tier.
 * Émet l'événement `loot:drop` via le PluginManager.
 */
@Injectable()
export class LootService {
    private readonly logger = new Logger(LootService.name);

    constructor(
        private readonly pluginManager: PluginManager,
        private readonly prisma: PrismaService
    ) { }

    /**
     * Génère le loot pour un joueur après la mort d'un monstre.
     */
    async generateLoot(playerId: string, monster: MonsterData): Promise<LootDropEvent | null> {
        // Roll pour savoir si le monstre drop quelque chose
        const isBoss = monster.tier % 10 === 0;
        const dropChance = isBoss ? 1.0 : BASE_DROP_CHANCE + (monster.tier * 0.002);

        if (Math.random() > Math.min(dropChance, 0.8)) {
            // Pas de loot ce coup-ci (sauf gold)
            const goldEvent: LootDropEvent = {
                playerId,
                monsterId: monster.id,
                tier: monster.tier,
                drops: [],
                goldAmount: monster.goldReward,
                timestamp: Date.now(),
            };
            this.pluginManager.emit('loot:drop', goldEvent);
            return goldEvent;
        }

        // Sélectionner la rareté du drop
        const rarity = this.rollRarity(monster.tier, isBoss);

        // Stratégie de recherche :
        // 1. Items approuvés du tier actuel ou inférieur
        // 2. Si rien, items approuvés de n'importe quel tier (fallback)
        let template = await this.findTemplate(rarity, monster.tier);

        const drops: any[] = [];

        if (template) {
            drops.push({
                templateId: template.id,
                name: template.name,
                rarity: template.rarity,
                quantity: 1,
            });
        } else {
            // Fallback ultime : item procédural (n'est pas sauvegardé en DB automatiquement)
            this.logger.warn(`⚠️ No ItemTemplate found for rarity ${rarity} at tier ${monster.tier}. Falling back to virtual item.`);
            const itemName = this.generateItemName(rarity, monster.tier);
            drops.push({
                templateId: `generated_${monster.tier}_${Date.now()}`,
                name: itemName,
                rarity,
                quantity: 1,
            });
        }

        // Boss : chance de double drop
        if (isBoss && Math.random() < 0.3) {
            const bonusRarity = this.rollRarity(monster.tier, false);
            const bonusTemplate = await this.findTemplate(bonusRarity, monster.tier);

            if (bonusTemplate) {
                drops.push({
                    templateId: bonusTemplate.id,
                    name: bonusTemplate.name,
                    rarity: bonusTemplate.rarity,
                    quantity: 1,
                });
            }
        }

        const lootEvent: LootDropEvent = {
            playerId,
            monsterId: monster.id,
            tier: monster.tier,
            drops,
            goldAmount: monster.goldReward,
            timestamp: Date.now(),
        };

        // Émettre l'événement pour que d'autres modules puissent réagir
        this.pluginManager.emit('loot:drop', lootEvent);

        return lootEvent;
    }

    /**
     * Trouve un template approprié dans la DB.
     */
    private async findTemplate(rarity: string, tier: number) {
        // Test 1 : Tier exact ou inférieur
        let templates = await this.prisma.itemTemplate.findMany({
            where: {
                status: 'APPROVED',
                rarity: rarity as any,
                dropTier: { lte: tier }
            },
            take: 10
        });

        // Test 2 : Si rien, n'importe quel item de cette rareté
        if (templates.length === 0) {
            templates = await this.prisma.itemTemplate.findMany({
                where: {
                    status: 'APPROVED',
                    rarity: rarity as any
                },
                take: 10
            });
        }

        if (templates.length === 0) return null;
        return templates[Math.floor(Math.random() * templates.length)];
    }

    /**
     * Roll de rareté basé sur le Tier.
     */
    private rollRarity(tier: number, isBoss: boolean): string {
        const weights = this.getRarityWeights(tier, isBoss);
        const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
        let roll = Math.random() * totalWeight;

        for (const { rarity, weight } of weights) {
            roll -= weight;
            if (roll <= 0) return rarity;
        }

        return 'COMMON';
    }

    private getRarityWeights(tier: number, isBoss: boolean): RarityWeight[] {
        const bossBonus = isBoss ? 2 : 0;
        return [
            { rarity: 'COMMON', weight: Math.max(50 - tier * 0.5, 10) },
            { rarity: 'UNCOMMON', weight: 30 + Math.min(tier * 0.3, 15) },
            { rarity: 'RARE', weight: 15 + Math.min(tier * 0.2, 20) + bossBonus },
            { rarity: 'EPIC', weight: Math.min(4 + tier * 0.1, 15) + bossBonus },
            { rarity: 'LEGENDARY', weight: Math.min(1 + tier * 0.03, 5) + bossBonus * 2 },
        ];
    }

    private generateItemName(rarity: string, tier: number): string {
        const prefixes: Record<string, string[]> = {
            COMMON: ['Vieux', 'Usé', 'Simple', 'Basique'],
            UNCOMMON: ['Solide', 'Renforcé', 'Fiable', 'Trempé'],
            RARE: ['Enchanté', 'Béni', 'Étoilé', 'Mystique'],
            EPIC: ['Draconique', 'Abyssal', 'Céleste', 'Runique'],
            LEGENDARY: ['Divin', 'Primordial', 'Éternel', 'Mythique'],
        };
        const items = ['Épée', 'Bouclier', 'Casque', 'Plastron', 'Jambières', 'Bottes', 'Cape', 'Anneau', 'Amulette', 'Arc'];
        const prefix = prefixes[rarity]?.[tier % (prefixes[rarity]?.length || 1)] ?? 'Ancien';
        const item = items[tier % items.length];
        return `${prefix} ${item}`;
    }
}
