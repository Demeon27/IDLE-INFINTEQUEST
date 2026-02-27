import { Controller, Post, Get, Body, Param, UseGuards /* TODO: AuthGuard pour plus tard */ } from '@nestjs/common';
import { WorkshopService, CreateWorkshopItemDto } from './workshop.service';

/**
 * Controller HTTP pour l'Atelier UGC
 * 
 * Tout ce qui concerne des transferts de fichiers d'images (Base64 lourd) 
 * passe par de vraies requêtes Post au lieu de WebSocket pour libérer 
 * la bande passante temps réel du moteur de jeu.
 */
@Controller('workshop')
export class WorkshopController {
    constructor(private readonly workshopService: WorkshopService) { }

    // 1. Soumettre une création (Pixel Studio)
    @Post('submit')
    async submitUgc(@Body() dto: CreateWorkshopItemDto) {
        return this.workshopService.submitItem(dto);
    }

    // 2. Banc des Juges - Voir les PENDING
    // FIXME: Ajouter un guard @Roles('MODERATOR', 'ADMIN') une fois la vraie auth JWT en place
    @Get('pending')
    async getPendingItems() {
        return this.workshopService.getPendingItems();
    }

    // 3. Modération - Approuver
    @Post(':id/approve')
    async approveItem(@Param('id') itemId: string) {
        return this.workshopService.approveItem(itemId);
    }

    // 4. Modération - Rejeter
    @Post(':id/reject')
    async rejectItem(@Param('id') itemId: string) {
        return this.workshopService.rejectItem(itemId);
    }

    // 5. Voir la Vitrine d'un créateur
    @Get('creator/:id')
    async getCreatorShowcase(@Param('id') creatorId: string) {
        return this.workshopService.getCreatorShowcase(creatorId);
    }

    // 6. Liker un objet
    @Post('item/:id/like')
    async likeItem(@Param('id') templateId: string) {
        return this.workshopService.likeItem(templateId);
    }
}
