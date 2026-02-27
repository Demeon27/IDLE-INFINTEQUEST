import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GuildRole } from '@prisma/client';

@Injectable()
export class GuildService {
    constructor(private prisma: PrismaService) { }

    async createGuild(ownerId: string, name: string, description?: string) {
        // Vérifier si le joueur est déjà dans une guilde
        const user = await this.prisma.user.findUnique({ where: { id: ownerId } });
        if (user?.guildId) {
            throw new BadRequestException('Vous êtes déjà membre d\'une guilde.');
        }

        // Vérifier si le nom est pris
        const existing = await this.prisma.guild.findUnique({ where: { name } });
        if (existing) {
            throw new BadRequestException('Ce nom de guilde est déjà utilisé.');
        }

        return this.prisma.guild.create({
            data: {
                name,
                description,
                members: {
                    connect: { id: ownerId }
                }
            }
        });
    }

    async getGuildDetails(guildId: string) {
        const guild = await this.prisma.guild.findUnique({
            where: { id: guildId },
            include: {
                members: {
                    select: {
                        id: true,
                        username: true,
                        level: true,
                        xp: true,
                        role: true,
                        lastLogin: true
                    },
                    orderBy: { level: 'desc' }
                }
            }
        });

        if (!guild) throw new NotFoundException('Guilde introuvable');
        return guild;
    }

    async joinGuild(userId: string, guildId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user?.guildId) {
            throw new BadRequestException('Quittez votre guilde actuelle avant d\'en rejoindre une nouvelle.');
        }

        return this.prisma.guild.update({
            where: { id: guildId },
            data: {
                members: {
                    connect: { id: userId }
                }
            }
        });
    }

    async leaveGuild(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.guildId) {
            throw new BadRequestException('Vous n\'êtes pas dans une guilde.');
        }

        // TODO: Si c'est le leader, gérer la succession ou dissoudre

        return this.prisma.user.update({
            where: { id: userId },
            data: { guildId: null, guildRole: null }
        });
    }

    async listGuilds() {
        return this.prisma.guild.findMany({
            include: {
                _count: {
                    select: { members: true }
                }
            },
            orderBy: { level: 'desc' }
        });
    }
}
