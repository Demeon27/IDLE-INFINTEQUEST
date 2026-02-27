import { IGamePlugin, PluginManager, MonsterDeathEvent, GoldGainEvent } from '../plugin-manager.service';

/**
 * CombatLogPlugin — Journalise les événements de combat dans la console.
 *
 * Utile pour le développement et le debugging.
 * Peut être activé en dev, désactivé en prod.
 */
export class CombatLogPlugin implements IGamePlugin {
    name = 'CombatLog';
    description = '📜 Journal de combat — Affiche les événements dans la console serveur';
    version = '1.0.0';

    private handlers: Array<{ event: string; handler: (...args: unknown[]) => void }> = [];

    onEnable(manager: PluginManager): void {
        const deathHandler = (event: MonsterDeathEvent) => {
            console.log(`[CombatLog] ☠️ ${event.monsterName} (T${event.tier}) killed! DMG: ${event.damageDealt}`);
        };

        const goldHandler = (event: GoldGainEvent) => {
            console.log(`[CombatLog] 💰 ${event.playerId} gained ${event.amount} gold from ${event.source}`);
        };

        manager.on('monster:death', deathHandler);
        manager.on('gold:gain', goldHandler);

        this.handlers = [
            { event: 'monster:death', handler: deathHandler as (...args: unknown[]) => void },
            { event: 'gold:gain', handler: goldHandler as (...args: unknown[]) => void },
        ];
    }

    onDisable(manager: PluginManager): void {
        for (const { event, handler } of this.handlers) {
            manager.off(event as 'monster:death', handler as never);
        }
        this.handlers = [];
    }
}
