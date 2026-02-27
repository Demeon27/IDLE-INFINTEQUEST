import { IGamePlugin, PluginManager, XpGainEvent } from '../plugin-manager.service';

/**
 * DoubleXPPlugin — Plugin de démonstration.
 *
 * Quand activé, double tout le gain d'XP de tous les joueurs.
 * Peut être activé/désactivé en temps réel par un Admin
 * sans redémarrer le serveur.
 *
 * Ceci démontre le mécanisme fondamental du PluginManager :
 * un module externe qui s'abonne aux hooks sans modifier
 * le code du moteur.
 */
export class DoubleXPPlugin implements IGamePlugin {
    name = 'DoubleXP';
    description = '🎉 Double XP Event — Tous les gains d\'XP sont doublés !';
    version = '1.0.0';

    private handler: ((event: XpGainEvent) => void) | null = null;

    onEnable(manager: PluginManager): void {
        // S'abonner au hook xp:gain pour modifier le multiplicateur
        this.handler = (event: XpGainEvent) => {
            event.multiplier *= 2.0; // Double le multiplicateur existant
        };

        manager.on('xp:gain', this.handler);
    }

    onDisable(manager: PluginManager): void {
        if (this.handler) {
            manager.off('xp:gain', this.handler);
            this.handler = null;
        }
    }
}
