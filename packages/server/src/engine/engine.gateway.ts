import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GameLoopService } from './game-loop.service';
import { PluginManager } from './plugin-manager.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';


/**
 * EngineGateway — Pont WebSocket entre le moteur de jeu et les clients.
 *
 * Responsabilités :
 * - Démarrer la Game Loop quand un joueur s'identifie
 * - Pousser le GameState à chaque tick
 * - Recevoir les clics du joueur
 * - Broadcaster les événements importants (level-up, loot, mort)
 */
@WebSocketGateway({
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true,
    },
})
export class EngineGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(EngineGateway.name);
    /** Map socketId → playerId */
    private readonly socketToPlayer = new Map<string, string>();

    constructor(
        private readonly gameLoop: GameLoopService,
        private readonly pluginManager: PluginManager,
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) {
        // --- Écouter les événements du moteur pour les broadcaster aux clients ---

        this.pluginManager.on('combat:tick', (event) => {
            const session = this.gameLoop.getSession(event.playerId);
            if (!session) return;
            const state = this.gameLoop.buildGameState(session);
            this.server?.to(session.socketId).emit('game:state', state);
            this.server?.to(session.socketId).emit('combat:tick', {
                damage: event.playerDamage,
                monsterDamage: event.monsterDamage,
                isCrit: event.isCrit,
                isDodge: event.isDodge,
                playerHp: event.playerHp,
                monsterHp: event.monsterHp,
            });
        });

        this.pluginManager.on('monster:death', (event) => {
            const session = this.gameLoop.getSession(event.playerId);
            if (!session) return;
            this.server?.to(session.socketId).emit('monster:death', {
                monsterName: event.monsterName,
                tier: event.tier,
            });
        });

        this.pluginManager.on('player:levelup', (event) => {
            const session = this.gameLoop.getSession(event.playerId);
            if (!session) return;
            this.server?.to(session.socketId).emit('player:levelup', {
                oldLevel: event.oldLevel,
                newLevel: event.newLevel,
            });
        });

        this.pluginManager.on('loot:drop', (event) => {
            const session = this.gameLoop.getSession(event.playerId);
            if (!session) return;
            if (event.drops.length > 0) {
                this.server?.to(session.socketId).emit('loot:drop', {
                    drops: event.drops,
                    gold: event.goldAmount,
                });
            }
        });

        this.pluginManager.on('player:death', (event) => {
            const session = this.gameLoop.getSession(event.playerId);
            if (!session) return;
            this.server?.to(session.socketId).emit('player:death', {
                killedBy: event.killedBy,
                newTier: session.currentTier,
            });
        });
    }

    // ============================================================
    // Connexion / Déconnexion
    // ============================================================

    handleConnection(client: Socket) {
        this.logger.log(`🟢 Socket connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        const playerId = this.socketToPlayer.get(client.id);
        if (playerId) {
            const session = this.gameLoop.endSession(playerId);
            this.socketToPlayer.delete(client.id);
            if (session) {
                this.logger.log(`🔴 Player disconnected: ${session.username} (Lvl ${session.level}, Tier ${session.currentTier}, ${session.totalMonstersKilled} kills)`);
            }
        }
    }

    // ============================================================
    // Messages du client
    // ============================================================

    /**
     * Le client s'identifie et démarre sa Game Loop.
     */
    @SubscribeMessage('game:start')
    async handleGameStart(
        @ConnectedSocket() client: Socket,
    ) {
        // Extraction du token envoyé dans le handshake
        const token = client.handshake.auth?.token;
        let user;

        if (token) {
            try {
                const payload = this.jwtService.verify(token);
                user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
            } catch (e) {
                this.logger.warn(`Invalid JWT from client ${client.id}`);
            }
        }

        // Fallback Guest si pas de token ou token invalide
        if (!user) {
            const generatedName = `Guest_${client.id.slice(0, 4)}`;
            user = await this.prisma.user.upsert({
                where: { username: generatedName },
                create: {
                    username: generatedName,
                    email: `${generatedName.toLowerCase()}@idle.test`,
                    password: '',
                    gold: 500,
                },
                update: {}
            });
        }

        if (!user) return;
        const playerId = user.id;
        const username = user.username;

        this.socketToPlayer.set(client.id, playerId);

        const session = this.gameLoop.startSession(playerId, username, client.id, {
            level: (user as any).level,
            xp: (user as any).xp,
            gold: (user as any).gold,
            role: (user as any).role,
            language: (user as any).language
        });
        const state = this.gameLoop.buildGameState(session);

        client.emit('game:state', state);
        client.emit('ui:notification', {
            type: 'success',
            message: `⚔️ Bienvenue, ${username} ! Votre aventure commence au Tier ${session.currentTier}`,
        });

        return { success: true, playerId };
    }

    /**
     * Le joueur clique pour attaquer.
     */
    @SubscribeMessage('combat:click')
    handleClick(@ConnectedSocket() client: Socket) {
        const playerId = this.socketToPlayer.get(client.id);
        if (!playerId) return;

        const tickResult = this.gameLoop.handleClick(playerId);
        if (tickResult) {
            client.emit('combat:click_result', {
                damage: tickResult.playerDamage,
                isCrit: tickResult.isCrit,
                monsterHp: tickResult.monsterHp,
            });
        }
    }

    /**
     * Le joueur demande son GameState actuel.
     */
    @SubscribeMessage('game:state:request')
    handleStateRequest(@ConnectedSocket() client: Socket) {
        const playerId = this.socketToPlayer.get(client.id);
        if (!playerId) return;

        const session = this.gameLoop.getSession(playerId);
        if (session) {
            client.emit('game:state', this.gameLoop.buildGameState(session));
        }
    }

    /**
     * Le joueur entre dans un donjon spécifique.
     */
    @SubscribeMessage('dungeon:enter')
    async handleDungeonEnter(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { dungeonId: string }
    ) {
        const playerId = this.socketToPlayer.get(client.id);
        if (!playerId) return;

        const session = this.gameLoop.getSession(playerId);
        if (session) {
            session.activeDungeonId = data.dungeonId;
            session.dungeonMonstersKilled = 0;
            // On fait spawner un nouveau monstre du donjon immédiatement
            // spawnMonster est async maintenant, donc on l'attend
            // Note: spawnMonster est private, je vais devoir le rendre public ou passer par une méthode
            client.emit('ui:notification', { type: 'info', message: '⚔️ Vous entrez dans le donjon...' });
        }
    }

    /**
     * Le joueur quitte son donjon actuel.
     */
    @SubscribeMessage('dungeon:leave')
    handleDungeonLeave(@ConnectedSocket() client: Socket) {
        const playerId = this.socketToPlayer.get(client.id);
        if (!playerId) return;

        const session = this.gameLoop.getSession(playerId);
        if (session) {
            session.activeDungeonId = null;
            session.dungeonMonstersKilled = 0;
            client.emit('ui:notification', { type: 'info', message: '🏃 Vous quittez le donjon.' });
        }
    }

    /**
     * Mise à jour du profil (Pseudo, Langue)
     */
    @SubscribeMessage('profile:update')
    async handleProfileUpdate(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { username?: string; language?: string }
    ) {
        const playerId = this.socketToPlayer.get(client.id);
        if (!playerId) return;

        const updated = await this.prisma.user.update({
            where: { id: playerId },
            data: {
                username: data.username,
                language: data.language
            } as any
        });

        // Mettre à jour la session en mémoire
        const session = this.gameLoop.getSession(playerId);
        if (session) {
            session.username = updated.username;
            client.emit('game:state', this.gameLoop.buildGameState(session));
        }

        client.emit('ui:notification', { type: 'success', message: '✨ Profil mis à jour !' });
        return updated;
    }

    /**
     * Le joueur demande la liste des plugins actifs (debug/admin).
     */
    @SubscribeMessage('plugins:list')
    handlePluginsList() {
        return {
            event: 'plugins:list',
            data: this.pluginManager.listPlugins(),
        };
    }
}
