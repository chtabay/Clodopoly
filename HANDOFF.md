# Clodopoly — Handoff pour le prochain agent

> Ce document résume l'état du projet et ce qui reste à faire.

## Objectif

**Livrer un jeu entièrement jouable dans le navigateur, hébergé sur GitHub Pages à l'adresse https://chtabay.github.io/Clodopoly/.**

Le moteur de jeu (logique, règles, résolution) est terminé et testé. Il tourne en TypeScript pur, sans DOM. Il ne sert à rien tant qu'aucune interface web ne l'appelle. Le travail du prochain agent est de **construire l'UI web qui appelle ce moteur**, pour que le jeu soit jouable du début (création de partie) à la fin (victoire) directement dans le navigateur.

Le déploiement sur GitHub Pages est déjà automatisé : chaque push sur `master` déclenche un build Vite et un déploiement. Quand l'UI sera construite et branchée sur le moteur, le jeu sera immédiatement accessible en ligne.

## Contexte

Clodopoly est un jeu de plateau web (survie sociale sur plateau de Monopoly). Le concept, les règles, les specs et le moteur de jeu sont terminés. L'interface web reste à construire proprement.

## État du projet

### Ce qui est terminé et solide

| Élément | Fichier(s) | État |
|---|---|---|
| **Spec de game design** | `specs_v2/game_design.md` | v2.1 — Complet. Camp + 4 actions de nuit (dilemme émergent). |
| **Spec fonctionnelle** | `specs_v2/spec_fonctionnelle.md` | v1.0 — 17 sections. Décrit chaque écran, chaque modale, chaque flux. |
| **Spec technique** | `specs_v2/spec_technique.md` | v1.0 — **À réviser** (voir tâches ci-dessous). Architecture composants, types, moteur. |
| **Plan d'implémentation** | `specs_v2/plan_implementation.md` | v1.0 — Phase 1 terminée. Phase 2 à reprendre proprement. |
| **Thème Poitiers** | `specs_v2/locale_poitiers.md` | Complet. 22 rues + 4 gares. |
| **Moteur de jeu** | `src/engine/*.ts` | **181 tests verts**. Complet pour le Jalon A. |
| **Localisation** | `src/locale/*.ts` | FR + Poitiers + Monopoly US. Fonctionnel. |
| **Interface console** | `src/console/play.ts` | Fonctionnel. `npm run play` lance une partie interactive. |
| **Maquette HTML** | `old/mockup/` | Référence visuelle. Non connectée au moteur. |
| **CI/CD** | `.github/workflows/deploy.yml` | GitHub Actions → GitHub Pages. Fonctionne. |

### Ce qui est à refaire

| Élément | Problème |
|---|---|
| **`src/main.ts`** | UI monolithique bâclée (530 lignes, tout dans un fichier). À supprimer et reconstruire en suivant les specs. |
| **`src/ui/`** | Dossier vide. L'architecture composants décrite dans la spec technique §11 n'a pas été implémentée. |

### Ce qui n'a pas été implémenté (Jalon B, hors périmètre MVP immédiat)

- Maréchaussée + cycle jour/nuit
- Fantôme (2 tours post-élimination)
- Inflation + condamnation de bâtiments
- Recommandation d'emploi
- Localisation anglaise
- Responsive mobile avancé

## Fichiers clés à lire

1. **`specs_v2/game_design.md`** — Les règles complètes. Lire §8 (Camp et actions de nuit) en priorité.
2. **`specs_v2/spec_fonctionnelle.md`** — Ce que l'UI doit faire. Lire §6 (Plateau de jeu), §7-10 (phases), §13 (composants transversaux).
3. **`specs_v2/spec_technique.md`** — Comment construire l'UI. §3 (structure projet), §11 (composants UI), §10 (rendu plateau). **Ce document doit être révisé** pour corriger les écarts entre la spec et l'état réel du code.
4. **`src/engine/types.ts`** — Tous les types. Point d'entrée pour comprendre le modèle.
5. **`tests/engine/resolver.test.ts`** — Tests du resolver. Montre comment le moteur s'utilise.

## Stack

- TypeScript strict
- Vite 7 (build + dev server)
- Vitest 4 (tests)
- Zéro dépendance runtime (sauf tsx pour le script console)
- GitHub Pages (déploiement automatique sur push master)

## Commandes

