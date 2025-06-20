// Ce fichier JavaScript contient l'ensemble de l'interface pour gérer
// un tournoi de badminton en double avec des contraintes complexes
// et une interface utilisateur complète responsive et interactive.

// -- SETUP GLOBAL DATA --
const levels = [
  "NC",
  "P12",
  "P11",
  "P10",
  "D9",
  "D8",
  "D7",
  "R6",
  "R5",
  "R4",
  "N3",
  "N2",
  "N1",
];
const levelValue = Object.fromEntries(levels.map((lvl, i) => [lvl, i]));
let players = JSON.parse(localStorage.getItem("players") || "[]");
let settings = JSON.parse(
  localStorage.getItem("settings") || JSON.stringify({ terrains: 2, tours: 3 })
);
let scores = JSON.parse(localStorage.getItem("scores") || "{}");
let planning = [];
let manualMode = false;

window.addEventListener("DOMContentLoaded", () => {
  // -- DOM CREATION --
  document.body.innerHTML = `
  <header>
    <h1>⚽ Tournoi Badminton</h1>
    <nav>
      <button onclick="showSection('players')">👥 Joueurs</button>
      <button onclick="showSection('settings')">⚙️ Paramètres</button>
      <button onclick="showSection('tournament')">🏆 Tournoi</button>
      <button onclick="toggleStatsPanel()">📊 Statistiques</button>
    </nav>
  </header>
  <div id="main">
    <section id="players"></section>
    <section id="settings" style="display:none"></section>
    <section id="tournament" style="display:none"></section>
  </div>
  <aside id="statsPanel" class="hidden"></aside>
`;

  // -- CSS --
  const style = document.createElement("style");
  style.textContent = `
  body { font-family: sans-serif; margin: 0; }
  header { background: #222; color: #fff; padding: 0.5em; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; }
  nav button { margin: 0.2em; }
  section { padding: 1em; }
  #statsPanel { position: fixed; top: 0; right: 0; width: 300px; height: 100vh; background: #f5f5f5; border-left: 1px solid #ccc; padding: 1em; overflow-y: auto; display: none; }
  #statsPanel.open { display: block; }
  @media (max-width: 600px) {
    #statsPanel { width: 100%; height: 50vh; bottom: 0; top: auto; border-left: none; border-top: 1px solid #ccc; }
  }
  .player-entry { display: flex; gap: 0.5em; margin-bottom: 0.5em; flex-wrap: wrap; }
  .player-entry input, .player-entry select { flex: 1; min-width: 100px; }
  .match { margin: 0.5em 0; }
  .valid { color: green; }
  .invalid { color: red; }
`;
  document.head.appendChild(style);
});

// -- UI FUNCTIONS --
function showSection(id) {
  document
    .querySelectorAll("section")
    .forEach((sec) => (sec.style.display = "none"));
  document.getElementById(id).style.display = "block";
}

function toggleStatsPanel() {
  const panel = document.getElementById("statsPanel");
  panel.classList.toggle("open");
}

function saveData() {
  localStorage.setItem("players", JSON.stringify(players));
  localStorage.setItem("settings", JSON.stringify(settings));
  localStorage.setItem("scores", JSON.stringify(scores));
}

// -- RENDER PLAYERS SECTION --
function renderPlayersSection() {
  const el = document.getElementById("players");
  el.innerHTML = `
    <h2>Liste des joueurs</h2>
    <div id="playerList"></div>
    <button id="addBot">Ajouter un joueur (auto)</button>
  `;
  const list = el.querySelector("#playerList");
  list.innerHTML = players
    .map(
      (p, i) => `
    <div class="player-entry">
      <input value="${
        p.name
      }" onchange="players[${i}].name=this.value;saveData();renderPlayersSection()" />
      <select onchange="players[${i}].gender=this.value;saveData();renderPlayersSection()">
        <option value="H" ${p.gender === "H" ? "selected" : ""}>H</option>
        <option value="F" ${p.gender === "F" ? "selected" : ""}>F</option>
      </select>
      <select onchange="players[${i}].level=this.value;saveData();renderPlayersSection()">
        ${levels
          .map(
            (l) =>
              `<option value="${l}" ${
                p.level === l ? "selected" : ""
              }>${l}</option>`
          )
          .join("")}
      </select>
      <button onclick="players.splice(${i},1);saveData();renderPlayersSection()">Supprimer</button>
    </div>
  `
    )
    .join("");

  el.querySelector("#addBot").onclick = () => {
    const names = [
      "Echo",
      "Nova",
      "Rex",
      "Zara",
      "Kai",
      "Luna",
      "Jax",
      "Mira",
      "Orion",
      "Skye",
    ];
    let name;
    let tries = 0;
    do {
      name = "[BOT] " + names[Math.floor(Math.random() * names.length)];
      tries++;
    } while (players.find((p) => p.name === name) && tries < 50);

    const genders = ["H", "F"];
    const newPlayer = {
      name,
      gender: genders[Math.floor(Math.random() * genders.length)],
      level: levels[Math.floor(Math.random() * levels.length)],
    };
    players.push(newPlayer);
    saveData();
    renderPlayersSection();
  };
}

