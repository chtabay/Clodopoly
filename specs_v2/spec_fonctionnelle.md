# Clodopoly — Spécification Fonctionnelle

> Application web de jeu de plateau multijoueur

**Version :** 1.0
**Statut :** Draft
**Dernière mise à jour :** 2026-02-21
**Document de référence :** `game_design.md` v2.1

---

## Table des matières

1. [Périmètre et versions](#1-périmètre-et-versions)
2. [Parcours utilisateur global](#2-parcours-utilisateur-global)
3. [Écran : Accueil](#3-écran--accueil)
4. [Écran : Création de partie](#4-écran--création-de-partie)
5. [Écran : Draft initial](#5-écran--draft-initial)
6. [Écran : Plateau de jeu](#6-écran--plateau-de-jeu)
7. [Phase de déplacement](#7-phase-de-déplacement)
8. [Phase d'action](#8-phase-daction)
9. [Phase de nuit](#9-phase-de-nuit)
10. [Phase de maintenance](#10-phase-de-maintenance)
11. [Fin de tour et événements globaux](#11-fin-de-tour-et-événements-globaux)
12. [Écran : Fin de partie](#12-écran--fin-de-partie)
13. [Composants UI transversaux](#13-composants-ui-transversaux)
14. [Journal des événements](#14-journal-des-événements)
15. [Gestion des cartes](#15-gestion-des-cartes)
16. [Cas limites et règles de bord](#16-cas-limites-et-règles-de-bord)
17. [Spécificités V1 (multijoueur en ligne)](#17-spécificités-v1-multijoueur-en-ligne)

---

## 1. Périmètre et versions

### 1.1 MVP — Multijoueur local

| Caractéristique | Détail |
|---|---|
| **Plateforme** | Navigateur web (desktop et tablette) |
| **Joueurs** | 2-5 sur le même appareil |
| **Réseau** | Aucun. Tout fonctionne en local, sans serveur. |
| **Persistance** | Aucune. La partie est perdue si la page est fermée. |
| **Choix secrets** | Mécanisme de passage d'écran ("Passez à Joueur X") |
| **IA** | Aucune. Tous les joueurs sont humains. |
| **Langue** | Français uniquement |

### 1.2 V1 — Multijoueur en ligne

| Caractéristique | Détail |
|---|---|
| **Plateforme** | Navigateur web (desktop, tablette, mobile) |
| **Joueurs** | 2-5, chacun sur son propre appareil |
| **Réseau** | WebSocket pour la synchronisation temps réel |
| **Persistance** | Sauvegarde de partie optionnelle (reconnexion possible) |
| **Choix secrets** | Natifs (chaque joueur a son propre écran) |
| **IA** | Hors périmètre V1 |
| **Langue** | Français. Internationalisation préparée mais non implémentée. |

### 1.3 Hors périmètre (toutes versions)

- Mode solo contre IA
- Tchat textuel (V1 : communication vocale externe attendue)
- Personnalisation des règles / variantes
- Classement / comptes utilisateurs
- Monétisation

---

## 2. Parcours utilisateur global

### 2.1 Flux MVP (local)

```
ACCUEIL
  │
  ├─ Nouvelle partie
  │   │
  │   ├─ Création de partie (nombre de joueurs, noms)
  │   │
  │   ├─ Draft initial (chaque joueur compose son profil)
  │   │
  │   ├─ Boucle de jeu ─────────────────────────┐
  │   │   │                                      │
  │   │   ├─ Phase 0 : Maréchaussée (si active)  │
  │   │   ├─ Pour chaque joueur :                │
  │   │   │   ├─ Phase 1 : Déplacement           │
  │   │   │   └─ Phase 2 : Action de case        │
  │   │   ├─ Phase 3 : Nuit (tous, simultané)    │
  │   │   ├─ Phase 4 : Maintenance (résolution)  │
  │   │   ├─ Fin de tour (inflation, vérifs)     │
  │   │   └────── Tour suivant ──────────────────┘
  │   │
  │   └─ Fin de partie (écran résultat)
  │
  └─ Règles du jeu (consultation)
```

### 2.2 Flux V1 (en ligne)

```
ACCUEIL
  │
  ├─ Créer une partie → Obtenir un code / lien
  │   └─ Lobby (attente des joueurs)
  │
  ├─ Rejoindre une partie → Saisir le code / cliquer le lien
  │   └─ Lobby
  │
  ├─ Lobby ──────────────────────────────────┐
  │   ├─ Afficher les joueurs connectés      │
  │   ├─ Hôte : lancer la partie             │
  │   └────── Vers Draft initial ────────────┘
  │
  └─ (Suite identique au MVP)
```

---

## 3. Écran : Accueil

### 3.1 Contenu

L'écran d'accueil est la porte d'entrée du jeu. Il affiche :

- **Titre du jeu** : "Clodopoly" avec sous-titre "Les Billets Restent dans la Boîte"
- **Bouton "Nouvelle partie"** : ouvre l'écran de création
- **Bouton "Règles"** : ouvre un panneau latéral ou une modale avec les règles résumées
- **Version du jeu** en pied de page

### 3.2 Comportement

- Aucune authentification requise (MVP)
- Le bouton "Nouvelle partie" est toujours actif
- Les règles sont consultables à tout moment (y compris pendant la partie)

### 3.3 Ajouts V1

- Bouton "Rejoindre une partie" avec champ de code
- Bouton "Créer une partie en ligne"

---

## 4. Écran : Création de partie

### 4.1 Contenu

| Élément | Type | Détail |
|---|---|---|
| **Nombre de joueurs** | Sélecteur (2-5) | Défaut : 3 |
| **Nom de chaque joueur** | Champ texte | Placeholder : "Joueur 1", "Joueur 2"... Max 12 caractères. |
| **Couleur de chaque joueur** | Sélecteur de couleur | 5 couleurs prédéfinies. Attribution automatique, modifiable. |
| **Langue** | Sélecteur | "Français" (défaut), "English". Contrôle tous les textes de l'interface, des cartes et du journal. |
| **Thème de lieu** | Sélecteur | "Poitiers" (défaut), "Paris", "Pays du monde", "Monopoly US". Contrôle les noms des rues et des gares sur le plateau. |
| **Bouton "Commencer"** | Action | Valide et lance le draft |

Le changement de thème de lieu met à jour en temps réel un aperçu miniature du plateau avec les nouveaux noms de rues affichés.

### 4.2 Validation

- Au moins 2 joueurs requis
- Chaque joueur doit avoir un nom non vide
- Les noms doivent être uniques
- Les couleurs doivent être uniques
- Langue et thème doivent être sélectionnés (valeurs par défaut fournies)

### 4.3 Initialisation à la validation

Quand l'utilisateur clique "Commencer", le moteur de jeu :
1. Crée l'état de partie (voir spec technique)
2. Place aléatoirement 5 maisons et 2 hôtels sur les propriétés
3. Place 2 cartes Objet face visible sur chaque Marché
4. Mélange les pioches Événement et Fouille
5. Place la Maréchaussée sur la case Départ
6. Attribue à chaque joueur : 800€, 5 PV, emploi "Employé", position Départ
7. Détermine l'ordre de draft aléatoirement
8. Passe à l'écran Draft

---

## 5. Écran : Draft initial

### 5.1 Objectif

Chaque joueur compose son profil de départ en choisissant des cartes Objet totalisant exactement 8 PC. La Voiture (3 PC) est obligatoire et pré-attribuée.

### 5.2 Présentation

L'écran est divisé en deux zones :

**Zone haute — Cartes disponibles :**
- Grille de toutes les cartes Objet disponibles (les 32 cartes moins celles déjà prises)
- Chaque carte affiche : nom, icône, valeur PC, prix d'achat (pour référence), condition de perte
- Les cartes non sélectionnables (feraient dépasser 8 PC) sont grisées

**Zone basse — Profil du joueur actif :**
- Nom et couleur du joueur
- Cartes déjà sélectionnées (Voiture pré-placée)
- Compteur de PC : "X / 8 PC"
- Bouton "Valider" (actif uniquement quand total = 8 PC)

### 5.3 Flux du draft

```
Pour chaque joueur (dans l'ordre de draft) :
  1. Afficher "C'est au tour de [Joueur X] de choisir"
  2. Le joueur sélectionne une carte disponible
     → La carte passe dans son profil
     → Le compteur PC est mis à jour
     → Les cartes qui feraient dépasser 8 PC sont grisées
  3. Le joueur peut désélectionner une carte (sauf Voiture)
  4. Quand PC = 8, le bouton "Valider" s'active
  5. Clic sur "Valider" :
     → Les cartes sont retirées du pool
     → Passage au joueur suivant
```

### 5.4 Écran de transition (MVP)

Entre chaque joueur, un écran de transition affiche :
- "Passez l'appareil à **[Joueur suivant]**"
- Bouton "Je suis prêt" (pour éviter que le joueur précédent voie le choix du suivant)

### 5.5 Fin du draft

Quand tous les joueurs ont validé leur profil :
- Les cartes restantes forment la pioche Objet
- La partie commence (écran Plateau de jeu)
- Un récapitulatif rapide s'affiche (3 secondes) montrant le profil public de chaque joueur

---

## 6. Écran : Plateau de jeu

### 6.1 Vue d'ensemble

L'écran principal du jeu. Affiché pendant toute la durée de la partie. Composé de 4 zones :

```
┌──────────────────────────────────────────────────┐
│                 BARRE SUPÉRIEURE                 │
│  Tour N | Phase en cours | Jour/Nuit | Inflation │
├────────────────────┬─────────────────────────────┤
│                    │                             │
│                    │      PANNEAU LATÉRAL        │
│                    │                             │
│      PLATEAU       │  ┌─────────────────────┐   │
│    (vue centrale)  │  │  Fiche joueur actif  │   │
│                    │  ├─────────────────────┤   │
│                    │  │  Résumé des joueurs  │   │
│                    │  ├─────────────────────┤   │
│                    │  │  Actions disponibles │   │
│                    │  ├─────────────────────┤   │
│                    │  │  Journal (réduit)    │   │
│                    │  └─────────────────────┘   │
│                    │                             │
├────────────────────┴─────────────────────────────┤
│                BARRE D'ACTIONS                   │
│  [Lancer les dés] [Valider] [Voir les règles]    │
└──────────────────────────────────────────────────┘
```

### 6.2 Zone Plateau

- Représentation du plateau Monopoly standard, vu du dessus
- Les 40 cases sont identifiables et cliquables
- Les pions des joueurs sont affichés sur leurs cases respectives (couleur du joueur)
- Le pion Maréchaussée est affiché distinctement (icône spécifique)
- Les bâtiments (maisons, hôtels) sont visibles sur les cases correspondantes
- Les cases avec des cartes disponibles (Marchés) affichent un indicateur
- Zoom possible (molette / pinch) pour lire les détails d'une case
- Clic sur une case : affiche une info-bulle avec le type, le coût, les joueurs présents

### 6.3 Barre supérieure

Informations contextuelles toujours visibles :

| Élément | Contenu |
|---|---|
| **Numéro de tour** | "Tour 7" |
| **Phase en cours** | "Déplacement de Joueur A" / "Phase de nuit" / "Maintenance" |
| **Indicateur jour/nuit** | Icône soleil/lune + texte. Grisé si cycle pas encore actif. |
| **Coût nourriture actuel** | "Nourriture : 30€" (mis à jour avec l'inflation) |
| **Bâtiments restants** | "Abris : 5/7" |

### 6.4 Panneau latéral

#### Fiche du joueur actif

Affichée en haut du panneau. Contient :

| Info | Affichage |
|---|---|
| **Nom + couleur** | Pastille de couleur + nom |
| **Argent** | "450€" |
| **PV** | 5 coeurs (pleins/vides) |
| **PC** | Jauge 0-10 avec valeur numérique |
| **Emploi** | "Employé (350€)" ou "Sans emploi" |
| **Transport** | Icône voiture / bus / piéton |
| **Cartes** | Liste déroulante des cartes Objet possédées |
| **Retard travail** | "0/1" (compteur / tolérance) |

#### Résumé des autres joueurs

Liste compacte de tous les joueurs (y compris l'actif) avec pour chacun :
- Nom + couleur
- Argent (valeur exacte, information publique)
- PV (icônes)
- PC (valeur numérique)
- Emploi (icône)
- Position sur le plateau (numéro de case)
- Statut : actif / au Foyer / Fantôme / éliminé

#### Zone d'actions

Contextuelle selon la phase en cours. Affiche les actions disponibles sous forme de boutons. Détaillée dans les sections §7 à §10.

#### Journal (réduit)

Les 3 dernières entrées du journal. Bouton "Voir tout" pour ouvrir le journal complet (voir §14).

### 6.5 Barre d'actions

Barre fixe en bas de l'écran. Contient les boutons d'action principaux, qui changent selon la phase :

| Phase | Boutons affichés |
|---|---|
| Déplacement | [Voiture] [Bus] [À pied] + [Lancer les dés] |
| Choix de case | Cases surbrillance sur le plateau + [Valider] |
| Action | Boutons contextuels (acheter, travailler, etc.) + [Passer] |
| Nuit | [Dormir] [Veiller] [Fouiller] [Se servir] (si en Camp) |
| Maintenance | [Résolution automatique] ou choix si options disponibles |

### 6.6 Responsive

- **Desktop (>1024px)** : plateau à gauche (60%), panneau à droite (40%)
- **Tablette (768-1024px)** : plateau plein écran, panneau en tiroir latéral (swipe ou bouton)
- **Mobile (<768px)** : plateau zoomable plein écran, panneau en overlay bas (bottom sheet). MVP : support tablette minimum, mobile optionnel.

---

## 7. Phase de déplacement

### 7.1 Début de phase

Le jeu indique "C'est au tour de **[Joueur X]** — Phase de déplacement".

En MVP (local), un écran de transition rappelle de passer l'appareil si nécessaire.

### 7.2 Choix du transport

La barre d'actions affiche les modes de transport disponibles :

| Bouton | Condition d'affichage | Info affichée |
|---|---|---|
| **Voiture** | Joueur possède carte Voiture | "2d6 — 30€ essence" |
| **Bus** | Pas de grève active | "1d6+2 — 10€ ticket" |
| **À pied** | Toujours | "1d6 — Gratuit" |

Un mode est **grisé** (non cliquable) si le joueur ne peut pas payer le coût associé (essence, ticket). Le joueur sélectionne un mode.

### 7.3 Lancer de dés

Après sélection du transport, le bouton "Lancer les dés" apparaît.

**Animation de dés :**
- Les dés roulent à l'écran (animation 1-2 secondes)
- Le résultat s'affiche clairement : "Résultat : **8**"
- Pour le bus : afficher "1d6 (X) + 2 = **Y**"

### 7.4 Choix de la case d'arrivée

Après le lancer, les cases accessibles sont **mises en surbrillance** sur le plateau :

- Cases 1 à [résultat] en avant (voiture, bus)
- Cases 1 à [résultat] en avant ET en arrière (à pied)
- La case actuelle n'est PAS sélectionnable (il faut avancer d'au moins 1)

Le joueur **clique sur la case de son choix** parmi les cases surbrillantes.

**Informations affichées** au survol de chaque case accessible :
- Type de case (Quartier, Petit Boulot, Marché, etc.)
- Coût de la nuitée (si Quartier avec bâtiment)
- "Pas d'abri" (si Quartier sans bâtiment)
- Joueurs déjà présents (noms + couleurs)
- "Maréchaussée présente" (si applicable)

### 7.5 Résolution du déplacement

Quand le joueur clique sur une case :
1. Animation du pion se déplaçant case par case
2. Si le pion **passe par la case Paie** en chemin :
   - Vérifier les conditions de salaire
   - Si salaire dû : afficher notification "+ [montant]€ (salaire)" + animation d'argent
   - Si retard : afficher notification "Pas de salaire — retard au travail"
3. Si le pion **passe par la Maréchaussée** (en voiture) :
   - Vérifier le mode de la Maréchaussée
   - Si amende : afficher notification "Amende routière : -30€"
4. Le pion arrive sur la case choisie

### 7.6 Passage automatique

Si le joueur ne peut utiliser aucun transport (pas de voiture, grève du bus, et le joueur choisit quand même de se déplacer) : il va à pied (toujours disponible).

Si le joueur est au **Foyer** : pas de phase de déplacement. Afficher "Vous êtes au Foyer — [X] tour(s) restant(s)". Bouton "Payer 50€ pour sortir" si le joueur a les fonds.

---

## 8. Phase d'action

### 8.1 Principe

Après l'arrivée sur une case, le jeu propose les actions disponibles en fonction du type de case. Les actions sont affichées dans la zone d'actions du panneau latéral et/ou dans la barre d'actions.

### 8.2 Actions par type de case

#### Case Quartier (propriété)

Pas d'action immédiate. Le logement est résolu pendant la phase de Nuit.
Afficher : "[Nom de la rue] — Nuitée : [coût]€" ou "[Nom de la rue] — Pas d'abri disponible".

#### Case Petit Boulot

| Condition | Action affichée |
|---|---|
| Case libre (aucun autre joueur travaillant) | Bouton **"Travailler (+80€)"** |
| Case occupée par un autre travailleur | Message "Poste déjà occupé" — pas d'action |

Le gain est immédiat : notification "+80€" et mise à jour du solde.

#### Case Marché

Afficher les 2 cartes Objet disponibles (ou moins si pioche vide) :
- Nom, icône, valeur PC, prix
- Bouton **"Acheter"** sous chaque carte (grisé si fonds insuffisants)

Le joueur peut acheter 0, 1 ou 2 cartes. Chaque achat est immédiat :
- Carte ajoutée à l'inventaire
- Argent déduit
- Carte remplacée par la suivante de la pioche (si disponible)

Bouton **"Passer"** pour ne rien acheter.

#### Case Douche publique

Bouton **"Se doucher (+1 PC)"** (si PC < 10).
Sinon : message "PC maximum atteint".

#### Case Centre de soins

Bouton **"Se soigner (+1 PV, -50€)"** (si PV < 5 et argent ≥ 50€).
Grisé avec explication si conditions non remplies.

#### Case Événement

Animation de tirage de carte. La carte est affichée en grand au centre de l'écran :
- Nom de l'événement
- Icône
- Effet (texte descriptif)
- Bouton **"OK"** pour appliquer et fermer

L'effet est appliqué immédiatement.

#### Case Fouille

Même animation que Événement. Si la carte est conservable :
- Bouton **"Garder"** (ajoute à l'inventaire)
Si usage unique :
- Bouton **"Utiliser"** (applique l'effet et défausse)

#### Case Lieu de Travail

**Si employé :**
- Message "Vous avez pointé au travail"
- Compteur de retard remis à 0
- Notification si c'est la première fois depuis le dernier salaire : "Prochain passage à la Paie : salaire versé"

**Si sans emploi :**
- Afficher les offres d'emploi (les 3 cartes, celles prises par d'autres joueurs marquées "Pourvu")
- Pour chaque poste disponible : bouton **"Postuler"** (actif si PC ≥ seuil d'embauche)
- Si recommandation possible (autre joueur employé sur la case) : afficher "Recommandé par [Joueur Y] — seuil réduit de 2 PC"

**Si employé ET autre joueur sans emploi présent :**
- Bouton **"Recommander [Joueur Y]"** (action gratuite, pas de coût)

#### Case Foyer d'urgence

- Arrivée : lancer 1d6 pour la durée du séjour
- Afficher "Séjour au Foyer : [X] tour(s)" + animation dé
- Bouton "Payer 50€ pour sortir au prochain tour" (si fonds suffisants)
- Message de rappel : "Logement et repas gratuits. Impossible de travailler."

#### Case Rafle

- Animation du pion envoyé au Foyer
- Message "Rafle ! Vous êtes envoyé au Foyer d'urgence."
- Résolution comme §8.2 Case Foyer

#### Cases Taxe

- **Inflation** : afficher "Taxe : [10% de l'argent ou 20€ min]" + bouton "Payer". Si impossible : notification "-1 PC".
- **Amende** : afficher "Amende : 75€" + bouton "Payer". Si impossible : notification "-1 PC".

### 8.3 Bouton "Passer"

Toujours visible. Permet de passer la phase d'action si aucune action obligatoire n'est en cours. Certaines actions sont obligatoires (taxe, événement) et doivent être résolues avant de passer.

---

## 9. Phase de nuit

### 9.1 Déclenchement

La phase de nuit se déclenche **après que tous les joueurs ont joué leurs phases de Déplacement et d'Action**. C'est une phase **simultanée** : tous les joueurs choisissent en même temps.

### 9.2 Identification des Camps

Le jeu identifie automatiquement les Camps :
- Grouper les joueurs par case
- Cases avec 2+ joueurs = Camp
- Cases avec 1 joueur = joueur seul
- Joueurs au Foyer = hors Camp (abri sûr)
- Joueurs Fantômes = peuvent former un Camp

Afficher un résumé avant le choix :

```
┌─────────────────────────────────────────┐
│            PHASE DE NUIT                │
├─────────────────────────────────────────┤
│                                         │
│  Camp sur California Drive :            │
│    👤 Alice    👤 Bob                   │
│                                         │
│  Camp sur Atlantic Drive :              │
│    👤 Charlie  👤 Diana                 │
│                                         │
│  Seul :                                 │
│    👤 Eve — Kansas Drive (pas d'abri)   │
│                                         │
│  Au Foyer :                             │
│    (personne)                           │
│                                         │
└─────────────────────────────────────────┘
```

### 9.3 Choix des actions (joueurs seuls)

Un joueur seul sur une case n'a pas d'action de nuit à choisir. Sa situation est déterminée :

| Situation | Résolution automatique |
|---|---|
| Case avec bâtiment, peut payer | Dort à l'abri (coût déduit) |
| Case avec bâtiment, ne peut pas payer | Dort dehors (-1 PV, -1 PC) |
| Case sans bâtiment | Dort dehors (-1 PV, -1 PC) |
| Au Foyer | Dort au Foyer (gratuit, pas de perte) |

Pour le joueur seul sur une case avec bâtiment et qui peut payer, une option est proposée : **"Payer [X]€ pour dormir à l'abri"** ou **"Dormir dehors (économiser, mais -1 PV, -1 PC)"**. Ce choix est visible de tous (pas de secret pour les joueurs seuls).

### 9.4 Choix des actions (joueurs en Camp)

#### Séquence MVP (passage d'écran)

Pour chaque Camp identifié :
1. Afficher la liste des joueurs du Camp
2. Pour chaque joueur du Camp, dans un ordre aléatoire :
   a. Écran de transition : "Passez l'appareil à **[Joueur X]** — Les autres, détournez le regard"
   b. Bouton "Je suis prêt"
   c. L'écran de choix s'affiche avec les 4 actions :

```
┌──────────────────────────────────────────┐
│       NUIT — Votre choix, [Alice]        │
│                                          │
│  Vous êtes en Camp avec : Bob            │
│  Case : California Drive (abri : 60€)   │
│                                          │
│  ┌──────────┐  ┌──────────┐             │
│  │  DORMIR  │  │ VEILLER  │             │
│  │  😴      │  │  👁️      │             │
│  │ Repos    │  │ Vigilant │             │
│  │ +1 PC    │  │ +0 PC    │             │
│  │ Coûts /2 │  │ Coûts /2 │             │
│  └──────────┘  └──────────┘             │
│                                          │
│  ┌──────────┐  ┌──────────┐             │
│  │ FOUILLER │  │SE SERVIR │             │
│  │  🔦      │  │  🤚      │             │
│  │ +1 carte │  │ Prendre  │             │
│  │ Fouille  │  │ 1 carte  │             │
│  └──────────┘  └──────────┘             │
│                                          │
│           Timer : 20s                    │
└──────────────────────────────────────────┘
```

   d. Le joueur clique sur une action
   e. Confirmation : "Vous avez choisi : **[action]**" + bouton "Confirmer"
   f. Écran de transition vers le joueur suivant (ou vers la résolution si dernier joueur)

**Timer :** Si le joueur ne choisit pas en 30 secondes, l'action par défaut est **Dormir**.

**Information affichée pour "Se servir" :** Au clic, une sous-vue montre les cartes visibles des autres joueurs du Camp (celles qu'on prendrait). Le choix de la carte spécifique se fait à la résolution (voir §9.5), pas au moment du choix d'action.

### 9.5 Résolution

Une fois tous les choix effectués, l'écran de résolution s'affiche pour tout le monde :

```
┌──────────────────────────────────────────┐
│         RÉSOLUTION DE LA NUIT            │
├──────────────────────────────────────────┤
│                                          │
│  Camp sur California Drive :             │
│    Alice a choisi : DORMIR               │
│    Bob a choisi : DORMIR                 │
│    → Nuit paisible. Coûts partagés.      │
│    → Alice +1 PC, Bob +1 PC             │
│                                          │
│  Camp sur Atlantic Drive :               │
│    Charlie a choisi : DORMIR             │
│    Diana a choisi : SE SERVIR            │
│    → Diana prend le Costume de Charlie   │
│                                          │
│  Seul :                                  │
│    Eve dort dehors. -1 PV, -1 PC.        │
│                                          │
│              [Continuer]                 │
└──────────────────────────────────────────┘
```

#### Résolution "Se servir" — choix de la carte cible

Quand un joueur a choisi "Se servir" et que l'action réussit (la cible dort ou fouille, pas de veilleur), le joueur qui se sert doit choisir quelle carte prendre :

- En MVP : l'écran de résolution s'interrompt. Écran de transition "Passez à [Joueur X]". Le joueur voit les cartes de la victime et clique sur celle qu'il veut prendre. Confirmation. Retour à l'écran de résolution.
- En V1 : le choix apparaît sur l'écran du joueur concerné.

#### Résolution Confrontation (Se servir + Se servir)

Si deux joueurs ont choisi Se servir :
1. Animation de confrontation
2. Chaque joueur lance 1d6 + nombre de cartes Objet (animation de dés)
3. Résultat affiché : "[Joueur A] : 4+3 = 7 vs [Joueur B] : 2+2 = 4"
4. Le gagnant choisit une carte du perdant (même mécanisme que ci-dessus)
5. Notifications : "-1 PV pour [perdant]", "-1 PC pour les deux"

### 9.6 Effets de la Maréchaussée

Si le cycle nuit est actif, **après** la résolution des actions de nuit, vérifier la Maréchaussée :
- Quels joueurs dorment dehors (seuls sans abri, ou ayant choisi de ne pas payer) ?
- La Maréchaussée est-elle sur leur case ou les a-t-elle croisés ?
- Appliquer l'effet selon le mode actuel (Répression / Contraventions / Laxiste)

Afficher les effets dans l'écran de résolution :
```
  Maréchaussée (mode Contraventions) :
    Eve (SDF sur Kansas Drive) : amende 50€
```

---

## 10. Phase de maintenance

### 10.1 Résolution automatique

Après la phase de nuit, la maintenance est résolue automatiquement pour chaque joueur. L'écran affiche un résumé pour chacun :

```
┌──────────────────────────────────────────┐
│           MAINTENANCE — Tour 7           │
├──────────────────────────────────────────┤
│                                          │
│  Alice :                                 │
│    Nourriture : -30€                     │
│    Logement (Camp) : -30€                │
│    Camp : +1 PC                          │
│    Solde : 340€ → 280€                   │
│                                          │
│  Bob :                                   │
│    Nourriture : -30€                     │
│    Logement (Camp) : -30€                │
│    Camp : +1 PC                          │
│    Solde : 210€ → 150€                   │
│                                          │
│  Eve :                                   │
│    Nourriture : -30€ ❌ (pas assez)      │
│    → -1 PV (faim)                        │
│    Logement : dehors                     │
│    → -1 PV, -1 PC                        │
│    PV : 3 → 1 ⚠️                         │
│                                          │
│              [Continuer]                 │
└──────────────────────────────────────────┘
```

### 10.2 Choix si fonds insuffisants pour la nourriture

Si un joueur ne peut pas payer la nourriture ET possède des cartes Objet revendables, le jeu ne force PAS la vente automatique. Le joueur subit simplement -1 PV. C'est un choix implicite : il aurait pu vendre au Marché avant.

### 10.3 Vérification des seuils

Après application des coûts, vérifier dans l'ordre :

1. **PV = 0 ?** → Notification "**[Joueur X] est éliminé !**" + animation. Le joueur passe en mode Fantôme (voir §13.5).

2. **PC < seuil de maintien de l'emploi ?** → Notification "**[Joueur X] est licencié !** PC insuffisants pour le poste de [poste]." La carte emploi est libérée.

3. **Compteur de retard > tolérance ?** → Notification "**[Joueur X] est licencié !** Trop de retards." La carte emploi est libérée.

### 10.4 Utilisation des protections

Si un joueur dort dehors et possède un **Carton solide** ou **Sac de couchage**, le jeu propose automatiquement :
- "Utiliser [Carton solide] pour annuler la perte de PV ? (L'objet sera consommé)" + [Oui] / [Non]

Ce choix est fait **avant** la résolution de la Maintenance (techniquement pendant la phase de nuit ou juste après, mais affiché dans le flux de maintenance pour la clarté).

---

## 11. Fin de tour et événements globaux

### 11.1 Séquence de fin de tour

Après la maintenance de tous les joueurs :

1. **Éliminations** : si des joueurs passent en Fantôme, afficher l'événement.
2. **Avancer le compteur de tour** : Tour N → Tour N+1.
3. **Vérifier l'inflation** (tous les 4 tours) :
   - Si tour multiple de 4 : augmenter le coût de la nourriture de 10€
   - Notification : "**Inflation !** Le coût de la nourriture passe à [X]€."
4. **Condamnation de bâtiment** (tous les 4 tours) :
   - Si tour multiple de 4 : retirer un bâtiment aléatoire du plateau
   - Animation du bâtiment qui disparaît
   - Notification : "**Bâtiment condamné !** L'abri de [case] est fermé."
5. **Vérifier la condition de victoire** : s'il ne reste qu'un joueur avec PV > 0 (hors Fantômes), fin de partie.
6. **Cycle jour/nuit** : si un joueur a dormi dehors ce tour et que le cycle n'est pas encore actif, l'activer. Notification : "**Le cycle nuit s'active.** La Maréchaussée entre en jeu."

### 11.2 Phase 0 du tour suivant — Maréchaussée

Si le cycle nuit est actif, le tour suivant commence par le déplacement de la Maréchaussée :

1. Lancer 2d6 (animation)
2. Déplacer le pion Maréchaussée (animation case par case)
3. Si la Maréchaussée **passe par la case Départ** :
   - Basculer jour ↔ nuit (animation de transition : changement d'ambiance visuelle)
   - Lancer 1d6 pour le comportement (animation)
   - Afficher le mode : "Maréchaussée : mode **[Répression / Contraventions / Laxiste]**"
4. Vérifier si la Maréchaussée croise des joueurs pendant son déplacement (amendes routières de jour, effets de nuit traités en §9.6)

---

## 12. Écran : Fin de partie

### 12.1 Déclenchement

La fin de partie survient quand :
- Il ne reste **qu'un joueur vivant** (PV > 0, hors Fantômes)
- OU le tour **24** est atteint (départage par PV > PC > Argent)

### 12.2 Contenu de l'écran

```
┌──────────────────────────────────────────┐
│                                          │
│           🏆 FIN DE PARTIE 🏆            │
│                                          │
│     [Nom du gagnant] a survécu !         │
│                                          │
│  Dernière personne debout après          │
│  [N] tours de survie.                    │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │        CLASSEMENT FINAL          │    │
│  ├──────────────────────────────────┤    │
│  │  1. Alice — Survécu (2 PV)      │    │
│  │  2. Bob — Éliminé tour 14       │    │
│  │  3. Charlie — Éliminé tour 11   │    │
│  │  4. Diana — Éliminé tour 9      │    │
│  │  5. Eve — Éliminé tour 6        │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │       STATISTIQUES               │    │
│  ├──────────────────────────────────┤    │
│  │  Nuits en Camp : 23              │    │
│  │  Vols réussis : 4                │    │
│  │  Vols échoués (pris sur le fait): 2  ││
│  │  Confrontations : 1              │    │
│  │  Cartes Fouille tirées : 12      │    │
│  │  Bâtiments condamnés : 3         │    │
│  └──────────────────────────────────┘    │
│                                          │
│  [Voir le journal complet]               │
│  [Nouvelle partie]  [Retour à l'accueil] │
│                                          │
└──────────────────────────────────────────┘
```

### 12.3 Statistiques collectées

| Stat | Description |
|---|---|
| Durée (tours) | Nombre total de tours joués |
| Nuits en Camp | Nombre total de nuits où au moins 2 joueurs ont dormi ensemble |
| Vols réussis | Nombre de "Se servir" réussis (cible dormait ou fouillait) |
| Vols échoués | Nombre de "Se servir" bloqués par un veilleur |
| Confrontations | Nombre de "Se servir + Se servir" (combats) |
| Joueur le plus volé | Nom du joueur ayant subi le plus de vols |
| Plus longue alliance | Nombre de nuits consécutives de Camp paisible entre 2 joueurs |
| Tour de la première élimination | Numéro du tour |

---

## 13. Composants UI transversaux

### 13.1 Notification

Bandeau en haut de l'écran, apparaissant brièvement (3-4 secondes) pour signaler un événement :
- Fond coloré selon la nature (vert = gain, rouge = perte, jaune = avertissement, bleu = info)
- Texte court : "+80€ (Petit Boulot)" / "-1 PV (faim)" / "Alice a volé le Costume de Bob"
- Empilable (plusieurs notifications en file)

### 13.2 Modale de carte

Affichage plein écran d'une carte (Événement, Fouille, Objet) :
- Fond semi-transparent
- Carte au centre, grande taille
- Nom, icône, description, effet, valeur PC (si applicable)
- Bouton(s) d'action en bas

### 13.3 Info-bulle de case

Au survol/clic d'une case du plateau :
- Nom de la case
- Type (Quartier, Gare, etc.)
- Coût associé (nuitée, etc.)
- Joueurs présents (pions colorés + noms)
- Bâtiment présent (maison/hôtel/rien)

### 13.4 Animation de dés

- Dés 3D simulés (CSS/Canvas)
- Durée : 1-2 secondes
- Résultat visible après l'animation
- Son optionnel (activable/désactivable)

### 13.5 Indicateur Fantôme

Quand un joueur est en mode Fantôme :
- Son pion devient semi-transparent sur le plateau
- Son nom est barré dans la liste des joueurs
- Un compteur "Fantôme : X tour(s) restant(s)" s'affiche sur sa fiche
- Il peut toujours agir (déplacement à pied, actions de nuit) mais son interface affiche "Vous ne pouvez plus gagner"

### 13.6 Ambiance visuelle jour/nuit

Quand le cycle jour/nuit est actif :
- **Jour** : palette claire, pas de changement majeur
- **Nuit** : filtre sombre sur le plateau (opacité ~30% bleu foncé), étoiles décoratives, icône lune dans la barre supérieure
- La transition jour→nuit est animée (fondu de 1 seconde)

### 13.7 Panneau des règles

Accessible à tout moment via un bouton (icône "?") :
- Panneau latéral ou modale
- Contenu structuré en sections pliables
- Recherche textuelle (V1)
- Référence rapide des coûts toujours visible en premier

---

## 14. Journal des événements

### 14.1 Rôle

Le journal est la **mémoire sociale** du jeu. Il enregistre tous les événements significatifs, tour par tour, et est visible de tous les joueurs à tout moment. Il remplace les marqueurs de méfiance : les joueurs lisent l'historique et tirent leurs propres conclusions.

### 14.2 Contenu enregistré

Chaque entrée du journal contient :

| Catégorie | Exemples d'entrées |
|---|---|
| **Déplacement** | "Alice se déplace en voiture vers California Drive (7 cases)" |
| **Salaire** | "Bob touche son salaire : +350€" |
| **Action de case** | "Charlie travaille au Petit Boulot : +80€" / "Diana achète un Costume au Marché : -150€" |
| **Événement** | "Eve tire Contrôle d'identité : -2 PC" |
| **Fouille** | "Alice trouve un Carton solide" |
| **Actions de nuit** | "Camp sur California Drive : Alice (Dormir), Bob (Dormir) → Nuit paisible" |
| **Vol** | "Diana prend le Téléphone de Charlie pendant la nuit" |
| **Veille** | "Bob prend Diana sur le fait (Se servir échoué)" |
| **Confrontation** | "Alice (7) vs Eve (4) — Alice prend le Chapeau d'Eve. Eve -1 PV." |
| **Maintenance** | "Charlie dort dehors : -1 PV, -1 PC" |
| **Licenciement** | "Eve est licenciée (PC insuffisants)" |
| **Élimination** | "Bob est éliminé (0 PV). Fantôme pendant 2 tours." |
| **Inflation** | "Tour 8 : Inflation ! Nourriture passe à 30€." |
| **Condamnation** | "Tour 8 : L'abri de Vermont Drive est condamné." |
| **Maréchaussée** | "Maréchaussée : mode Contraventions. Eve (SDF) : amende 50€." |

### 14.3 Affichage

**Vue réduite** (dans le panneau latéral) : les 3 dernières entrées. Bouton "Voir tout".

**Vue complète** (modale ou panneau plein) :
- Filtrable par tour
- Filtrable par joueur
- Filtrable par catégorie (vols, combats, éliminations...)
- Défilement vertical
- Entrées les plus récentes en haut

### 14.4 Mise en forme

- Les noms de joueurs sont colorés avec leur couleur
- Les gains sont en vert, les pertes en rouge
- Les actions de nuit sont encadrées dans un bloc distinct (fond sombre)
- Les événements critiques (élimination, licenciement) sont mis en évidence (bordure, icône)

---

## 15. Gestion des cartes

### 15.1 Pioches

Le jeu gère 3 pioches distinctes :

| Pioche | Contenu initial | Recyclage |
|---|---|---|
| **Événement** | 16 cartes | Quand vide : mélanger la défausse |
| **Fouille** | 16 cartes | Quand vide : mélanger la défausse |
| **Objet** | 32 cartes moins celles distribuées au draft | Pas de recyclage. Quand vide, les Marchés n'ont plus de stock. |

### 15.2 Inventaire du joueur

Chaque joueur possède un ensemble de cartes visible dans sa fiche :
- **Cartes Objet** : apportent des PC. Listées avec nom, valeur PC, condition de perte.
- **Cartes Fouille conservables** : listées séparément (Carton, Sac de couchage, Planque, etc.)
- **Carte Emploi** : affichée distinctement (poste actuel ou "Sans emploi")
- **Carte Véhicule** : indicateur dans le transport

L'inventaire est **toujours visible** de tous les joueurs (information publique). Dans le panneau latéral, cliquer sur un autre joueur déploie son inventaire.

### 15.3 Interaction avec les cartes

Un joueur peut, pendant sa phase d'action :
- **Consulter** ses cartes (toujours)
- **Utiliser** une carte à effet immédiat si les conditions sont remplies (ex : Nourriture périmée pour +1 PV)
- **Donner** une carte à un joueur Fantôme ou sur la même case (action libre)

Il ne peut PAS :
- Vendre une carte en dehors d'un Marché
- Échanger directement entre joueurs (pas de troc mécanique — les dons sont unilatéraux)
- Défausser volontairement une carte

---

## 16. Cas limites et règles de bord

### 16.1 Argent négatif

Impossible. Si un joueur ne peut pas payer une dépense obligatoire :
- **Nourriture** : pas payée → -1 PV
- **Logement** : pas payé → dort dehors → -1 PV, -1 PC
- **Amende/Taxe** : pas payée → -1 PC
- **Essence** : pas payée → ne peut pas utiliser la voiture ce tour
- L'argent ne descend jamais sous 0€

### 16.2 PC négatif

Impossible. Le PC ne descend pas sous 0. Les effets qui retirent des PC quand le joueur est à 0 n'ont simplement pas d'effet supplémentaire.

### 16.3 PV au-dessus du maximum

Les PV ne peuvent pas dépasser 5 (le maximum de départ). Les effets de soin qui porteraient au-dessus de 5 sont plafonnés.

### 16.4 Tous les joueurs sur la même case

Camp avec tous les joueurs. Chacun choisit son action de nuit individuellement. Un seul veilleur protège tout le Camp.

### 16.5 Fantôme seul survivant

Impossible par construction : un Fantôme ne peut pas être le dernier vivant car il est déjà éliminé. Si tous les joueurs non-Fantômes sont éliminés simultanément au même tour, le dernier éliminé (celui avec le plus de PV avant le tour fatal) est déclaré vainqueur.

### 16.6 Pas de bâtiments restants

Si tous les bâtiments sont condamnés, plus personne ne peut dormir à l'abri (sauf Foyer). Tous les joueurs dorment dehors chaque tour. Le Camp reste possible : le partage des coûts de nourriture fonctionne, le +1 PC fonctionne, mais les -1 PV/-1 PC de dormir dehors s'appliquent toujours. Le Camp en extérieur protège quand même de la Maréchaussée (deux dormeurs ensemble ne sont pas considérés SDF isolés).

### 16.7 Draft impossible

Si les cartes Objet restantes ne permettent pas d'atteindre exactement 8 PC pour un joueur (cas très rare avec 5 joueurs), le joueur prend ce qu'il peut et commence avec moins de 8 PC. Le jeu ajuste automatiquement.

### 16.8 Pioche Objet vide pendant le draft

Le draft s'arrête quand il n'y a plus assez de cartes. Les joueurs n'ayant pas atteint 8 PC commencent avec moins.

### 16.9 Déconnexion (V1 uniquement)

- Le joueur déconnecté est mis en pause
- Timer de 60 secondes pour la reconnexion
- Si pas de reconnexion : le joueur est joué en "auto" (Dormir par défaut, pas de déplacement, pas d'action)
- Après 3 tours auto : le joueur est éliminé (PV mis à 0)

---

## 17. Spécificités V1 (multijoueur en ligne)

### 17.1 Lobby

| Fonction | Détail |
|---|---|
| **Créer une partie** | Génère un code de 6 caractères et un lien partageable |
| **Rejoindre** | Saisie du code ou clic sur le lien |
| **Affichage** | Liste des joueurs connectés avec nom, couleur, statut "prêt" |
| **Hôte** | Le créateur. Peut lancer la partie quand 2+ joueurs sont prêts. Peut exclure un joueur. |
| **Personnalisation** | Chaque joueur choisit son nom et sa couleur |

### 17.2 Synchronisation

- Toutes les actions sont synchronisées en temps réel via WebSocket
- L'état du jeu est **autoritatif côté serveur** (le serveur valide toutes les actions)
- Les clients envoient des **intentions** ("je choisis Dormir"), le serveur résout et diffuse le résultat
- La phase de nuit est résolue quand **tous les joueurs en Camp ont soumis leur choix** (ou quand le timer expire)

### 17.3 Phase de nuit en ligne

- Chaque joueur voit son propre écran de choix
- Les choix des autres joueurs ne sont **pas visibles** tant que tous n'ont pas choisi
- Timer de 20 secondes. Barre de progression visible. Défaut = Dormir.
- Quand tous ont choisi : résolution affichée simultanément à tous

### 17.4 Latence et animations

- Les animations sont jouées côté client en réponse aux événements serveur
- Si la latence dépasse 2 secondes, afficher un indicateur de chargement
- Les dés sont lancés côté serveur et diffusés ; l'animation client est décorative

### 17.5 Spectateurs (hors périmètre V1)

Pas de mode spectateur en V1. Pourrait être ajouté ultérieurement.
