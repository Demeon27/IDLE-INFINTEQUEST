# 🧠 PROJECT BRAIN — IDLE Infinite Quest
## Mémoire Universelle du Projet (à lire par tout LLM ou développeur)

> **Ce fichier est la source de vérité absolue du projet.** Avant de coder quoi que ce soit, lis ce document en entier. Il contient l'historique, les décisions architecturales, les erreurs passées à ne pas reproduire, et le plan d'action en cours.

**Dernière mise à jour :** 26 Février 2026

---

## 1. Qu'est-ce que IDLE Infinite Quest ?

Un **RPG Idle/Clicker Multijoueur** jouable dans un navigateur web. Le joueur crée un personnage (avatar pixel art multicouche), combat des monstres automatiquement (Idle) ou en cliquant (Clicker), récupère du loot, s'équipe, et progresse dans des donjons générés par la communauté.

### Ce qui rend le projet unique :
- **User Generated Content (UGC)** : Les joueurs dessinent eux-mêmes des armes, armures et monstres via un "Pixel Studio" intégré. Ces créations sont modérées puis intégrées au jeu pour tous.
- **Progression techniquement infinie** : Pas de niveau max. Les donjons et la difficulté scalent mathématiquement à l'infini.
- **Architecture "Server-Authoritative"** : Le serveur NestJS gère toute la logique. Le client React ne fait qu'afficher.
- **Système de Plugins** ouvert (façon WordPress) : Les développeurs tiers peuvent créer des modules sans toucher au code source du moteur.

---

## 2. Historique et Leçons de la V1

### Ce qui existait (V1 — Projet actuel dans ce dossier)
- Frontend : Vite + React + TypeScript
- Backend : Express.js + Prisma + PostgreSQL + Socket.IO
- Moteur de rendu : **Phaser** (Canvas WebGL) pour la zone de combat
- Fonctionnalités partiellement implémentées : Combat basique, Workshop (Pixel Studio), Inventaire, Boutique, Administration basique

### Pourquoi la V1 a échoué (Les erreurs à NE PAS reproduire)
1. **Phaser + React = Conflit permanent.** Deux boucles de rendu (Phaser Game Loop 60fps vs React State) qui se désynchronisaient. Résultat : écrans blancs, sprites avec cases noires (transparence cassée), crash au respawn des monstres.
2. **Pas d'architecture modulaire.** Chaque ajout de feature (Workshop, Admin, Boutique) nécessitait de modifier le code du combat, de l'inventaire ET des routes. Effet domino systématique.
3. **Pas de séparation Frontend/Backend stricte.** Le client faisait des calculs de combat localement, créant des incohérences avec le serveur.
4. **Sprites stockés en base64 dans PostgreSQL.** La base de données explosait en taille.
5. **Pas de système de rôles (Modérateurs).** Un seul admin pour tout gérer = goulot d'étranglement.
6. **Code groupé par type de fichier** (controllers/, services/, routes/) au lieu d'être groupé par domaine métier.

### Ce qui a bien fonctionné (À garder)
- **Prisma + PostgreSQL** : Excellent ORM, à conserver.
- **Socket.IO** : Performant pour le temps réel.
- **Le concept de "LayeredSprite"** : Empiler des calques PNG pour former un avatar personnalisé. Le concept est génial, l'implémentation Phaser était le problème.
- **Le Pixel Studio** : L'éditeur de pixel art intégré pour que les joueurs créent leurs items.

---

## 3. La V2 — Le Reboot

### Document de référence
Tout le plan d'architecture détaillé est dans : **`V2-Reboot-Architecture.md`** (même dossier).

### Résumé des choix technologiques V2

