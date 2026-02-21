# Clodopoly — Thème de lieu : Poitiers

> Thème par défaut. Les noms de rues sont des lieux réels de Poitiers,
> classés du quartier le plus modeste au plus cossu.

## Propriétés (22 cases)

| Couleur | Quartier thématique | Case 1 | Case 2 | Case 3 |
|---|---|---|---|---|
| **Marron** (30€) | Zone périphérique | Rue de la Cueille | Rue du Pont Neuf | — |
| **Bleu clair** (30€) | Faubourgs populaires | Rue de la Tranchée | Rue du Faubourg du Pont-Neuf | Rue Saint-Cyprien |
| **Rose** (60€) | Quartier résidentiel | Rue Arsène Orillard | Rue Carnot | Rue de la Chaîne |
| **Orange** (60€) | Centre ancien | Rue de la Regratterie | Rue des Grandes-Écoles | Rue Boncenne |
| **Rouge** (90€) | Hypercentre | Rue Gambetta | Rue de la Grand'Maison | Place Charles de Gaulle |
| **Jaune** (90€) | Quartier commerçant | Rue des Cordeliers | Place du Maréchal-Leclerc | Rue Henri Oudin |
| **Vert** (120€) | Quartier bourgeois | Boulevard de Verdun | Rue Jean Jaurès | Boulevard du Grand Cerf |
| **Bleu foncé** (120€) | Quartier prestigieux | Place d'Armes | — | — |

## Gares (4 cases)

| Position | Fonction | Nom |
|---|---|---|
| Gare 1 (bas) | Petit Boulot | Gare de Poitiers |
| Gare 2 (gauche) | Marché | Marché Notre-Dame |
| Gare 3 (haut) | Petit Boulot | CHU de Poitiers |
| Gare 4 (droite) | Marché | Les Cordeliers |

## Format de données

```typescript
import { LocationTheme } from "../types";

export const THEME_POITIERS: LocationTheme = {
  id: "poitiers",
  label: "Poitiers",

  propertyNames: {
    brown:      ["Rue de la Cueille", "Rue du Pont Neuf"],
    light_blue: ["Rue de la Tranchée", "Rue du Fbg du Pont-Neuf", "Rue Saint-Cyprien"],
    pink:       ["Rue Arsène Orillard", "Rue Carnot", "Rue de la Chaîne"],
    orange:     ["Rue de la Regratterie", "Rue des Grandes-Écoles", "Rue Boncenne"],
    red:        ["Rue Gambetta", "Rue de la Grand'Maison", "Place Charles de Gaulle"],
    yellow:     ["Rue des Cordeliers", "Place du Mal-Leclerc", "Rue Henri Oudin"],
    green:      ["Bvd de Verdun", "Rue Jean Jaurès", "Bvd du Grand Cerf"],
    dark_blue:  ["Place d'Armes"],
  },

  stationNames: [
    "Gare de Poitiers",
    "Marché Notre-Dame",
    "CHU de Poitiers",
    "Les Cordeliers",
  ],
};
```

## Logique de classement

Les couleurs du Monopoly vont du moins cher (marron) au plus cher (bleu foncé). Les quartiers de Poitiers sont mappés par cohérence sociale :

- **Marron / Bleu clair** : zones excentrées, faubourgs, périphérie → logement bon marché
- **Rose / Orange** : centre historique, rues commerçantes modestes → logement moyen
- **Rouge / Jaune** : hypercentre, grandes places, axes commerçants → logement cher
- **Vert / Bleu foncé** : boulevards bourgeois, place militaire → logement très cher

Cette hiérarchie renforce la dissonance du jeu : les joueurs reconnaissent les lieux et savent que les quartiers "chics" sont hors de portée.
