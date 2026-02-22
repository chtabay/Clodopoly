# Audit UX/UI — Clodopoly

**Date** : 22 février 2026  
**Version** : 0.1.0  
**Auteur** : Analyse UI/UX Designer  

---

## Sommaire

1. [Vue d'ensemble](#1-vue-densemble)
2. [Ecran d'accueil](#2-ecran-daccueil)
3. [Ecran de creation de partie](#3-ecran-de-creation-de-partie)
4. [Ecran d'equipement (draft)](#4-ecran-dequipement-draft)
5. [Ecran de jeu — plateau et navigation](#5-ecran-de-jeu--plateau-et-navigation)
6. [Phase de deplacement](#6-phase-de-deplacement)
7. [Phase d'action](#7-phase-daction)
8. [Phase de nuit](#8-phase-de-nuit)
9. [Phases de resolution et maintenance](#9-phases-de-resolution-et-maintenance)
10. [Ecran de fin de partie](#10-ecran-de-fin-de-partie)
11. [Communication des enjeux et regles](#11-communication-des-enjeux-et-regles)
12. [Responsivite et accessibilite](#12-responsivite-et-accessibilite)
13. [Navigation et flux de pages](#13-navigation-et-flux-de-pages)
14. [Comprehension des enjeux avant chaque action](#14-comprehension-des-enjeux-avant-chaque-action)
15. [Synthese des recommandations](#15-synthese-des-recommandations)

---

## 1. Vue d'ensemble

### Points forts

- **Theme fort** : le jeu aborde un sujet original (survie sociale) avec des mecaniques coherentes (PV, PC, argent, emploi, nuit).
- **Plateau fidele au Monopoly** : grille 11x11 CSS, cases colorees, coins thematiques — reperes connus du joueur.
- **Stepper jour/nuit** : indicateur visuel clair de la progression de la journee dans la navbar.
- **Zone d'action centrale** : les choix contextuels au centre du plateau captent l'attention.
- **Theme sombre** : lisible, moderne, coherent.

### Points faibles structurels

- **Manque de pedagogie** : les regles complexes du jeu ne sont communiquees qu'une seule fois (modale intro), sans rappel contextuel.
- **Surcharge informationnelle** : le panneau lateral contient trop d'informations simultanees.
- **Absence de feedback visuel** : pas d'animations de transition, de deplacement de pions, ou de retour sensoriel sur les actions.
- **Pas de sauvegarde** : une partie ne peut pas etre interrompue et reprise.

---

## 2. Ecran d'accueil

### Etat actuel
- Titre centre, sous-titre, bouton "Nouvelle partie", bouton "Regles", version.

### Problemes identifies

| # | Severite | Probleme | Impact joueur |
|---|----------|----------|---------------|
| 2.1 | **Critique** | Bouton "Regles" non fonctionnel (console.log) | Le joueur ne peut pas decouvrir les regles avant de jouer |
| 2.2 | Mineur | Pas d'ambiance visuelle (illustration, animation) | Premiere impression fade |
| 2.3 | Mineur | Pas de mention du nombre de joueurs requis | Incertitude avant de commencer |

### Recommandations
- Implementer un panneau de regles interactif (ou au minimum un lien vers un document).
- Ajouter une illustration ou animation d'accueil evoquant le theme du jeu.
- Mentionner "2 a 5 joueurs" sous le bouton de creation.

---

## 3. Ecran de creation de partie

### Etat actuel
- Choix du nombre de joueurs (2-5), noms (max 12 caracteres), couleurs assignees automatiquement.

### Problemes identifies

| # | Severite | Probleme | Impact joueur |
|---|----------|----------|---------------|
| 3.1 | Moyen | Validation uniquement au clic sur "Commencer" | Pas de retour en temps reel sur les erreurs |
| 3.2 | Mineur | Pas de choix de couleur | Frustration si la couleur assignee ne plait pas |
| 3.3 | Mineur | Pas de retour arriere vers l'accueil | Le joueur doit recharger la page |
| 3.4 | Mineur | Pas d'indication visuelle du champ invalide | Notification generique peu claire |

### Recommandations
- Ajouter une validation en temps reel (bordure rouge si doublon, champ vide).
- Permettre le choix de couleur (clic sur un rond pour cycler).
- Ajouter un bouton retour.

---

## 4. Ecran d'equipement (draft)

### Etat actuel
- Transition "Passez l'appareil a [Nom]".
- Modale d'introduction (regles du jeu) au premier joueur.
- Grille de cartes objets (sans voiture, auto-ajoutee).
- Profil joueur avec compteur PC (X/5), conseils strategiques.
- Bouton "Valider".

### Problemes identifies

| # | Severite | Probleme | Impact joueur |
|---|----------|----------|---------------|
| 4.1 | **Critique** | La modale d'introduction est dense et textuelle | Le joueur ne retient pas les regles |
| 4.2 | Moyen | Le mecanisme de la voiture "offerte" n'est pas assez visible | Confusion sur le decompte PC (5 a choisir + 3 offerts = 8) |
| 4.3 | Moyen | Pas d'explication des consequences des choix | Pourquoi choisir un costume a 2PC plutot qu'un chapeau a 1PC ? |
| 4.4 | Moyen | Le bouton "Valider" desactive ne donne pas la raison | Le joueur ne sait pas quoi faire |
| 4.5 | Mineur | Pas de possibilite de revenir en arriere apres validation | Erreur irreversible |
| 4.6 | Mineur | Les conditions de perte des objets sont affichees en petit | Information cruciale peu visible |

### Recommandations
- Transformer la modale d'introduction en tutoriel pas-a-pas avec illustrations.
- Afficher clairement "Voiture incluse (3 PC)" dans une zone dediee, separee de la grille de choix.
- Afficher un tooltip au survol de chaque carte expliquant : PC gagnes, prix de revente, condition de perte, impact sur l'emploi.
- Afficher la raison de desactivation du bouton "Valider" ("Selectionnez encore X PC").
- Rendre les conditions de perte plus visibles (icone d'alerte, couleur contrastee).

---

## 5. Ecran de jeu — plateau et navigation

### Structure
```
[NAVBAR] Joueur | Tour | Phase | Stepper jour/nuit | Nourriture
[PLATEAU 11x11]                              [PANNEAU LATERAL]
  Cases + pions + batiments                    Joueur actif
  Centre = zone d'action                       Stats detaillees
                                               Tous les joueurs
                                               Journal
```

### Problemes identifies

| # | Severite | Probleme | Impact joueur |
|---|----------|----------|---------------|
| 5.1 | **Critique** | Le plateau est trop petit sur mobile — textes illisibles | Gameplay degrade sur telephone |
| 5.2 | **Critique** | Pas d'animation de deplacement des pions | Le joueur ne voit pas ou il va |
| 5.3 | Moyen | Pas de legende des icones de cases | Les icones ne sont pas toutes intuitives |
| 5.4 | Moyen | Le panneau lateral deborde d'informations | Surcharge cognitive |
| 5.5 | Moyen | Le joueur actif est identifie par couleur uniquement dans la navbar | Pas assez visible sur le plateau |
| 5.6 | Moyen | Pas de zoom/pan sur le plateau | Impossible de lire les cases eloignees |
| 5.7 | Mineur | Les etablissements sont affiches en tres petit | Information utile mais invisible |
| 5.8 | Mineur | Le journal est limite a 5 entrees | Pas d'historique complet accessible |

### Recommandations
- Ajouter un zoom tactile sur mobile (pinch-to-zoom ou boutons +/-).
- Animer le deplacement du pion (translation CSS/JS).
- Ajouter un indicateur pulse/glow sur le pion du joueur actif.
- Proposer un mode "focus" ou le panneau lateral se replie pour agrandir le plateau.
- Agrandir le nom de l'etablissement ou l'afficher au survol/clic.
- Ajouter un bouton "Journal complet" ouvrant une modale scrollable.

---

## 6. Phase de deplacement

### Etat actuel
1. Choix du transport : Voiture (2d6, 30 euros, avant), Bus (1d6+2, 10 euros, avant), A pied (1d6, gratuit, avant/arriere).
2. Lancer de des : resultat affiche.
3. Selection de case : cases accessibles en surbrillance doree.

### Problemes identifies

| # | Severite | Probleme | Impact joueur |
|---|----------|----------|---------------|
| 6.1 | Moyen | Les descriptions de transport sont cryptiques ("2d6 cases, 30 euros, Avant seul.") | Un joueur non-initie ne comprend pas |
| 6.2 | Moyen | Apres le lancer de des, le message "Cliquez une case doree" n'est pas assez guide | Le joueur cherche les cases dorees sur le plateau |
| 6.3 | Mineur | Pas de visualisation de la portee avant de choisir le transport | Le joueur ne peut pas anticiper ou il ira |
| 6.4 | Mineur | Les boutons desactives ne donnent pas la raison | "Pourquoi la voiture est grisee ?" |
| 6.5 | Mineur | Le cout de l'essence n'est deduit qu'apres — pas de confirmation | Action irreversible sans avertissement |

### Recommandations
- Reformuler les descriptions : "Voiture : avancez de 2 a 12 cases (30 euros d'essence)" / "Bus : avancez de 3 a 8 cases (10 euros)" / "A pied : 1 a 6 cases, gratuit, reculer possible".
- Au survol d'un transport, mettre en surbrillance la zone de cases accessibles sur le plateau.
- Afficher un tooltip sur les boutons desactives : "Pas assez d'argent" / "Bus en greve" / "Pas de voiture".
- Flasher les cases accessibles avec une animation pulsante apres le lancer.
- Afficher le solde apres deduction avant confirmation.

---

## 7. Phase d'action

### Etat actuel
- Actions contextuelles selon le type de case : travailler, acheter, vendre, se soigner, postuler, etc.
- Un bouton "Passer" toujours present.
- Certaines actions auto-resolues (evenement, fouille, rafle, taxes).

### Problemes identifies

| # | Severite | Probleme | Impact joueur |
|---|----------|----------|---------------|
| 7.1 | **Critique** | Les actions auto-resolues se produisent sans avertissement ni animation | Le joueur ne comprend pas ce qui vient de se passer |
| 7.2 | **Critique** | Sur les cases propriete sans batiment, l'unique info est "Pas d'abri — Dormir dehors (-1 PV, -1 PC)" sans action possible | Le joueur se sent impuissant |
| 7.3 | Moyen | Le bouton "Passer" n'avertit pas des consequences | Le joueur peut passer sans comprendre qu'il va dormir dehors |
| 7.4 | Moyen | Pas de confirmation avant achat ou vente | Clic accidentel irreversible |
| 7.5 | Moyen | Les offres d'emploi n'expliquent pas les consequences du travail | "Que se passe-t-il si je suis en retard ?" |
| 7.6 | Mineur | L'agence immobiliere (case 30) ne mentionne pas la duree du logement garanti | "C'est pour ce soir ou permanent ?" |
| 7.7 | Mineur | La vente a 50% n'est pas anticipable | Le joueur decouvre le prix au moment de la vente |

### Recommandations
- Pour les actions auto-resolues : afficher une mini-modale animee avec le resultat pendant 2-3 secondes avant de passer.
- Sur les cases sans action utile : proposer des conseils ("Vous dormirez dehors cette nuit. Pensez a rejoindre un abri ou un camp.").
- Ajouter un avertissement au bouton "Passer" si la case offre des actions non effectuees.
- Ajouter un dialog de confirmation pour achats et ventes.
- Afficher les regles d'emploi au survol : seuils PC, retards toleres, salaire, cycle de paie.
- Preciser la duree du logement garanti : "Valable pour cette nuit uniquement".
- Afficher la valeur de revente dans l'inventaire en permanence.

---

## 8. Phase de nuit

### Etat actuel
- Overlay plein ecran.
- Transition "Passez l'appareil a [Nom]" (hot-seat).
- Grille 2x2 avec 4 choix : Dormir, Veiller, Fouiller, Se servir.
- Description succincte de chaque choix.

### Problemes identifies

| # | Severite | Probleme | Impact joueur |
|---|----------|----------|---------------|
| 8.1 | **Critique** | Les consequences de chaque choix ne sont pas assez detaillees | Le joueur choisit au hasard |
| 8.2 | **Critique** | Le joueur ne voit pas ou il dormira ni le cout avant de choisir | Decision sans information |
| 8.3 | Moyen | Le concept de "camp" n'est pas explique visuellement | "Avec qui suis-je ? Ou est le camp ?" |
| 8.4 | Moyen | Pas d'indication du risque reel de chaque action | "Se servir" semble risque mais a quel point ? |
| 8.5 | Mineur | L'overlay sombre masque completement le plateau | Le joueur perd le contexte spatial |
| 8.6 | Mineur | Les choix sont identiques visuellement (meme style) | Pas de distinction visuelle entre action defensive et offensive |

### Recommandations
- Afficher avant le choix un resume contextuel : "Vous etes sur [Case]. [Batiment : oui/non]. Cout de la nuit : X euros. Joueurs presents : [liste]."
- Detailler les consequences dans chaque choix :
  - **Dormir** : "+1 PC. Vous etes vulnerable au vol. Cout : X euros si batiment, sinon -1 PV -1 PC."
  - **Veiller** : "Vous protegez le camp contre les voleurs. Pas de bonus PC."
  - **Fouiller** : "Piochez une carte fouille. Vous quittez le camp."
  - **Se servir** : "Tentez de voler un objet d'un dormeur. Si un veilleur est present, vous perdez 1 PC."
- Styler differemment les actions defensives (bleu) et offensives (rouge).
- Afficher le plateau en arriere-plan semi-transparent avec le camp mis en evidence.
- Montrer la position du joueur et ses voisins sur une mini-carte.

---

## 9. Phases de resolution et maintenance

### Etat actuel
- **Resolution de la nuit** : bloc journal montrant les evenements.
- **Maintenance** : bloc journal + bouton pour resoudre (nourriture, emploi, elimination).
- **Fin du tour** : bloc journal + bouton "Tour suivant".

### Problemes identifies

| # | Severite | Probleme | Impact joueur |
|---|----------|----------|---------------|
| 9.1 | **Critique** | Les resultats de la nuit sont affiches comme un journal brut | Le joueur ne distingue pas les evenements importants des mineurs |
| 9.2 | Moyen | Pas de recapitulatif avant/apres | Le joueur ne voit pas ce qu'il a perdu ou gagne |
| 9.3 | Moyen | La maintenance se resout en un clic sans explication | "Pourquoi ai-je perdu 1 PV ?" |
| 9.4 | Mineur | Pas de distinction visuelle entre bonne et mauvaise nouvelle | Tout est affiche de la meme facon |

### Recommandations
- Afficher un recapitulatif visuel avant/apres pour chaque joueur : argent, PV, PC avec fleches de variation.
- Colorer les entries du journal : vert pour les gains, rouge pour les pertes, gris pour les neutres.
- Ajouter des icones distinctives par type d'evenement.
- Pour la maintenance, afficher chaque etape avec un mini-delai : "Nourriture... -20 euros" puis "Logement... dormir dehors -1 PV" puis "Emploi... OK".
- Mettre en evidence les eliminations avec une animation dediee.

---

## 10. Ecran de fin de partie

### Etat actuel
- Trophee, nom du gagnant, tableau de classement (statut uniquement), boutons "Nouvelle partie" et "Accueil".

### Problemes identifies

| # | Severite | Probleme | Impact joueur |
|---|----------|----------|---------------|
| 10.1 | Moyen | Pas de statistiques de fin de partie | Le joueur ne peut pas analyser sa performance |
| 10.2 | Moyen | Pas d'animation de victoire | Moment anticlimactique |
| 10.3 | Mineur | Pas de journal complet consultable | Pas de recit de la partie |

### Recommandations
- Ajouter des statistiques : tours survecu, argent max atteint, nombre de nuits dehors, objets perdus, emplois occupes.
- Animer l'apparition du trophee.
- Ajouter un bouton "Revoir le journal" pour relire la partie.

---

## 11. Communication des enjeux et regles

### Probleme fondamental

Le jeu repose sur des mecaniques complexes (emploi avec seuils PC, nuit avec camps et confrontations, taxes, logement, nourriture) mais ces regles ne sont communiquees **qu'une seule fois** dans la modale d'introduction — et seulement au premier joueur. Le reste du temps, le joueur est livre a lui-meme.

### Ecarts entre mecaniques et communication

| Mecanique | Ce que le moteur fait | Ce que le joueur voit |
|-----------|----------------------|----------------------|
| **Emploi — seuil PC** | Cadre : min 8 PC pour etre embauche, 6 PC pour garder le poste | Affiche le seuil d'embauche mais pas le seuil de maintien |
| **Emploi — retards** | Cadre : 0 retard tolere / Employe : 1 / Precaire : 3 | Non communique |
| **Emploi — bonus salaire** | +10% si PC >= 8 | Non communique |
| **Nourriture en camp** | Cout reduit a 60% | Non communique |
| **Taxe revenus (case 4)** | 10% du capital, minimum 20 euros | Appelee "Inflation" — trompeur |
| **Taxe luxe (case 38)** | 75 euros fixe | Appelee "Amende" — trompeur |
| **Logement garanti** | 80 euros, valable 1 nuit | Duree non precisee |
| **Vente d'objets** | 50% du prix d'achat | Visible uniquement au moment de vendre |
| **Dette essence** | Max 2 tours sans payer avant perte voiture | Non communique |
| **Dormir en hotel** | Cout depend de la couleur (30 a 200 euros) | Affiche sur la case mais pas toujours lisible |
| **Confrontation nocturne** | Des + nombre d'objets determine le gagnant | Regles non expliquees |

### Recommandations

1. **Aide contextuelle** : ajouter un bouton "?" sur chaque zone de l'interface, ouvrant un tooltip ou une mini-modale explicative.
2. **Panneau de regles** : implementer le bouton "Regles" de l'accueil avec un document consultable a tout moment (icone dans la navbar).
3. **Terminologie coherente** : remplacer "Inflation" par "Impots" et "Amende" par "Amende de luxe" pour mieux refleter la mecanique.
4. **Tooltips d'emploi** : afficher au survol de l'emploi dans le panneau lateral : retards toleres, seuil PC de maintien, prochaine paie.
5. **Preview des couts** : avant chaque action couteuse, afficher "Solde actuel : X euros -> Solde apres : Y euros".

---

## 12. Responsivite et accessibilite

### Etat actuel
- Breakpoint unique a 768px (desktop/mobile).
- Mobile : plateau + panneau empiles verticalement.
- Pas de gestion du mode paysage.
- Pas de zoom sur le plateau.

### Problemes identifies

| # | Severite | Probleme |
|---|----------|----------|
| 12.1 | **Critique** | Cases du plateau illisibles sur ecran < 400px |
| 12.2 | Moyen | Panneau lateral limite a 40vh sur mobile — insuffisant |
| 12.3 | Moyen | Pas de breakpoint tablette (768-1024px) |
| 12.4 | Mineur | Pas de gestion du mode sombre/clair (sombre uniquement) |
| 12.5 | Mineur | Pas d'attributs ARIA pour l'accessibilite |
| 12.6 | Mineur | Taille de police fixe — pas de zoom texte |

### Recommandations
- Ajouter un mode "plateau plein ecran" sur mobile avec panneau en drawer.
- Implementer un zoom tactile (pinch ou boutons) sur le plateau.
- Ajouter un breakpoint tablette pour un layout a 2 colonnes proportionnel.
- Ajouter des attributs ARIA minimaux (roles, labels) pour les boutons et zones interactives.

---

## 13. Navigation et flux de pages

### Flux de navigation global

Le jeu suit un parcours strictement lineaire :

```
Accueil → Creation → Equipement (draft) → Partie → Fin
```

A aucun moment le joueur ne peut revenir a l'ecran precedent, mettre en pause, ou consulter les regles. La seule sortie est de recharger la page, ce qui detruit tout l'etat de jeu.

### Problemes de navigation

| # | Severite | Probleme | Impact joueur |
|---|----------|----------|---------------|
| 13.1 | **Critique** | Aucun bouton "retour" dans les ecrans setup et draft | Le joueur est piege dans le flux |
| 13.2 | **Critique** | Pas d'acces aux regles pendant la partie | Le joueur ne peut pas verifier une mecanique qu'il a oubliee |
| 13.3 | Moyen | Pas de transitions entre les phases de jeu | Le contenu central change instantanement — le joueur ne percoit pas le passage d'une phase a l'autre |
| 13.4 | Moyen | 7 phases differentes gerees dans un seul ecran sans signal de transition | Le joueur voit le meme ecran mais le contenu mute silencieusement |
| 13.5 | Moyen | La nuit est le seul moment avec un overlay distinct | Les phases maintenance et fin de tour sont des blocs de journal sans mise en scene |
| 13.6 | Mineur | Pas de breadcrumb ou fil d'Ariane du cycle de tour | Le joueur ne sait pas ou il en est dans la sequence deplacement → action → nuit → maintenance |

### Absence de reperes dans le cycle d'un tour

Un tour complet suit cette sequence :

```
(x4 par joueur) Deplacement → Action
puis : Nuit → Resolution → Maintenance → Fin du tour
```

Mais le joueur ne voit **aucune representation visuelle de cette sequence**. Le stepper jour/nuit montre la manche (1/4 a 4/4) mais pas la position dans le cycle de resolution. Quand la nuit commence, le joueur ne sait pas combien d'etapes restent avant le prochain tour.

### Recommandations

- Ajouter un bouton "retour" sur les ecrans setup et draft.
- Ajouter un bouton "Regles" dans la navbar, accessible a tout moment (icone livre ou "?").
- Introduire des micro-transitions (fade, slide) entre les phases pour signaler le changement.
- Ajouter un indicateur de progression du cycle : Deplacement → Action → ... → Nuit → Resolution → Maintenance → Nouveau tour.
- Envisager un mode pause / sauvegarde pour les parties longues.

---

## 14. Comprehension des enjeux avant chaque action

### Probleme fondamental

Le jeu demande des decisions strategiques mais ne fournit pas les informations necessaires pour les prendre. Le joueur agit a l'aveugle a trois moments cles :
1. **Deplacement** : il choisit un transport et une case sans savoir ce qui l'attend.
2. **Achat/vente** : il ne connait pas les consequences en cascade (perte PC, perte emploi, perte salaire).
3. **Nuit** : il choisit entre 4 actions sans comprendre les mecaniques de camp, confrontation et vol.

### Analyse detaillee — Phase de deplacement

| Action | Enjeux affiches | Enjeux manquants |
|--------|----------------|------------------|
| **Voiture** | "2d6 cases · 30 euros · Avant seul." | Pas de preview de la zone accessible. Pas de mention de la dette essence (max 2 tours sans payer, puis perte de la voiture). Le joueur ne sait pas ce qu'il y a devant lui. |
| **Bus** | "1d6+2 cases · 10 euros · Avant seul." | Meme probleme. La raison de desactivation (greve, argent) n'est pas affichee. |
| **A pied** | "1d6 cases · Gratuit · Avant ou arriere." | "Avant ou arriere" laisse croire que le joueur choisit la direction (en realite, les cases dans les deux sens sont proposees). |
| **Lancer de des** | Resultat numerique | Le joueur ne sait pas a quoi il s'expose sur les cases accessibles. Pas de tooltip au survol des cases dorees. |
| **Choix de case** | Cases en surbrillance doree | Aucune information sur le contenu de la case avant de cliquer. Le joueur doit lire les noms minuscules sur le plateau. |

### Analyse detaillee — Phase d'action, par type de case

| Case | Info avant action | Ce qui manque pour decider |
|------|------------------|---------------------------|
| **Propriete avec batiment** | "Hotel/Maison — Nuit : X euros. Cout deduit automatiquement." | Le joueur comprend le cout mais pas le moment exact ("ce soir ?"). Il ne peut de toute facon pas changer de case. |
| **Propriete sans batiment** | "Pas d'abri — Dormir dehors (-1 PV, -1 PC)" | Information passive. Pas de suggestion ("Votre prochaine manche vous permettra de bouger."). |
| **Propriete avec agence immobiliere** | "Logement garanti : 80 euros" | Ne precise pas que c'est valable pour cette nuit uniquement. |
| **Petit boulot** | "Gagner 80 euros immediatement. Un seul travailleur par tour." | Ne mentionne pas que si un autre joueur est deja present, l'action echoue silencieusement. |
| **Marche — achat** | Boutons avec "+XPC — Y euros" | La condition de perte de l'objet n'apparait pas sur le bouton d'achat. Le joueur achete un costume a 150 euros sans savoir qu'il le perdra en dormant dehors. Impact PC en cascade sur l'emploi non mentionne. |
| **Marche — vente** | "Vendre [objet] → X euros" | Le cout en PC de la perte de l'objet n'est pas indique. Le joueur peut vendre sans realiser qu'il passe sous le seuil PC de son emploi et sera licencie a la maintenance. |
| **Douche** | "Gratuit. +1 point de credibilite." | Clair et complet. Bonne pratique. |
| **Clinique** | "Coute 50 euros. Sante actuelle : X/5 PV." | Clair et complet. Bonne pratique. |
| **Lieu de travail — pointer** | "Valide votre cycle de travail. Prochain passage a la Paie → salaire verse." | Ne dit pas le montant du salaire ni le nombre de retards restants avant licenciement. |
| **Lieu de travail — postuler** | "Emploi (salaire/cycle, min X PC)" | Ne mentionne pas : seuil PC de maintien, retards toleres, bonus salaire si PC >= 8, frequence de paie. |
| **Foyer** | "Logement et repas gratuits. Impossible de travailler." | Ne dit pas combien de tours on y reste (1 a 3, determine par un de). |
| **Paie** | "Salaire verse si vous avez pointe." | Ne dit pas le montant du salaire actuel du joueur. |
| **Evenement / Fouille / Rafle / Taxes** | Rien — action auto-resolue | Le joueur tombe sur la case et le resultat s'affiche dans le journal sans avertissement. Pas de modale "Vous avez tire : [carte]. Effet : [description]" avec un delai de lecture. L'action s'execute en `setTimeout(0)`. |

### Analyse detaillee — Phase de nuit

| Choix | Info affichee | Ce qui manque pour decider |
|-------|-------------|---------------------------|
| **Dormir** | "+1 PC, vulnerable" | Vulnerable a quoi ? Quel cout du logement ? Si pas de batiment, quelles pertes exactement ? |
| **Veiller** | "Protege le camp" | Contre quoi exactement ? Que se passe-t-il si personne ne vole ? |
| **Fouiller** | "Trouver objets" | Le joueur ne sait pas qu'il quitte le camp et ne beneficie pas du +1 PC. |
| **Se servir** | "Voler un objet" | Consequence si pris par un veilleur (-1 PC) ? Confrontation avec un autre voleur (-1 PV au perdant, -1 PC aux deux, resolution par des + inventaire) ? |

### Analyse detaillee — Phases de resolution

| Phase | Info affichee | Ce qui manque |
|-------|-------------|---------------|
| **Resolution nuit** | Journal brut des evenements | Pas de recap "avant/apres" par joueur. Pas de code couleur (gain vert, perte rouge). Tous les messages se ressemblent. |
| **Maintenance** | Journal + bouton "Resoudre" | Le joueur clique sans preview. Pas de "Nourriture : -20 euros / Logement : OK ou echec / Emploi : garder ou perdre". Le resultat est subi, pas anticipe. |
| **Fin du tour** | Journal + bouton "Tour suivant" | Pas de bilan du tour. Pas de comparaison entre joueurs. Pas de moment de respiration. |

### Matrice recapitulative : information disponible vs necessaire

| Moment de decision | Info disponible | Info necessaire | Ecart |
|--------------------|----------------|-----------------|-------|
| Choix du transport | Cout, des, direction | Zone de cases accessibles, contenu des cases, solde apres | **Fort** |
| Choix de case | Surbrillance doree | Type de case, batiment, cout de nuit, joueurs presents | **Fort** |
| Achat au marche | PC gagnes, prix | Condition de perte, impact emploi, solde apres | **Moyen** |
| Vente d'objet | Prix de revente | Perte de PC, seuil emploi, risque licenciement | **Fort** |
| Postuler a un emploi | Salaire, seuil PC embauche | Seuil PC maintien, retards toleres, bonus, cycle de paie | **Fort** |
| Choix de nuit | Description vague | Cout reel, risque chiffre, mecaniques de confrontation | **Fort** |
| Resolution maintenance | Rien (clic direct) | Preview de chaque etape : nourriture, logement, emploi | **Critique** |

### Recommandations specifiques

1. **Preview au survol des cases dorees** : afficher en tooltip le nom, le type, la presence de batiment, et les joueurs presents.
2. **Tooltip sur les boutons d'achat/vente** : afficher "Cet objet sera perdu si vous dormez dehors. Votre PC passera de X a Y. Seuil emploi : Z."
3. **Fiche emploi detaillee** : au survol de l'emploi dans le panneau lateral ou au lieu de travail, afficher seuil PC maintien, retards restants, prochain salaire.
4. **Descriptions de nuit enrichies** : chiffrer chaque consequence. Afficher le contexte (case, batiment, voisins) avant le choix.
5. **Preview de maintenance** : avant le clic "Resoudre", afficher une liste de ce qui va se passer : "Nourriture : -20 euros (solde : X) / Logement : dormir dehors → -1 PV -1 PC / Emploi : retard +1 (max 1)".
6. **Modale d'evenement** : au lieu d'auto-resoudre en silence, afficher une carte avec l'evenement tire, son effet, et un bouton "OK" pour continuer.

---

## 15. Synthese des recommandations

### Priorite 1 — Impact critique sur la jouabilite

1. **Implementer le panneau de regles** accessible depuis l'accueil et depuis la partie.
2. **Ajouter de l'aide contextuelle** (tooltips, mini-modales "?") sur les actions, l'emploi, les couts.
3. **Animer le deplacement des pions** pour que le joueur suive l'action.
4. **Enrichir les informations de la phase de nuit** : cout prevu, joueurs presents, consequences detaillees.
5. **Ameliorer les resolutions** : recapitulatif avant/apres avec couleurs (gains/pertes).

### Priorite 2 — Amelioration significative de l'experience

6. **Reformuler les descriptions de transport** en langage naturel.
7. **Ajouter des confirmations** pour les achats, ventes, et actions irreversibles.
8. **Colorer les entrees du journal** selon leur nature (gain, perte, neutre, danger).
9. **Ameliorer le responsive mobile** : zoom plateau, drawer pour panneau lateral.
10. **Afficher les conditions de perte des objets** de maniere plus visible.

### Priorite 3 — Polish et finitions

11. **Statistiques de fin de partie** : tours, argent, objets, nuits dehors.
12. **Animations de victoire et de transitions** entre phases.
13. **Coherence terminologique** : renommer "Inflation" et "Amende".
14. **Tutoriel interactif** remplacant la modale textuelle de la draft.
15. **Journal complet** accessible en modale scrollable.

---

*Ce document constitue une base pour un plan d'amelioration iteratif. Chaque recommandation peut etre implementee independamment, en commencant par les priorites 1 pour maximiser l'impact sur l'experience joueur.*
