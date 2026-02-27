# IDLE Infinite Quest V2 — Blueprint d'Architecture & Plan de Refonte

Face à la complexité grandissante et à l'accumulation de dette technique due aux nombreuses itérations, ce document pose les bases du redémarrage (Reboot) du projet "IDLE Infinite Quest". L'objectif est d'abandonner les reliquats du passé et de concevoir un moteur robuste, modulaire, et **Server-Authoritative** (le serveur dicte la loi, le client ne fait qu'afficher et demander).

---

## 1. Philosophie Architecturale

### 1.1 Le Paradigme "Server-Authoritative"
- **Le Serveur (Backend) est la vérité absolue.** Il gère les calculs de combat, la progression hors-ligne, la validation des achats, l'inventaire, et les jets de dés (RNG).
- **Le Client (Frontend) est un simple afficheur.** Il se contente de réagir aux événements envoyés par le serveur via WebSockets. Il n'a aucune autorité sur les stats, le loot, ou le temps de recharge.
- **Zéro conflits HTTP / WebSocket.** Toutes les actions en jeu (combat, déplacement, achat, équipement) se font via WebSocket pour une synchro parfaite. Seules les actions "hors boucle de jeu" (Login, upload d'images lourdes, admin) utilisent des requêtes HTTP REST.

### 1.2 Modularité Extrême et "Open Source Ready" (Façon WordPress)
Le code n'est plus groupé par type de fichier (controllers/services), mais par **Domaine**. Si on casse le Domaine "Boutique", le Domaine "Combat" continue de fonctionner.
- **Architecture de Plugins (dès le Jour 1) :** Le système sera pensé dès le départ avec un `PluginManager` (EventEmitter central). Un développeur externe pourra créer un module (ex: `GachaModule` ou `PetModule`) qui s'abonne aux événements centraux (ex: `onPlayerKillMonster`) sans jamais avoir à modifier le code du `EngineModule` central. C'est idéal pour un projet communautaire Open Source.
- **Ne jamais hardcoder la logique métier.** Le combat, les drops, et la mort des monstres déclenchent des "Hooks" auxquels n'importe quel module peut se brancher.

### 1.3 Panneau d'Administration et Hiérarchie des Rôles
Puisque le jeu accepte du contenu utilisateur (UGC), **le contrôle doit être absolu**. Trois niveaux d'accès stricts :
- **`USER` (Voyageur) :** Le joueur standard. Il joue, crée dans le Workshop et poste sur le Forum.
- **`MODERATOR` (Game Master / Garde de la Taverne) :** Promu par un Admin. Badge distinctif sur le Forum. Peut valider/rejeter les créations du Workshop (droits d'auteur) et réduire au silence (Mute) les joueurs imprudents. **Aucun pouvoir financier ou technique** sur la base de données.
- **`ADMIN` (Le Roi des Dieux) :** Contrôle total. Paramétrage du serveur en direct : Modifier le taux d'XP, les probabilités de drop (Drop Rates). Promouvoir/destituer des Modérateurs.

### 1.4 Sécurité Anti-Abus
- **Rate-Limiting côté serveur :** Un joueur ne peut émettre un maximum de **10 actions WebSocket par seconde** (anti-autoclicker). Au-delà, le serveur ignore silencieusement les requêtes excédentaires.
- **Validation de toutes les entrées :** Chaque `socket.emit()` du client est traité comme potentiellement malveillant. Le serveur vérifie systématiquement que le joueur a le droit d'effectuer l'action.

---

## 2. Choix Technologiques (La Stack V2)

### 2.1 Monorepo (Turborepo ou Nx)
Séparation nette : `@idle/client`, `@idle/server`, et très important : `@idle/shared`.
- **`@idle/shared`** : Contient tous les types TypeScript, toutes les constantes (XP requise, LayeredSprite params), et les formules mathématiques pures. Si une stat change, elle change pour le front et le back instantanément.

### 2.2 Backend (Node.js)
- **Framework** : NestJS. Pourquoi ? Pour son injection de dépendance native. Cela force une architecture propre et évite les singletons spaghettis.
- **Base de données** : PostgreSQL avec **Prisma** (gardé, car excellent).
- **Real-Time** : Socket.IO (intégré proprement dans les "Gateways" de NestJS).
- **Cache & File d'attente** : Redis. Indispensable dès le départ pour partager l'état entre les instances Node.js, gérer les sessions WebSocket et les files d'attente de Raids.
- **Stockage des Sprites (UGC)** : **MinIO** (clone S3 auto-hébergé dans Docker). Les sprites ne sont **jamais** stockés en base64 dans PostgreSQL. Seule l'URL du fichier est enregistrée en BDD. Cela évite de faire exploser la taille de la base de données et permet de servir les images via un CDN (Cloudflare) gratuitement.

### 2.3 Frontend (React & CSS Moderne)
- **Framework** : Vite + React + TypeScript.
- **State Management** : Zustand (léger, réactif). L'état global est l'exact reflet du payload WebSocket.
- **Moteur de Rendu (Sans Phaser)** : Le jeu abandonne Phaser au profit d'une interface 100% DOM (HTML/CSS pur). Les avatars utilisent un système d'empilement complexe (calques d'images) superposé via CSS (Z-index, position absolue).
- **VFX & "Juice" (Effets Visuels)** : Des particules CSS ultra-légères (Floating Damage Numbers, Screen Shake, Lueurs de rareté). Le clic spam génère des feedback visuels instantanés (étincelles, recul du monstre) côté client, sans attendre la réponse du serveur, pour un "feeling" ultra-réactif. Le serveur confirme ensuite le calcul réel.

### 2.4 Direction Artistique : "La Taverne Pixel Art"
L'interface ne doit pas ressembler à une application mobile pleine page ni à un site "néon tech". C'est un **Site Web Premium** structuré avec une ambiance RPG médiéval classique :
- **Structure Web :** Sidebar (Menu latéral avec icônes pixel art), Header global (richesses, HP, notifications), et contenu central (la zone de jeu).
- **Esthétique :** Inspirée de *Ragnarok Online* et de la Taverne du "Poney Fringant" (Tolkien). Textures de bois, pierre, parchemin. Couleurs terreuses et chaudes (brun, or terni, rouge sombre). Lueur de feu de cheminée.
- **Fenêtres modales :** Texturées et ornées (bordures en bois sculpté, en fer forgé). Les fenêtres peuvent être déplacées par le joueur sur son écran pour organiser son propre coin de jeu (très "MMO Old School").
- **Indicateurs de rareté :** Contour lumineux subtil autour des objets selon leur rareté (blanc > vert > bleu > violet > orange). C'est la seule "lueur" autorisée, et elle doit être sobre et pixel art.
- **Sound Design :** Bruits de parchemin à l'ouverture du forum, tintement de pièces à l'achat, bruissement d'armure au changement d'équipement. Sons 8-bit / chiptune cohérents avec le pixel art.

### 2.5 Personnalisation Visuelle Poussée (Le joueur doit en prendre plein la vue)
Le personnage du joueur est la vitrine de tout le jeu. Il ne doit **jamais** paraître générique :
- **Système de Calques Illimité :** Le `LayeredSprite` supporte un nombre arbitraire de couches (Base du corps, Cheveux, Casque, Armure torso, Jambières, Bottes, Cape, Arme Main Droite, Arme Main Gauche, Bouclier, Aura, Familier). Chaque couche est un fichier PNG transparent indépendant.
- **Recoloration Dynamique (Hue Shifting) :** Via des filtres CSS (`hue-rotate`, `brightness`, `saturate`), un joueur peut teinter une armure pour personnaliser sa couleur sans nécessiter une nouvelle texture. Un Pixel Artiste dessine une armure en niveaux de gris, et les joueurs choisissent leurs propres couleurs.
- **Effets de Rareté sur l'Avatar :** Un personnage portant un objet "Légendaire" aura un subtil halo pixel art ou des particules dorées flottantes autour de l'item en question (rendu CSS, `drop-shadow` animé).
- **Animations Contextuelles :** L'avatar n'est pas un bloc statique. Il a des animations Idle (respiration), Attack (coup d'épée), Hit (recul), et Death (chute). Toutes gérées par des classes CSS et des spritesheets standards.
- **La "Carte d'Identité du Héros" :** En cliquant sur un personnage sur le Forum ou dans la liste de Guilde, une fiche de personnage s'ouvre, affichant l'avatar animé en grand, ses stats, son stuff, le nom des créateurs UGC de chaque pièce d'équipement, et un bouton "J'admire ce look" (Like).

### 2.6 Infrastructure, Déploiement & Scalabilité
- **Environnement Docker** : Containerisation stricte sous **Docker** (Client, Serveur, Base de données, Redis, MinIO). Tout est géré via un `docker-compose.yml` robuste pour garantir que l'environnement de développement soit identique à la production.
- **Capacité de Départ (VPS 2 cœurs / 8 Go RAM)** : Estimation **réaliste** de **3 000 à 5 000 joueurs connectés simultanément (CCU)** en combat actif. Les joueurs en progression hors-ligne (tab fermé) ne consomment aucune ressource serveur (le calcul se fait au moment de la reconnexion). Un excellent point de départ pour un lancement.
- **Scalabilité Massive (Cible : 8 vCPU / 32 Go RAM / 400 Go NVMe)** : En utilisant PM2 en mode *Cluster*, les 8 cœurs du CPU tourneront en parallèle. Redis partage l'état entre les instances Node.js. Avec cette puissance : **10 000 à 50 000+ joueurs actifs**, supportant les mécaniques avancées (critique, hâte, esquive, raids multi-joueurs).

---

## 3. Plan d'Action & Prompts de Redémarrage (Les 13 Piliers)

Voici la feuille de route. Ces prompts doivent être soumis **l'un après l'autre** pour garantir une construction incrémentale propre.

### Phase 0 : Design System & UI Kit "Taverne"
**L'objectif :** Avant de coder la moindre feature, figer la charte graphique. Cela garantit que chaque composant construit ensuite sera visuellement cohérent dès le premier jour.

> **PROMPT 0 : Design System Pixel Art**
> "Crée le Design System du jeu. Définis un fichier CSS global avec : la palette de couleurs (tons terreux, bois, pierre, or, rouge sombre), les typographies (une police pixel art pour les titres, une police lisible pour le corps), les composants réutilisables de base (Bouton en bois texturé, Modale en pierre/parchemin, Input texturé, Barre de progression en métal, Tooltip en parchemin). Crée un `Storybook` léger ou une page `/design` qui affiche tous ces composants pour validation visuelle avant de construire les features."

### Phase 1A : Fondation du Monorepo & Docker
**L'objectif :** Créer la coquille vide et le squelette qui tourne dans Docker, sans aucune logique métier.

> **PROMPT 1A : Initialisation Monorepo & Docker**
> "Initialise un monorepo Turborepo avec trois packages : `@idle/client` (Vite + React + TypeScript), `@idle/server` (NestJS), et `@idle/shared` (types TypeScript purs). Configure un `docker-compose.yml` avec les services : client (Vite dev server), server (NestJS), postgres, redis, et minio (stockage S3 auto-hébergé pour les sprites UGC). L'ensemble doit compiler et démarrer avec un simple `docker compose up`. Aucune logique métier à ce stade."

### Phase 1B : Schéma de Base de Données & Authentification
**L'objectif :** Écrire le schéma Prisma parfait, débarrassé des champs inutiles, avec l'authentification JWT.

> **PROMPT 1B : Schéma Prisma & Auth JWT**
> "Écris un schéma Prisma strict pour un RPG Idle MMO. Les modèles doivent être : `User` (avec un champ Enum `role`: USER, MODERATOR, ADMIN), `ItemTemplate` (le blueprint d'un item, créé par le Workshop ou par le système), `InventoryInstance` (une instance unique d'un item possédé par un joueur, avec clé étrangère vers User et ItemTemplate), `Guild`, `DungeonTemplate`. L'inventaire ne doit plus être un champ JSON dans User mais une vraie table relationnelle. Implémente l'authentification JWT (register, login) avec hashage bcrypt."

### Phase 2 : Le Moteur de Jeu & Système de Plugins (Core Engine)
**L'objectif :** Créer la Game Loop côté serveur **avec le PluginManager intégré dès le premier jour**. C'est la fondation sur laquelle reposent toutes les phases suivantes.

> **PROMPT 2 : Engine Module, Game Loop & Plugin Manager**
> "Dans le backend NestJS, crée un `EngineModule`. Au cœur : un `PluginManager` basé sur un EventEmitter typé. La boucle de jeu (Game Loop) par joueur calcule les dégâts, les timers d'attaque, la mort, et l'attribution de l'XP en piochant les données d'un `MonsterRepository`. À chaque événement significatif, le moteur déclenche des Hooks typés (`onMonsterDeath`, `onPlayerLevelUp`, `onLootDrop`). Les modules futurs (Shop, Guild, Dungeon) s'abonneront à ces hooks sans modifier le moteur. Écris un exemple de plugin `DoubleXPPlugin` qui double l'XP quand il est activé, pour démontrer le mécanisme. Expose le `GameState` complet au client via un WebSocket Gateway."

### Phase 3 : Rendu Client & Composant LayeredSprite
**L'objectif :** Le client doit afficher les avatars multicouches animés, pilotés par les données du serveur.

> **PROMPT 3 : LayeredSprite, Zustand & WebSocket Client**
> "Dans le frontend React, configure l'écoute des événements WebSocket via Socket.IO et connecte-les à un hook Zustand `useGameState()`. Crée le composant `LayeredSprite` ultra-robuste : il accepte un tableau de couches (URLs de sprites PNG transparents), une animation active (Idle, Attack, Hit, Death), et la taille du spritesheet. Le rendu est 100% CSS (spritesheets animées via `background-position` et `@keyframes`). Ajoute les filtres CSS de recoloration dynamique (`hue-rotate`, `brightness`). L'avatar doit réagir visuellement aux événements serveur (fx: screen shake au hit, floating damage numbers)."

### Phase 4 : Inventaire & Boutique
**L'objectif :** Créer les modules d'inventaire et de commerce comme des modules isolés branchés sur les Hooks du moteur.

> **PROMPT 4 : Système d'Inventaire et Boutique Transactionnelle**
> "Dans le backend, crée un `InventoryModule` et un `ShopModule` dédiés. L'achat se fait via WebSocket. Utilise des Transactions Prisma atomiques pour éviter la copie d'objets ou les exploits sur la monnaie. Côté frontend, crée les menus (boutique, sac) avec l'esthétique du Design System 'Taverne'. Les menus envoient uniquement des intentions d'action (ex: `socket.emit('shop:buy', itemId)`), le serveur valide silencieusement. Le `ShopModule` s'abonne au Hook `onMonsterDeath` du PluginManager pour gérer les drops de loot."

### Phase 5 : Workshop & Pixel Studio (UGC)
**L'objectif :** Le système de création d'items visuels par les joueurs, entièrement découplé du moteur de combat.

> **PROMPT 5 : Module Workshop, Upload & Modération**
> "Crée le module Workshop. Le joueur dessine un sprite dans un 'Pixel Studio' intégré (canvas HTML5). Le sprite est uploadé via HTTP POST vers le backend, qui le stocke dans MinIO (S3). Le statut de l'item est `PENDING` (en attente de modération). Crée la vue 'Banc des Juges' pour les MODERATOR et ADMIN : liste des items en attente avec prévisualisation du sprite, boutons Approuver / Rejeter (avec motif). Quand un item est approuvé, le backend diffuse un événement `CatalogReloaded` via le PluginManager pour que le GameServer intègre les nouveaux objets sans redémarrer."

### Phase 6 : Fonctionnalités Communautaires & Rétention
**L'objectif :** Créer un sentiment d'appartenance et un écosystème joueurs/créateurs.

> **PROMPT 6 : Marché de Joueurs & Boutique du Créateur**
> "Ajoute les bases du système communautaire. 1. Un 'Hôtel de Vente' (Auction House) où les joueurs peuvent vendre leur loot contre de la monnaie in-game (taxe de 5% sur chaque transaction). 2. Un système de 'Boutique du Créateur' : quand un joueur équipe un item UGC, il peut voir le nom du créateur, liker (upvote) son travail, et visiter sa vitrine. Implémente le système de notification asynchrone pour qu'un créateur sache que son item a été acheté/équipé."

### Phase 7 : Administration & Game Masters
**L'objectif :** Le panel d'administration complet avec la hiérarchie de rôles.

> **PROMPT 7 : Dashboard Admin, Modération & Live Config**
> "Crée le panneau d'administration sécurisé côté React (accessible uniquement avec le rôle ADMIN). Il comprend : 1. La gestion des utilisateurs (promouvoir en MODERATOR, bannir). 2. La 'Live Config' : un formulaire qui envoie des modifications au serveur NestJS via HTTP sécurisé (multiplicateur d'XP, drop rate, activation d'un événement 'Double XP'). Le serveur applique ces changements en mémoire et les diffuse immédiatement à toutes les Game Loops actives sans redémarrage. 3. Un tableau de bord de monitoring (nombre de CCU, mémoire utilisée, erreurs récentes)."

### Phase 8 : L'Économie Éthique (Monétisation)
**L'objectif :** Financer les serveurs via une monétisation cosmétique/confort, sans P2W.

> **PROMPT 8 : Monnaie Premium & Transmogrification**
> "Implémente la monnaie Premium 'Cristaux'. Crée le système de 'Garde-Robe' (Transmogrification) : le joueur dépense des Cristaux pour extraire l'apparence (Skin) d'un item UGC et l'appliquer par-dessus les statistiques d'un item Meta. Ajoute un 'Creator Pass' (abonnement mensuel) qui offre aux artistes un canvas de création plus large (64x64 au lieu de 32x32), des calques animés, et une vitrine mise en avant dans la boutique. Prépare une intégration Stripe en mode test sur NestJS pour l'achat de Cristaux."

### Phase 9 : Donjons Communautaires (UGC Dungeons) & Progression Infinie
**L'objectif :** Permettre aux joueurs de créer des Donjons sans briser l'économie.

> **PROMPT 9 : Créateur de Donjons et Auto-Scaling Serveur**
> "Conçois le `DungeonModule`. Les joueurs uploadent des assets de monstres et de décors pour assembler des 'Cartes' (10 sbires + 1 boss). **Règle absolue d'équilibrage :** Le créateur ne choisit RIEN des statistiques. Il ne définit que l'esthétique et la composition. Le Core Engine NestJS impose un 'Auto-Scaling Infini' : la difficulté (HP, dégâts, loot) est calculée mathématiquement par une formule exponentielle basée sur le Tier du donjon (Tier 1 = 100 HP, Tier 1000 = 50 Milliards HP). La triche mathématique est impossible. Le jeu reste techniquement infini."

### Phase 10 : Systèmes Sociaux (Guildes, Forum & Amis)
**L'objectif :** Créer des liens forts entre les joueurs sans imposer un fardeau "Temps Réel" au serveur.

> **PROMPT 10 : Guildes, Forum de la Taverne & Fiches de Personnage**
> "Implémente le `SocialModule`. Crée un 'Forum de la Taverne' asynchrone (modèle classique : Catégories > Sujets > Réponses). La particularité : le profil de chaque joueur sur le forum affiche **son Avatar du jeu en temps réel** (composant `LayeredSprite`) avec tout son équipement UGC actuel. En cliquant dessus, on ouvre sa 'Carte d'Identité du Héros' (stats, build, Donjon le plus haut atteint, items créés). Implémente les Guildes avec 'Expéditions' (dons de loots collectifs → Buff global passif pour tous les membres)."

### Phase 11 : Gameplay Profond "MMO-IDLE" (Classes, Talents & Raids)
**L'objectif :** Reproduire la richesse d'un "World of Warcraft" adaptée à un jeu Idle.

> **PROMPT 11 : Classes, Arbres de Talents & Raids Asynchrones**
> "Refactorise le modèle de combat. Introduis trois archétypes de base (Guerrier, Mage, Voleur). Ajoute des statistiques complexes : Chance de Critique, Esquive, Hâte (vitesse d'attaque), Résistances Élémentaires. Crée le modèle `TalentTree` : le joueur dépense des points gagnés chaque niveau dans un arbre de compétences passives qui altèrent le comportement de sa Game Loop (ex: 'Cleave' = frappe 2 monstres, 'Vampirisme' = se soigne de 5% des dégâts). Implémente la 'Recherche de Groupe' asynchrone pour les Raids 5 joueurs : le serveur simule le combat de 5 instances contre un Mega-Boss et génère un récapitulatif ('Damage Meter')."

### Phase 12 : Tests & Stabilisation
**L'objectif :** Garantir que le système est fiable avant un lancement public.

> **PROMPT 12 : Tests Unitaires, E2E & Load Testing**
> "Écris des tests unitaires (Jest) pour les modules critiques : les formules de combat (dégâts, critique, esquive), les transactions d'achat (pas de duplication d'items), et le système de permissions (un MODERATOR ne peut pas accéder aux routes ADMIN). Écris des tests End-to-End (Supertest) pour les flux complets : inscription → login → combat → loot → achat. Ajoute un test de charge basique (Artillery ou k6) simulant 500 connexions WebSocket simultanées pour vérifier la stabilité."

---

## 4. Règles d'Or pour la V2

1. **Un Moteur = Une Responsabilité.** Le système de combat n'a pas à voir avec les prix de la boutique. Le Workshop est totalement découplé de la Game Loop.
2. **Types Partagés Absolus.** Fini les `any` ou les redéclarations. Les entités du jeu vivent toutes dans `@idle/shared`.
3. **Immutabilité Côté Client.** Le React Frontend affiche (et claque visuellement via CSS), le NestJS Backend décide.
4. **Dev = Prod.** Tout doit tourner, dès l'initialisation, dans des containers Docker orchestrés.
5. **Le Plugin d'abord.** Ne jamais hardcoder une feature. Toute logique métier passe par les Hooks du PluginManager.
6. **Sprites sur disque, jamais en BDD.** Les fichiers visuels sont stockés dans MinIO (S3), PostgreSQL ne contient que l'URL.

---

## 5. Pistes de Brainstorming Communautaire (Pour rendre les joueurs "accros")

Pour que l'aspect *User Generated Content* (UGC) explose vraiment, le jeu ne doit pas juste être un Idle de progression solitaire. Il faut un tissu social fort :

- **Le Mur des Légendes (Leaderboards dynamiques) :** Ne classe pas seulement les joueurs par DPS ou niveau, classe aussi les **Créateurs**. "Item le plus porté ce mois-ci", "Créateur le plus rentable", "Équipement le plus meurtrier".
- **Les Boss Communs (World Boss Asynchrones) :** Tous les samedis, un Raid Boss gigantesque a des milliards de points de vie. Tous les joueurs dans leur jeu respectif "Cliquent" sur le boss en même temps (les dégâts sont agrégés sur le serveur). Les meilleurs "tapeurs" gagnent un item exclusif.
- **Le Système de "Skin Transmog" :** Appliquer l'apparence d'une belle arme UGC sur l'arme aux meilleures statistiques. L'art des créateurs UGC ne devient jamais obsolète.
- **Feedback & "Pourboires" :** Quand tu portes l'arme d'un créateur, celle-ci gagne de "l'XP de Maîtrise". Le créateur gagne des points de gloire passivement pendant que tu l'utilises.
- **Le Forum de la Taverne (Fiches de Personnage Intégrées) :** Image de profil = Avatar du jeu en temps réel avec toute la personnalisation UGC. La consécration ultime de la personnalisation.
- **Saisons des Artisans (Battle Pass) :** Les éléments débloquables sont des templates d'objets (ex: *Semaine Ninja : accès aux lames courbes pour les créateurs qui ont le pass*).
- **Abonnement / 'Creator Pass' (Monétisation) :** 3€/mois pour les artistes : canvas plus larges (64x64), animations multicouches, vitrine mise en avant.
- **Les Métiers (Professions MMO) liés au Workshop :** L'artisanat pixel art est le métier de "Skin". Ajoutons les métiers de récolte hors-ligne (Herboristerie, Minage) et de craft (Alchimie pour les potions de buff temporaire).
- **Recoloration illimitée :** Un même sprite d'armure peut être teinté de milliers de couleurs via les filtres CSS. Les joueurs ne se ressemblent jamais.

---

Es-tu prêt à préparer ton environnement (`docker`, `Node.js`) et tes assets de côté pour lancer le **PROMPT 0** de la nouvelle ère ?
