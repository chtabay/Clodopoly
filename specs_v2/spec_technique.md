# Clodopoly — Spécification Technique

> Architecture, stack, structures de données et plan d'implémentation

**Version :** 1.0
**Statut :** Draft
**Dernière mise à jour :** 2026-02-21
**Documents de référence :** `game_design.md` v2.1, `spec_fonctionnelle.md` v1.0

---

## Table des matières

1. [Vue d'ensemble de l'architecture](#1-vue-densemble-de-larchitecture)
2. [Stack technique](#2-stack-technique)
3. [Structure du projet](#3-structure-du-projet)
4. [Modèle de données](#4-modèle-de-données)
5. [Moteur de jeu](#5-moteur-de-jeu)
6. [Définition statique du plateau](#6-définition-statique-du-plateau)
7. [Définition des cartes](#7-définition-des-cartes)
8. [Machine à états — Flux de jeu](#8-machine-à-états--flux-de-jeu)
9. [Résolution des actions de nuit](#9-résolution-des-actions-de-nuit)
10. [Rendu du plateau](#10-rendu-du-plateau)
11. [Interface utilisateur — Composants](#11-interface-utilisateur--composants)
12. [Système d'événements et journal](#12-système-dévénements-et-journal)
13. [Générateur de nombres aléatoires](#13-générateur-de-nombres-aléatoires)
14. [Extensions V1 — Multijoueur en ligne](#14-extensions-v1--multijoueur-en-ligne)
15. [Plan d'implémentation MVP](#15-plan-dimplémentation-mvp)
16. [Conventions et qualité](#16-conventions-et-qualité)

---

## 1. Vue d'ensemble de l'architecture

### 1.1 MVP — Architecture locale

```
┌──────────────────────────────────────────────────────┐
│                    NAVIGATEUR                        │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │              APPLICATION (SPA)                 │  │
│  │                                                │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │  │
│  │  │  MOTEUR   │  │   ÉTAT   │  │  INTERFACE   │ │  │
│  │  │  DE JEU   │←→│  DU JEU  │←→│ UTILISATEUR  │ │  │
│  │  │ (logique) │  │ (store)  │  │  (rendu)     │ │  │
│  │  └──────────┘  └──────────┘  └──────────────┘ │  │
│  │       │                            ↑           │  │
│  │       ↓                            │           │  │
│  │  ┌──────────┐              ┌──────────────┐   │  │
│  │  │ JOURNAL  │              │   PLATEAU    │   │  │
│  │  │  (log)   │              │  (canvas/svg)│   │  │
│  │  └──────────┘              └──────────────┘   │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Pas de serveur. Pas de réseau. Tout en mémoire.     │
└──────────────────────────────────────────────────────┘
```

Le MVP est une **Single Page Application** (SPA) entièrement côté client. Aucun backend. L'état du jeu vit en mémoire JavaScript. La page fermée = partie perdue.

### 1.2 V1 — Architecture en ligne

```
┌──────────────────┐        WebSocket        ┌──────────────────┐
│   CLIENT A       │◄══════════════════════►│     SERVEUR      │
│  (navigateur)    │                         │                  │
├──────────────────┤                         │  ┌────────────┐  │
│   CLIENT B       │◄══════════════════════►│  │  MOTEUR    │  │
│  (navigateur)    │                         │  │  DE JEU    │  │
├──────────────────┤                         │  │ (autoritatif)│ │
│   CLIENT C       │◄══════════════════════►│  ├────────────┤  │
│  (navigateur)    │                         │  │  ÉTAT      │  │
└──────────────────┘                         │  │  DU JEU    │  │
                                             │  ├────────────┤  │
     Clients : rendu + intentions            │  │  ROOMS     │  │
     Serveur : logique + validation          │  └────────────┘  │
                                             └──────────────────┘
```

En V1, le moteur de jeu migre côté serveur. Les clients envoient des **intentions** (actions), le serveur les valide, résout, et diffuse l'état mis à jour. Le code du moteur de jeu est conçu dès le MVP pour être isomorphe (exécutable côté client et côté serveur).

---

## 2. Stack technique

### 2.1 MVP

| Couche | Technologie | Justification |
|---|---|---|
| **Langage** | TypeScript | Typage statique, fiabilité du moteur de jeu, autocomplétion |
| **Bundler** | Vite | Rapide, HMR, config minimale |
| **UI** | Vanilla TS + HTML/CSS | Pas de framework. Complexité UI maîtrisée, pas de dépendance lourde. |
| **Rendu plateau** | SVG inline (DOM) | Le plateau est un SVG existant. Manipulation directe du DOM SVG. |
| **État** | Pattern store maison | Un objet central immuable, mis à jour par le moteur via des actions. |
| **Tests** | Vitest | Compatible Vite, rapide, assertions claires |
| **Linting** | ESLint + Prettier | Cohérence du code |

### 2.2 V1 (ajouts)

| Couche | Technologie | Justification |
|---|---|---|
| **Serveur** | Node.js + Express | Même langage que le client, partage du code moteur |
| **WebSocket** | ws (ou Socket.io) | Communication temps réel bidirectionnelle |
| **Persistance** | SQLite (via better-sqlite3) | Léger, sans setup, suffisant pour les rooms et l'état de partie |

### 2.3 Dépendances minimales (MVP)

```json
{
  "devDependencies": {
    "typescript": "^5.x",
    "vite": "^6.x",
    "vitest": "^3.x",
    "eslint": "^9.x",
    "prettier": "^3.x"
  }
}
```

Zéro dépendance runtime. Le MVP n'a aucune bibliothèque tierce en production.

---

## 3. Structure du projet

### 3.1 Arborescence MVP

```
Clodopoly/
├── assets/
│   ├── board/
│   │   └── Monopoly Template.svg
│   └── cards/
│       └── (SVG existants)
├── specs_v2/
│   ├── game_design.md
│   ├── spec_fonctionnelle.md
│   └── spec_technique.md
├── src/
│   ├── engine/                  # Moteur de jeu (logique pure, aucun DOM)
│   │   ├── types.ts             # Types et interfaces
│   │   ├── constants.ts         # Constantes du jeu (coûts, seuils, etc.)
│   │   ├── board.ts             # Définition structurelle des 40 cases (types, coûts — pas de noms)
│   │   ├── cards.ts             # Définition mécanique des cartes (effets — pas de textes)
│   │   ├── state.ts             # État du jeu : création, lecture
│   │   ├── actions.ts           # Actions possibles et validation
│   │   ├── resolver.ts          # Résolution des actions (nuit, maintenance, etc.)
│   │   ├── engine.ts            # Orchestrateur : machine à états, boucle de jeu
│   │   └── dice.ts              # Générateur de dés
│   ├── locale/                  # Localisation : langues et thèmes de lieux
│   │   ├── types.ts             # Types LocaleData, LocationTheme
│   │   ├── i18n.ts              # Résolution des textes (getLabel, getCellName, etc.)
│   │   ├── lang/
│   │   │   ├── fr.ts            # Textes français (par défaut)
│   │   │   └── en.ts            # Textes anglais
│   │   └── themes/
│   │       ├── poitiers.ts      # Noms de rues de Poitiers (par défaut)
│   │       ├── paris.ts         # Noms de rues de Paris
│   │       ├── countries.ts     # Noms de pays
│   │       └── monopoly.ts      # Noms Monopoly US classiques (Boston, California...)
│   ├── ui/                      # Interface utilisateur (DOM)
│   │   ├── app.ts               # Point d'entrée UI, routage des écrans
│   │   ├── screens/
│   │   │   ├── home.ts          # Écran d'accueil
│   │   │   ├── setup.ts         # Création de partie
│   │   │   ├── draft.ts         # Draft initial
│   │   │   ├── game.ts          # Écran principal (plateau de jeu)
│   │   │   └── endgame.ts       # Fin de partie
│   │   ├── components/
│   │   │   ├── board-renderer.ts # Rendu SVG du plateau
│   │   │   ├── player-panel.ts  # Fiche joueur + résumé
│   │   │   ├── action-bar.ts    # Barre d'actions contextuelle
│   │   │   ├── night-phase.ts   # Interface phase de nuit
│   │   │   ├── card-modal.ts    # Modale d'affichage de carte
│   │   │   ├── dice-roller.ts   # Animation de dés
│   │   │   ├── journal.ts       # Journal des événements
│   │   │   ├── notification.ts  # Système de notifications
│   │   │   └── rules-panel.ts   # Panneau de règles
│   │   └── styles/
│   │       ├── main.css         # Styles globaux
│   │       ├── board.css        # Styles du plateau
│   │       ├── components.css   # Styles des composants
│   │       └── animations.css   # Animations (dés, déplacement, transitions)
│   └── main.ts                  # Point d'entrée application
├── tests/
│   ├── engine/
│   │   ├── state.test.ts
│   │   ├── actions.test.ts
│   │   ├── resolver.test.ts
│   │   ├── engine.test.ts
│   │   └── night.test.ts        # Tests spécifiques résolution de nuit
│   └── integration/
│       ├── full-game.test.ts    # Simulation d'une partie complète
│       └── edge-cases.test.ts   # Cas limites
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### 3.2 Séparation engine / UI

Le dossier `engine/` ne contient **aucune référence au DOM**, au navigateur, ou à l'UI. C'est de la logique pure TypeScript, testable en isolation. Cette séparation garantit :

1. **Testabilité** : le moteur est testé unitairement sans DOM
2. **Portabilité** : le moteur peut tourner côté serveur (V1) sans modification
3. **Lisibilité** : la logique de jeu est isolée de la présentation

---

## 4. Modèle de données

### 4.1 Types principaux

```typescript
// === Identifiants ===

type PlayerId = string;       // "player_0", "player_1", ...
type CardId = string;         // "obj_costume_0", "evt_controle_0", ...
type CellIndex = number;      // 0-39 (position sur le plateau)

// === Énumérations ===

enum GamePhase {
  SETUP = "setup",
  DRAFT = "draft",
  MARECHAUSSEE = "marechaussee",
  MOVEMENT = "movement",
  ACTION = "action",
  NIGHT = "night",
  NIGHT_RESOLUTION = "night_resolution",
  MAINTENANCE = "maintenance",
  END_TURN = "end_turn",
  GAME_OVER = "game_over",
}

enum TransportMode {
  CAR = "car",
  BUS = "bus",
  FOOT = "foot",
}

enum NightAction {
  SLEEP = "sleep",
  WATCH = "watch",
  SCAVENGE = "scavenge",
  TAKE = "take",
}

enum JobType {
  CADRE = "cadre",
  EMPLOYE = "employe",
  PRECAIRE = "precaire",
}

enum CellType {
  PROPERTY = "property",
  PETIT_BOULOT = "petit_boulot",
  MARKET = "market",
  SHOWER = "shower",
  CLINIC = "clinic",
  EVENT = "event",
  SCAVENGE = "scavenge",
  PAYDAY = "payday",
  WORKPLACE = "workplace",
  SHELTER = "shelter",     // Foyer d'urgence (prison)
  ROUNDUP = "roundup",     // Rafle (allez en prison)
  TAX_INCOME = "tax_income",
  TAX_LUXURY = "tax_luxury",
}

enum DayNightCycle {
  INACTIVE = "inactive",
  DAY = "day",
  NIGHT = "night",
}

enum MarechausseeMode {
  REPRESSION = "repression",
  FINES = "fines",
  LAX = "lax",
}

enum PlayerStatus {
  ALIVE = "alive",
  GHOST = "ghost",          // Fantôme (2 tours restants)
  ELIMINATED = "eliminated",
}

enum PropertyColor {
  BROWN = "brown",
  LIGHT_BLUE = "light_blue",
  PINK = "pink",
  ORANGE = "orange",
  RED = "red",
  YELLOW = "yellow",
  GREEN = "green",
  DARK_BLUE = "dark_blue",
}
```

### 4.2 État d'un joueur

```typescript
interface PlayerState {
  id: PlayerId;
  name: string;
  color: string;               // Code couleur hex
  money: number;               // >= 0
  pv: number;                  // 0-5
  pc: number;                  // 0-10 (calculé depuis les cartes Objet)
  position: CellIndex;         // 0-39
  status: PlayerStatus;
  ghostTurnsLeft: number;      // 0 si vivant, 2→1→0 si fantôme

  job: JobType | null;         // null = sans emploi
  lateCounter: number;         // compteur de retards
  hasWorkedSinceLastPay: boolean;

  inventory: CardId[];         // cartes Objet possédées
  specialCards: CardId[];      // cartes Fouille conservables (Carton, Sac, Planque, etc.)
  hasCarFuelDebt: number;      // 0, 1 ou 2 (tours consécutifs sans essence)

  nightAction: NightAction | null; // choix de nuit (null si pas encore choisi)

  // Modificateurs temporaires (durée 1 tour)
  busDisabled: boolean;        // grève des transports
  carDisabled: boolean;        // panne d'essence
}
```

### 4.3 État du jeu

```typescript
interface GameState {
  // Métadonnées
  phase: GamePhase;
  turn: number;                 // 1-based
  currentPlayerIndex: number;   // index dans players[] du joueur actif
  turnOrder: PlayerId[];        // ordre de jeu

  // Joueurs
  players: PlayerState[];

  // Plateau
  buildings: Map<CellIndex, "house" | "hotel">; // bâtiments sur les cases
  marketCards: [CardId | null, CardId | null][]; // 2 marchés × 2 emplacements

  // Pioches
  eventDeck: CardId[];
  eventDiscard: CardId[];
  scavengeDeck: CardId[];
  scavengeDiscard: CardId[];
  objectDeck: CardId[];        // pioche Objet (pour les Marchés)

  // Emploi
  availableJobs: JobType[];    // postes non pourvus

  // Maréchaussée
  dayNightCycle: DayNightCycle;
  marechausseePosition: CellIndex;
  marechausseeMode: MarechausseeMode;

  // Inflation
  foodCost: number;            // coût nourriture actuel (commence à 20)
  buildingsRemaining: number;  // nombre de bâtiments restants

  // Journal
  journal: JournalEntry[];

  // Dés
  lastDiceRoll: number[] | null; // dernier lancer de dés [d1, d2, ...]

  // Phase de nuit — collecte des choix
  nightChoices: Map<PlayerId, NightAction>;
}
```

### 4.4 Définition d'une case

La définition d'une case est **purement mécanique** — elle ne contient aucun texte affiché. Les noms viennent du système de localisation (voir §4.7).

```typescript
interface CellDefinition {
  index: CellIndex;            // 0-39
  type: CellType;
  color?: PropertyColor;       // uniquement pour PROPERTY
  nightCost?: number;          // coût nuitée (maison), uniquement pour PROPERTY
  hotelCost?: number;          // coût nuitée (hôtel), uniquement pour PROPERTY
}
```

### 4.5 Définition d'une carte

La définition d'une carte sépare la **mécanique** (effets, coûts, valeurs) du **contenu textuel** (noms, descriptions). Les textes viennent du système de localisation (voir §4.7).

```typescript
interface CardDefinition {
  id: string;                  // template id (ex: "obj_costume")
  type: "object" | "event" | "scavenge" | "job";
  icon: string;                // emoji ou référence d'icône

  // Objet
  pcValue?: number;            // valeur en PC
  price?: number;              // prix au Marché

  // Événement / Fouille
  effect?: CardEffect;         // effet mécanique

  // Emploi
  salary?: number;
  hireMinPc?: number;
  keepMinPc?: number;
  maxLate?: number;

  copies: number;              // nombre d'exemplaires dans le jeu
  keepable: boolean;           // true si la carte reste dans l'inventaire
}

interface CardEffect {
  moneyDelta?: number;         // +/- argent
  pvDelta?: number;            // +/- PV
  pcDelta?: number;            // +/- PC
  loseObject?: "any" | "cheapest" | "most_expensive" | "left_player_choice";
  disableBus?: boolean;
  disableCar?: boolean;
  destroyCartons?: boolean;    // pluie torrentielle
  drawScavenge?: boolean;      // fouille de nuit
}
```

### 4.7 Système de localisation

La localisation repose sur deux axes indépendants :

**Axe 1 — Langue (lang)** : contrôle tous les textes de l'interface, les noms de cartes, les descriptions, les messages du journal, les labels de l'UI.

**Axe 2 — Thème de lieu (theme)** : contrôle uniquement les noms des 22 cases propriétés et des 4 gares. Tout le reste (cartes, UI, règles) ne dépend pas du thème.

```typescript
// === Thème de lieu ===

interface LocationTheme {
  id: string;                    // "poitiers", "paris", "countries", "monopoly_us"
  label: string;                 // Affiché dans le menu : "Poitiers", "Paris", etc.

  // 22 noms de propriétés, indexés par PropertyColor + position dans le groupe
  propertyNames: Record<PropertyColor, string[]>;

  // 4 noms de gares (2 Petits Boulots + 2 Marchés)
  stationNames: [string, string, string, string];
}

// === Langue ===

interface LangData {
  id: string;                    // "fr", "en"
  label: string;                 // "Français", "English"

  // UI
  ui: {
    newGame: string;             // "Nouvelle partie"
    rules: string;               // "Règles"
    turn: string;                // "Tour"
    phase: string;               // "Phase"
    day: string;                 // "Jour"
    night: string;               // "Nuit"
    food: string;                // "Nourriture"
    shelters: string;            // "Abris"
    money: string;               // "Argent"
    health: string;              // "Santé"
    credibility: string;         // "Crédibilité"
    job: string;                 // "Emploi"
    noJob: string;               // "Sans emploi"
    validate: string;            // "Valider"
    skip: string;                // "Passer"
    continue_: string;           // "Continuer"
    rollDice: string;            // "Lancer les dés"
    // ... (exhaustif dans l'implémentation)
  };

  // Cases spéciales (non-propriétés)
  cells: {
    payday: string;              // "Paie"
    shelter: string;             // "Foyer d'urgence"
    workplace: string;           // "Lieu de Travail"
    roundup: string;             // "Rafle"
    event: string;               // "Événement"
    scavenge: string;            // "Fouille"
    shower: string;              // "Douche publique"
    clinic: string;              // "Centre de soins"
    market: string;              // "Marché"
    petitBoulot: string;         // "Petit Boulot"
    taxIncome: string;           // "Inflation"
    taxLuxury: string;           // "Amende"
  };

  // Cartes — noms et descriptions
  cards: {
    [cardId: string]: {
      name: string;              // "Costume", "Suit"
      description: string;       // "Perdu si dormir dehors", "Lost if sleeping outside"
    };
  };

  // Emplois
  jobs: {
    [jobType: string]: {
      name: string;              // "Cadre", "Executive"
    };
  };

  // Actions de nuit
  nightActions: {
    sleep: { name: string; description: string };
    watch: { name: string; description: string };
    scavenge: { name: string; description: string };
    take: { name: string; description: string };
  };

  // Transports
  transport: {
    car: { name: string };
    bus: { name: string };
    foot: { name: string };
  };

  // Templates de messages du journal (avec placeholders {player}, {card}, {cell}, {amount})
  journal: {
    movement: string;            // "{player} se déplace vers {cell}"
    salary: string;              // "{player} touche son salaire : +{amount}€"
    nightCampPeaceful: string;   // "Nuit paisible. Coûts partagés. +1 PC chacun."
    nightTheft: string;          // "{player} prend {card} de {target} pendant la nuit"
    nightCaught: string;         // "{target} prend {player} sur le fait"
    sleepsOutside: string;       // "{player} dort dehors : -1 PV, -1 PC"
    fired: string;               // "{player} est licencié"
    eliminated: string;          // "{player} est éliminé"
    inflation: string;           // "Inflation ! Nourriture passe à {amount}€"
    condemned: string;           // "L'abri de {cell} est condamné"
    // ... (exhaustif dans l'implémentation)
  };
}
```

#### Résolution d'un nom de case

```typescript
function getCellDisplayName(
  cellIndex: CellIndex,
  board: CellDefinition[],
  lang: LangData,
  theme: LocationTheme
): string {
  const cell = board[cellIndex];

  // Propriétés : nom issu du thème de lieu
  if (cell.type === CellType.PROPERTY) {
    const colorGroup = board
      .filter(c => c.color === cell.color)
      .sort((a, b) => a.index - b.index);
    const posInGroup = colorGroup.indexOf(cell);
    return theme.propertyNames[cell.color!][posInGroup];
  }

  // Gares : nom issu du thème de lieu
  if (cell.type === CellType.PETIT_BOULOT || cell.type === CellType.MARKET) {
    const stations = board.filter(c =>
      c.type === CellType.PETIT_BOULOT || c.type === CellType.MARKET
    ).sort((a, b) => a.index - b.index);
    const posInStations = stations.indexOf(cell);
    return theme.stationNames[posInStations];
  }

  // Cases spéciales : nom issu de la langue
  const typeToKey: Record<string, keyof LangData["cells"]> = {
    [CellType.PAYDAY]: "payday",
    [CellType.SHELTER]: "shelter",
    [CellType.WORKPLACE]: "workplace",
    [CellType.ROUNDUP]: "roundup",
    [CellType.EVENT]: "event",
    [CellType.SCAVENGE]: "scavenge",
    [CellType.SHOWER]: "shower",
    [CellType.CLINIC]: "clinic",
    [CellType.MARKET]: "market",
    [CellType.PETIT_BOULOT]: "petitBoulot",
    [CellType.TAX_INCOME]: "taxIncome",
    [CellType.TAX_LUXURY]: "taxLuxury",
  };

  return lang.cells[typeToKey[cell.type]] ?? "???";
}
```

#### Configuration de partie

La langue et le thème sont choisis à la création de la partie :

```typescript
interface GameConfig {
  lang: string;       // "fr" | "en"
  theme: string;      // "poitiers" | "paris" | "countries" | "monopoly_us"
  playerCount: number;
}
```

Le moteur de jeu ne contient **aucun texte**. Il travaille avec des IDs (cellIndex, cardId, jobType). L'UI résout les textes via `LangData` et `LocationTheme` au moment du rendu.

### 4.6 Entrée du journal

```typescript
interface JournalEntry {
  turn: number;
  phase: GamePhase;
  type: JournalEntryType;
  playerId?: PlayerId;
  targetId?: PlayerId;
  message: string;             // texte lisible
  data?: Record<string, unknown>; // données structurées pour le filtrage
}

enum JournalEntryType {
  MOVEMENT = "movement",
  SALARY = "salary",
  CASE_ACTION = "case_action",
  EVENT_CARD = "event_card",
  SCAVENGE_CARD = "scavenge_card",
  NIGHT_CAMP = "night_camp",
  NIGHT_THEFT = "night_theft",
  NIGHT_CAUGHT = "night_caught",
  NIGHT_CONFRONTATION = "night_confrontation",
  MAINTENANCE = "maintenance",
  FIRED = "fired",
  HIRED = "hired",
  ELIMINATED = "eliminated",
  INFLATION = "inflation",
  BUILDING_CONDEMNED = "building_condemned",
  MARECHAUSSEE = "marechaussee",
  GAME_OVER = "game_over",
}
```

---

## 5. Moteur de jeu

### 5.1 Architecture du moteur

Le moteur est une **machine à états immutable**. Il expose une seule fonction principale :

```typescript
function applyAction(state: GameState, action: GameAction): GameState;
```

Chaque appel prend l'état courant et une action, et retourne un **nouvel état**. L'état précédent n'est jamais muté. Cela garantit :

- **Prédictibilité** : même état + même action = même résultat
- **Debugging** : possibilité de rejouer les actions
- **Testabilité** : chaque transition est testable en isolation
- **Portabilité** : fonctionne côté client et serveur

### 5.2 Actions du moteur

```typescript
type GameAction =
  | { type: "START_GAME"; playerNames: string[]; playerColors: string[] }
  | { type: "DRAFT_PICK"; playerId: PlayerId; cardId: CardId }
  | { type: "DRAFT_VALIDATE"; playerId: PlayerId }
  | { type: "CHOOSE_TRANSPORT"; playerId: PlayerId; mode: TransportMode }
  | { type: "ROLL_DICE"; playerId: PlayerId }
  | { type: "CHOOSE_CELL"; playerId: PlayerId; cellIndex: CellIndex }
  | { type: "CASE_ACTION"; playerId: PlayerId; actionType: string; params?: Record<string, unknown> }
  | { type: "SKIP_ACTION"; playerId: PlayerId }
  | { type: "CHOOSE_NIGHT_ACTION"; playerId: PlayerId; action: NightAction }
  | { type: "RESOLVE_NIGHT" }
  | { type: "NIGHT_CHOOSE_TARGET"; playerId: PlayerId; targetCardId: CardId }
  | { type: "RESOLVE_MAINTENANCE" }
  | { type: "USE_PROTECTION"; playerId: PlayerId; cardId: CardId; use: boolean }
  | { type: "END_TURN" }
  | { type: "MOVE_MARECHAUSSEE" }
  | { type: "PAY_SHELTER_EXIT"; playerId: PlayerId };
```

### 5.3 Validation des actions

Chaque action est validée avant application :

```typescript
function validateAction(state: GameState, action: GameAction): ValidationResult;

interface ValidationResult {
  valid: boolean;
  error?: string; // message d'erreur si invalide
}
```

Le moteur **refuse** les actions invalides (mauvaise phase, joueur pas actif, fonds insuffisants, etc.). En MVP, les actions invalides sont simplement ignorées côté UI. En V1, le serveur renvoie une erreur au client.

### 5.4 Calcul des PC

Les PC ne sont pas stockés directement. Ils sont **calculés** depuis l'inventaire :

```typescript
function computePC(player: PlayerState, cards: Map<string, CardDefinition>): number {
  let pc = 0;
  for (const cardId of player.inventory) {
    const def = cards.get(cardIdToTemplate(cardId));
    if (def?.pcValue) pc += def.pcValue;
  }
  for (const cardId of player.specialCards) {
    const def = cards.get(cardIdToTemplate(cardId));
    if (def?.pcValue) pc += def.pcValue;
  }
  return Math.min(pc, 10);
}
```

Le champ `pc` dans `PlayerState` est une **valeur dénormalisée** mise à jour après chaque changement d'inventaire, pour éviter de recalculer à chaque accès.

### 5.5 Fonctions utilitaires du moteur

```typescript
// Cases accessibles depuis une position avec un résultat de dés
function getReachableCells(position: CellIndex, roll: number, direction: "forward" | "both"): CellIndex[];

// Identifier les Camps (groupes de joueurs sur la même case)
function identifyCamps(state: GameState): Map<CellIndex, PlayerId[]>;

// Vérifier si un joueur peut payer un coût
function canAfford(player: PlayerState, cost: number): boolean;

// Calculer le salaire effectif d'un joueur
function computeSalary(player: PlayerState): number;

// Vérifier les conditions de licenciement
function checkFiring(player: PlayerState, cards: Map<string, CardDefinition>): boolean;

// Calculer le coût de logement partagé en Camp
function computeCampCost(baseCost: number, campSize: number): number;

// Calculer le coût de nourriture en Camp
function computeCampFoodCost(baseFoodCost: number, campSize: number): number;
```

---

## 6. Définition statique du plateau

### 6.1 Les 40 cases

Le plateau est défini comme un tableau de 40 `CellDefinition` **sans noms**. Les noms sont résolus par le système de localisation (§4.7). L'index 0 correspond à la case Départ (Paie), et les cases se suivent dans le sens horaire.

```typescript
const BOARD: CellDefinition[] = [
  // Côté bas (index 0-10)
  { index: 0,  type: CellType.PAYDAY },
  { index: 1,  type: CellType.PROPERTY,     color: PropertyColor.BROWN,      nightCost: 30, hotelCost: 50 },
  { index: 2,  type: CellType.SCAVENGE },
  { index: 3,  type: CellType.PROPERTY,     color: PropertyColor.BROWN,      nightCost: 30, hotelCost: 50 },
  { index: 4,  type: CellType.TAX_INCOME },
  { index: 5,  type: CellType.PETIT_BOULOT },
  { index: 6,  type: CellType.PROPERTY,     color: PropertyColor.LIGHT_BLUE, nightCost: 30, hotelCost: 50 },
  { index: 7,  type: CellType.EVENT },
  { index: 8,  type: CellType.PROPERTY,     color: PropertyColor.LIGHT_BLUE, nightCost: 30, hotelCost: 50 },
  { index: 9,  type: CellType.PROPERTY,     color: PropertyColor.LIGHT_BLUE, nightCost: 30, hotelCost: 50 },
  { index: 10, type: CellType.SHELTER },

  // Côté gauche (index 11-20)
  { index: 11, type: CellType.PROPERTY,     color: PropertyColor.PINK,       nightCost: 60, hotelCost: 100 },
  { index: 12, type: CellType.SHOWER },
  { index: 13, type: CellType.PROPERTY,     color: PropertyColor.PINK,       nightCost: 60, hotelCost: 100 },
  { index: 14, type: CellType.PROPERTY,     color: PropertyColor.PINK,       nightCost: 60, hotelCost: 100 },
  { index: 15, type: CellType.MARKET },
  { index: 16, type: CellType.PROPERTY,     color: PropertyColor.ORANGE,     nightCost: 60, hotelCost: 100 },
  { index: 17, type: CellType.SCAVENGE },
  { index: 18, type: CellType.PROPERTY,     color: PropertyColor.ORANGE,     nightCost: 60, hotelCost: 100 },
  { index: 19, type: CellType.PROPERTY,     color: PropertyColor.ORANGE,     nightCost: 60, hotelCost: 100 },
  { index: 20, type: CellType.WORKPLACE },

  // Côté haut (index 21-30)
  { index: 21, type: CellType.PROPERTY,     color: PropertyColor.RED,        nightCost: 90, hotelCost: 150 },
  { index: 22, type: CellType.EVENT },
  { index: 23, type: CellType.PROPERTY,     color: PropertyColor.RED,        nightCost: 90, hotelCost: 150 },
  { index: 24, type: CellType.PROPERTY,     color: PropertyColor.RED,        nightCost: 90, hotelCost: 150 },
  { index: 25, type: CellType.PETIT_BOULOT },
  { index: 26, type: CellType.CLINIC },
  { index: 27, type: CellType.PROPERTY,     color: PropertyColor.YELLOW,     nightCost: 90, hotelCost: 150 },
  { index: 28, type: CellType.PROPERTY,     color: PropertyColor.YELLOW,     nightCost: 90, hotelCost: 150 },
  { index: 29, type: CellType.MARKET },
  { index: 30, type: CellType.PROPERTY,     color: PropertyColor.YELLOW,     nightCost: 90, hotelCost: 150 },

  // Côté droit (index 31-39)
  { index: 31, type: CellType.ROUNDUP },
  { index: 32, type: CellType.PROPERTY,     color: PropertyColor.GREEN,      nightCost: 120, hotelCost: 200 },
  { index: 33, type: CellType.PROPERTY,     color: PropertyColor.GREEN,      nightCost: 120, hotelCost: 200 },
  { index: 34, type: CellType.SCAVENGE },
  { index: 35, type: CellType.MARKET },
  { index: 36, type: CellType.EVENT },
  { index: 37, type: CellType.PROPERTY,     color: PropertyColor.GREEN,      nightCost: 120, hotelCost: 200 },
  { index: 38, type: CellType.TAX_LUXURY },
  { index: 39, type: CellType.PROPERTY,     color: PropertyColor.DARK_BLUE,  nightCost: 120, hotelCost: 200 },
];
```

> Note : la case Bleu foncé n'a qu'une propriété ici (index 39). L'index 37 est comptée en Vert. À ajuster si on veut 2 cases Bleu foncé comme le Monopoly standard (ajout d'une case supplémentaire ou réaffectation).

### 6.2 Coordonnées visuelles

Pour le rendu SVG, chaque case est associée à des coordonnées (x, y, largeur, hauteur, orientation). Ces coordonnées sont extraites du SVG existant et stockées dans un fichier de mapping séparé :

```typescript
interface CellVisual {
  index: CellIndex;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // 0, 90, 180, 270
}

const CELL_VISUALS: CellVisual[] = [
  // Extraits du SVG template
  { index: 0,  x: 1208, y: 1208, width: 194, height: 194, rotation: 0 },
  { index: 1,  x: 1096, y: 1208, width: 112, height: 194, rotation: 0 },
  // ... (40 entrées)
];
```

---

## 7. Définition des cartes

### 7.1 Cartes Objet (32 cartes, 8 types × 4 exemplaires)

```typescript
const OBJECT_CARDS: CardDefinition[] = [
  { id: "obj_costume",    type: "object", name: "Costume",            icon: "👔", pcValue: 2, price: 150, lossCondition: "Perdu si dormir dehors", copies: 4, keepable: true },
  { id: "obj_car",        type: "object", name: "Voiture",            icon: "🚗", pcValue: 3, price: 400, lossCondition: "Perdue si 2 tours sans essence", copies: 4, keepable: true },
  { id: "obj_hat",        type: "object", name: "Chapeau",            icon: "🎩", pcValue: 1, price: 40,  lossCondition: "Perdu si combat perdu", copies: 4, keepable: true },
  { id: "obj_shoes",      type: "object", name: "Chaussures propres", icon: "👞", pcValue: 1, price: 80,  lossCondition: "Perdu si dormir dehors", copies: 4, keepable: true },
  { id: "obj_hair",       type: "object", name: "Coiffure soignée",   icon: "💇", pcValue: 1, price: 80,  lossCondition: "Perdu si dormir dehors", copies: 4, keepable: true },
  { id: "obj_phone",      type: "object", name: "Téléphone portable", icon: "📱", pcValue: 2, price: 250, lossCondition: "Perdu si argent = 0€", copies: 4, keepable: true },
  { id: "obj_watch",      type: "object", name: "Montre",             icon: "⌚", pcValue: 1, price: 120, lossCondition: "Perdue si combat perdu", copies: 4, keepable: true },
  { id: "obj_bag",        type: "object", name: "Sac / Mallette",     icon: "💼", pcValue: 1, price: 80,  lossCondition: "Perdu si agression", copies: 4, keepable: true },
];
```

### 7.2 Cartes Événement (16 cartes)

```typescript
const EVENT_CARDS: CardDefinition[] = [
  { id: "evt_id_check",     type: "event", name: "Contrôle d'identité",     icon: "👮", effect: { pcDelta: -2 }, copies: 2, keepable: false },
  { id: "evt_samaritan",    type: "event", name: "Bon samaritain",          icon: "🤝", effect: { moneyDelta: 100 }, copies: 2, keepable: false },
  { id: "evt_assault",      type: "event", name: "Agression",               icon: "👊", effect: { pvDelta: -1, loseObject: "any" }, copies: 2, keepable: false },
  { id: "evt_strike",       type: "event", name: "Grève des transports",    icon: "🚌", effect: { disableBus: true }, copies: 2, keepable: false },
  { id: "evt_breakdown",    type: "event", name: "Panne d'essence",         icon: "⛽", effect: { disableCar: true }, copies: 2, keepable: false },
  { id: "evt_food_poison",  type: "event", name: "Intoxication alimentaire",icon: "🤢", effect: { pvDelta: -2 }, copies: 2, keepable: false },
  { id: "evt_rain",         type: "event", name: "Pluie torrentielle",      icon: "🌧️", effect: { destroyCartons: true }, copies: 2, keepable: false },
  { id: "evt_police_raid",  type: "event", name: "Descente de police",      icon: "🚨", effect: { loseObject: "most_expensive" }, copies: 1, keepable: false },
  { id: "evt_pickpocket",   type: "event", name: "Vol à la tire",           icon: "🦹", effect: { loseObject: "left_player_choice" }, copies: 1, keepable: false },
];
```

### 7.3 Cartes Fouille (16 cartes)

```typescript
const SCAVENGE_CARDS: CardDefinition[] = [
  { id: "scv_costume",    type: "scavenge", name: "Costume usé",        icon: "👔", pcValue: 1, lossCondition: "Perdu si dormir dehors", copies: 1, keepable: true },
  { id: "scv_toiletries", type: "scavenge", name: "Articles de toilette",icon: "🚿", pcValue: 1, lossCondition: "Perdu après 2 tours sans douche", copies: 1, keepable: true },
  { id: "scv_food",       type: "scavenge", name: "Nourriture périmée", icon: "🥫", effect: { pvDelta: 1 }, copies: 2, keepable: false },
  { id: "scv_cardboard",  type: "scavenge", name: "Carton solide",      icon: "📦", copies: 2, keepable: true, description: "Protection : annule -1 PV pour une nuit dehors. Perdu si Pluie." },
  { id: "scv_hideout",    type: "scavenge", name: "Planque secrète",    icon: "🏚️", copies: 2, keepable: true, description: "Évite une interaction avec la Maréchaussée. Usage unique." },
  { id: "scv_sellable",   type: "scavenge", name: "Objets revendables", icon: "💰", effect: { moneyDelta: 50 }, copies: 3, keepable: false },
  { id: "scv_meds",       type: "scavenge", name: "Médicaments",        icon: "💊", effect: { pvDelta: 2 }, copies: 2, keepable: false },
  { id: "scv_phone",      type: "scavenge", name: "Vieux téléphone",    icon: "📱", pcValue: 1, lossCondition: "Perdu si agression", copies: 1, keepable: true },
  { id: "scv_sleeping_bag",type: "scavenge",name: "Sac de couchage",    icon: "🛏️", copies: 2, keepable: true, description: "Protection : annule -1 PV pour une nuit dehors. Perdu si vol." },
];
```

### 7.4 Instanciation des cartes

Chaque carte est instanciée avec un ID unique basé sur le template et l'index de copie :

```typescript
function instantiateCards(definitions: CardDefinition[]): CardInstance[] {
  const instances: CardInstance[] = [];
  for (const def of definitions) {
    for (let i = 0; i < def.copies; i++) {
      instances.push({
        instanceId: `${def.id}_${i}`,  // ex: "obj_costume_0", "obj_costume_1"
        templateId: def.id,
      });
    }
  }
  return instances;
}
```

---

## 8. Machine à états — Flux de jeu

### 8.1 Diagramme de transitions

```
SETUP ──► DRAFT ──► MARECHAUSSEE ──► MOVEMENT ──► ACTION
                         ▲                            │
                         │                            ▼
                    END_TURN ◄── MAINTENANCE ◄── NIGHT_RESOLUTION ◄── NIGHT
                         │
                         ▼
                      GAME_OVER
```

### 8.2 Transitions détaillées

```typescript
const TRANSITIONS: Record<GamePhase, { action: string; next: GamePhase; condition?: string }[]> = {
  [GamePhase.SETUP]: [
    { action: "START_GAME", next: GamePhase.DRAFT },
  ],
  [GamePhase.DRAFT]: [
    { action: "DRAFT_PICK", next: GamePhase.DRAFT },
    { action: "DRAFT_VALIDATE", next: GamePhase.DRAFT, condition: "Reste des joueurs à drafter" },
    { action: "DRAFT_VALIDATE", next: GamePhase.MARECHAUSSEE, condition: "Tous les joueurs ont drafté + cycle nuit actif" },
    { action: "DRAFT_VALIDATE", next: GamePhase.MOVEMENT, condition: "Tous les joueurs ont drafté + pas de cycle nuit" },
  ],
  [GamePhase.MARECHAUSSEE]: [
    { action: "MOVE_MARECHAUSSEE", next: GamePhase.MOVEMENT },
  ],
  [GamePhase.MOVEMENT]: [
    { action: "CHOOSE_TRANSPORT", next: GamePhase.MOVEMENT },
    { action: "ROLL_DICE", next: GamePhase.MOVEMENT },
    { action: "CHOOSE_CELL", next: GamePhase.ACTION },
  ],
  [GamePhase.ACTION]: [
    { action: "CASE_ACTION", next: GamePhase.ACTION, condition: "Actions restantes" },
    { action: "SKIP_ACTION", next: GamePhase.MOVEMENT, condition: "Joueur suivant a encore son tour" },
    { action: "SKIP_ACTION", next: GamePhase.NIGHT, condition: "Dernier joueur du tour" },
  ],
  [GamePhase.NIGHT]: [
    { action: "CHOOSE_NIGHT_ACTION", next: GamePhase.NIGHT, condition: "Reste des joueurs en Camp à choisir" },
    { action: "CHOOSE_NIGHT_ACTION", next: GamePhase.NIGHT_RESOLUTION, condition: "Tous les joueurs ont choisi" },
  ],
  [GamePhase.NIGHT_RESOLUTION]: [
    { action: "RESOLVE_NIGHT", next: GamePhase.NIGHT_RESOLUTION, condition: "Se servir nécessite un choix de cible" },
    { action: "NIGHT_CHOOSE_TARGET", next: GamePhase.NIGHT_RESOLUTION },
    { action: "RESOLVE_NIGHT", next: GamePhase.MAINTENANCE, condition: "Résolution complète" },
  ],
  [GamePhase.MAINTENANCE]: [
    { action: "USE_PROTECTION", next: GamePhase.MAINTENANCE },
    { action: "RESOLVE_MAINTENANCE", next: GamePhase.END_TURN },
  ],
  [GamePhase.END_TURN]: [
    { action: "END_TURN", next: GamePhase.MARECHAUSSEE, condition: "Cycle nuit actif" },
    { action: "END_TURN", next: GamePhase.MOVEMENT, condition: "Pas de cycle nuit" },
    { action: "END_TURN", next: GamePhase.GAME_OVER, condition: "Condition de victoire remplie" },
  ],
  [GamePhase.GAME_OVER]: [],
};
```

### 8.3 Gestion du joueur actif

Le `currentPlayerIndex` avance après la phase ACTION de chaque joueur. Quand tous les joueurs ont joué leurs phases MOVEMENT + ACTION, la phase NIGHT commence (simultanée).

```typescript
function nextPlayer(state: GameState): GameState {
  const aliveOrGhost = state.players.filter(
    p => p.status === PlayerStatus.ALIVE || p.status === PlayerStatus.GHOST
  );
  let nextIdx = (state.currentPlayerIndex + 1) % state.players.length;
  while (state.players[nextIdx].status === PlayerStatus.ELIMINATED) {
    nextIdx = (nextIdx + 1) % state.players.length;
  }
  if (nextIdx <= state.currentPlayerIndex) {
    // On a bouclé : tous les joueurs ont joué → phase NIGHT
    return { ...state, phase: GamePhase.NIGHT };
  }
  return { ...state, currentPlayerIndex: nextIdx, phase: GamePhase.MOVEMENT };
}
```

---

## 9. Résolution des actions de nuit

### 9.1 Algorithme

La résolution de la nuit est le calcul le plus complexe du moteur. Elle suit cet algorithme :

```
ENTRÉE : état du jeu avec nightChoices rempli pour tous les joueurs

1. Identifier les Camps (joueurs partageant une case)

2. Pour chaque Camp :
   a. Lister les dormeurs (SLEEP)
   b. Lister les veilleurs (WATCH)
   c. Lister les fouilleurs (SCAVENGE)
   d. Lister les serveurs (TAKE)

   e. Si veilleur(s) présent(s) :
      → Bloquer TOUS les serveurs du Camp
      → Chaque serveur : -1 PC, log "pris sur le fait par [veilleur]"
      → Camp dissous pour la nuit (pas de partage de coûts)

   f. Si PAS de veilleur :
      → Chaque serveur choisit une cible parmi dormeurs + fouilleurs
         (en résolution, le serveur indique quel joueur et quelle carte)
      → La carte est transférée
      → Log "X prend [carte] de Y pendant la nuit"

   g. Si 2+ serveurs ET pas de veilleur :
      → Confrontation entre serveurs (1d6 + nb cartes Objet chacun)
      → Gagnant : prend 1 carte au perdant
      → Perdant : -1 PV
      → Les deux : -1 PC
      → Gagnant peut ensuite se servir chez dormeurs/fouilleurs

   h. Chaque fouilleur : tire une carte Fouille

   i. Calculer les coûts :
      → Si Camp intact (pas de serveur pris, pas de confrontation) :
         - Dormeurs partagent logement 50/50 (ou plus si +2 dormeurs)
         - Nourriture à 60% pour les participants du Camp
         - Dormeurs : +1 PC
      → Si Camp dissous :
         - Chacun paie ses coûts individuellement
         - Pas de bonus PC

3. Pour chaque joueur SEUL :
   → Résoudre logement individuellement (abri ou dehors)
   → Pas de bonus Camp

4. Pour chaque joueur au FOYER :
   → Gratuit, pas de perte

SORTIE : nouvel état avec inventaires, PV, PC, argent mis à jour + journal enrichi
```

### 9.2 Ordre de résolution des serveurs multiples

Si plusieurs serveurs ciblent la même victime, l'ordre de résolution est déterminé par l'ordre de tour. Le premier serveur prend une carte, le second prend une autre carte (si disponible). Si la victime n'a plus de carte, le second vol échoue silencieusement.

### 9.3 Confrontation — détail

```typescript
function resolveConfrontation(
  attacker: PlayerState,
  defender: PlayerState,
  diceRoller: DiceRoller
): ConfrontationResult {
  const attackerRoll = diceRoller.roll(1) + attacker.inventory.length;
  const defenderRoll = diceRoller.roll(1) + defender.inventory.length;

  if (attackerRoll === defenderRoll) {
    // Égalité : relancer (sans bonus)
    const tiebreakA = diceRoller.roll(1);
    const tiebreakD = diceRoller.roll(1);
    // Récursif si encore égalité (max 3 relances puis attaquant gagne)
  }

  return {
    winnerId: attackerRoll > defenderRoll ? attacker.id : defender.id,
    loserId: attackerRoll > defenderRoll ? defender.id : attacker.id,
    attackerRoll,
    defenderRoll,
  };
}
```

---

## 10. Rendu du plateau

### 10.1 Approche

Le plateau est rendu en **SVG inline** dans le DOM. Le fichier SVG existant (`Monopoly Template.svg`) est utilisé comme base. Des couches (layers) sont superposées pour les éléments dynamiques.

```
┌────────────────────────────────┐
│  Couche 0 : SVG du plateau    │  (statique, chargé au démarrage)
├────────────────────────────────┤
│  Couche 1 : Bâtiments         │  (maisons, hôtels — SVG dynamique)
├────────────────────────────────┤
│  Couche 2 : Pions             │  (joueurs + Maréchaussée — SVG dynamique)
├────────────────────────────────┤
│  Couche 3 : Surbrillance      │  (cases accessibles, sélection — SVG dynamique)
├────────────────────────────────┤
│  Couche 4 : Infobulles        │  (HTML overlay positionné en absolu)
└────────────────────────────────┘
```

### 10.2 Intégration du SVG existant

Le SVG de `Monopoly Template.svg` est embarqué dans le HTML en tant qu'élément `<svg>` inline (pas une `<img>`). Cela permet :
- De manipuler les éléments du SVG via le DOM
- D'ajouter des événements (click, hover) sur les cases
- De superposer des couches dynamiques

Le SVG existant est nettoyé au build :
1. Suppression des métadonnées Adobe Illustrator
2. Ajout d'attributs `data-cell-index` sur chaque rectangle de case
3. Attribution d'IDs sémantiques aux groupes de cases

### 10.3 Pions

Chaque pion est un élément SVG positionné sur la case correspondante :

```typescript
function renderPawn(playerId: PlayerId, cellIndex: CellIndex, color: string): SVGElement {
  const cell = CELL_VISUALS[cellIndex];
  const circle = document.createElementNS(SVG_NS, "circle");
  circle.setAttribute("cx", String(cell.x + cell.width / 2));
  circle.setAttribute("cy", String(cell.y + cell.height / 2));
  circle.setAttribute("r", "12");
  circle.setAttribute("fill", color);
  circle.setAttribute("stroke", "#231F20");
  circle.setAttribute("stroke-width", "2");
  return circle;
}
```

Si plusieurs pions sont sur la même case, ils sont décalés en grille (2×3 max) pour rester visibles.

### 10.4 Animation de déplacement

Le déplacement d'un pion est animé case par case :

```typescript
async function animateMovement(
  pawnElement: SVGElement,
  from: CellIndex,
  to: CellIndex,
  direction: "forward" | "backward"
): Promise<void> {
  const path = getPathBetween(from, to, direction);
  for (const cellIndex of path) {
    const target = CELL_VISUALS[cellIndex];
    await animateTo(pawnElement, target.x + target.width/2, target.y + target.height/2, 150);
  }
}
```

Durée par case : 150ms. Trajet complet de 8 cases : ~1.2 secondes.

### 10.5 Indicateur jour/nuit

Un filtre SVG est appliqué sur la couche 0 pour l'ambiance nuit :

```css
.board--night .board-layer-base {
  filter: brightness(0.7) saturate(0.8);
}

.board--night::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(10, 10, 40, 0.3) 100%);
  pointer-events: none;
}
```

---

## 11. Interface utilisateur — Composants

### 11.1 Architecture des composants

Chaque composant UI est une classe TypeScript qui gère un fragment du DOM :

```typescript
interface UIComponent {
  mount(container: HTMLElement): void;   // Insérer dans le DOM
  update(state: GameState): void;        // Mettre à jour selon l'état
  unmount(): void;                       // Retirer du DOM
}
```

Les composants **ne modifient jamais l'état du jeu directement**. Ils émettent des actions via un dispatcher :

```typescript
type ActionDispatcher = (action: GameAction) => void;

class ActionBar implements UIComponent {
  constructor(private dispatch: ActionDispatcher) {}

  private onRollDice() {
    this.dispatch({
      type: "ROLL_DICE",
      playerId: this.currentPlayerId,
    });
  }
}
```

### 11.2 Boucle de rendu

Le pattern est un flux unidirectionnel :

```
Action utilisateur (clic)
    │
    ▼
Dispatch(GameAction)
    │
    ▼
applyAction(state, action) → newState
    │
    ▼
Tous les composants reçoivent update(newState)
    │
    ▼
Le DOM est mis à jour
```

```typescript
class App {
  private state: GameState;
  private components: UIComponent[] = [];

  dispatch = (action: GameAction) => {
    const validation = validateAction(this.state, action);
    if (!validation.valid) return;
    this.state = applyAction(this.state, action);
    for (const component of this.components) {
      component.update(this.state);
    }
  };
}
```

### 11.3 Écran de transition (MVP — passage d'appareil)

Pour les phases secrètes (draft, nuit), un écran de transition masque le contenu :

```typescript
class TransitionScreen implements UIComponent {
  show(playerName: string, onReady: () => void) {
    // Affiche "Passez l'appareil à [playerName]"
    // Bouton "Je suis prêt" → appelle onReady()
    // Pendant ce temps, le contenu du jeu est masqué
  }
}
```

### 11.4 Modale de choix de nuit

Interface pour la phase de nuit en Camp :

```
┌──────────────────────────────────────────┐
│       NUIT — Votre choix, [Alice]        │
│                                          │
│  Vous êtes en Camp avec : Bob, Charlie   │
│  Case : California Drive (abri : 60€)   │
│                                          │
│  ┌──────────┐  ┌──────────┐             │
│  │  DORMIR  │  │ VEILLER  │             │
│  │    😴    │  │    👁️    │             │
│  └──────────┘  └──────────┘             │
│                                          │
│  ┌──────────┐  ┌──────────┐             │
│  │ FOUILLER │  │SE SERVIR │             │
│  │    🔦    │  │    🤚    │             │
│  └──────────┘  └──────────┘             │
│                                          │
│           Timer : ██████░░░░ 14s         │
└──────────────────────────────────────────┘
```

Chaque bouton affiche au survol un détail de l'action (pas d'étiquette morale, juste la description factuelle de l'action).

---

## 12. Système d'événements et journal

### 12.1 Émission d'événements

Chaque fois que `applyAction` modifie l'état, elle ajoute des entrées au journal :

```typescript
function applyAction(state: GameState, action: GameAction): GameState {
  let newState = { ...state };

  switch (action.type) {
    case "CHOOSE_CELL": {
      // ... logique de déplacement ...
      newState.journal = [
        ...newState.journal,
        {
          turn: newState.turn,
          phase: GamePhase.MOVEMENT,
          type: JournalEntryType.MOVEMENT,
          playerId: action.playerId,
          message: `${playerName} se déplace vers ${cellName}`,
          data: { from: oldPosition, to: action.cellIndex, transport: transportMode },
        },
      ];
      break;
    }
    // ...
  }

  return newState;
}
```

### 12.2 Rendu du journal

Le composant Journal reçoit `state.journal` et le rend en HTML :

```typescript
class JournalComponent implements UIComponent {
  update(state: GameState) {
    const entries = state.journal;
    // Filtrage par tour, joueur, catégorie
    // Rendu HTML avec coloration des noms de joueurs
  }

  renderEntry(entry: JournalEntry, players: PlayerState[]): string {
    const player = players.find(p => p.id === entry.playerId);
    const color = player?.color ?? "#888";
    return `<div class="journal-entry journal-entry--${entry.type}">
      <span class="journal-turn">T${entry.turn}</span>
      <span class="journal-message">${this.colorizePlayerNames(entry.message, players)}</span>
    </div>`;
  }
}
```

---

## 13. Générateur de nombres aléatoires

### 13.1 Interface

```typescript
interface DiceRoller {
  roll(count: number): number;    // Lancer `count` d6, retourner la somme
  rollOne(): number;              // Lancer 1d6
  seed?: number;                  // Seed pour la reproductibilité (tests)
}
```

### 13.2 Implémentation MVP

```typescript
class RandomDiceRoller implements DiceRoller {
  roll(count: number): number {
    let sum = 0;
    for (let i = 0; i < count; i++) {
      sum += Math.floor(Math.random() * 6) + 1;
    }
    return sum;
  }

  rollOne(): number {
    return Math.floor(Math.random() * 6) + 1;
  }
}
```

### 13.3 Implémentation pour les tests

```typescript
class SeededDiceRoller implements DiceRoller {
  private sequence: number[];
  private index = 0;

  constructor(sequence: number[]) {
    this.sequence = sequence;
  }

  rollOne(): number {
    return this.sequence[this.index++ % this.sequence.length];
  }

  roll(count: number): number {
    let sum = 0;
    for (let i = 0; i < count; i++) sum += this.rollOne();
    return sum;
  }
}
```

### 13.4 V1 — Dés côté serveur

En V1, les dés sont lancés **côté serveur** pour éviter la triche. Le client reçoit le résultat et joue l'animation correspondante. Le `DiceRoller` est injecté dans le moteur, permettant de passer de `RandomDiceRoller` (client MVP) à un roller serveur (V1) sans changer le moteur.

---

## 14. Extensions V1 — Multijoueur en ligne

### 14.1 Architecture serveur

```typescript
// server.ts
import express from "express";
import { WebSocketServer } from "ws";
import { applyAction, validateAction, GameState, GameAction } from "../engine";

interface Room {
  id: string;
  state: GameState;
  clients: Map<PlayerId, WebSocket>;
}

const rooms = new Map<string, Room>();

wss.on("connection", (ws) => {
  ws.on("message", (raw) => {
    const msg = JSON.parse(raw.toString());

    switch (msg.type) {
      case "CREATE_ROOM":
        // Créer une room, renvoyer le code
        break;
      case "JOIN_ROOM":
        // Ajouter le client à la room
        break;
      case "ACTION":
        // Valider et appliquer l'action
        const room = rooms.get(msg.roomId);
        const validation = validateAction(room.state, msg.action);
        if (validation.valid) {
          room.state = applyAction(room.state, msg.action);
          broadcast(room, { type: "STATE_UPDATE", state: room.state });
        } else {
          ws.send(JSON.stringify({ type: "ERROR", error: validation.error }));
        }
        break;
    }
  });
});
```

### 14.2 Protocole WebSocket

| Message client → serveur | Payload |
|---|---|
| `CREATE_ROOM` | `{ playerName, playerColor }` |
| `JOIN_ROOM` | `{ roomCode, playerName, playerColor }` |
| `READY` | `{ }` |
| `ACTION` | `{ roomId, action: GameAction }` |

| Message serveur → client | Payload |
|---|---|
| `ROOM_CREATED` | `{ roomId, roomCode }` |
| `ROOM_JOINED` | `{ roomId, players }` |
| `PLAYER_JOINED` | `{ player }` |
| `STATE_UPDATE` | `{ state: GameState }` |
| `ERROR` | `{ error: string }` |
| `NIGHT_PHASE_START` | `{ camps, timer }` |
| `NIGHT_PHASE_RESULT` | `{ results }` |

### 14.3 Gestion de la phase de nuit en ligne

1. Le serveur détecte la phase NIGHT et envoie `NIGHT_PHASE_START` à tous les clients
2. Chaque client affiche l'interface de choix de nuit
3. Le client envoie `ACTION { type: "CHOOSE_NIGHT_ACTION", ... }`
4. Le serveur collecte les choix. Il ne les révèle pas tant que tous n'ont pas choisi (ou timer expiré).
5. Timer côté serveur : 20 secondes. À expiration, les joueurs n'ayant pas choisi reçoivent "Dormir" par défaut.
6. Le serveur résout et diffuse `STATE_UPDATE` avec le résultat.

### 14.4 Reconnexion

- Le serveur stocke l'état de la room en mémoire (et optionnellement en SQLite)
- À la reconnexion, le client envoie `JOIN_ROOM` avec son identifiant
- Le serveur renvoie l'état complet de la partie
- Le client reconstruit son affichage depuis l'état

---

## 15. Plan d'implémentation MVP

### 15.1 Lots de développement

| Lot | Contenu | Estimation | Dépendances |
|---|---|---|---|
| **L0 — Fondations** | Setup projet (Vite, TS, Vitest), types, constantes | 0.5j | — |
| **L1 — Moteur : État** | Création d'état, joueurs, plateau statique, pioches | 1j | L0 |
| **L2 — Moteur : Déplacement** | Transport, dés, choix de case, passage Paie | 1j | L1 |
| **L3 — Moteur : Actions de case** | Résolution des 13 types de case | 1.5j | L2 |
| **L4 — Moteur : Nuit** | Camps, 4 actions, matrice de résolution, confrontation | 2j | L3 |
| **L5 — Moteur : Maintenance** | Coûts, vérifications, licenciement, élimination | 1j | L4 |
| **L6 — Moteur : Boucle** | Machine à états, inflation, condamnation, Maréchaussée, Fantôme, victoire | 1.5j | L5 |
| **L7 — Tests moteur** | Tests unitaires de chaque module + tests d'intégration (partie complète) | 2j | L6 |
| **L8 — UI : Structure** | Layout HTML/CSS, écrans, routing, composants vides | 1j | L0 |
| **L9 — UI : Plateau** | Intégration SVG, pions, bâtiments, surbrillance, infobulles | 2j | L8 |
| **L10 — UI : Draft** | Écran de draft, transitions, validation | 1j | L8, L1 |
| **L11 — UI : Déplacement** | Choix transport, animation dés, choix case, animation pion | 1.5j | L9, L2 |
| **L12 — UI : Actions** | Interface contextuelle par type de case, modales de carte | 1.5j | L9, L3 |
| **L13 — UI : Nuit** | Interface de choix, transitions, écran de résolution | 2j | L9, L4 |
| **L14 — UI : Maintenance & Journal** | Écran maintenance, journal filtrable, notifications | 1j | L9, L5 |
| **L15 — UI : Fin & Polish** | Écran fin, statistiques, ambiance jour/nuit, responsive, sons | 1.5j | L14 |
| **L16 — Intégration** | Connexion moteur ↔ UI, test end-to-end en navigateur | 2j | L7, L15 |

**Total estimé : ~23 jours de développement.**

### 15.2 Ordre recommandé

```
L0 → L1 → L2 → L3 → L4 → L5 → L6 → L7 (moteur complet et testé)
       ↘
        L8 → L9 → L10 (UI de base en parallèle)

L7 + L10 → L11 → L12 → L13 → L14 → L15 → L16
```

Le moteur et l'UI de base peuvent avancer en parallèle. L'intégration commence quand les deux sont prêts.

### 15.3 Critères de "done" par lot

Chaque lot est considéré terminé quand :
1. Le code compile sans erreur TypeScript
2. Les tests unitaires passent (couverture ≥ 80% pour le moteur)
3. Les fonctionnalités sont vérifiables manuellement (pour l'UI)
4. Aucune régression sur les lots précédents

---

## 16. Conventions et qualité

### 16.1 Conventions de code

| Aspect | Convention |
|---|---|
| **Nommage fichiers** | kebab-case (`board-renderer.ts`) |
| **Nommage types** | PascalCase (`GameState`, `PlayerState`) |
| **Nommage fonctions** | camelCase (`applyAction`, `computePC`) |
| **Nommage constantes** | UPPER_SNAKE_CASE (`BOARD`, `OBJECT_CARDS`) |
| **Nommage énumérations** | PascalCase pour le type, UPPER_SNAKE_CASE pour les valeurs |
| **Exports** | Named exports uniquement (pas de `export default`) |
| **Immutabilité** | L'état du jeu est traité comme immuable. Spread operator pour les mises à jour. |
| **Null vs undefined** | `null` pour "valeur absente intentionnellement" (ex: `job: null`). `undefined` n'est pas utilisé dans les types. |

### 16.2 Stratégie de test

| Couche | Type de test | Outil | Couverture cible |
|---|---|---|---|
| `engine/` | Unitaire | Vitest | ≥ 80% |
| `engine/` (nuit) | Unitaire + paramétrique | Vitest | 100% des combinaisons |
| `engine/` (intégration) | Simulation de partie | Vitest | 3+ scénarios complets |
| `ui/` | Manuel | Navigateur | Vérification fonctionnelle |

### 16.3 Tests prioritaires

1. **Résolution de nuit** : toutes les combinaisons 2 joueurs (4×4 = 16 cas), les cas 3 joueurs critiques
2. **Calcul économique** : partage de coûts en Camp, inflation, salaires
3. **Machine à états** : chaque transition est testée, les transitions invalides sont rejetées
4. **Cas limites** : 0 PV, 0 argent, 0 PC, plus de bâtiments, pioche vide, draft impossible

### 16.4 Performance

Le MVP n'a pas de contrainte de performance significative (tout est local, pas de réseau). Les points d'attention :

- Le rendu SVG doit rester fluide (pas de reflow complet à chaque mise à jour — ne modifier que les éléments changés)
- Les animations utilisent `requestAnimationFrame` et des transitions CSS, pas de `setInterval`
- Le journal peut croître (100+ entrées en fin de partie) — utiliser un DOM virtuel léger ou du recycling si le scroll devient lent
