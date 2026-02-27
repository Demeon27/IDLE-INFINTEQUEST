import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PluginManager } from '../engine/plugin-manager.service';
import * as fs from 'fs';
import * as path from 'path';

export interface CreateWorkshopItemDto {
    creatorId: string;
    name: string;
    description?: string;
    slot: string; // 'HEAD', 'WEAPON', etc.
    rarity: string; // 'COMMON', etc.
    base64Image: string; // "data:image/png;base64,iVBORw0KGgo..."
    // Paramètres choisis par le créateur
    attack?: number;
    defense?: number;
    hp?: number;
    price?: number;
}

@Injectable()
export class WorkshopService {
    private readonly logger = new Logger(WorkshopService.name);
    // Le dossier "uploads/sprites" est à la racine du package server
    private readonly uploadDir = path.join(__dirname, '..', '..', 'uploads', 'sprites');

    constructor(
        private readonly prisma: PrismaService,
        private readonly pluginManager: PluginManager,
    ) {
        // Créer le dossier s'il n'existe pas
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
            this.logger.log(`📁 Dossier de sprites UGC créé : ${this.uploadDir}`);
        }
    }

    /**
     * 1. Soumission d'une nouvelle création par un joueur
     */
    async submitItem(dto: CreateWorkshopItemDto) {
        // Extraire la vraie donnée Base64 sans l'entête "data:image/png;base64,"
        const matches = dto.base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            throw new BadRequestException('Image invalide. Format attendu : data:image/png;base64,...');
        }

        const buffer = Buffer.from(matches[2], 'base64');
        const fileName = `ugc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.png`;
        const filePath = path.join(this.uploadDir, fileName);

        // Sauvegarder le fichier physiquement (A remplacer par S3/MinIO plus tard)
        fs.writeFileSync(filePath, buffer);

        // Enregistrer en base de données au statut PENDING
        const template = await this.prisma.itemTemplate.create({
            data: {
                name: dto.name,
                description: dto.description || 'Création communautaire',
                slot: dto.slot,
                // On met "COMMON" de base si la valeur n'est pas reconnue
                rarity: ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'].includes(dto.rarity) ? dto.rarity as any : 'COMMON',
                attack: dto.attack || 0,
                defense: dto.defense || 0,
                hp: dto.hp || 0,
                shopPrice: dto.price || 100, // Prix souhaité
                dropTier: 5, // Par défaut, on le met au Tier 5 pour l'instant
                spriteUrl: `/uploads/sprites/${fileName}`,
                isUGC: true,
                status: 'PENDING',
                creatorId: dto.creatorId,
            }
        });

        this.logger.log(`🎨 Nouvelle soumission UGC : ${template.name} par le joueur ID: ${dto.creatorId}`);
        return template;
    }

    /**
     * 2. Banc des Juges : Voir les objets en attente
     */
    async getPendingItems() {
        return this.prisma.itemTemplate.findMany({
            where: { status: 'PENDING' },
            include: { creator: { select: { username: true } } },
            orderBy: { createdAt: 'asc' }
        });
    }

    /**
     * 3. Banc des Juges : Valider un objet
     */
    async approveItem(templateId: string) {
        const item = await this.prisma.itemTemplate.update({
            where: { id: templateId },
            data: { status: 'APPROVED' }
        });

        this.logger.log(`✅ UGC Approuvé : ${item.name}`);

        // Optionnel: Déclencher un hook pour dire à la boutique de rafraîchir son cache si on en a un
        this.pluginManager.emit('shop:item_approved', { item });

        return item;
    }

    /**
     * 4. Banc des Juges : Rejeter un objet
     */
    async rejectItem(templateId: string) {
        const item = await this.prisma.itemTemplate.update({
            where: { id: templateId },
            data: { status: 'REJECTED' }
        });

        this.logger.log(`❌ UGC Rejeté : ${item.name}`);
        // Dans une V3 on pourrait supprimer le fichier physique pour libérer de l'espace
        return item;
    }

    /**
     * 5. Boutique du Créateur : Vitrine
     */
    async getCreatorShowcase(creatorId: string) {
        const creator = await this.prisma.user.findUnique({
            where: { id: creatorId },
            select: { username: true, id: true }
        });

        if (!creator) throw new NotFoundException('Créateur introuvable.');

        const items = await this.prisma.itemTemplate.findMany({
            where: { creatorId: creatorId, status: 'APPROVED' },
            orderBy: { likes: 'desc' }
        });

        return { creator, items };
    }

    /**
     * 6. Communauté : Aimer un chef d'oeuvre UGC
     */
    async likeItem(templateId: string) {
        const item = await this.prisma.itemTemplate.update({
            where: { id: templateId },
            data: { likes: { increment: 1 } }
        });
        this.logger.log(`❤️  L'item ${item.name} a été liké ! (Total: ${item.likes})`);
        return item;
    }
}
