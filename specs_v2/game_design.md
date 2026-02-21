# Clodopoly — Spécification de Game Design

> *"Les Billets Restent dans la Boîte"*
> Jeu de survie sociale à descente contrôlée, sur plateau de Monopoly

**Version :** 2.1
**Statut :** Draft
**Dernière mise à jour :** 2026-02-21

---

## Table des matières

1. [Vision et philosophie](#1-vision-et-philosophie)
2. [Matériel et composants](#2-matériel-et-composants)
3. [Ressources des joueurs](#3-ressources-des-joueurs)
4. [Le plateau — réinterprétation des cases](#4-le-plateau--réinterprétation-des-cases)
5. [Mise en place](#5-mise-en-place)
6. [Structure d'un tour](#6-structure-dun-tour)
7. [Déplacement](#7-déplacement)
8. [Le Camp et les actions de nuit](#8-le-camp-et-les-actions-de-nuit)
9. [Résolution des cases](#9-résolution-des-cases)
10. [Système d'emploi](#10-système-demploi)
11. [Système de survie et maintenance](#11-système-de-survie-et-maintenance)
12. [Cycle jour/nuit et Maréchaussée](#12-cycle-journuit-et-maréchaussée)
13. [Cartes](#13-cartes)
14. [Pression temporelle et inflation](#14-pression-temporelle-et-inflation)
15. [Élimination et Fantôme](#15-élimination-et-fantôme)
16. [Conditions de victoire](#16-conditions-de-victoire)
17. [Équilibrage économique](#17-équilibrage-économique)
18. [Annexes](#18-annexes)

---

## 1. Vision et philosophie

### 1.1 Concept

Clodopoly est une parodie inversée du Monopoly. Là où le Monopoly simule l'accumulation de richesse, Clodopoly simule la spirale de la précarité. Les joueurs commencent avec un emploi, un logement accessible, un moyen de transport et de l'argent. Tout se dégrade.

Le plateau reste un Monopoly standard, immédiatement reconnaissable. La dissonance entre le jeu de l'accumulation (que le joueur connaît) et le jeu de la survie (qu'il joue) est le propos artistique central.

### 1.2 Thèse ludique

> La précarité est un système où l'on ne remonte pas seul. La solidarité peut stabiliser la chute, mais elle exige une confiance que le système lui-même détruit.

### 1.3 Principes de design

| Principe | Implication |
|---|---|
| **Le pourrissement est le jeu** | Tout le monde descend. La victoire = descendre en dernier. Pas de victoire par accumulation. |
| **Chaque tour est un dilemme** | Le joueur choisit ce qu'il sacrifie, pas ce qu'il gagne. Aucune option n'est "bonne". |
| **La coopération est possible mais fragile** | Deux joueurs solidaires ralentissent leur chute. Mais la trahison est toujours plus rentable à court terme. |
| **Le plateau familier amplifie le message** | On joue la pauvreté sur le plateau de la richesse. Le contraste est le propos. |
| **L'information est publique** | Toutes les ressources sont visibles. Les tensions reposent sur la psychologie, pas sur l'ignorance. |
| **Le dilemme est émergent** | Le jeu ne demande jamais "coopères-tu ou trahis-tu ?". Il offre des actions concrètes dont les conséquences créent naturellement des dilemmes. |

### 1.4 Public et format

- **Joueurs :** 2 à 5
- **Durée :** 25-40 minutes (version numérique)
- **Âge :** 14+
- **Format cible :** Application web (HTML), multijoueur local (MVP) puis en ligne (V1)
- **Langues :** Français (défaut), anglais
- **Thèmes de lieu :** Les noms de rues et de gares sont interchangeables. Thème par défaut : Poitiers. Autres thèmes possibles : Paris, pays du monde, noms Monopoly US classiques. Le thème n'affecte que les noms affichés sur le plateau — les mécaniques, coûts et cartes sont identiques quel que soit le thème.

---

## 2. Matériel et composants

### 2.1 Composants physiques (référence, jeu de plateau)

- 1 plateau Monopoly standard (non modifié)
- 5 pions joueurs
- 1 pion Maréchaussée
- 2 dés à 6 faces
- Billets de banque (coupures : 10€, 20€, 50€, 100€, 200€)
- 16 cartes Événement (ex-Chance)
- 16 cartes Fouille (ex-Communauté)
- 32 cartes Objet (avec valeur PC)
- 3 cartes Emploi
- 5 marqueurs Bâtiment (maisons)
- 2 marqueurs Hôtel
- Marqueurs Méfiance (jetons rouges)
- Piste de PV par joueur (5 cases)

### 2.2 Composants numériques (version web)

Tous les composants ci-dessus sont représentés à l'écran. Les cartes, dés et marqueurs sont gérés par le moteur de jeu. Les choix secrets (actions de nuit) utilisent un mécanisme de passage d'écran (MVP) ou d'écrans séparés (V1 en ligne).

---

## 3. Ressources des joueurs

### 3.1 Le triangle de survie

Chaque joueur gère trois ressources interdépendantes. Dépenser sur un axe revient à renoncer sur les autres.

```
          ARGENT (€)
         /          \
        /    SURVIE   \
       /    TRIANGLE    \
      /                  \
   SANTÉ (PV) ——————— CRÉDIBILITÉ (PC)
```

### 3.2 Argent (€)

- **Plage :** 0 à illimité (en pratique, rarement au-dessus de 1000€)
- **Visibilité :** Publique (tous les joueurs voient le solde de chacun)
- **Fonction :** Payer les coûts obligatoires (nourriture, logement, transport)
- **Sources :** Salaire, petits boulots, fouille, exploitation d'un coopérant
- **Particularité :** L'argent ne génère pas d'argent. Il n'y a pas d'investissement ni de rente. Chaque euro gagné est un euro qui sera dépensé pour survivre.

### 3.3 Crédibilité (PC)

- **Plage :** 0 à 10
- **Visibilité :** Publique
- **Représentation :** Composée de cartes Objet, chacune valant 1 à 3 PC
- **Fonction :** Conditionne l'accès et le maintien de l'emploi, influence les interactions sociales
- **Seuils :**

| Plage PC | Effet |
|---|---|
| 8-10 | Éligible au poste de Cadre. Bonus salaire +10% |
| 5-7 | Éligible au poste d'Employé. Salaire normal |
| 2-4 | Éligible au poste de Précaire uniquement. Salaire réduit si emploi supérieur |
| 0-1 | Perte d'emploi immédiate. Inéligible à tout poste sauf Précaire |

- **Gain de PC :** Achat de cartes Objet (Marché), fouille (cartes Fouille), nuit en Camp (Dormir avec d'autres), douche publique (+1 PC)
- **Perte de PC :** Dormir dehors (-1 PC), événements (cartes Événement), trahison subie (-1 PC), dégradation naturelle des objets

### 3.4 Santé (PV)

- **Plage :** 0 à 5
- **Visibilité :** Publique
- **Fonction :** Mesure la résistance physique. 0 PV = élimination (avec phase Fantôme)
- **Gain de PV :** Centre de soins (+1 PV, coût 50€), nourriture trouvée (carte Fouille), médicaments (carte Fouille), coopération durable
- **Perte de PV :** Dormir dehors (-1 PV), ne pas manger (-1 PV), combat perdu (-1 PV), événements (cartes Événement)

### 3.5 Inventaire

Chaque joueur possède un ensemble de cartes qui représentent ses biens :
- **Cartes Objet** : apportent des PC. Peuvent être perdues (événements, dormir dehors, trahison, combat)
- **Cartes Spéciales** (issues de la Fouille) : effets uniques (protection, revente, soin)
- **Carte Emploi** : indique le poste actuel (ou absent si sans emploi)
- **Carte Véhicule** : si possédée, permet le transport en voiture

Capacité d'inventaire : **pas de limite**.

---

## 4. Le plateau — réinterprétation des cases

### 4.1 Principe

Le plateau Monopoly standard comporte 40 cases. Chaque case conserve son apparence d'origine mais reçoit une nouvelle fonction dans le contexte de Clodopoly.

### 4.2 Cartographie complète

#### Cases Propriétés — Quartiers (22 cases)

Les propriétés sont regroupées par couleur. Chaque groupe de couleur représente un quartier avec un coût de logement spécifique. En début de partie, des bâtiments (maisons/hôtels) sont placés aléatoirement sur certaines propriétés. Seules les cases avec bâtiment offrent un logement.

| Couleur | Nombre de cases | Coût nuitée (maison) | Coût nuitée (hôtel) | Quartier thématique |
|---|---|---|---|---|
| Marron | 2 | 30€ | 50€ | Quartier populaire |
| Bleu clair | 3 | 30€ | 50€ | Banlieue modeste |
| Rose | 3 | 60€ | 100€ | Zone résidentielle |
| Orange | 3 | 60€ | 100€ | Centre-ville bas |
| Rouge | 3 | 90€ | 150€ | Centre-ville |
| Jaune | 3 | 90€ | 150€ | Quartier d'affaires |
| Vert | 3 | 120€ | 200€ | Quartier chic |
| Bleu foncé | 2 | 120€ | 200€ | Quartier luxueux |

**Dormir sur une case Quartier avec bâtiment :** payer le coût de la nuitée. Le joueur conserve ses PV et PC.

**Dormir sur une case Quartier sans bâtiment (ou ne pas pouvoir/vouloir payer) :** dormir dehors. Conséquences : **-1 PV, -1 PC**. Risque d'interaction avec la Maréchaussée si cycle nuit actif.

#### Gares — Petits Boulots et Marchés (4 cases)

Les 4 gares du plateau sont réassignées :

| Gare | Nouvelle fonction | Effet |
|---|---|---|
| Gare 1 (bas) | **Petit Boulot** | Gagner 80€. Un seul joueur par tour. |
| Gare 2 (gauche) | **Marché** | Acheter des cartes Objet face visible (2 cartes disponibles, se renouvellent quand achetées). Prix = valeur indiquée sur la carte. |
| Gare 3 (haut) | **Petit Boulot** | Gagner 80€. Un seul joueur par tour. |
| Gare 4 (droite) | **Marché** | Acheter des cartes Objet face visible (2 cartes disponibles). |

#### Services Publics (2 cases)

| Case | Nouvelle fonction | Effet |
|---|---|---|
| Compagnie d'électricité | **Douche publique** | +1 PC (gratuit). Utilisable une fois par passage. |
| Compagnie des eaux | **Centre de soins** | +1 PV (coût 50€). Utilisable une fois par passage. |

#### Cases Événement (ex-Chance) — 3 cases

Tirer une carte de la pioche Événement. Résoudre immédiatement.

#### Cases Fouille (ex-Communauté) — 3 cases

Tirer une carte de la pioche Fouille. Résoudre immédiatement ou conserver selon la carte.

#### Cases spéciales (6 cases)

| Case originale | Nouvelle fonction | Effet |
|---|---|---|
| **GO (Départ)** | **Paie** | Toucher son salaire au passage (si employé). Montant selon le poste et les PC. |
| **Prison / Simple visite** | **Foyer d'urgence** | Logement gratuit + repas gratuit. Mais impossible de travailler. Séjour : 1 à 3 tours (1d6 : 1-2 = 1 tour, 3-4 = 2 tours, 5-6 = 3 tours). Sortie anticipée : payer 50€. |
| **Parking gratuit** | **Lieu de Travail** | Case où le joueur "travaille". Nécessaire pour valider un cycle de salaire. Case de recrutement pour les sans-emploi. |
| **Allez en prison** | **Rafle** | Le joueur est envoyé directement au Foyer d'urgence. |
| **Taxe de luxe** | **Amende** | Payer 75€ à la banque. Si impossible, -1 PC. |
| **Impôt sur le revenu** | **Inflation** | Payer 10% de son argent (minimum 20€). Si impossible, -1 PC. |

---

## 5. Mise en place

### 5.1 Préparation du plateau

1. Placer le plateau au centre (physique) ou afficher à l'écran (numérique)
2. Placer **5 maisons** aléatoirement sur 5 propriétés différentes (une par case, pas de doublon de couleur si possible)
3. Placer **2 hôtels** aléatoirement sur 2 propriétés différentes (cases différentes des maisons)
4. Placer **2 cartes Objet face visible** sur chaque case Marché
5. Mélanger les pioches Événement et Fouille séparément
6. Placer le pion Maréchaussée sur la case Départ

### 5.2 Distribution aux joueurs

Chaque joueur reçoit :

| Ressource | Quantité | Détail |
|---|---|---|
| **Argent** | 800€ | Répartition : 4×100€, 4×50€, 4×20€, 8×10€ |
| **PC de départ** | 8 PC | Composés par draft de cartes Objet (voir §5.3) |
| **PV** | 5 | Maximum |
| **Emploi** | Employé | Salaire 350€ |
| **Position** | Case Départ | Tous les joueurs commencent au même endroit |

### 5.3 Draft initial des cartes Objet

Le draft donne au joueur son identité de départ et constitue sa **première vraie décision**.

1. Étaler toutes les cartes Objet face visible au centre de la table
2. Déterminer l'ordre de draft aléatoirement
3. Chaque joueur, à tour de rôle, prend **une carte Objet** de son choix
4. Continuer jusqu'à ce que chaque joueur ait exactement **8 PC** en cartes
5. La carte **Voiture** (3 PC) est **obligatoire** pour chaque joueur
6. Les cartes restantes forment la pioche Objet (utilisée pour les Marchés et la Fouille)

**Contrainte :** Le total des PC des cartes choisies doit faire exactement 8. Comme la Voiture coûte 3 PC, il reste 5 PC à répartir librement.

**Exemples de compositions valides :**
- Voiture (3) + Costume (2) + Téléphone (2) + Chapeau (1) = 8 PC
- Voiture (3) + Costume (2) + Montre (1) + Chaussures (1) + Sac (1) = 8 PC
- Voiture (3) + Téléphone (2) + Coiffure (1) + Chaussures (1) + Chapeau (1) = 8 PC

**Implications stratégiques :**
- Moins de cartes = objets de valeur, mais chaque perte est catastrophique
- Plus de cartes = résilience aux pertes, mais objets moins impactants individuellement

---

## 6. Structure d'un tour

### 6.1 Séquence d'un tour de jeu

Un tour de jeu se compose de 4 phases jouées dans l'ordre. Les phases 1 et 2 sont jouées séquentiellement par chaque joueur. La phase 3 (Nuit) est résolue **simultanément** pour tous les joueurs. La phase 4 (Maintenance) est résolue individuellement.

```
┌─────────────────────────────────────────────┐
│                  DÉBUT DU TOUR              │
├─────────────────────────────────────────────┤
│  0. Maréchaussée (si cycle nuit actif)      │
│     → Lancer 2d6, avancer la Maréchaussée   │
│     → Si passage case Départ : jet de       │
│       comportement (1d6) + bascule jour/nuit│
├─────────────────────────────────────────────┤
│  Pour chaque joueur (sens horaire) :        │
│                                             │
│  1. PHASE DE DÉPLACEMENT                    │
│     → Choisir le mode de transport          │
│     → Lancer les dés correspondants         │
│     → Choisir la case d'arrivée (1 à résultat)│
│                                             │
│  2. PHASE D'ACTION                          │
│     → Résoudre l'effet de la case           │
│     → Effectuer les actions possibles       │
│                                             │
│  3. PHASE DE NUIT (simultanée, tous joueurs)│
│     → Chaque joueur choisit secrètement     │
│       son action de nuit (voir §8)          │
│     → Résolution simultanée                 │
│                                             │
│  4. PHASE DE MAINTENANCE                    │
│     → Payer la nourriture (selon Camp)      │
│     → Résoudre le logement (selon Camp)     │
│     → Vérifier les seuils (emploi, PV)      │
├─────────────────────────────────────────────┤
│                  FIN DU TOUR                │
│  → Vérifier les éliminations               │
│  → Avancer le compteur de tours            │
│  → Appliquer l'inflation (si tour multiple  │
│    de 4)                                    │
└─────────────────────────────────────────────┘
```

### 6.2 Passage de la case Paie (Départ)

Quand un joueur **passe par** ou **s'arrête sur** la case Paie au cours de son déplacement, il touche son salaire si et seulement si :
- Il possède un emploi
- Il a validé un passage par le Lieu de Travail depuis son dernier salaire

Si le joueur n'a pas de passage validé au Travail, le salaire n'est pas versé et le compteur de retard est incrémenté (voir §10 Système d'emploi).

---

## 7. Déplacement

### 7.1 Modes de transport

| Transport | Condition | Dés | Portée | Direction | Coût par tour | Risque |
|---|---|---|---|---|---|---|
| **Voiture** | Posséder carte Voiture | 2d6 | 2-12 cases | Avant uniquement | 30€ (essence) | Amende si dépasse la Maréchaussée (30€) |
| **Bus** | Aucune | 1d6+2 | 3-8 cases | Avant uniquement | 10€ (ticket) | Indisponible si carte Grève active |
| **À pied** | Aucune | 1d6 | 1-6 cases | Avant **ou** arrière | Gratuit | Aucun |

### 7.2 Choix de la case d'arrivée

Après le lancer de dés, le joueur **choisit** sur quelle case s'arrêter parmi toutes les cases entre 1 et le résultat du lancer (inclus). Il n'est pas obligé d'utiliser tout le résultat.

**Exemples :**
- Voiture, jet de 8 → le joueur peut s'arrêter sur n'importe quelle case entre 1 et 8 cases devant lui
- À pied, jet de 4 → le joueur peut s'arrêter entre 1 et 4 cases devant **ou** derrière lui
- Bus, jet de 5 (1d6) + 2 = 7 → le joueur peut s'arrêter entre 1 et 7 cases devant lui

**Conséquence stratégique :** Le joueur peut viser :
- Un autre joueur (pour former un Camp — ou profiter de sa présence)
- Un bâtiment disponible (pour dormir à l'abri)
- Le Lieu de Travail (pour pointer)
- Un Petit Boulot ou Marché
- Éviter la Maréchaussée
- Fuir un joueur en qui il n'a plus confiance

### 7.3 Passage par des cases intermédiaires

Si le joueur passe par (sans s'arrêter) :
- **La case Paie** : il touche son salaire (si conditions remplies)
- **La Maréchaussée** (en voiture) : risque d'amende

Les autres cases intermédiaires n'ont aucun effet si le joueur ne s'y arrête pas.

### 7.4 Perte du véhicule

Si le joueur possède une Voiture mais ne peut pas payer l'essence (30€), il **doit** choisir un autre mode de transport pour ce tour. Si cela arrive 2 tours consécutifs, la carte Voiture est défaussée.

---

## 8. Le Camp et les actions de nuit

### 8.1 Philosophie

Le jeu ne demande jamais au joueur "coopères-tu ou trahis-tu ?". Il lui propose des **actions concrètes** — dormir, veiller, fouiller, se servir — dont les conséquences dépendent de ce que les autres font au même moment. Les dilemmes sociaux émergent de la structure des incitations, pas d'un choix étiqueté.

Un joueur qui prend le manteau d'un autre ne se dit pas "je trahis". Il se dit "j'ai froid et ce manteau est là". C'est au joueur dépouillé, et aux témoins, de qualifier l'acte. Le jeu, lui, ne juge pas — il résout des actions.

### 8.2 Le Camp

#### Formation

Quand **deux joueurs ou plus terminent un tour sur la même case**, ils partagent un espace commun : le **Camp**. Le Camp n'est pas un accord ni un contrat. C'est la conséquence naturelle de la proximité — on est au même endroit, on partage l'espace.

**Exceptions :** Pas de Camp sur les cases Paie, Foyer, et Rafle.

#### Avantages du Camp

Être en Camp ouvre des bénéfices qui n'existent pas quand on est seul :

| Bénéfice | Effet | Condition |
|---|---|---|
| **Partage de l'abri** | Le coût de la nuitée est divisé par le nombre d'occupants (arrondi au supérieur) | La case a un bâtiment et au moins deux joueurs choisissent Dormir |
| **Partage de la nourriture** | Le coût de la nourriture passe à 60% par personne | Au moins deux joueurs choisissent Dormir |
| **Lien social** | +1 PC par joueur | Deux joueurs ou plus choisissent Dormir sur la même case |
| **Protection mutuelle** | Immunité contre la Maréchaussée pour la nuit | Deux joueurs ou plus choisissent Dormir ensemble |
| **Protection partagée** | Un objet de protection (Carton, Sac de couchage) protège tous les dormeurs | Le porteur de l'objet choisit Dormir |

Le Camp est **mécaniquement avantageux**. Être à plusieurs est toujours mieux qu'être seul, en termes de coûts et de PC. C'est cette attractivité qui crée la tentation de la proximité.

#### Le prix de la proximité

Mais la proximité a un coût : **les affaires de chacun sont accessibles**. Un joueur qui dort dans le même abri qu'un autre expose ses cartes. Rien ne protège mécaniquement les biens d'un dormeur — sauf la présence d'un veilleur.

### 8.3 Les actions de nuit

#### Principe

Chaque tour, à la **phase de Nuit** (après les phases de Déplacement et d'Action, avant la Maintenance), **tous les joueurs choisissent simultanément et secrètement** ce qu'ils font pendant la nuit.

Un joueur **seul** sur une case a deux options :
- Payer le logement (si bâtiment disponible)
- Dormir dehors

Un joueur **en Camp** (partageant une case avec d'autres) a **quatre actions possibles** :

| Action | Description concrète |
|---|---|
| **Dormir** | Se coucher et se reposer. Profiter des avantages du Camp. Ses cartes restent posées à côté de lui — accessibles. |
| **Veiller** | Rester éveillé pour surveiller ses affaires et le camp. Pas de bonus social (+0 PC au lieu de +1). Mais impossible d'être volé, et tout joueur qui tente de Se servir à proximité est pris sur le fait. |
| **Fouiller** | Quitter le camp pendant la nuit pour chercher des ressources dans les environs. Tirer une carte Fouille. Mais ses affaires restent au camp sans surveillance. |
| **Se servir** | Prendre un objet qui appartient à un autre joueur présent. Prendre **une carte** dans l'inventaire d'un joueur qui a choisi Dormir ou Fouiller (absent ou endormi). |

#### Choix simultané et secret

Les actions de nuit sont choisies **en même temps par tous les joueurs**, sans connaître le choix des autres. C'est la seule mécanique secrète du jeu.

**En version locale (MVP) :** Le jeu affiche un écran de choix pour chaque joueur tour à tour ("Passez l'appareil au Joueur X — les autres, détournez le regard"). Tous les choix sont révélés simultanément une fois que chaque joueur a choisi.

**En version en ligne (V1) :** Chaque joueur voit le choix sur son propre écran. Un timer de 20 secondes est imposé. Pas de choix = Dormir par défaut.

**Joueurs seuls sur leur case :** Ils choisissent uniquement entre payer le logement ou dormir dehors. Pas d'action de Camp. Leur choix peut être fait en même temps que les autres joueurs en Camp.

### 8.4 Résolution des combinaisons

Les actions se résolvent selon les combinaisons naturelles entre chaque paire de joueurs sur la même case.

#### Dormir + Dormir

Nuit paisible. Les deux joueurs bénéficient du Camp : coûts partagés, +1 PC chacun, protection mutuelle contre la Maréchaussée. C'est le meilleur résultat collectif.

#### Dormir + Veiller

Le dormeur se repose normalement (+1 PC, coûts partagés). Le veilleur ne dort pas bien (+0 PC, mais les coûts restent partagés — il est quand même dans l'abri). Pas d'incident. Le veilleur a sacrifié du repos pour la tranquillité d'esprit — ou pour rien, si personne n'a tenté quoi que ce soit.

#### Dormir + Fouiller

Le dormeur se repose. Le fouilleur tire une carte Fouille et revient au petit matin. Les coûts d'abri restent partagés (le fouilleur a quitté le camp mais y revient). Pas d'incident direct, mais les affaires du fouilleur sont restées sans surveillance pendant son absence.

#### Dormir + Se servir

Le serveur prend **une carte au choix** dans l'inventaire du dormeur. Le dormeur se réveille le lendemain avec une carte en moins. Le vol est constaté au matin — tout le monde voit le résultat dans le journal de la partie. Il n'y a pas de confrontation : le dormeur dormait.

Le serveur bénéficie du Camp pour ce tour (il était là, il a partagé les coûts normalement avant d'agir). Il ne reçoit **aucun marqueur ni pénalité mécanique**. Les conséquences sont **sociales** : les autres joueurs voient ce qui s'est passé et agissent en conséquence dans les tours suivants.

#### Veiller + Se servir

Le serveur est **pris sur le fait** par le veilleur. La tentative échoue : aucune carte n'est prise. Le serveur perd **1 PC** (honte publique). Le Camp est **dissous** : les joueurs sont considérés comme séparés pour le reste de la nuit (plus de partage de coûts ni de bonus PC pour ce tour). Chacun paie ses coûts individuellement.

#### Fouiller + Se servir

Le serveur se sert dans les affaires du fouilleur, qui est parti chercher des ressources et n'est pas là pour protéger ses biens. Prise d'**une carte**. Le fouilleur revient avec sa carte Fouille mais découvre la disparition d'un objet.

#### Se servir + Se servir

Les deux joueurs sont éveillés et cherchent à prendre. Ils se surprennent mutuellement. **Confrontation** : chacun lance **1d6 + nombre de cartes Objet possédées**. Le plus haut score gagne. En cas d'égalité, relancer (sans bonus).
- Le **gagnant** prend une carte au choix dans l'inventaire du perdant
- Le **perdant** subit **-1 PV**
- Les **deux** joueurs subissent **-1 PC** (la violence dégrade tout le monde)
- Le Camp est dissous pour la nuit.

#### Veiller + Veiller

Les deux joueurs se regardent toute la nuit sans dormir. Personne ne se repose bien : +0 PC pour les deux. Les coûts d'abri restent partagés (ils sont dans le même espace). Pas d'incident.

#### Veiller + Fouiller

Le veilleur garde le camp. Le fouilleur part et tire une carte Fouille. Les affaires du fouilleur sont en sécurité (le veilleur est là). Coûts partagés. Pas d'incident.

#### Fouiller + Fouiller

Les deux joueurs quittent le camp pour fouiller. Chacun tire une carte Fouille. Mais le camp est **vide** : si un troisième joueur était présent et avait choisi Se servir, il se servirait dans les affaires des deux fouilleurs sans opposition.

### 8.5 Camp à 3+ joueurs

Quand 3 joueurs ou plus partagent une case, chacun choisit **une seule action de nuit** (pas une action par paire). La résolution s'applique globalement :

- Les **dormeurs** partagent les coûts entre eux et gagnent +1 PC chacun
- Un **veilleur** protège tous les dormeurs et lui-même : toute tentative de Se servir à proximité d'un veilleur échoue
- Un **fouilleur** tire une carte mais laisse ses affaires accessibles (sauf si un veilleur est présent)
- Un **serveur** peut prendre une carte d'un dormeur ou d'un fouilleur absent, **sauf** s'il y a un veilleur dans le Camp
- Si **plusieurs serveurs** et **aucun veilleur** : confrontation entre les serveurs (voir Se servir + Se servir), puis le gagnant peut se servir chez les dormeurs/fouilleurs

**Exemple (3 joueurs : A dort, B fouille, C se sert) :**
- A dort : bénéficie du partage, +1 PC, mais vulnérable
- B fouille : tire une carte Fouille, affaires sans surveillance
- C se sert : prend une carte chez A ou B (au choix de C)
- Résultat : C a pris, A ou B a perdu. Le journal affiche ce qui s'est passé.

**Exemple (3 joueurs : A dort, B veille, C se sert) :**
- A dort : bénéficie du partage, +1 PC, protégé par B
- B veille : +0 PC, mais prend C sur le fait
- C se sert : **échoue** (B veillait). C perd 1 PC.
- Résultat : le veilleur a protégé le camp. Le serveur est exposé.

### 8.6 Pourquoi le dilemme émerge

Le jeu ne dit jamais "coopère ou trahis". Il propose quatre actions concrètes. Mais la structure des incitations crée naturellement des tensions :

**Si je pense que l'autre va Dormir :**
- Dormir moi aussi = nuit parfaite pour les deux. Optimal collectivement.
- Se servir = je gagne une carte gratuite. Optimal individuellement.
- Le dilemme : est-ce que je fais confiance ?

**Si je pense que l'autre va Veiller :**
- Se servir = je suis pris sur le fait. Catastrophique.
- Dormir = je dors bien, il veille pour rien. Sûr pour moi.
- Le calcul : est-ce qu'il a des raisons de se méfier ?

**Si je pense que l'autre va Se servir :**
- Dormir = je me fais voler. Catastrophique.
- Veiller = je le prends sur le fait. Satisfaction et sécurité.
- Le calcul : est-ce que je le connais assez pour anticiper ?

Le joueur ne choisit jamais entre "bien" et "mal". Il choisit entre des actions qui ont du sens dans sa situation. Et c'est **l'accumulation de ces choix** — sur plusieurs tours, avec les mêmes joueurs — qui crée les dynamiques de confiance, de méfiance, d'alliance et de rupture.

### 8.7 Le dilemme macro — au-delà de la nuit

Les actions de nuit ne sont que la partie la plus visible du dilemme. La structure du jeu tout entière génère des tensions émergentes :

**Le dilemme du mouvement.** Le joueur choisit où s'arrêter (dans sa fenêtre de dés). Rejoindre un autre joueur = accès au Camp (économies, PC) mais aussi exposition (vol). Éviter les autres = sécurité mais coûts pleins. Le jeu ne demande pas "veux-tu être social ?". Il demande "sur quelle case t'arrêtes-tu ?".

**Le dilemme de l'emploi.** Il n'y a que 3 postes pour 5 joueurs. Recommander quelqu'un pour un poste (voir §10.5), c'est créer un concurrent. Laisser quelqu'un au chômage, c'est affaiblir un potentiel partenaire de Camp. Le jeu ne dit pas "aide ou trahis". Il dit "il y a 3 postes et vous êtes 5".

**Le dilemme temporel.** La coopération ralentit la descente de tout le monde. Mais il n'y a **qu'un seul gagnant**. À un moment, il faut que les autres tombent. Quand bascule-t-on de "on s'entraide" à "chacun pour soi" ? Le jeu ne pose pas la question. Le joueur y arrive seul, quand l'inflation et la raréfaction des bâtiments rendent la coopération insuffisante.

**Le dilemme du Fantôme.** Un joueur éliminé a encore 2 tours d'existence (voir §15). Il ne peut plus gagner. À qui donne-t-il ses dernières cartes ? À celui qui l'a aidé ? À celui qui l'a trahi, pour acheter la paix ? Le jeu ne guide pas. Le Fantôme agit librement.

### 8.8 L'historique comme mémoire sociale

Le jeu ne comporte **aucun marqueur de méfiance** ni étiquette morale. Il n'y a pas de compteur de "trahisons".

À la place, la version numérique maintient un **journal des événements de nuit**, visible de tous les joueurs :

```
Tour 4 — Camp sur California Drive (A, B)
  A : Dormir | B : Dormir → Nuit paisible

Tour 7 — Camp sur Atlantic Drive (A, B, C)
  A : Dormir | B : Se servir | C : Veiller
  → B prend le Costume de A
  → C n'a rien vu (A et B étaient de l'autre côté)

Tour 9 — Camp sur States Drive (A, B)
  A : Veiller | B : Se servir
  → B pris sur le fait. B perd 1 PC.
```

Les joueurs lisent ce journal et **tirent leurs propres conclusions**. Le jeu ne punit pas, ne récompense pas, ne juge pas. Il enregistre. La punition et la récompense viennent des **autres joueurs**, à travers leurs choix futurs de mouvement, de Camp, et d'actions de nuit.

---

## 9. Résolution des cases

### 9.1 Cases Quartier (propriétés)

**Avec bâtiment :**
- Le joueur **peut** payer la nuitée pour dormir à l'abri
- S'il paie : aucune perte de PV ni PC liée au logement
- S'il ne paie pas (choix ou incapacité) : dormir dehors (voir §9.2)

**Sans bâtiment :**
- Le joueur **doit** dormir dehors (pas d'option de logement)

### 9.2 Dormir dehors

Conséquences applicables en phase de Maintenance :
- **-1 PV**
- **-1 PC**
- Si cycle nuit actif : risque d'interaction avec la Maréchaussée (voir §12)
- Si le joueur possède un **Carton solide** ou un **Sac de couchage** : annule la perte de PV (mais pas la perte de PC). L'objet de protection est **consommé** (défaussé après usage).

### 9.3 Cases Petit Boulot (2 gares)

- Le joueur gagne **80€** immédiatement
- **Un seul joueur** peut occuper un Petit Boulot par tour. Si un autre joueur est déjà sur la case (y compris de ce tour), le Petit Boulot n'est pas disponible — mais le Camp se forme quand même pour la nuit
- Un joueur avec emploi peut quand même faire un Petit Boulot (cumul autorisé)

### 9.4 Cases Marché (2 gares)

- **2 cartes Objet** sont exposées face visible sur chaque Marché
- Le joueur peut acheter une ou plusieurs cartes au prix indiqué
- Quand une carte est achetée, elle est immédiatement remplacée par la prochaine carte de la pioche Objet
- Si la pioche Objet est vide, le Marché n'a plus de stock

### 9.5 Douche publique (1 service public)

- Le joueur gagne **+1 PC** (gratuit)
- Utilisable **une seule fois par passage** (pas de boucle en revenant sur la case)
- Ne peut pas dépasser 10 PC

### 9.6 Centre de soins (1 service public)

- Le joueur gagne **+1 PV** (coût : 50€)
- Utilisable **une seule fois par passage**
- Ne peut pas dépasser 5 PV
- Si le joueur ne peut pas payer : pas de soin

### 9.7 Cases Événement (3 cases)

Tirer la carte du dessus de la pioche Événement. Appliquer l'effet immédiatement. Défausser la carte. Si la pioche est vide, mélanger la défausse pour reconstituer la pioche.

### 9.8 Cases Fouille (3 cases)

Tirer la carte du dessus de la pioche Fouille. Selon la carte :
- **Effet immédiat** : appliquer et défausser
- **Objet conservable** : le joueur ajoute la carte à son inventaire

### 9.9 Case Paie (Départ)

Voir §6.2 et §10.

### 9.10 Case Lieu de Travail (Parking Gratuit)

- Si le joueur est **employé** : il "pointe". Son compteur de retard est remis à zéro. Le prochain passage par la case Paie déclenchera le versement du salaire.
- Si le joueur est **sans emploi** : il peut consulter les offres d'emploi (3 cartes Emploi face visible) et postuler s'il remplit les conditions de PC minimum. L'embauche est immédiate.
- Si un autre joueur employé est présent : possibilité de **Recommandation** (voir §10.5).

### 9.11 Case Foyer d'urgence (Prison)

- Le joueur bénéficie d'un **logement et de repas gratuits** pour la durée de son séjour
- Durée du séjour : lancer 1d6 à l'arrivée (1-2 = 1 tour, 3-4 = 2 tours, 5-6 = 3 tours)
- **Sortie anticipée** : payer 50€
- **Pendant le séjour** : le joueur ne peut pas se déplacer, ne peut pas travailler, ne peut pas faire de Petit Boulot. Son compteur de retard au travail continue de s'incrémenter.
- Le Foyer est un **abri sûr** : pas de Camp possible, pas d'actions de nuit entre joueurs, pas d'effet de la Maréchaussée

### 9.12 Case Rafle (Allez en Prison)

Le joueur est immédiatement déplacé au Foyer d'urgence. Il ne touche pas son salaire même s'il passe par la case Paie.

### 9.13 Cases Taxe

- **Inflation (Impôt sur le revenu)** : payer 10% de son argent (minimum 20€). Si impossible : -1 PC.
- **Amende (Taxe de luxe)** : payer 75€. Si impossible : -1 PC.

---

## 10. Système d'emploi

### 10.1 Les trois postes

| Poste | Salaire de base | PC embauche (min) | PC maintien (min) | Retards tolérés | Bonus PC 8+ |
|---|---|---|---|---|---|
| **Cadre** | 500€ | 8 PC | 6 PC | 0 | 550€ |
| **Employé** | 350€ | 5 PC | 3 PC | 1 | 385€ |
| **Précaire** | 200€ | 2 PC | 1 PC | 3 | 220€ |

### 10.2 Cycle de salaire

Le salaire est versé quand **les deux conditions** suivantes sont remplies :
1. Le joueur passe par la **case Paie** (Départ)
2. Le joueur a visité le **Lieu de Travail** au moins une fois depuis son dernier salaire

Si la condition 2 n'est pas remplie, c'est un **retard** :
- Le salaire n'est pas versé
- Le compteur de retard est incrémenté de 1
- Si le compteur de retard dépasse la tolérance du poste → **licenciement**

### 10.3 Licenciement

Un joueur est licencié si :
- Son **compteur de retard** dépasse la tolérance de son poste
- Ses **PC tombent sous le seuil de maintien** de son poste

Le licenciement est **immédiat** :
- La carte Emploi est retournée face visible dans les offres
- Le joueur ne touche plus de salaire
- Il peut postuler à un nouveau poste en se rendant au Lieu de Travail

### 10.4 Embauche

Pour être embauché :
1. Se rendre sur la case **Lieu de Travail**
2. Choisir parmi les postes **disponibles** (les 3 cartes Emploi sont toujours visibles ; un poste est disponible s'il n'est détenu par personne)
3. Avoir les **PC minimum d'embauche** requis
4. L'embauche est immédiate. Le joueur reçoit la carte Emploi.

**Contrainte :** Il n'y a que **3 cartes Emploi** pour tout le jeu. Si tous les postes sont pris, un joueur sans emploi doit attendre qu'un poste se libère (licenciement d'un autre joueur). Avec 4-5 joueurs, il y a structurellement des sans-emploi.

### 10.5 Recommandation

Quand un joueur employé et un joueur sans emploi se trouvent sur la case Lieu de Travail en même temps, le joueur employé peut **recommander** le sans-emploi :
- Le joueur recommandé bénéficie d'un **bonus de -2 PC** sur le seuil d'embauche (ex : Employé accessible dès 3 PC au lieu de 5)
- Le recommandant n'a aucun coût mécanique immédiat
- **Risque stratégique** : si le recommandé obtient un meilleur poste, il peut devenir un concurrent. Si les PC du recommandant baissent, l'autre pourrait garder le poste à sa place.

---

## 11. Système de survie et maintenance

### 11.1 Coûts obligatoires (phase de Maintenance)

À la fin de chaque tour, le joueur doit payer ses coûts de survie :

| Dépense | Coût | Obligatoire ? | Conséquence si impayé |
|---|---|---|---|
| **Nourriture** | 20€ (base, augmente avec l'inflation) | Oui | -1 PV |
| **Logement** | Selon le quartier (0€ si Foyer ou dehors) | Non (choix de dormir dehors) | Dormir dehors : -1 PV, -1 PC |
| **Essence** | 30€ si voiture utilisée | Seulement si voiture utilisée | Pas de pénalité immédiate (voir §7.4) |

### 11.2 Vérification des seuils

Après le paiement des coûts, vérifier dans l'ordre :
1. **PV ≤ 0 ?** → Le joueur est éliminé (passe en mode Fantôme, voir §15)
2. **PC < seuil de maintien de l'emploi ?** → Licenciement immédiat
3. **Compteur de retard > tolérance ?** → Licenciement immédiat

### 11.3 Récapitulatif des pertes et gains de ressources

#### Pertes de PV
| Cause | Perte |
|---|---|
| Dormir dehors | -1 PV |
| Ne pas manger | -1 PV |
| Perdre un combat (Confrontation) | -1 PV |
| Carte Événement (Intoxication alimentaire) | -2 PV |
| Carte Événement (Agression) | -1 PV |

#### Gains de PV
| Cause | Gain |
|---|---|
| Centre de soins | +1 PV (coût 50€) |
| Carte Fouille (Nourriture périmée) | +1 PV |
| Carte Fouille (Médicaments) | +2 PV |

#### Pertes de PC
| Cause | Perte |
|---|---|
| Dormir dehors | -1 PC |
| Pris sur le fait en tentant de Se servir | -1 PC |
| Confrontation (Se servir + Se servir, les deux joueurs) | -1 PC |
| Carte Événement (Contrôle d'identité) | -2 PC |
| Carte Événement (Pluie torrentielle) | Perte des Cartons |
| Carte Événement (Agression) | Perte d'un objet |
| Carte Événement (Vol à la tire) | Perte d'un objet |
| Carte Événement (Descente de police) | Perte d'un objet |
| Ne pas pouvoir payer une taxe | -1 PC |

#### Gains de PC
| Cause | Gain |
|---|---|
| Douche publique | +1 PC |
| Nuit en Camp (Dormir avec au moins un autre dormeur) | +1 PC |
| Achat carte Objet (Marché) | Valeur PC de la carte |
| Carte Fouille (Costume usé, etc.) | +1 PC |
| Carte Fouille (Articles toilette) | +1 PC |

---

## 12. Cycle jour/nuit et Maréchaussée

### 12.1 Activation du cycle

- **En début de partie** : pas de cycle nuit. Pas de Maréchaussée active.
- **Activation** : dès qu'un joueur dort dehors pour la première fois, le cycle jour/nuit s'active au tour suivant.

### 12.2 Fonctionnement du cycle

- La Maréchaussée se déplace de **2d6** au début de chaque tour (avant les joueurs)
- Elle avance dans le **sens horaire**
- Quand la Maréchaussée **passe par la case Départ** : bascule jour↔nuit et jet de comportement (1d6)

### 12.3 Comportement de la Maréchaussée

| Jet (1d6) | Mode | Effet de nuit | Effet de jour |
|---|---|---|---|
| 1-2 | **Répression** | Tout joueur SDF (dormant dehors) croisé ou sur la même case est envoyé au Foyer | Aucun effet spécial |
| 3-4 | **Contraventions** | Amende de 50€ à tout joueur SDF croisé ou sur la même case | Amende de 30€ à tout joueur en voiture croisé |
| 5-6 | **Laxiste** | Aucun effet | Aucun effet |

### 12.4 "Croisé" — définition

La Maréchaussée "croise" un joueur si, lors de son déplacement de 2d6, elle **passe par** ou **atterrit sur** une case occupée par un joueur.

### 12.5 Éviter la Maréchaussée

- **Carte Planque secrète** (Fouille) : annule une interaction avec la police (usage unique)
- **Camp** : les joueurs qui dorment ensemble dans un Camp (au moins 2 joueurs ayant choisi Dormir) bénéficient d'une protection mutuelle contre la Maréchaussée pour la nuit
- **Foyer d'urgence** : la Maréchaussée n'affecte pas les joueurs au Foyer
- **Ne pas dormir dehors** : la Maréchaussée n'affecte que les joueurs SDF (dormant dehors)

---

## 13. Cartes

### 13.1 Cartes Événement (16 cartes)

| Carte | Exemplaires | Effet |
|---|---|---|
| **Contrôle d'identité** | ×2 | -2 PC |
| **Bon samaritain** | ×2 | +100€ |
| **Agression** | ×2 | -1 PV, perte d'une carte Objet (au choix du joueur) |
| **Grève des transports** | ×2 | Bus indisponible pour le joueur au prochain tour |
| **Panne d'essence** | ×2 | Voiture inutilisable au prochain tour |
| **Intoxication alimentaire** | ×2 | -2 PV |
| **Pluie torrentielle** | ×2 | Toutes les cartes Carton solide du joueur sont défaussées |
| **Descente de police** | ×1 | Confiscation d'une carte Objet (la plus chère en PC) |
| **Vol à la tire** | ×1 | Perte d'une carte Objet (choisie par le joueur à gauche) |

### 13.2 Cartes Fouille (16 cartes)

| Carte | Exemplaires | Type | Effet |
|---|---|---|---|
| **Costume usé** | ×1 | Conservable | +1 PC. Perdu si dormir dehors. |
| **Articles de toilette** | ×1 | Conservable | +1 PC. Perdu après une nuit sans douche (2 tours sans passer par la Douche publique). |
| **Nourriture périmée** | ×2 | Usage unique | +1 PV. |
| **Carton solide** | ×2 | Conservable | Protection : annule -1 PV pour une nuit dehors. Perdu si carte Pluie torrentielle. |
| **Planque secrète** | ×2 | Usage unique | Évite une interaction avec la Maréchaussée. |
| **Objets revendables** | ×3 | Usage unique | +50€. |
| **Médicaments** | ×2 | Usage unique | +2 PV (max 5). |
| **Vieux téléphone** | ×1 | Conservable | +1 PC. Perdu si Agression. |
| **Sac de couchage** | ×2 | Conservable | Protection : annule -1 PV pour une nuit dehors. Perdu si Vol à la tire. |

### 13.3 Cartes Objet (32 cartes)

Les cartes Objet servent à la fois de réserve de PC et de biens échangeables/volables.

| Carte | Exemplaires | Prix (Marché) | Valeur PC | Condition de perte |
|---|---|---|---|---|
| **Costume** | ×4 | 150€ | 2 PC | Perdu si dormir dehors |
| **Voiture** | ×4 | 400€ | 3 PC | Perdue si 2 tours consécutifs sans essence |
| **Chapeau** | ×4 | 40€ | 1 PC | Perdu si combat perdu |
| **Chaussures propres** | ×4 | 80€ | 1 PC | Perdu si dormir dehors |
| **Coiffure soignée** | ×4 | 80€ | 1 PC | Perdu si dormir dehors |
| **Téléphone portable** | ×4 | 250€ | 2 PC | Perdu si argent = 0€ |
| **Montre** | ×4 | 120€ | 1 PC | Perdue si combat perdu |
| **Sac / Mallette** | ×4 | 80€ | 1 PC | Perdu si Agression |

### 13.4 Cartes Emploi (3 cartes)

Voir §10.1. Les 3 cartes sont toujours visibles (soit tenues par un joueur, soit exposées comme offres d'emploi sur la case Travail).

---

## 14. Pression temporelle et inflation

### 14.1 Objectif

Empêcher les parties de stagner. Garantir que le jeu converge vers une fin en un nombre raisonnable de tours. Créer un sentiment d'urgence croissante.

### 14.2 Inflation alimentaire

Tous les **4 tours**, le coût de la nourriture augmente de **10€** :

| Tours | Coût nourriture |
|---|---|
| 1-4 | 20€ |
| 5-8 | 30€ |
| 9-12 | 40€ |
| 13-16 | 50€ |
| 17-20 | 60€ |
| 21+ | 70€ |

### 14.3 Condamnation de bâtiments

Tous les **4 tours**, un bâtiment aléatoire est **condamné** (retiré du plateau). Les options de logement se raréfient.

| Tours | Bâtiments restants (sur 7 initiaux) |
|---|---|
| 1-4 | 7 |
| 5-8 | 6 |
| 9-12 | 5 |
| 13-16 | 4 |
| 17-20 | 3 |
| 21+ | 2 |

### 14.4 Effet combiné

La combinaison de l'inflation et de la raréfaction des logements crée une pression exponentielle :
- Tours 1-8 : la survie est gérable avec un emploi
- Tours 9-16 : la survie exige de la coopération ou des sacrifices constants
- Tours 17+ : la survie est quasi-impossible, les éliminations s'enchaînent

---

## 15. Élimination et Fantôme

### 15.1 Condition d'élimination

Un joueur est éliminé quand ses **PV atteignent 0** (après résolution de tous les effets du tour).

### 15.2 Phase Fantôme

Le joueur éliminé ne quitte pas immédiatement la partie. Il devient un **Fantôme** pour **2 tours** :

| Capacité | Fantôme peut ? |
|---|---|
| Se déplacer (à pied uniquement, 1d6) | Oui |
| Participer aux actions de nuit (Camp) | Oui |
| Donner des cartes volontairement | Oui |
| Se faire voler des cartes | Oui |
| Travailler / toucher un salaire | Non |
| Gagner la partie | Non |
| Payer des coûts de maintenance | Non (il est déjà "mort") |

### 15.3 Rôle du Fantôme

Le Fantôme est un **agent de chaos et de justice**. Ses motivations sont purement sociales :
- Il peut donner ses cartes restantes à un allié qui l'a aidé
- Il peut rejoindre un joueur qui l'a dépouillé pour Se servir à son tour une dernière fois
- Il peut influencer le résultat final par ses dernières actions

Après 2 tours, le Fantôme est définitivement retiré du jeu. Ses cartes restantes sont défaussées.

---

## 16. Conditions de victoire

### 16.1 Règle principale

Le **dernier joueur avec PV > 0** remporte la partie.

### 16.2 Fin par temps

Si après **24 tours** personne n'est éliminé (improbable mais possible à 2 joueurs), le joueur avec le plus de PV gagne. En cas d'égalité : le plus de PC. En cas de nouvelle égalité : le plus d'argent. En cas de triple égalité : les deux joueurs "survivent" (victoire partagée).

### 16.3 Partie à 2 joueurs

Avec 2 joueurs, la tension sociale est plus intense (il n'y a qu'une seule relation à gérer, chaque action de nuit est lourde de conséquences). La partie est plus courte. Ajustement recommandé :
- Inflation accélérée : tous les **3 tours** au lieu de 4
- Départ avec 600€ au lieu de 800€

---

## 17. Équilibrage économique

### 17.1 Budget type d'un joueur (premiers tours)

Avec un emploi d'Employé (350€/salaire), un joueur paie par cycle (environ 4-5 tours entre deux salaires) :

| Poste | Coût par tour | Coût par cycle (5 tours) |
|---|---|---|
| Nourriture | 20€ | 100€ |
| Logement (quartier moyen) | 60€ | 300€ |
| Bus | 10€ | 50€ |
| **Total** | **90€** | **450€** |

**Salaire par cycle : 350€. Déficit : -100€ par cycle.**

C'est **volontaire**. Le joueur est structurellement déficitaire même avec un emploi. Il doit compléter par des Petits Boulots (80€), de la Fouille, ou de la coopération. Le message du jeu : même en travaillant, on ne s'en sort pas.

### 17.2 Impact du Camp (Dormir + Dormir)

Deux joueurs qui dorment ensemble sur la même case partagent les coûts :

| Poste | Coût par tour (seul) | Coût par tour (Camp, 2 dormeurs) |
|---|---|---|
| Nourriture | 20€ | 12€ (60%) |
| Logement | 60€ | 30€ (50%) |
| Bus | 10€ | 10€ |
| **Total** | **90€** | **52€** |

**Coût par cycle en Camp : 260€. Salaire 350€. Excédent : +90€.**

Le Camp transforme un déficit en excédent. C'est ce qui rend la proximité **mécaniquement nécessaire**. Mais pour obtenir ce bénéfice, il faut choisir Dormir — et dormir, c'est s'exposer.

### 17.3 Impact de Se servir

Un joueur qui choisit Se servir contre un dormeur gagne une carte et bénéficie quand même du partage des coûts pour le tour (il était dans le Camp avant d'agir). Gain immédiat : une carte + économies. Mais :
- Le journal de nuit enregistre l'acte — visible de tous
- La victime et les témoins ajustent leur comportement dans les tours suivants
- Le joueur qui vole perd des partenaires de Camp potentiels, donc revient aux coûts pleins

Le "coût" de Se servir n'est pas mécanique — il est **stratégique et social**. C'est ce qui rend le calcul non trivial : le gain est immédiat et certain, le coût est futur et incertain.

### 17.4 Valeurs clés à playtester

| Paramètre | Valeur initiale | Plage de test |
|---|---|---|
| Argent de départ | 800€ | 600-1000€ |
| PV de départ | 5 | 4-6 |
| PC de départ (draft) | 8 | 7-10 |
| Coût nourriture base | 20€ | 15-30€ |
| Incrément inflation | +10€ tous les 4 tours | +5-15€, tous les 3-5 tours |
| Salaire Employé | 350€ | 300-400€ |
| Coût logement moyen | 60€ | 40-80€ |
| Gain Petit Boulot | 80€ | 60-100€ |
| Coût Centre de soins | 50€ | 30-70€ |

---

## 18. Annexes

### 18.1 Glossaire

| Terme | Définition |
|---|---|
| **PC** | Points de Crédibilité (0-10). Représentent le statut social perçu. |
| **PV** | Points de Vie (0-5). Représentent la santé physique. |
| **SDF** | Joueur sans logement pour le tour en cours (dort dehors). |
| **Camp** | Espace partagé quand 2+ joueurs sont sur la même case. Partage des coûts et bonus de PC. |
| **Dormir** | Action de nuit. Se reposer dans le Camp. Bénéficier des avantages. Être vulnérable. |
| **Veiller** | Action de nuit. Rester éveillé. Protège contre le vol. Pas de bonus PC. |
| **Fouiller** | Action de nuit. Quitter le camp pour chercher des ressources. Ses affaires sont sans garde. |
| **Se servir** | Action de nuit. Prendre une carte d'un dormeur ou d'un fouilleur absent. Risque si un veilleur est présent. |
| **Confrontation** | Combat résultant de deux joueurs qui tentent de Se servir simultanément. |
| **Fantôme** | Joueur éliminé qui reste actif pour 2 tours supplémentaires. |
| **Journal** | Historique des actions de nuit, visible de tous. Mémoire sociale du jeu. |
| **Cycle** | Période entre deux passages par la case Paie (~4-6 tours). |
| **Inflation** | Augmentation progressive des coûts de nourriture (+10€ tous les 4 tours). |
| **Condamnation** | Retrait d'un bâtiment du plateau (tous les 4 tours). |
| **Draft** | Phase initiale de sélection des cartes Objet. |

### 18.2 Aide-mémoire par tour

```
1. Maréchaussée bouge (si cycle nuit actif)
2. Choisir transport → Lancer dés → Choisir case
3. Résoudre l'effet de la case
4. Phase de nuit (simultanée) :
   → Seul : payer logement ou dormir dehors
   → En Camp : choisir Dormir / Veiller / Fouiller / Se servir
   → Résolution simultanée des actions
5. Maintenance : nourriture + logement + vérifications
```

### 18.3 Référence rapide des coûts

| Élément | Coût |
|---|---|
| Nourriture (base) | 20€/tour |
| Logement bas (marron, bleu clair) | 30€ |
| Logement moyen (rose, orange) | 60€ |
| Logement élevé (rouge, jaune) | 90€ |
| Logement luxe (vert, bleu foncé) | 120€ |
| Hôtel | Double du prix standard |
| Bus | 10€ |
| Essence (voiture) | 30€ |
| Centre de soins | 50€ |
| Amende police (SDF) | 50€ |
| Amende routière | 30€ |
| Amende (taxe de luxe) | 75€ |
| Sortie anticipée Foyer | 50€ |

### 18.4 Historique des changements par rapport à la V1

| Aspect | V1 (Clodopoly original) | V2 (cette spec) | Raison |
|---|---|---|---|
| Joueurs | 2-6 | 2-5 | 3 emplois pour max 5 joueurs = tension structurelle |
| Argent de départ | 1000€ | 800€ | Augmenter la pression initiale |
| PC de départ | 10 | 8 | Marge de manoeuvre réduite = choix plus tendus |
| Mouvement | Dés purs | Dés + choix de case | Agentivité sur le déplacement |
| Interaction joueurs | Baston (1d6 vs 1d6) | Camp + actions de nuit émergentes | Dilemmes naturels, pas de choix étiqueté |
| Coopération | Mentionnée, non définie | Avantage mécanique du Camp (partage des coûts, +PC) | Incitation structurelle à la proximité |
| Trahison | Absente | Se servir pendant la nuit (action concrète) | Émergente, non labellisée, conséquences sociales |
| Combat | Événement isolé | Confrontation (Se servir simultanés) | Le combat a un sens narratif |
| Pression temporelle | Aucune | Inflation + condamnation bâtiments | Convergence vers la fin |
| Élimination | Mort = hors jeu | Fantôme pendant 2 tours | Maintien de l'engagement |
| Emplois disponibles | 3 types, illimités | 3 cartes uniques, concurrence | Rareté = tension |
| Cycle nuit | >50% SDF | Dès le premier SDF | Activation plus précoce |
| Nourriture | 30€/tour fixe | 20€ base + inflation | Pression croissante |
| Plateau | Non adapté | Conservé tel quel (intentionnel) | La dissonance est le propos |