```bash
npm run dev          # Serveur de développement Vite
npm run build        # Build production → dist/
npm run test         # 181 tests
npm run play         # Partie interactive en console
```

## Tâches pour le prochain agent

### 1. Réviser la spec technique

Le document `specs_v2/spec_technique.md` a été écrit avant l'implémentation. Certaines sections doivent être mises à jour pour refléter le code réel :

- **§3 Structure du projet** : ajouter `src/console/`, vérifier que l'arborescence correspond
- **§4 Modèle de données** : les types dans `src/engine/types.ts` sont la source de vérité — vérifier que la spec les reflète fidèlement
- **§5 Moteur de jeu** : décrire l'API réelle (`resolver.ts` expose des fonctions, pas un `applyAction` unique). La spec décrit une architecture `applyAction(state, action) → newState` mais l'implémentation utilise des fonctions dédiées (`resolvePetitBoulot`, `resolveNight`, etc.)
- **§6 Plateau** : OK, correspond au code
- **§8 Machine à états** : le flux réel utilise `advanceToNextPlayer()` pour la transition entre joueurs — le documenter
- **§10 Rendu du plateau** : la maquette (`old/mockup/index.html`) utilise une grille CSS 11×11. Reprendre cette approche plutôt que du SVG inline.
- **§11 Composants UI** : c'est la section principale à suivre pour reconstruire l'UI. Vérifier que les interfaces correspondent au moteur réel.

### 2. Reconstruire l'UI (Phase 2 du plan d'implémentation)

Suivre les lots 2.1 à 2.10 du plan d'implémentation. Ordre recommandé :

1. **2.1 Layout et navigation** — Structure HTML/CSS, routing entre écrans, pattern UIComponent
2. **2.2 Accueil + Création** — Reprendre l'écran de setup existant (il fonctionne dans le main.ts actuel)
3. **2.3 Draft** — Écran de draft (fonctionne aussi, à extraire en composant propre)
4. **2.4 Plateau** — Grille 11×11, pions, bâtiments, surbrillance, panneau de focus au clic
5. **2.5 Panneau latéral + barre d'actions** — Fiche joueur, résumé, actions contextuelles
6. **2.6 Déplacement** — Choix transport, dés (afficher le résultat !), choix de case
7. **2.7 Actions de case** — Boutons contextuels, modale de carte
8. **2.8 Phase de nuit** — Les 4 actions, passage d'écran secret, résolution
9. **2.9 Maintenance + fin** — Résumé des coûts, écran de victoire
10. **2.10 Règles** — Panneau consultable à tout moment

### 3. Intégration et déploiement

- Lots 3.1 à 3.3 du plan : intégration moteur↔UI, polish, cas limites
- Lot 4.1 : le CI/CD fonctionne déjà — chaque push sur master build et déploie automatiquement

### Critère de "done"

Le travail est terminé quand **https://chtabay.github.io/Clodopoly/ permet de jouer une partie complète** :
- Créer une partie (2-5 joueurs, noms)
- Drafter les cartes (8 PC, voiture obligatoire)
- Jouer les tours (transport → dés → choix de case → action)
- Voir le plateau avec les pions, bâtiments, et noms de rues (Poitiers)
- Cliquer une case pour voir ses détails (panneau de focus)
- Résoudre la phase de nuit (choix secrets entre joueurs en Camp)
- Voir la maintenance (coûts, pertes, licenciements)
- Voir les éliminations et la victoire du dernier survivant
- Consulter le journal des événements à tout moment

## Points d'attention

- **Le moteur ne contient aucun texte affiché.** Tous les textes passent par `src/locale/i18n.ts`. L'UI doit appeler `getCellDisplayName()`, `getCardName()`, `formatJournal()` pour tout affichage.
- **L'état est immuable.** Le moteur retourne un nouvel état à chaque opération. L'UI doit re-render après chaque changement d'état.
- **Le `main.ts` actuel peut être utilisé comme référence** pour comprendre comment appeler le moteur, mais ne doit PAS être la base de l'UI. Tout refaire en composants.
- **La maquette `old/mockup/index.html`** est une bonne référence visuelle pour le design (couleurs, layout, composants).
- **Le plateau est une grille 11×11** (pas un SVG Monopoly). Les cases des coins font 1.5fr, les cases intermédiaires 1fr. Le centre (9×9) affiche le titre du jeu.
