import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class AdminService implements OnModuleInit {
    private configCache: Map<string, string> = new Map();

    constructor(private prisma: PrismaService) { }

    async onModuleInit() {
        // Initialisation des configs par défaut si elles n'existent pas
        await this.ensureConfig('XP_MULTIPLIER', '1.0', 'Multiplicateur global d\'XP');
        await this.ensureConfig('DROP_RATE_MODIFIER', '1.0', 'Modificateur global de loot');

        // Charger tout le cache
        const all = await this.prisma.systemConfig.findMany();
        all.forEach(c => this.configCache.set(c.key, c.value));
    }

    private async ensureConfig(key: string, defaultValue: string, description: string) {
        const existing = await this.prisma.systemConfig.findUnique({ where: { key } });
        if (!existing) {
            await this.prisma.systemConfig.create({
                data: { key, value: defaultValue, description }
            });
        }
    }

    // --- Live Config ---
    async getAllConfig() {
        return this.prisma.systemConfig.findMany();
    }

    async updateConfig(key: string, value: string) {
        const updated = await this.prisma.systemConfig.update({
            where: { key },
            data: { value }
        });
        this.configCache.set(key, value);
        return updated;
    }

    getConfig(key: string, defaultValue: string): string {
        return this.configCache.get(key) || defaultValue;
    }

    getNumberConfig(key: string, defaultValue: number): number {
        const val = this.configCache.get(key);
        return val ? parseFloat(val) : defaultValue;
    }

    // --- User Management ---
    async listUsers() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                status: true,
                level: true,
                createdAt: true,
                lastLogin: true,
                banExpires: true,
                banReason: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async updateUserRole(userId: string, role: Role) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { role }
        });
    }

    async updateUserStatus(userId: string, data: { status: any, banReason?: string, banExpires?: Date }) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                status: data.status,
                banReason: data.banReason,
                banExpires: data.banExpires,
                bannedAt: data.status !== 'ACTIVE' ? new Date() : null
            }
        });
    }

    async deleteUser(userId: string) {
        return this.prisma.user.delete({
            where: { id: userId }
        });
    }
}
