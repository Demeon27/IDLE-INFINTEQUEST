import {
    WebSocketGateway,
    SubscribeMessage,
    ConnectedSocket,
    MessageBody,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { PluginManager } from '../engine/plugin-manager.service';

/**
 * ChatGateway — Serveur WebSocket pour le chat mondial ("La Taverne") et la présence.
 */
@WebSocketGateway({
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true,
    },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);

    // Suivi des joueurs en ligne
    // Map de socketId -> userId 
    private connectedClients: Map<string, string> = new Map();

    constructor(
        private readonly chatService: ChatService,
        private readonly pluginManager: PluginManager,
    ) {
        // Optionnel : Écouter des événements système pour les rediffuser dans le chat !
        this.pluginManager.on('loot:drop', (event: any) => {
            // Uniquement pour les items RARE, EPIC, LEGENDARY pour éviter le spam
            if (event.drops && Array.isArray(event.drops)) {
                event.drops.forEach((drop: any) => {
                    if (['RARE', 'EPIC', 'LEGENDARY'].includes(drop.rarity)) {
                        this.broadcastSystemMessage(`🌟 **[INFO]** Un joueur chanceux vient de trouver **${drop.name}** !`);
                    }
                });
            }
        });

        this.pluginManager.on('shop:item_approved', (event: any) => {
            if (event.item && event.item.name) {
                this.broadcastSystemMessage(`🔨 **[WORKSHOP]** L'artisanat **${event.item.name}** a été validé ! Disponible en boutique.`);
            }
        });
    }

    async handleConnection(client: Socket) {
        this.logger.log(`📱 Client connecté à la Taverne: ${client.id}`);
        // Not yet identified by userId, wait for identity ping
    }

    async handleDisconnect(client: Socket) {
        const userId = this.connectedClients.get(client.id);
        if (userId) {
            this.logger.log(`👋 Joueur déconnecté: ${userId}`);
            this.connectedClients.delete(client.id);
            this.broadcastPresence();
        }
    }

    /**
     * Identification du client 
     */
    @SubscribeMessage('chat:join')
    async handleJoin(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string },
    ) {
        this.connectedClients.set(client.id, data.userId);
        this.broadcastPresence();

        // Envoyer l'historique récent au nouveau venu
        try {
            const history = await this.chatService.getRecentMessages('global', 50);
            client.emit('chat:history', { messages: history });
        } catch (e) {
            this.logger.error("Erreur historique chat", e);
        }
    }

    /**
     * Envoi d'un message public
     */
    @SubscribeMessage('chat:send')
    async handleIncomingMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string; content: string },
    ) {
        if (!data.content || data.content.trim() === '') return;

        try {
            // Sauvegarde DB
            const savedMsg = await this.chatService.saveMessage(data.userId, data.content.trim(), 'global');

            // Broadcast mondial
            this.server.emit('chat:receive', savedMsg);

        } catch (e) {
            this.logger.error(`Erreur envoi message : ${e}`);
        }
    }

    /**
     * Difuse le nombre de joueurs en ligne à tout le monde
     */
    private broadcastPresence() {
        // Map => Set pour avoir le nombre d'utilisateurs uniques, car un user peut avoir plusieurs sockets ouvertes
        const uniqueUsers = new Set(this.connectedClients.values());
        this.server.emit('chat:presence', { onlineCount: uniqueUsers.size });
    }

    /**
     * Diffuse un message "Système"
     */
    public broadcastSystemMessage(content: string) {
        // Construit un objet qui mime le format ChatMessage de Prisma
        const sysMsg = {
            id: `sys-${Date.now()}`,
            content: content,
            channel: 'global',
            createdAt: new Date(),
            senderId: 'SYSTEM',
            sender: {
                id: 'SYSTEM',
                username: 'Tavernier',
                role: 'ADMIN' as any
            }
        };
        this.server.emit('chat:receive', sysMsg);
    }
}
