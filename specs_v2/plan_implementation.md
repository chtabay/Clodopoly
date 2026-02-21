# Clodopoly — Plan d'implémentation MVP

> Du code zéro au jeu jouable sur GitHub Pages

**Version :** 1.0
**Dernière mise à jour :** 2026-02-21
**Documents de référence :** `game_design.md` v2.1, `spec_fonctionnelle.md`, `spec_technique.md`

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Prérequis](#2-prérequis)
3. [Phase 0 — Fondations](#3-phase-0--fondations)
4. [Phase 1 — Moteur de jeu](#4-phase-1--moteur-de-jeu)
5. [Phase 2 — Interface utilisateur](#5-phase-2--interface-utilisateur)
6. [Phase 3 — Intégration et polish](#6-phase-3--intégration-et-polish)
7. [Phase 4 — Déploiement](#7-phase-4--déploiement)
8. [Critères de validation MVP](#8-critères-de-validation-mvp)
9. [Risques et mitigations](#9-risques-et-mitigations)
10. [Détail des tâches](#10-détail-des-tâches)

---

## 1. Vue d'ensemble

### 1.1 Objectif

Livrer un MVP jouable en multijoueur local (même écran), hébergé sur GitHub Pages, permettant de jouer une partie complète de Clodopoly du draft à la victoire.

### 1.2 Phasage

```
Phase 0 — Fondations          ██░░░░░░░░░░░░░░░░░░  ~0.5j
Phase 1 — Moteur de jeu       ██████████░░░░░░░░░░  ~8j
Phase 2 — Interface            ░░░░░░████████░░░░░░  ~8j
Phase 3 — Intégration          ░░░░░░░░░░░░░░████░░  ~4j
Phase 4 — Déploiement          ░░░░░░░░░░░░░░░░░░██  ~0.5j
                               ─────────────────────
                               Total estimé : ~21j
```

Les phases 1 et 2 sont partiellement parallélisables : l'UI de base (layout, écrans vides) peut commencer dès la Phase 0 terminée, indépendamment du moteur.

### 1.3 Stratégie

**Moteur d'abord, UI ensuite.** Le moteur est la fondation — s'il est bugué, l'UI n'a aucune valeur. On le développe et on le teste en isolation avant de brancher l'UI.

**Tests continus.** Chaque lot du moteur est accompagné de ses tests unitaires. On ne passe au lot suivant que si les tests du lot courant passent.

**Intégration progressive.** On ne branche pas tout l'UI d'un coup. On connecte écran par écran, en vérifiant chaque flux.

---

## 2. Prérequis

### 2.1 Environnement

- Node.js >= 20
- npm >= 10
- Git
- Navigateur moderne (Chrome/Firefox/Safari)
- Éditeur avec support TypeScript (Cursor/VS Code)

### 2.2 Dépôt Git

Le projet vit dans `C:\Users\Guillaume\Documents\Project\Clodopoly`. Le dépôt sera structuré avec :
- Branche `main` : code stable, déployé sur GitHub Pages
- Développement directement sur `main` pour le MVP (pas de branches feature)
- `.gitignore` adapté (node_modules, dist, .env)

### 2.3 GitHub Pages

- Déploiement depuis la branche `main`, dossier `/dist`
- Ou via GitHub Actions (workflow de build + deploy)
- URL cible : `https://<username>.github.io/Clodopoly/`

---

## 3. Phase 0 — Fondations

> Objectif : projet compilable, lintable, testable. Zéro logique de jeu.

### Tâche 0.1 — Initialisation du projet

**Actions :**
1. Créer `package.json` avec les métadonnées du projet
2. Installer les dépendances dev : `typescript`, `vite`, `vitest`, `eslint`, `prettier`
3. Créer `tsconfig.json` (strict mode, ES2022, module ESNext)
4. Créer `vite.config.ts` (base: "/Clodopoly/", build outDir: "dist")
5. Créer `.eslintrc.json` et `.prettierrc`
6. Créer `.gitignore` (node_modules, dist, .env, *.pyc, __pycache__)
7. Créer `index.html` minimal (point d'entrée Vite)
8. Créer `src/main.ts` (console.log de vérification)

**Vérification :**
- `npm run dev` → page blanche avec console.log visible
- `npm run build` → dossier `dist/` généré
- `npm run test` → vitest s'exécute (0 test, 0 erreur)
- `npm run lint` → aucune erreur

### Tâche 0.2 — Structure des dossiers

**Actions :**
1. Créer l'arborescence `src/engine/`, `src/locale/`, `src/ui/`, `tests/`
2. Créer les fichiers vides avec exports de base :
   - `src/engine/types.ts` — types et enums (copier depuis spec technique §4)
   - `src/engine/constants.ts` — constantes vides
   - `src/engine/board.ts` — export vide
   - `src/engine/cards.ts` — export vide
   - `src/locale/types.ts` — types LocaleData, LocationTheme
3. Vérifier que tout compile sans erreur

**Vérification :**
- `npx tsc --noEmit` → 0 erreur
- Les imports croisés fonctionnent

**Durée estimée Phase 0 : 0.5 jour**

---

## 4. Phase 1 — Moteur de jeu

> Objectif : logique complète, testée, sans aucune dépendance au DOM.

### Lot 1.1 — Types et constantes

**Fichiers :** `src/engine/types.ts`, `src/engine/constants.ts`

**Contenu :**
- Tous les types de la spec technique §4 (GameState, PlayerState, CellDefinition, CardDefinition, etc.)
- Constantes : coûts (logement par couleur, nourriture de base, essence, bus, etc.), seuils (PC par emploi, PV max, PC max), paramètres d'inflation (intervalle, incrément)

**Tests :** Aucun (types purs + constantes).

**Durée : 0.5j**

### Lot 1.2 — Définitions statiques (plateau, cartes, locale)

**Fichiers :** `src/engine/board.ts`, `src/engine/cards.ts`, `src/locale/lang/fr.ts`, `src/locale/lang/en.ts`, `src/locale/themes/poitiers.ts`, `src/locale/themes/monopoly.ts`, `src/locale/i18n.ts`

**Contenu :**
- `board.ts` : tableau de 40 `CellDefinition` (sans noms, mécanique pure)
- `cards.ts` : tableaux des 32 cartes Objet, 16 Événement, 16 Fouille, 3 Emploi (mécaniques pures)
- `fr.ts` : tous les textes français (UI, cartes, journal, actions de nuit)
- `en.ts` : tous les textes anglais
- `poitiers.ts` : 22 noms de rues + 4 gares
- `monopoly.ts` : noms Monopoly US classiques (pour référence/test)
- `i18n.ts` : fonctions `getCellDisplayName()`, `getCardText()`, `getJournalMessage()`, `getUILabel()`

**Tests :**
- Chaque case a un nom dans chaque combo lang×theme
- Chaque carte a un nom et une description dans chaque langue
- `getCellDisplayName` retourne les bons noms pour Poitiers et Monopoly US
- Nombre correct de cases par couleur

**Durée : 1.5j**

### Lot 1.3 — État initial et dés

**Fichiers :** `src/engine/state.ts`, `src/engine/dice.ts`

**Contenu :**
- `state.ts` :
  - `createInitialState(config)` : crée un état de jeu vierge avec joueurs, pioches mélangées, bâtiments placés aléatoirement, Maréchaussée positionnée
  - `getPlayer(state, id)` : accès rapide à un joueur
  - `computePC(player)` : calcul des PC depuis l'inventaire
  - `computeSalary(player)` : calcul du salaire effectif
- `dice.ts` :
  - `RandomDiceRoller` : implémentation production (Math.random)
  - `SeededDiceRoller` : implémentation test (séquence prédéfinie)
  - Interface `DiceRoller` injectée dans le moteur

**Tests :**
- `createInitialState` produit un état valide (bon nombre de joueurs, bon montant d'argent, 5 PV, 8 PC en cartes, bâtiments placés, pioches non vides)
- `computePC` calcule correctement depuis différentes combinaisons de cartes
- `computeSalary` applique les bonus/malus selon les PC
- `SeededDiceRoller` retourne la séquence attendue

**Durée : 1j**

### Lot 1.4 — Déplacement

**Fichiers :** `src/engine/actions.ts` (partiel), `src/engine/resolver.ts` (partiel)

**Actions implémentées :** `CHOOSE_TRANSPORT`, `ROLL_DICE`, `CHOOSE_CELL`

**Contenu :**
- Validation du transport (a-t-on la voiture ? peut-on payer l'essence ? grève ?)
- Calcul des cases accessibles (`getReachableCells`)
- Validation du choix de case (dans la fenêtre du lancer)
- Résolution du déplacement : déduction essence/ticket, passage par la case Paie (salaire), passage par la Maréchaussée (amende routière)
- Écriture des entrées journal

**Tests :**
- Voiture : portée 2-12, coût essence déduit, sens horaire uniquement
- Bus : portée 3-8, coût ticket déduit, sens horaire
- À pied : portée 1-6, bidirectionnel, gratuit
- Choix de case : cases hors portée refusées
- Passage case Paie : salaire versé si conditions remplies, pas de salaire sinon
- Passage Maréchaussée en voiture : amende appliquée
- Perte de voiture après 2 tours sans essence
- Bus indisponible si grève active

**Durée : 1.5j**

### Lot 1.5 — Actions de case

**Fichiers :** `src/engine/actions.ts` (suite), `src/engine/resolver.ts` (suite)

**Actions implémentées :** `CASE_ACTION`, `SKIP_ACTION`

**Contenu :**
- Petit Boulot : gain 80€, vérification un seul joueur par tour
- Marché : achat de cartes, remplacement depuis la pioche
- Douche : +1 PC, une fois par passage
- Centre de soins : +1 PV pour 50€
- Événement : tirage, application de l'effet, recyclage de la pioche
- Fouille : tirage, ajout à l'inventaire si conservable
- Lieu de Travail : pointer (reset retard), embauche (si sans emploi + PC suffisants), recommandation
- Foyer : lancer durée séjour, logement/repas gratuits, sortie anticipée
- Rafle : envoi au Foyer
- Taxes : paiement ou -1 PC

**Tests :**
- Chaque type de case : action correcte, effet correct, journal correct
- Petit Boulot déjà occupé : refusé
- Marché pioche vide : pas de remplacement
- Événement pioche vide : recyclage de la défausse
- Foyer : durée correcte, sortie anticipée
- Embauche : refusée si PC insuffisants, réussie sinon
- Taxe impayable : -1 PC

**Durée : 2j**

### Lot 1.6 — Phase de nuit

**Fichiers :** `src/engine/resolver.ts` (suite — `resolveNight()`)

**Actions implémentées :** `CHOOSE_NIGHT_ACTION`, `RESOLVE_NIGHT`, `NIGHT_CHOOSE_TARGET`

**Contenu :**
- Identification des Camps (`identifyCamps`)
- Collecte des choix (4 actions par joueur en Camp)
- Résolution par Camp :
  - Dormir+Dormir : partage coûts, +1 PC, protection Maréchaussée
  - Dormir+Veiller : pas d'incident
  - Dormir+Se servir : vol réussi (choix de carte cible)
  - Veiller+Se servir : vol échoué, -1 PC au serveur, Camp dissous
  - Se servir+Se servir : confrontation (dés + bonus objets)
  - Fouiller+X : tirage carte Fouille, affaires accessibles
  - Toutes les autres combinaisons
- Résolution joueurs seuls : logement ou dehors
- Application des protections (Carton, Sac de couchage)
- Écriture journal complet des actions de nuit

**Tests (exhaustifs — 16 combinaisons 2 joueurs) :**
- Dormir+Dormir : coûts divisés, +1 PC chacun
- Dormir+Veiller : dormeur +1 PC, veilleur +0 PC
- Dormir+Fouiller : dormeur dort, fouilleur tire une carte
- Dormir+Se servir : serveur prend une carte au dormeur
- Veiller+Veiller : +0 PC chacun
- Veiller+Fouiller : pas d'incident
- Veiller+Se servir : serveur pris sur le fait, -1 PC, Camp dissous
- Fouiller+Fouiller : deux cartes tirées
- Fouiller+Se servir : serveur prend chez le fouilleur absent
- Se servir+Se servir : confrontation, gagnant prend, perdant -1 PV, -1 PC chacun
- Camp 3 joueurs avec veilleur : tout vol bloqué
- Camp 3 joueurs sans veilleur : serveur choisit sa cible
- Joueur seul sans bâtiment : -1 PV, -1 PC
- Joueur seul avec bâtiment, peut payer : pas de perte
- Joueur seul avec bâtiment, ne peut pas payer : dehors
- Protection Carton : annule -1 PV, carte consommée

**Durée : 2j**

### Lot 1.7 — Maintenance et boucle de jeu

**Fichiers :** `src/engine/resolver.ts` (suite — `resolveMaintenance()`), `src/engine/engine.ts`

**Actions implémentées :** `RESOLVE_MAINTENANCE`, `USE_PROTECTION`, `END_TURN`, `MOVE_MARECHAUSSEE`, `START_GAME`

**Contenu :**
- Maintenance : coûts nourriture, vérification seuils (PV, PC emploi, retards), licenciement, élimination → Fantôme
- Inflation : tous les 4 tours, +10€ nourriture
- Condamnation : tous les 4 tours, retirer un bâtiment aléatoire
- Maréchaussée : déplacement 2d6, comportement 1d6 au passage case Départ, bascule jour/nuit
- Activation cycle nuit : dès qu'un joueur dort dehors
- Fantôme : 2 tours restants, puis élimination définitive
- Condition de victoire : dernier joueur PV > 0
- Limite de tours : 24 tours max
- Machine à états : transitions entre phases (voir spec technique §8)
- Passage au joueur suivant, détection fin de tour

**Tests :**
- Nourriture impayée : -1 PV
- Licenciement par PC : correct selon les seuils
- Licenciement par retard : correct selon la tolérance
- Élimination : PV = 0 → Fantôme 2 tours → éliminé
- Inflation : nourriture augmente aux bons tours
- Condamnation : bâtiment retiré, joueur sur la case affecté
- Maréchaussée : déplacement correct, mode déterminé par dé
- Maréchaussée + SDF : amende/foyer selon le mode
- Condition de victoire : détectée quand un seul survivant
- Partie complète simulée (10 parties avec SeededDiceRoller) : pas de crash, victoire atteinte

**Durée : 2j**

### Lot 1.8 — Draft

**Fichiers :** `src/engine/actions.ts` (suite), `src/engine/resolver.ts` (suite)

**Actions implémentées :** `DRAFT_PICK`, `DRAFT_VALIDATE`

**Contenu :**
- Pool de cartes disponibles
- Sélection/désélection d'une carte
- Validation : total = 8 PC, Voiture obligatoire
- Cartes qui feraient dépasser 8 PC : marquées non sélectionnables
- Passage au joueur suivant après validation
- Cartes restantes → pioche Objet

**Tests :**
- Sélection valide acceptée
- Sélection qui dépasse 8 PC refusée
- Validation sans Voiture refusée
- Validation à 8 PC acceptée
- Cartes retirées du pool après validation d'un joueur
- Pioche Objet correctement constituée après le draft complet

**Durée : 0.5j**

---

## 5. Phase 2 — Interface utilisateur

> Objectif : tous les écrans fonctionnels, connectés au moteur.

### Lot 2.1 — Layout et navigation

**Fichiers :** `src/ui/app.ts`, `src/ui/screens/*.ts`, `src/ui/styles/*.css`, `index.html`

**Contenu :**
- Point d'entrée HTML avec conteneur principal
- Système de navigation entre écrans (hash routing simple : `#home`, `#setup`, `#draft`, `#game`, `#end`)
- Layout de base de chaque écran (structure HTML/CSS issue de la maquette)
- Import et intégration des styles depuis la maquette
- Composant de base : `UIComponent` (mount/update/unmount)
- Dispatcher d'actions connecté au moteur

**Vérification :** Navigation entre les 5 écrans, layout conforme à la maquette.

**Durée : 1j**

### Lot 2.2 — Écrans Accueil et Création

**Fichiers :** `src/ui/screens/home.ts`, `src/ui/screens/setup.ts`

**Contenu :**
- Accueil : titre, sous-titre, bouton Nouvelle partie, bouton Règles
- Création : sélecteurs nombre de joueurs, champs noms, couleurs, sélecteurs langue/thème
- Validation des champs
- Déclenchement de `START_GAME` et passage au draft

**Vérification :** Créer une partie avec 3 joueurs → écran de draft affiché.

**Durée : 0.5j**

### Lot 2.3 — Écran Draft

**Fichiers :** `src/ui/screens/draft.ts`

**Contenu :**
- Grille de cartes disponibles (issue du moteur)
- Sélection/désélection par clic
- Compteur PC en temps réel
- Cartes grisées si dépassement
- Barre de sélection sticky
- Écran de transition entre joueurs (MVP local)
- Bouton Valider → `DRAFT_VALIDATE`
- Récapitulatif après le draft de tous les joueurs → passage à l'écran Jeu

**Vérification :** Drafter 3 joueurs avec des compositions différentes → écran de jeu avec les inventaires corrects.

**Durée : 1j**

### Lot 2.4 — Plateau de jeu (rendu)

**Fichiers :** `src/ui/components/board-renderer.ts`, `src/ui/styles/board.css`

**Contenu :**
- Construction de la grille 11×11 (reprendre la logique de la maquette)
- Affichage des noms de cases localisés (via i18n)
- Barres de couleur par quartier
- Pions joueurs positionnés (couleurs, décalage si même case)
- Pion Maréchaussée
- Bâtiments (maisons, hôtels)
- Indicateur de cases accessibles (surbrillance)
- Panneau de focus au clic (détail de la case)
- Centre du plateau : titre + phase en cours
- Ambiance jour/nuit (filtre CSS)
- Responsive mobile (zoom, noms masqués, focus en bottom panel)

**Vérification :** Le plateau affiche correctement l'état initial. Clic sur une case → panneau de focus avec les bonnes informations.

**Durée : 2j**

### Lot 2.5 — Panneau latéral et barre d'actions

**Fichiers :** `src/ui/components/player-panel.ts`, `src/ui/components/action-bar.ts`

**Contenu :**
- Fiche joueur actif (argent, PV, PC, emploi, inventaire)
- Résumé de tous les joueurs (compact)
- Journal réduit (3 dernières entrées)
- Barre d'actions contextuelle selon la phase :
  - Déplacement : choix transport + lancer dés
  - Choix de case : surbrillance + valider
  - Action : boutons contextuels par type de case
- Bottom sheet mobile (drag gesture)

**Vérification :** La fiche joueur se met à jour quand l'état change. Les boutons d'action changent selon la phase.

**Durée : 1.5j**

### Lot 2.6 — Phase de déplacement (UI)

**Fichiers :** `src/ui/components/dice-roller.ts` (intégré dans le flux)

**Contenu :**
- Sélection du transport (boutons barre d'actions)
- Animation de dés (CSS)
- Surbrillance des cases accessibles sur le plateau
- Clic sur une case → animation du pion case par case
- Notification de salaire si passage case Paie
- Notification d'amende si passage Maréchaussée

**Vérification :** Choisir Voiture → lancer dés → cliquer une case → pion animé → passage au joueur suivant ou phase action.

**Durée : 1j**

### Lot 2.7 — Phase d'action (UI)

**Fichiers :** `src/ui/components/card-modal.ts` (intégré dans le flux)

**Contenu :**
- Actions contextuelles par case (boutons)
- Modale de carte (Événement, Fouille) : affichage grand format, effet, bouton OK
- Achat au Marché : cartes affichées, bouton acheter
- Lieu de Travail : pointer / embauche / recommandation
- Foyer : animation dé durée, affichage séjour
- Notifications de gain/perte

**Vérification :** Arriver sur chaque type de case → l'action correcte est proposée → l'effet est appliqué et affiché.

**Durée : 1j**

### Lot 2.8 — Phase de nuit (UI)

**Fichiers :** `src/ui/components/night-phase.ts`

**Contenu :**
- Écran récapitulatif des Camps
- Pour chaque joueur en Camp (MVP — passage d'écran) :
  - Écran de transition "Passez à [Joueur X]"
  - 4 boutons d'action (Dormir/Veiller/Fouiller/Se servir)
  - Timer visuel (30s, défaut = Dormir)
  - Confirmation
- Écran de résolution : résultat par Camp, tags colorés par action
- Si Se servir réussi : écran de choix de carte cible (passage d'écran)
- Si Confrontation : animation dés, résultat
- Journal mis à jour

**Vérification :** Phase de nuit complète avec 2 joueurs en Camp → choix secrets → résolution cohérente.

**Durée : 2j**

### Lot 2.9 — Maintenance, fin de tour, fin de partie

**Fichiers :** `src/ui/screens/endgame.ts`, `src/ui/components/notification.ts`, `src/ui/components/journal.ts`

**Contenu :**
- Modale de maintenance : décompte par joueur
- Notifications (gain/perte/warning/info) empilables
- Journal complet : filtrable par tour, joueur, catégorie
- Événements de fin de tour : inflation, condamnation, activation cycle nuit
- Animation Maréchaussée (déplacement + mode)
- Écran de fin : gagnant, classement, statistiques
- Boutons "Nouvelle partie" et "Accueil"

**Vérification :** Partie complète jusqu'à la victoire. Écran de fin affiché avec les bonnes stats.

**Durée : 1.5j**

### Lot 2.10 — Panneau de règles

**Fichiers :** `src/ui/components/rules-panel.ts`

**Contenu :**
- Panneau latéral ou modale
- Règles résumées, structurées en sections pliables
- Référence rapide des coûts
- Accessible à tout moment via bouton "?"
- Localisé (fr/en)

**Vérification :** Le panneau s'ouvre, les textes sont corrects dans les deux langues.

**Durée : 0.5j**

---

## 6. Phase 3 — Intégration et polish

> Objectif : tout fonctionne de bout en bout. Le jeu est jouable.

### Lot 3.1 — Intégration moteur ↔ UI

**Contenu :**
- Connecter le dispatcher UI au moteur (`applyAction`)
- Vérifier chaque transition de phase : le moteur avance, l'UI suit
- Corriger les décalages entre l'état du moteur et le rendu
- Tester le flux complet : accueil → création → draft → jeu (tours) → fin

**Tests :**
- 3 parties complètes jouées manuellement avec 2, 3 et 4 joueurs
- Vérifier que chaque action produit le bon résultat visuel
- Vérifier que le journal enregistre tout correctement

**Durée : 2j**

### Lot 3.2 — Polish visuel et UX

**Contenu :**
- Animations de déplacement fluides
- Transitions entre phases (fadeIn/fadeOut)
- Ambiance jour/nuit correcte
- Responsive mobile : test sur 3 tailles (375px, 768px, 1280px)
- Bottom sheet fonctionnel sur mobile
- Panneau de focus correct sur mobile
- Temps de chargement : vérifier que le build est < 500KB
- Favicon et meta tags

**Durée : 1j**

### Lot 3.3 — Cas limites et robustesse

**Contenu :**
- Tester tous les cas limites documentés (spec fonctionnelle §16) :
  - Argent = 0 pendant une taxe
  - PC = 0 avec emploi de Cadre
  - Plus de bâtiments sur le plateau
  - Pioche Objet vide au Marché
  - Pioche Événement vide (recyclage)
  - 5 joueurs, 3 emplois
  - Fantôme qui rejoint un Camp
  - Tous les joueurs éliminés au même tour
- Corriger les bugs trouvés

**Durée : 1j**

---

## 7. Phase 4 — Déploiement

### Lot 4.1 — GitHub Actions + Pages

**Contenu :**
1. Créer `.github/workflows/deploy.yml` :
   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [main]
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 20
         - run: npm ci
         - run: npm run build
         - uses: actions/upload-pages-artifact@v3
           with:
             path: dist
         - uses: actions/deploy-pages@v4
   ```
2. Activer GitHub Pages dans les settings du dépôt (source: GitHub Actions)
3. Push → vérifier que le déploiement fonctionne
4. Tester le jeu sur l'URL publique

**Vérification :** Le jeu est accessible et jouable à l'URL GitHub Pages.

**Durée : 0.5j**

---

## 8. Critères de validation MVP

Le MVP est considéré terminé quand **tous** les critères suivants sont remplis :

### 8.1 Fonctionnel

| Critère | Description |
|---|---|
| ✅ Création de partie | 2-5 joueurs, noms, couleurs, langue, thème |
| ✅ Draft | Chaque joueur compose son profil (8 PC, Voiture obligatoire) |
| ✅ Déplacement | 3 modes de transport, choix de case, passage Paie |
| ✅ Actions de case | Les 13 types de case fonctionnent |
| ✅ Phase de nuit | 4 actions, résolution correcte, passage d'écran secret |
| ✅ Maintenance | Coûts, vérifications, licenciement, élimination |
| ✅ Camp | Partage de coûts, +1 PC, protection mutuelle |
| ✅ Inflation | Nourriture augmente tous les 4 tours |
| ✅ Condamnation | Bâtiment retiré tous les 4 tours |
| ✅ Maréchaussée | Déplacement, modes, interaction avec SDF |
| ✅ Fantôme | 2 tours d'activité après élimination |
| ✅ Fin de partie | Dernier survivant gagne, écran de fin, stats |
| ✅ Journal | Historique complet, filtrable |
| ✅ Localisation | FR/EN, thème Poitiers fonctionnel |

### 8.2 Technique

| Critère | Description |
|---|---|
| ✅ Build | `npm run build` produit un bundle fonctionnel |
| ✅ Tests | 80%+ de couverture sur le moteur, 100% sur la nuit |
| ✅ Déploiement | Jouable sur GitHub Pages |
| ✅ Performance | Chargement < 3s, aucun lag perceptible |
| ✅ Mobile | Jouable sur tablette (768px). Consultation sur mobile (375px). |

### 8.3 Expérience

| Critère | Description |
|---|---|
| ✅ Partie complète | Une partie de 3 joueurs peut être jouée de bout en bout sans bug bloquant |
| ✅ Lisibilité | Les informations sont lisibles sans effort |
| ✅ Compréhension | Un joueur qui lit les règles peut jouer sans aide externe |

---

## 9. Risques et mitigations

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| **Résolution de nuit buguée** | Moyenne | Critique | Tests exhaustifs des 16 combinaisons + tests 3 joueurs. C'est le lot le plus testé. |
| **Équilibrage économique** | Élevée | Moyen | Les valeurs sont configurables dans `constants.ts`. Le playtest permettra d'ajuster. |
| **Plateau mobile illisible** | Moyenne | Moyen | Panneau de focus déjà conçu. Tests sur tailles réelles. |
| **Performance SVG avec 40 cases** | Faible | Faible | Le plateau est une grille HTML/CSS (pas un SVG lourd). 40 éléments = aucun problème. |
| **Phase de nuit en local : triche** | Élevée | Faible | Inhérent au passage d'écran. Acceptable pour le MVP. Résolu nativement en V1 (en ligne). |
| **Trop de règles pour le joueur** | Moyenne | Moyen | Panneau de règles accessible à tout moment. Tutoriel hors périmètre MVP. |

---

## 10. Détail des tâches

### 10.1 Tableau récapitulatif

| ID | Lot | Durée | Dépendances | Livrable |
|---|---|---|---|---|
| **0.1** | Init projet | 0.25j | — | Projet compilable |
| **0.2** | Structure dossiers | 0.25j | 0.1 | Arborescence + types vides |
| **1.1** | Types et constantes | 0.5j | 0.2 | types.ts, constants.ts |
| **1.2** | Plateau, cartes, locale | 1.5j | 1.1 | board.ts, cards.ts, fr.ts, en.ts, poitiers.ts, i18n.ts |
| **1.3** | État initial, dés | 1j | 1.1 | state.ts, dice.ts + tests |
| **1.4** | Déplacement | 1.5j | 1.3 | actions.ts (partiel) + tests |
| **1.5** | Actions de case | 2j | 1.4 | actions.ts (complet) + tests |
| **1.6** | Phase de nuit | 2j | 1.5 | resolver.ts (nuit) + tests |
| **1.7** | Maintenance + boucle | 2j | 1.6 | engine.ts, resolver.ts + tests |
| **1.8** | Draft | 0.5j | 1.3 | actions.ts (draft) + tests |
| **2.1** | Layout et navigation | 1j | 0.2 | Écrans vides navigables |
| **2.2** | Accueil + Création | 0.5j | 2.1 | Écrans fonctionnels |
| **2.3** | Draft UI | 1j | 2.1, 1.8 | Écran draft connecté |
| **2.4** | Plateau rendu | 2j | 2.1, 1.2 | Plateau interactif |
| **2.5** | Panneau + actions | 1.5j | 2.4 | Panneau latéral, barre d'actions |
| **2.6** | Déplacement UI | 1j | 2.5, 1.4 | Flux déplacement complet |
| **2.7** | Action UI | 1j | 2.5, 1.5 | Flux action complet |
| **2.8** | Nuit UI | 2j | 2.5, 1.6 | Flux nuit complet |
| **2.9** | Maintenance + fin | 1.5j | 2.5, 1.7 | Flux fin de tour + écran fin |
| **2.10** | Règles | 0.5j | 2.1, 1.2 | Panneau de règles |
| **3.1** | Intégration | 2j | tous lots 1.x et 2.x | Jeu jouable bout en bout |
| **3.2** | Polish | 1j | 3.1 | Animations, responsive, finitions |
| **3.3** | Cas limites | 1j | 3.1 | Robustesse |
| **4.1** | Déploiement | 0.5j | 3.x | GitHub Pages fonctionnel |

### 10.2 Chemin critique

```
0.1 → 0.2 → 1.1 → 1.3 → 1.4 → 1.5 → 1.6 → 1.7 → 3.1 → 3.2 → 3.3 → 4.1
                              ↘                        ↗
                    1.2 → 2.1 → 2.4 → 2.5 → 2.6 → 2.8
```

Le chemin critique passe par le moteur (lots 1.x) puis l'intégration (3.1). L'UI (lots 2.x) est parallélisable avec le moteur à partir du lot 2.1.

### 10.3 Ordre d'implémentation recommandé

```
Semaine 1 :  0.1 → 0.2 → 1.1 → 1.2 → 1.3 → 1.8
             (en parallèle : 2.1 → 2.2)

Semaine 2 :  1.4 → 1.5
             (en parallèle : 2.3 → 2.4)

Semaine 3 :  1.6 → 1.7
             (en parallèle : 2.5 → 2.6 → 2.7)

Semaine 4 :  2.8 → 2.9 → 2.10
             3.1 (intégration progressive)

Semaine 5 :  3.1 (fin) → 3.2 → 3.3 → 4.1
```