// -- RENDER SETTINGS SECTION --
function renderSettingsSection() {
  const el = document.getElementById("settings");
  el.innerHTML = `
    <h2>Paramètres</h2>
    <label>Nombre de terrains : <input type="number" min="1" value="${settings.terrains}" onchange="settings.terrains=parseInt(this.value);saveData()"></label><br>
    <label>Nombre de tours : <input type="number" min="1" value="${settings.tours}" onchange="settings.tours=parseInt(this.value);saveData()"></label><br>
    <button onclick="generatePlanning();renderTournament();">Générer le planning</button>
  `;
}

// -- RENDER TOURNAMENT SECTION --
function renderTournament() {
  let planning = JSON.parse(localStorage.getItem("planning") || []);
  const el = document.getElementById("tournament");
  el.innerHTML = `
      <h2>Tournoi</h2>
      ${planning.map((tour, index) => {
        return `
            <div class="tour">
                <h3>Tour ${index + 1}</h3>
                ${tour.map((match, index) => {
                  return `
                        <div class="match">
                            <div class="team1">
                                ${match.team1.map((player, index) => {
                                  return `
                                        <div class="players-team1">
                                        <strong>${player.name}</strong>
                                        <strong>${player.name}</strong>
                                        </div>
                                    `;
                                })}
                            </div>
                            <div class="team1">
                                ${match.team2.map((player, index) => {
                                  return `
                                        <div class="players-team2">
                                        <strong>${player.name}</strong>
                                        <strong>${player.name}</strong>
                                        </div>
                                    `;
                                })}
                            </div>
                        </div>
                    `;
                })}
                <strong>Équipe 2:</strong>
                
            </div>
        `;
      })}
    `;
}

// -- GENERATE MATCH PLANNING --
function generatePlanning() {
  planning = [];
  const history = {};

  function key(a, b) {
    return [a, b].sort().join("|");
  }

  function scoreMatch(p1, p2, p3, p4) {
    let score = 0;
    const team1 = [p1, p2];
    const team2 = [p3, p4];
    const all = [...team1, ...team2];

    // Penalty for repeated teammates or opponents
    score -= (history[key(p1.name, p2.name)] || 0) * 5;
    score -= (history[key(p3.name, p4.name)] || 0) * 5;
    for (let a of team1)
      for (let b of team2) score -= (history[key(a.name, b.name)] || 0) * 2;

    // Penalize cross-gender inconsistencies
    const gender1 = new Set(team1.map((p) => p.gender));
    const gender2 = new Set(team2.map((p) => p.gender));
    if (
      gender1.size === 1 &&
      gender2.size === 1 &&
      [...gender1][0] !== [...gender2][0]
    )
      score -= 10;

    // Level balance bonus
    const levelDiff = Math.abs(
      levelValue[p1.level] +
        levelValue[p2.level] -
        (levelValue[p3.level] + levelValue[p4.level])
    );
    score -= levelDiff;

    return score;
  }

  for (let tour = 0; tour < settings.tours; tour++) {
    const matches = [];
    const used = new Set();
    let tourPlayers = [...players];

    for (let t = 0; t < settings.terrains; t++) {
      let bestScore = -Infinity;
      let bestCombo = null;

      for (let i = 0; i < tourPlayers.length; i++) {
        for (let j = i + 1; j < tourPlayers.length; j++) {
          for (let k = 0; k < tourPlayers.length; k++) {
            if (used.has(k) || k === i || k === j) continue;
            for (let l = k + 1; l < tourPlayers.length; l++) {
              if (used.has(l) || l === i || l === j) continue;
              const p1 = tourPlayers[i],
                p2 = tourPlayers[j],
                p3 = tourPlayers[k],
                p4 = tourPlayers[l];
              const s = scoreMatch(p1, p2, p3, p4);
              if (s > bestScore) {
                bestScore = s;
                bestCombo = [i, j, k, l];
              }
            }
          }
        }
      }

      if (bestCombo) {
        const [i, j, k, l] = bestCombo;
        const match = {
          team1: [tourPlayers[i], tourPlayers[j]],
          team2: [tourPlayers[k], tourPlayers[l]],
        };
        matches.push(match);
        [i, j, k, l].forEach((idx) => used.add(idx));

        const pairs = [
          [i, j],
          [k, l],
          [i, k],
          [i, l],
          [j, k],
          [j, l],
        ];
        pairs.forEach(([a, b]) => {
          const hKey = key(tourPlayers[a].name, tourPlayers[b].name);
          history[hKey] = (history[hKey] || 0) + 1;
        });
      }
    }

    planning.push(matches);
  }

  localStorage.setItem("planning", JSON.stringify(planning));
}

// -- UI FUNCTIONS --
function showSection(id) {
  document
    .querySelectorAll("section")
    .forEach((sec) => (sec.style.display = "none"));

  const sectionEl = document.getElementById(id);
  if (id === "players") renderPlayersSection();
  if (id === "settings") renderSettingsSection();
  if (id === "tournament") renderTournament();

  sectionEl.style.display = "block";
}

function toggleStatsPanel() {
  const panel = document.getElementById("statsPanel");
  panel.classList.toggle("open");
  if (panel.classList.contains("open")) {
    renderStatsPanel();
  }
}
