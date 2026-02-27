# ⚔️ IDLE Infinite Quest

Bienvenue dans le dépôt officiel de **IDLE Infinite Quest (V2)**, un ambitieux projet de jeu MMO-IDLE jouable directement depuis votre navigateur. Entièrement repensé depuis sa version précédente (V1 sur Discord), ce jeu propose une véritable architecture temps-réel, des visuels rétro (Pixel Art) et un système communautaire fort guidé par du contenu généré par les utilisateurs (UGC).

---

## 🚀 Fonctionnalités Principales

- **Boucle de Jeu Côté Serveur (Server-Authoritative)** : Tous les combats, l'expérience (XP), le loot et l'économie tournent en temps réel de manière sécurisée sur le serveur (NestJS). Le client n'est qu'un "lecteur" visuel.
- **Synchronisation Temps-Réel (WebSockets)** : Le GameState (santé, dégâts, esquives, coups critiques) est streamé aux joueurs en temps réel `(Socket.io)`.
- **Visuels Côté Client (CSS Animations & React)** : L'arène de combat est rendue visuellement de manière fluide via des animations CSS natives et React, animant votre personnage (généré procéduralement via sprite layers). L'interface utilisateur complète est construite en `React`.
- **Inventaire et Boutique Vivants** : Système de butin dynamique. Les objets tombés au combat sont sauvegardés en DB et synchronisent instantanément l'interface des joueurs.
- **The Workshop (UGC)** : Les joueurs peuvent dessiner et soumettre leurs propres équipements via le **Pixel Studio** intégré au jeu. 
- **Modération & Administration** : Un panel de contrôle complet ("Banc des juges") permet aux Game Masters d'approuver ou rejeter le contenu UGC soumis par la communauté.
- **Architecture Modulaire par Plugins** : Le serveur utilise un système de plugins avec des "Hooks" pour écouter les événements, rendant le jeu extrêmement scalable et maintenable.

---

## 🛠️ Stack Technique

Ce projet utilise un **Monorepo (Turborepo)** divisé en dossiers `packages/client`, `packages/server`, et `packages/shared`.

- **Frontend** : React 18, Vite, Zustand (State), Socket.io-client, i18next, CSS natif (pour les animations de combat).
- **Backend** : NestJS, Socket.io, Prisma (ORM), PostgreSQL.
- **Authentification** : JWT (JSON Web Tokens)
- **Déploiement / Architecture** : Prévu pour Docker, Redis (pour le scaling futur des WebSockets).

---

## 📜 Licence

Ce projet est publié sous la licence **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)**. 
- Vous pouvez auditer, apprendre ou vous inspirer du code et partager le contenu.
- **L'utilisation et la réutilisation de ce code à des fins commerciales sont strictement interdites.**
- Vous devez citer le projet d'origine.

Voir le fichier `LICENSE.md` pour plus de détails juridiques.

---

*Que la quête (infinie) commence !* 🗡️🛡️
