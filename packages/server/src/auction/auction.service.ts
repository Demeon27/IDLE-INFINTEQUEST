import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PluginManager } from '../engine/plugin-manager.service';
import { GameLoopService } from '../engine/game-loop.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuctionService {
    private readonly logger = new Logger(AuctionService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly pluginManager: PluginManager,
        private readonly gameLoop: GameLoopService, // Pour modifiyer l'or en temps réel
    ) { }

    /**
     * Voir les objets en vente sur le marché
     */
    async getActiveListings() {
        return this.prisma.auctionListing.findMany({
            where: { status: 'ACTIVE' },
            include: {
                seller: { select: { id: true, username: true } },
                template: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 50, // Pagination simplifiée pour la démo
        });
    }

    /**
     * Mettre un objet en vente
     */
    async listObjectForSale(userId: string, activeInstanceId: string, price: number, quantity: number = 1) {
        if (price <= 0 || quantity <= 0) {
            throw new BadRequestException('Prix et quantité doivent être supérieurs à 0.');
        }

        // Trouver l'item dans l'inventaire du joueur
        const instance = await this.prisma.inventoryInstance.findFirst({
            where: { id: activeInstanceId, userId: userId, isEquipped: false }
        });

        if (!instance) {
            throw new NotFoundException('Objet introuvable dans votre sac ou actuellement équipé.');
        }

        if (instance.quantity < quantity) {
            throw new BadRequestException('Vous ne possédez pas cette quantité.');
        }

        // Transaction : déduire de l'inventaire et créer le listing
        await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Mise à jour de la quantité
            if (instance.quantity === quantity) {
                await tx.inventoryInstance.delete({ where: { id: instance.id } });
            } else {
                await tx.inventoryInstance.update({
                    where: { id: instance.id },
                    data: { quantity: instance.quantity - quantity }
                });
            }

            // Création de l'enchère (Hôtel de vente)
            await tx.auctionListing.create({
                data: {
                    sellerId: userId,
                    templateId: instance.templateId,
                    price: price, // Le prix pour la quantité entière
                    quantity: quantity,
                    status: 'ACTIVE'
                }
            });
        });

        this.logger.log(`⚖️ [Auction] Le joueur ${userId} a mis en vente l'item ${instance.templateId} pour ${price} Or.`);
        return { success: true };
    }

    /**
     * Acheter un objet sur le marché
     */
    async buyListedItem(buyerId: string, listingId: string) {
        return await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Verrouiller le listing
            const listing = await tx.auctionListing.findUnique({
                where: { id: listingId },
                include: { template: true }
            });

            if (!listing || listing.status !== 'ACTIVE') {
                throw new BadRequestException('Cet objet n\'est plus disponible.');
            }

            // if (listing.sellerId === buyerId) {
            //     throw new BadRequestException('Vous ne pouvez pas acheter votre propre objet.');
            // }

            // 2. Vérifier si l'acheteur a assez d'or (en BDD)
            const buyer = await tx.user.findUnique({ where: { id: buyerId } });
            if (!buyer || buyer.gold < listing.price) {
                throw new BadRequestException('Fonds insuffisants.');
            }

            // 3. Calcul de la taxe de vente (5%) - Le gold sink
            const tax = Math.floor(listing.price * 0.05);
            const sellerRevenue = listing.price - tax;

            // 4. Déduire l'or de l'acheteur
            await tx.user.update({
                where: { id: buyerId },
                data: { gold: { decrement: listing.price } }
            });

            // 5. Ajouter l'or au vendeur
            await tx.user.update({
                where: { id: listing.sellerId },
                data: { gold: { increment: sellerRevenue } }
            });

            // 6. Ajouter l'objet à l'inventaire de l'acheteur
            const existingInventory = await tx.inventoryInstance.findFirst({
                where: { userId: buyerId, templateId: listing.templateId, isEquipped: false }
            });

            if (existingInventory) {
                await tx.inventoryInstance.update({
                    where: { id: existingInventory.id },
                    data: { quantity: { increment: listing.quantity } }
                });
            } else {
                await tx.inventoryInstance.create({
                    data: {
                        userId: buyerId,
                        templateId: listing.templateId,
                        quantity: listing.quantity,
                        isEquipped: false
                    }
                });
            }

            // 7. Marquer le listing comme vendu
            const finalListing = await tx.auctionListing.update({
                where: { id: listingId },
                data: { status: 'SOLD' },
                include: { template: true }
            });

            // 8. Synchroniser l'or en mémoire si l'acheteur et/ou vendeur sont connectés !
            const buyerSession = this.gameLoop.getSession(buyerId);
            if (buyerSession) {
                buyerSession.gold -= listing.price;
                this.pluginManager.emit('gold:gain', { playerId: buyerId, amount: -listing.price, source: 'auction_buy', timestamp: Date.now() });
            }

            const sellerSession = this.gameLoop.getSession(listing.sellerId);
            if (sellerSession) {
                sellerSession.gold += sellerRevenue;
                // Idéalement notifier le vendeur via WS ici (notification asynchrone).
                this.pluginManager.emit('gold:gain', { playerId: listing.sellerId, amount: sellerRevenue, source: 'auction_sale', timestamp: Date.now() });
            }

            this.logger.log(`⚖️ [Auction] Vente M>J: Listing ${listingId} acheté par ${buyerId} à ${listing.sellerId} pour ${listing.price} (Taxe: ${tax}).`);

            // 9. Si l'objet est un UGC, on pourrait notifier le créateur
            if (listing.template.isUGC && listing.template.creatorId) {
                // Future notification système : "Un item que vous avez forgé vient de se vendre sur le marché !"
            }

            return { success: true, item: finalListing.template, paid: listing.price };
        });
    }
}
