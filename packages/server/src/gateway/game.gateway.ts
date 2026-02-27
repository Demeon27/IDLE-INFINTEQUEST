import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

/**
 * GameGateway — Point d'entrée WebSocket pour toute la communication en temps réel.
 *
 * Le serveur dicte la loi. Le client ne fait qu'émettre des intentions d'action,
 * le serveur valide et renvoie le GameState mis à jour.
 *
 * En Phase 2, le EngineModule branchera la Game Loop ici.
 */
@WebSocketGateway({
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true,
    },
    namespace: '/',
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(GameGateway.name);
    private connectedPlayers = new Map<string, { socketId: string; username: string }>();

    /**
     * Un joueur se connecte
     */
    handleConnection(client: Socket) {
        this.logger.log(`🟢 Client connected: ${client.id}`);

        // Envoyer un état initial de bienvenue
        client.emit('game:state', {
            connected: true,
            serverTime: new Date().toISOString(),
            ccu: this.connectedPlayers.size + 1,
            message: 'Bienvenue à la Taverne, voyageur !',
        });
    }

    /**
     * Un joueur se déconnecte
     */
    handleDisconnect(client: Socket) {
        this.connectedPlayers.delete(client.id);
        this.logger.log(`🔴 Client disconnected: ${client.id} (CCU: ${this.connectedPlayers.size})`);
    }

    /**
     * Ping/Pong de test — vérifie que la connexion est vivante
     */
    @SubscribeMessage('ping')
    handlePing(@ConnectedSocket() client: Socket) {
        return {
            event: 'pong',
            data: {
                timestamp: Date.now(),
                ccu: this.connectedPlayers.size,
            },
        };
    }

    /**
     * Le client s'identifie après connexion (avec son JWT)
     * En Phase 2 : le JWT sera validé et la Game Loop démarrée
     */
    @SubscribeMessage('auth:identify')
    handleIdentify(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { token: string; username: string },
    ) {
        // TODO Phase 2 : Valider le JWT et charger le GameState du joueur
        this.connectedPlayers.set(client.id, {
            socketId: client.id,
            username: data.username || 'Anonymous',
        });

        this.logger.log(`⚔️ Player identified: ${data.username} (CCU: ${this.connectedPlayers.size})`);

        client.emit('game:state', {
            authenticated: true,
            username: data.username,
            message: `Bienvenue, ${data.username} ! Votre aventure commence...`,
        });
    }

    /**
     * Retourne le nombre de joueurs connectés
     */
    getCCU(): number {
        return this.connectedPlayers.size;
    }
}