| Composant | Technologie | Justification |
|---|---|---|
| **Monorepo** | Turborepo ou Nx | `@idle/client`, `@idle/server`, `@idle/shared` |
| **Backend** | NestJS | Injection de dépendances native, parfait pour le système de plugins |
| **BDD** | PostgreSQL + Prisma | Conservé de la V1 (excellent) |
| **Temps réel** | Socket.IO (via NestJS Gateways) | Conservé de la V1 |
| **Cache/Sessions** | Redis | Obligatoire pour le mode Cluster multi-cœurs |
| **Stockage sprites** | MinIO (S3 auto-hébergé, docker) | Les sprites ne vont JAMAIS en BDD, seulement l'URL |
| **Frontend** | Vite + React + TypeScript | Conservé de la V1 |
| **State Management** | Zustand | Léger, réactif, miroir du payload WebSocket |
| **Moteur de rendu** | ❌ PAS Phaser. 100% DOM/CSS | Calques <img> superposés, animations CSS Keyframes |
| **Containers** | Docker + docker-compose | Client, Server, Postgres, Redis, MinIO |

### Direction artistique
- **Style "Taverne Pixel Art"** : Ragnarok Online, Tolkien (Le Poney Fringant)
- **Palette :** Tons terreux (brun, or terni, rouge sombre), textures de bois/pierre/parchemin
- **PAS de néon, PAS de glassmorphism** — Ambiance chaleureuse, nostalgique, organique
- **Fenêtres modales** : Texturées (bois sculpté, fer forgé), déplaçables par le joueur
- **Structure web** : Sidebar + Header + Contenu central (c'est un SITE WEB, pas une app mobile)

### Système de personnalisation (CRITIQUE — Ne jamais limiter ça)
- Calques illimités : Corps, Cheveux, Casque, Armure, Cape, Arme x2, Bouclier, Aura, Familier
- Recoloration dynamique via filtres CSS (`hue-rotate`, `brightness`, `saturate`)
- Effets de rareté : Halo pixel art subtil pour les objets Légendaires (`drop-shadow` animé)
- Animations : Idle (respiration), Attack, Hit, Death — via spritesheets CSS
- "Carte d'Identité du Héros" : Fiche de personnage interactive (stats, build, crédits créateurs UGC)

### Hiérarchie des rôles utilisateurs
| Rôle | Pouvoirs |
|---|---|
| `USER` | Jouer, créer dans le Workshop, poster sur le Forum |
| `MODERATOR` | Valider/rejeter les créations Workshop (droits d'auteur), Mute sur le Forum. Aura spéciale sur l'avatar. **Aucun pouvoir financier/technique.** |
| `ADMIN` | Tout. Live Config serveur (XP, drop rates, événements). Promouvoir/destituer des Modérateurs. |

### Sécurité
- Rate-Limiting : Max 10 actions WebSocket/seconde par joueur
- Toute entrée client traitée comme potentiellement malveillante
- Transactions Prisma atomiques pour éviter la duplication d'items/monnaie

---

## 4. Infrastructure & Capacité Serveur

### Machine de départ
- VPS AMD EPYC : 2 cœurs, 8 Go RAM, SSD NVMe, 1 Gbps
- **Estimation réaliste : 3 000 à 5 000 CCU** (joueurs en combat actif simultanément)
- La progression hors-ligne ne coûte RIEN au serveur (calcul au moment de la reconnexion)

### Machine cible (évolution)
- 8 vCPU, 32 Go RAM, 400 Go NVMe, 32 To de bande passante
- PM2 en mode Cluster (8 instances Node.js)
- Redis obligatoire pour partager l'état entre les instances
- **Estimation : 10 000 à 50 000+ CCU**

---

## 5. Plan d'Action (Les 13 Piliers — voir V2-Reboot-Architecture.md)

| Phase | Nom | Statut |
|---|---|---|
| **0** | Design System & UI Kit "Taverne" | ✅ Fait (9/10) |
| **1A** | Monorepo + Docker (coquille vide) | ✅ Fait (8/10) |
| **1B** | Schéma Prisma + Auth JWT | ✅ Fait (8/10) |
| **2** | Engine Module + PluginManager + Game Loop | ✅ Fait (9/10) |
| **3** | LayeredSprite + Zustand + WebSocket Client | ✅ Fait (7/10 — Animations amplifiées) |
| **4** | Inventaire + Boutique | ✅ Fait (7/10) |
| **5** | Workshop + Pixel Studio + Modération | ✅ Fait (7/10 — Modération déplacée dans Admin) |
| **6** | Marché (Auction House) + Boutique du Créateur | ⚠️ Partiel (5/10 — Likes/Vitrine manquants) |
| **7** | Dashboard Admin + Rôles (USER/MOD/ADMIN) | 🔨 En cours (Admin branché, Live Config/Users à faire) |
| **8** | Monétisation (Cristaux, Transmog, Creator Pass) | ⬜ À faire |
| **9** | Donjons Communautaires + Auto-Scaling Infini | ⬜ À faire |
| **10** | Guildes + Forum "Taverne" + Fiches Personnage | ⚠️ Chat fait, reste Forum/Guildes/Fiches |
| **11** | Classes, Arbres de Talents, Raids Asynchrones | ⬜ À faire |
| **12** | Tests (Unitaires, E2E, Load Testing) | ⬜ À faire |


### Règle absolue d'exécution
- Les phases doivent être exécutées **dans l'ordre**.
- Chaque phase doit **compiler et fonctionner** avant de passer à la suivante.
- Le PluginManager (Phase 2) est la **fondation**. Toutes les phases 4+ l'utilisent.

---

## 6. Fonctionnalités Clés (Résumé pour référence rapide)

### Gameplay
- Combat Idle/Clicker avec statistiques complexes (Critique, Esquive, Hâte, Résistances)
- 3 Classes : Guerrier, Mage, Voleur (avec arbres de talents)
- Progression infinie (Tiers mathématiques exponentiels)
- Raids asynchrones à 5 joueurs (simulation serveur + Damage Meter)
- World Boss hebdomadaire (dégâts agrégés de tous les joueurs)

### Communautaire
- Workshop / Pixel Studio : Création d'items UGC (modération par les Game Masters)
- Donjons Communautaires : Les joueurs dessinent les monstres/décors, le serveur impose les stats
- Forum "La Taverne" : Avatar du jeu en temps réel comme image de profil
- Guildes + Expéditions (dons de loots → buff collectif)
- Hôtel de Vente (Auction House entre joueurs)
- Leaderboards joueurs ET créateurs
- Système de "Pourboires" pour les créateurs (XP de Maîtrise passive)

### Monétisation (Éthique, sans P2W)
- Monnaie Premium "Cristaux" (achat via Stripe)
- Transmogrification (appliquer un skin UGC sur un item stat)
- Creator Pass mensuel (3€ — canvas plus grands, animations, vitrine en avant)
- Taxe de 5% sur l'Hôtel de Vente
- Saisons/Battle Pass cosmétique (templates d'objets saisonniers)

---

## 7. Vocabulaire du Projet

| Terme | Signification |
|---|---|
| **LayeredSprite** | Composant React qui empile des calques PNG pour former un avatar |
| **PluginManager** | EventEmitter central NestJS. Les modules s'abonnent à des Hooks (`onMonsterDeath`, etc.) |
| **Tier** | Niveau de difficulté d'un donjon. Scale à l'infini. |
| **UGC** | User Generated Content — Contenu créé par les joueurs |
| **CCU** | Concurrent Connected Users — Joueurs connectés simultanément |
| **Transmog** | Transmogrification — Changer l'apparence d'un item sans changer ses stats |
| **Auto-Scaling** | Le serveur impose les stats des monstres mathématiquement selon le Tier |
| **Game Master** | Modérateur promu par l'Admin, avec des pouvoirs limités |
| **MinIO** | Clone S3 auto-hébergé pour stocker les sprites uploadés |
| **Hooks** | Événements déclenchés par le moteur auxquels les plugins s'abonnent |

---

## 8. Dossier de la V2

Le nouveau projet V2 sera créé dans : **`c:\Users\manth\Documents\Projet\IDLE-V2\`**
L'ancien projet V1 reste intact dans : **`c:\Users\manth\Documents\Projet\IDLE Infinite Quest\`** (pour récupérer les assets et sprites existants).

---

> **⚠️ RAPPEL POUR TOUT LLM :** Ne jamais hardcoder de la logique métier dans le EngineModule. Toujours passer par les Hooks du PluginManager. Ne jamais stocker de sprites en base64 dans PostgreSQL. Ne jamais utiliser Phaser. Lire `V2-Reboot-Architecture.md` pour les prompts détaillés.
