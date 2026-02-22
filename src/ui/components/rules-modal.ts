export function showRulesModal(): void {
  const existing = document.getElementById("rules-modal-overlay");
  if (existing) { existing.remove(); return; }

  const overlay = document.createElement("div");
  overlay.id = "rules-modal-overlay";
  overlay.className = "rules-modal-overlay";

  const modal = document.createElement("div");
  modal.className = "rules-modal";

  const closeBtn = document.createElement("button");
  closeBtn.className = "rules-modal-close";
  closeBtn.textContent = "\u2715";
  closeBtn.addEventListener("click", () => overlay.remove());
  modal.appendChild(closeBtn);

  const title = document.createElement("h2");
  title.textContent = "Regles du jeu";
  modal.appendChild(title);

  const sections: { title: string; content: string }[] = [
    {
      title: "Objectif",
      content: "Survivre. Le dernier joueur en vie gagne. Vous etes elimine si vos PV (points de vie) tombent a 0.",
    },
    {
      title: "Deroulement d'un tour",
      content: "Chaque jour comporte 4 manches. A chaque manche, tous les joueurs se deplacent et agissent. Apres les 4 manches, la nuit tombe : choix nocturnes, resolution, puis maintenance (nourriture, emploi, logement).",
    },
    {
      title: "Deplacement",
      content: "Voiture : 2d6 cases, 30\u20AC d'essence, avancer uniquement.\nBus : 1d6+2 cases, 10\u20AC, avancer uniquement.\nA pied : 1d6 cases, gratuit, avancer ou reculer.",
    },
    {
      title: "Ressources",
      content: "Argent (\u20AC) : pour se nourrir, se loger, se soigner, acheter des objets.\nPV (Points de Vie) : max 5. A 0, vous etes elimine.\nPC (Points de Credibilite) : max 10. Determines par vos objets. Influencent l'emploi.",
    },
    {
      title: "Emploi",
      content: "Postulez au Lieu de Travail (case angle). Trois types :\n- Cadre : 500\u20AC/cycle, min 8 PC embauche, 6 PC maintien, 0 retard tolere.\n- Employe : 350\u20AC/cycle, min 5 PC embauche, 3 PC maintien, 1 retard tolere.\n- Precaire : 200\u20AC/cycle, min 2 PC embauche, 1 PC maintien, 3 retards toleres.\nPointez au travail pour valider votre cycle. Salaire verse au passage de la case Paie.\nBonus +10% si PC >= 8.",
    },
    {
      title: "Nuit",
      content: "En camp (meme case qu'un autre joueur) :\n- Dormir : +1 PC, nourriture partagee (-40%), vulnerable au vol.\n- Veiller : protege contre les voleurs. Pas de bonus PC.\n- Fouiller : piochez une carte Fouille. Quitte le camp.\n- Se servir : tentez de voler. Si veilleur present : -1 PC. Si 2 voleurs : confrontation (de + inventaire, perdant -1 PV).\n\nSeul : les choix sont limites. Dormir seul sans abri : -1 PV, -1 PC.",
    },
    {
      title: "Logement",
      content: "Maison/Hotel sur une propriete : cout automatique la nuit (30 a 200\u20AC selon le quartier).\nFoyer d'urgence (case coin) : gratuit mais bloque 1 a 3 tours.\nAgence immobiliere (Rue de la Marne) : logement garanti pour 80\u20AC.\nSans abri : -1 PV, -1 PC.",
    },
    {
      title: "Nourriture",
      content: "Chaque nuit, chaque joueur paie le cout de la nourriture (20\u20AC de base, reduit en camp).\nSi vous ne pouvez pas payer : -1 PV.",
    },
    {
      title: "Objets",
      content: "Les objets augmentent vos PC. Ils peuvent etre perdus (dormir dehors, combat, evenements).\nRevente a 50% du prix d'achat sur les marches.\nAttention : perdre un objet peut faire baisser vos PC sous le seuil de votre emploi !",
    },
    {
      title: "Cases speciales",
      content: "Paie : salaire verse si vous avez pointe.\nFouille : carte aleatoire.\nEvenement : carte aleatoire (bonne ou mauvaise).\nImpots : 10% du capital (min 20\u20AC) ou -1 PC.\nAmende de luxe : 75\u20AC ou -1 PC.\nDouche : +1 PC gratuit.\nClinique : +1 PV pour 50\u20AC.\nRafle : envoye au Foyer.\nPetit Boulot : +80\u20AC (1 seul par tour).",
    },
  ];

  for (const section of sections) {
    const details = document.createElement("details");
    details.className = "rules-section";
    const summary = document.createElement("summary");
    summary.textContent = section.title;
    details.appendChild(summary);
    const content = document.createElement("p");
    content.className = "rules-section-content";
    content.textContent = section.content;
    details.appendChild(content);
    modal.appendChild(details);
  }

  overlay.appendChild(modal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
  document.body.appendChild(overlay);
}
