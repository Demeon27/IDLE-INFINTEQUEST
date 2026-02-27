import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MonsterCategory } from '@prisma/client';

export interface MonsterStats {
    hp: number;
    maxHp: number;
    attack: number;
    xp: number;
    gold: number;
}

@Injectable()
export class DungeonService {
    constructor(private prisma: PrismaService) { }

    /**
     * Calcule les statistiques d'un monstre en fonction du Tier du donjon.
     * Formule exponentielle pour une progression infinie.
     */
    calculateScaling(tier: number, category: MonsterCategory): MonsterStats {
        const baseHp = 100;
        const growthRate = 1.0202; // Environ 50 Milliards de HP au Tier 1000

        let hp = Math.floor(baseHp * Math.pow(growthRate, tier - 1));

        // Bonus pour les Boss
        if (category === MonsterCategory.BOSS) {
            hp *= 10;
        }

        // Dégâts : environ 10% des HP divisé par 10 pour le scaling (estimatif)
        // Au tier 1 : hp=100 -> attack=5
        // Au tier 1000 : hp=50B -> attack=2.5B
        const attack = Math.max(1, Math.floor(hp * 0.05));

        // Récompenses
        const xp = Math.floor(tier * 10 * Math.pow(1.01, tier - 1));
        const gold = Math.floor(tier * 5);

        return {
            hp,
            maxHp: hp,
            attack,
            xp,
            gold
        };
    }

    async createMonsterTemplate(data: { name: string; spriteUrl: string; category: MonsterCategory; isUGC?: boolean; creatorId?: string }) {
        return this.prisma.monsterTemplate.create({
            data: {
                ...data,
                status: data.isUGC ? 'PENDING' : 'APPROVED'
            }
        });
    }

    async createDungeonTemplate(data: { name: string; description?: string; backgroundUrl: string; minionTemplateId: string; bossTemplateId: string; isUGC?: boolean; creatorId?: string }) {
        return this.prisma.dungeonTemplate.create({
            data: {
                ...data,
                status: data.isUGC ? 'PENDING' : 'APPROVED'
            }
        });
    }

    async listDungeons() {
        return this.prisma.dungeonTemplate.findMany({
            where: { status: 'APPROVED' },
            include: {
                minionTemplate: true,
                bossTemplate: true,
                creator: { select: { username: true } }
            }
        });
    }

    async getDungeonDetails(id: string) {
        const dungeon = await this.prisma.dungeonTemplate.findUnique({
            where: { id },
            include: {
                minionTemplate: true,
                bossTemplate: true
            }
        });
        if (!dungeon) throw new NotFoundException('Donjon introuvable');
        return dungeon;
    }
}
