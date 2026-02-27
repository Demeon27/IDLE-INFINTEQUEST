import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../store/useGameStore';

const WS_URL = 'http://localhost:3000';

/**
 * useSocket — Hook de connexion WebSocket au serveur.
 *
 * Se connecte au serveur, écoute tous les événements de jeu,
 * et met à jour le store Zustand en conséquence.
 * Le client ne fait QU'AFFICHER — le serveur dicte la loi.
 */
export function useSocket() {
    const socketRef = useRef<Socket | null>(null);
    const store = useGameStore;
    const token = useGameStore(s => s.token);

    useEffect(() => {
        // Connexion au serveur
        const socket = io(WS_URL, {
            transports: ['websocket'],
            autoConnect: true,
            auth: {
                token: token
            }
        });

        socketRef.current = socket;

        // --- Événements de connexion ---
        socket.on('connect', () => {
            console.log('🟢 Connected to server:', socket.id);
            store.getState().setConnected(true);
            // Démarrer le jeu automatiquement
            socket.emit('game:start');
        });

        socket.on('disconnect', () => {
            console.log('🔴 Disconnected from server');
            store.getState().setConnected(false);
        });

        // --- Événements de jeu ---

        socket.on('game:state', (state) => {
            if (state.player) {
                store.getState().updateGameState(state);
            }
        });

        socket.on('combat:tick', (tick) => {
            store.getState().handleCombatTick(tick);
        });

        socket.on('combat:click_result', (result) => {
            store.getState().handleClickResult(result);
        });

        socket.on('monster:death', (data) => {
            store.getState().handleMonsterDeath(data);
        });

        socket.on('player:levelup', (data) => {
            store.getState().handleLevelUp(data);
        });

        socket.on('loot:drop', (data) => {
            store.getState().handleLootDrop(data);
        });

        socket.on('player:death', (data) => {
            store.getState().handlePlayerDeath(data);
        });

        socket.on('ui:notification', (data) => {
            store.getState().addToast(data.type || 'info', data.message);
        });

        // Cleanup
        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [token]);

    /**
     * Envoie un clic d'attaque au serveur.
     */
    const sendClick = useCallback(() => {
        socketRef.current?.emit('combat:click');
    }, []);

    /**
     * Demande le GameState actuel.
     */
    const requestState = useCallback(() => {
        socketRef.current?.emit('game:state:request');
    }, []);

    return { sendClick, requestState, socket: socketRef };
}
