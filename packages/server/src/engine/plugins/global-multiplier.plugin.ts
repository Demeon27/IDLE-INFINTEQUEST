import { IGamePlugin, PluginManager, XpGainEvent, LootDropEvent } from '../plugin-manager.service';
import { AdminService } from '../../admin/admin.service';

/**
 * GlobalMultiplierPlugin — Applique les coefficients de SystemConfig.
 * 
 * Ce plugin remplace le DoubleXP statique par une lecture dynamique
 * du cache de l'AdminService (XP_MULTIPLIER et DROP_RATE_MODIFIER).
 */
export class GlobalMultiplierPlugin implements IGamePlugin {
    name = 'GlobalMultiplier';
    description = '🌍 Applique les multiplicateurs de XP et de Loot définis par l\'Administration.';
    version = '1.0.0';

    constructor(private readonly adminService: AdminService) { }

    onEnable(manager: PluginManager): void {
        // 1. Hook XP
        manager.on('xp:gain', (event: XpGainEvent) => {
            const mult = this.adminService.getNumberConfig('XP_MULTIPLIER', 1.0);
            event.multiplier *= mult;
        });

        // 2. Hook Loot / Gold (TODO: Ajouter un hook gold:gain ou modifier loot:drop)
        manager.on('gold:gain', (event: any) => {
            const mult = this.adminService.getNumberConfig('DROP_RATE_MODIFIER', 1.0);
            event.amount = Math.round(event.amount * mult);
        });
    }

    onDisable(manager: PluginManager): void {
        // Comme manager.on n'est pas facilement détachable ici sans stocker les fonctions, 
        // et que ce plugin est permanent, on laisse tel quel ou on implémente une logique de nettoyage.
        // Pour IDLE V2, les multiplicateurs globaux sont structurels.
    }
}
