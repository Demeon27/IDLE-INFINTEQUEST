import './styles/index.css';
import './styles/combat.css';
import './styles/inventory.css';
import { useSocket } from './hooks/useSocket';
import { useGameStore } from './store/useGameStore';
import { CombatScene } from './components/CombatScene';
import { InventoryView, ShopView, useInventorySocket } from './components/InventoryShop';
import { WorkshopView } from './components/WorkshopView';
import { AuctionView } from './components/AuctionView';
import { TavernView } from './components/TavernView';
import { AdminPanel } from './components/AdminPanel';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { GuildView } from './components/social/GuildView';
import { ForumView } from './components/social/ForumView';
import { DungeonView } from './components/DungeonView';
import { HeroCard } from './components/HeroCard';
import { LevelUpOverlay } from './components/LevelUpOverlay';
import { AuthView } from './components/AuthView';
import { ProfileView } from './components/ProfileView';
import { useTranslation } from 'react-i18next';

/**
 * App — Point d'entrée de IDLE Infinite Quest V2.
 *
 * Structure : Sidebar + Header + Content (CombatScene)
 * Le WebSocket se connecte automatiquement au serveur.
 */
function App() {
  const { t } = useTranslation();
  const { sendClick, socket } = useSocket();
  (window as any).gameSocket = socket;
  const invSocket = useInventorySocket(socket);
  const connected = useGameStore(s => s.connected);
  const player = useGameStore(s => s.player);
  const combat = useGameStore(s => s.combat);
  const stats = useGameStore(s => s.stats);
  const toasts = useGameStore(s => s.toasts);
  const activeView = useGameStore(s => s.activeView);
  const setActiveView = useGameStore(s => s.setActiveView);
  const isAuthenticated = useGameStore(s => s.isAuthenticated);
  const logout = useGameStore(s => s.logout);

  const navItems = [
    { id: 'combat', icon: '⚔️', label: t('nav.combat') },
    { id: 'hero', icon: '👤', label: t('nav.hero') },
    { id: 'inventory', icon: '🎒', label: t('nav.inventory') },
    { id: 'shop', icon: '🏪', label: t('nav.shop') },
    { id: 'auction', icon: '🏛️', label: t('nav.auction') },
    { id: 'workshop', icon: '🔨', label: t('nav.workshop') },
    { id: 'guild', icon: '🏰', label: t('nav.guild') },
    { id: 'tavern', icon: '🍺', label: t('nav.tavern') },
    { id: 'dungeon', icon: '🗝️', label: t('nav.dungeon') },
    { id: 'leaderboard', icon: '🏆', label: t('nav.leaderboard') },
    { id: 'profile', icon: '⚙️', label: t('common.settings') },
  ];

  // Seul l'ADMIN voit l'onglet administration
  if (player?.role === 'ADMIN') {
    navItems.push({ id: 'admin', icon: '👑', label: t('nav.admin') });
  }

  if (!isAuthenticated || activeView === 'auth') {
    return <AuthView />;
  }

  return (
    <div className="app-layout">
      {/* ========== SIDEBAR ========== */}
      <aside className="sidebar">
        <div className="sidebar__logo">
          <h1>⚔️ IDLE<br />INFINITE<br />QUEST</h1>
        </div>
        <nav className="sidebar__nav">
          {navItems.map(item => (
            <a
              key={item.id}
              id={`nav-${item.id}`}
              className={`sidebar__link ${activeView === item.id ? 'sidebar__link--active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              <span className="sidebar__link-icon">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar__footer">
          <LanguageSwitcher />
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              background: 'var(--bg-medium)', border: `2px solid ${connected ? 'var(--emerald)' : 'var(--fire)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
            }}>🧙</div>
            <div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                {player?.username || t('header.connecting')}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                {player ? t('sidebar.level', { level: player.level }) : connected ? t('sidebar.connected') : `⏳ ${t('sidebar.disconnected')}`}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="btn btn--sm btn--ghost"
            style={{ width: '100%', marginTop: 'var(--space-md)', fontSize: '0.7rem', opacity: 0.6 }}
          >
            🚪 Quitter la Taverne
          </button>
        </div>
      </aside>

      {/* ========== HEADER ========== */}
      <header className="header">
        <div className="header__stats">
          {player && (
            <>
              <div className="header__stat">
                <span className="header__stat-icon">❤️</span>
                <div>
                  <div className="header__stat-value">
                    {player.hp.toLocaleString()} / {player.maxHp.toLocaleString()}
                  </div>
                  <div className="header__stat-label">{t('header.hp')}</div>
                </div>
              </div>
              <div className="header__stat">
                <span className="header__stat-icon">⭐</span>
                <div>
                  <div className="header__stat-value">{t('header.lvl', { level: player.level })}</div>
                  <div className="header__stat-label">
                    {player.xp.toLocaleString()} / {player.xpToNext.toLocaleString()} XP
                  </div>
                </div>
              </div>
              <div className="header__stat">
                <span className="header__stat-icon">💰</span>
                <div>
                  <div className="header__stat-value" style={{ color: 'var(--gold)' }}>
                    {player.gold.toLocaleString()}
                  </div>
                  <div className="header__stat-label">{t('header.gold')}</div>
                </div>
              </div>
              <div className="header__stat">
                <span className="header__stat-icon">⚔️</span>
                <div>
                  <div className="header__stat-value">{t('header.tier', { tier: combat.currentTier })}</div>
                  <div className="header__stat-label">{t('header.kills', { count: stats.totalMonstersKilled })}</div>
                </div>
              </div>
            </>
          )}
          {!player && (
            <div className="header__stat">
              <span style={{ color: connected ? 'var(--emerald)' : 'var(--fire)' }}>
                {connected ? t('header.connected') : t('header.disconnected')}
              </span>
            </div>
          )}
        </div>
        <div className="header__actions">
          <div style={{
            width: 8, height: 8, borderRadius: 'var(--radius-full)',
            background: connected ? 'var(--emerald)' : 'var(--fire)',
            boxShadow: connected ? '0 0 6px var(--emerald)' : '0 0 6px var(--fire)',
          }} />
        </div>
      </header>

      {/* ========== CONTENT ========== */}
      <main className="content">
        {activeView === 'combat' && (
          <CombatScene
            onAttack={sendClick}
            equippedItems={invSocket.inventory.filter(i => i.isEquipped)}
          />
        )}
        {activeView === 'inventory' && (
          <InventoryView
            inventory={invSocket.inventory}
            equipmentBonus={invSocket.equipmentBonus}
            onEquip={invSocket.equipItem}
            onUnequip={invSocket.unequipItem}
            onSell={invSocket.sellItem}
            onRefresh={invSocket.requestInventory}
          />
        )}
        {activeView === 'shop' && player && (
          <ShopView
            items={invSocket.shopItems}
            playerGold={player.gold}
            onBuy={invSocket.buyItem}
            onRefresh={() => invSocket.requestCatalog(combat.currentTier)}
          />
        )}
        {activeView === 'workshop' && player && (
          <WorkshopView />
        )}
        {activeView === 'auction' && player && (
          <AuctionView
            inventory={invSocket.inventory}
            socket={socket}
          />
        )}
        {activeView === 'tavern' && player && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 'var(--space-md)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-md)', padding: '0 var(--space-md)' }}>
              <button className="btn btn--sm btn--gold" onClick={() => setActiveView('tavern')}>💬 {t('tavern.title')}</button>
              <button className="btn btn--sm btn--ghost" onClick={() => setActiveView('forum')}>🍺 {t('social.forumTitle')}</button>
            </div>
            <TavernView socket={socket} />
          </div>
        )}
        {activeView === 'forum' && player && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 'var(--space-md)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-md)', padding: '0 var(--space-md)' }}>
              <button className="btn btn--sm btn--ghost" onClick={() => setActiveView('tavern')}>💬 {t('tavern.title')}</button>
              <button className="btn btn--sm btn--gold" onClick={() => setActiveView('forum')}>🍺 {t('social.forumTitle')}</button>
            </div>
            <ForumView />
          </div>
        )}
        {activeView === 'guild' && player && (
          <GuildView />
        )}
        {activeView === 'hero' && player && (
          <HeroCard />
        )}
        {activeView === 'dungeon' && player && (
          <DungeonView />
        )}
        {activeView === 'admin' && player?.role === 'ADMIN' && (
          <AdminPanel />
        )}
        {activeView === 'profile' && player && (
          <ProfileView socket={socket} />
        )}
        {!['combat', 'hero', 'inventory', 'shop', 'workshop', 'auction', 'tavern', 'forum', 'guild', 'dungeon', 'admin', 'profile'].includes(activeView) && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 'var(--space-lg)' }}>
            <span style={{ fontSize: 48 }}>🚧</span>
            <h2 className="text-pixel" style={{ fontSize: 'var(--text-sm)', color: 'var(--gold)' }}>
              {t('common.comingSoon')}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              {t('common.sectionComingSoon')}
            </p>
            <button className="btn btn--gold" onClick={() => setActiveView('combat')}>
              {t('common.backToCombat')}
            </button>
          </div>
        )}
      </main>

      <LevelUpOverlay />

      {/* ========== TOASTS ========== */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast--${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
