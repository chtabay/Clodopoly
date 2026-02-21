const app = document.getElementById("app");
if (app) {
  app.innerHTML = `
    <div style="
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: #1a1a2e;
      color: #e8e8e8;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      padding: 2rem;
    ">
      <h1 style="
        font-size: 3rem;
        font-weight: 800;
        background: linear-gradient(135deg, #e94560, #f0c040);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 0;
      ">CLODOPOLY</h1>
      <p style="color: #8899aa; font-style: italic; margin: 0;">Les Billets Restent dans la Boite</p>
      <p style="color: #8899aa; font-size: 0.9rem; margin-top: 1rem;">
        Moteur de jeu en cours de développement — UI à venir.
      </p>
      <a href="./mockup.html" style="
        display: inline-block;
        padding: 0.75rem 2rem;
        background: #e94560;
        color: white;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 1rem;
        margin-top: 0.5rem;
        transition: background 0.2s;
      " onmouseover="this.style.background='#c23152'" onmouseout="this.style.background='#e94560'"
      >Voir la maquette interactive</a>
      <div style="
        margin-top: 2rem;
        background: #16213e;
        border: 1px solid #2a3a5e;
        border-radius: 12px;
        padding: 1.25rem 1.5rem;
        max-width: 400px;
        width: 100%;
      ">
        <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: #8899aa; margin-bottom: 0.75rem;">
          Avancement MVP
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.85rem;">
          <div style="display:flex;justify-content:space-between;"><span>Types & constantes</span><span style="color:#4ecca3">✓</span></div>
          <div style="display:flex;justify-content:space-between;"><span>Plateau & cartes</span><span style="color:#4ecca3">✓</span></div>
          <div style="display:flex;justify-content:space-between;"><span>État initial & dés</span><span style="color:#4ecca3">✓</span></div>
          <div style="display:flex;justify-content:space-between;"><span>Localisation (FR/Poitiers)</span><span style="color:#4ecca3">✓</span></div>
          <div style="display:flex;justify-content:space-between;"><span>Déplacement</span><span style="color:#8899aa">—</span></div>
          <div style="display:flex;justify-content:space-between;"><span>Actions de case</span><span style="color:#8899aa">—</span></div>
          <div style="display:flex;justify-content:space-between;"><span>Phase de nuit</span><span style="color:#8899aa">—</span></div>
          <div style="display:flex;justify-content:space-between;"><span>Maintenance & boucle</span><span style="color:#8899aa">—</span></div>
          <div style="display:flex;justify-content:space-between;"><span>Draft</span><span style="color:#8899aa">—</span></div>
          <div style="display:flex;justify-content:space-between;"><span>Interface jouable</span><span style="color:#8899aa">—</span></div>
        </div>
        <div style="
          margin-top: 0.75rem;
          height: 6px;
          background: #2a3a5e;
          border-radius: 3px;
          overflow: hidden;
        "><div style="
          width: 40%;
          height: 100%;
          background: linear-gradient(90deg, #4ecca3, #4e9ff5);
          border-radius: 3px;
        "></div></div>
        <div style="font-size: 0.7rem; color: #8899aa; margin-top: 0.4rem; text-align: right;">87 tests ✓</div>
      </div>
    </div>
  `;
}
