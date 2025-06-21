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
let planning = JSON.parse(localStorage.getItem("planning") || "[]");
let manualMode = false;

// -- DOM CREATION --
window.addEventListener("DOMContentLoaded", () => {
  document.body.innerHTML = `
  <header class="header flex justify-start items-center">
      <span>🏸 Générateur de tournoi de Badminton</span>
  </header>
  <div id="main">
    <section id="preparation"></section>
    <section id="tournament" style="display:none"></section>
  </div>
  <aside id="statsPanel" class=""></aside>
`;

  renderPreparationSection();
  renderTournament();
  if (planning.length > 0) {
    renderStats();
  }
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
  localStorage.setItem("planning", JSON.stringify(planning));
}

// -- RENDER PLAYERS SECTION --
function renderPreparationSection() {
  const el = document.getElementById("preparation");
  el.innerHTML = `
    <div class="sous-header">
      <h2> ⚙️Paramètres</h2>
    </div>
    <div class="m-5">
      <label>Nombre de terrains : <input type="number" min="1" value="${
        settings.terrains
      }" onchange="settings.terrains=parseInt(this.value);saveData()"></label><br>
      <label>Nombre de tours : <input type="number" min="1" value="${
        settings.tours
      }" onchange="settings.tours=parseInt(this.value);saveData()"></label><br>
    </div>

    <div class="sous-header justify-between">
      <h2>👥 Liste des joueurs</h2>
      <span>${players.length} joueurs enregistrés</span>
    </div>
    <div class="m-5">

    <form id="form-add-player" class="my-2">
        <input id="name-player" placeholder="Nouveau joueur" value="" />
        <select id="gender-player" >
            <option value="H" selected>H</option>
            <option value="F">F</option>
        </select>
        <select id="level-player" >
        ${levels
          .map(
            (l) =>
              `<option value="${l}" ${
                "NC" === l ? "selected" : ""
              }>${l}</option>`
          )
          .join("")}
      </select>
        <button class="btn-primary w-36" type="submit" id="addPlayer">Ajouter un joueur</button>

    </form>
    <div id="playerList"></div>
    </div>

    <footer class="footer flex justify-end">
    ${
      planning.length == 0
        ? `
      <button class="btn-primary" onclick="generatePlanning();showSection('tournament');"> 🏆 Générer le tournoi</button>
      `
        : `
      <div class="flex justify-between w-full p-2">
        <button class="btn-primary" onclick="generatePlanning();showSection('tournament');"> 🏆 Régénérer le tournoi</button>
        <button class="btn-secondary" onclick="showSection('tournament');"> Tournoi en cours ➜</button>
      </div>
      `
    }
    </footer>
  `;

  el.querySelector("#form-add-player").onsubmit = () => {
    let name = el.querySelector("#name-player").value.trim();
    if (name == "") {
      const names = [
        "Paul",
        "Robin",
        "Celine",
        "John",
        "Olivier",
        "Fabien",
        "Marie",
        "Ludivine",
        "Audrey",
        "Katy",
      ];
      let tries = 0;
      do {
        name =
          "[Auto] " +
          names[Math.floor(Math.random() * names.length)] +
          "_" +
          Math.floor(Math.random() * 100);
        tries++;
      } while (players.find((p) => p.name === name) && tries < 50);
    }
    const newPlayer = {
      name,
      gender: el.querySelector("#gender-player").value,
      level: el.querySelector("#level-player").value,
    };
    players.splice(0, 0, newPlayer);
    saveData();
    renderPreparationSection();
    el.querySelector("#name-player").focus();
  };

  const list = el.querySelector("#playerList");
  list.innerHTML = players
    .map(
      (p, i) => `
    <div class="mb-1">
      <input value="${
        p.name
      }" onchange="players[${i}].name=this.value;saveData();renderPreparationSection()" />
      <select onchange="players[${i}].gender=this.value;saveData();renderPreparationSection()">
        <option value="H" ${p.gender === "H" ? "selected" : ""}>H</option>
        <option value="F" ${p.gender === "F" ? "selected" : ""}>F</option>
      </select>
      <select onchange="players[${i}].level=this.value;saveData();renderPreparationSection()">
        ${levels
          .map(
            (l) =>
              `<option value="${l}" ${
                p.level === l ? "selected" : ""
              }>${l}</option>`
          )
          .join("")}
      </select>
      <button class="btn-secondary w-36" onclick="players.splice(${i},1);saveData();renderPreparationSection()">Supprimer</button>
    </div>
  `
    )
    .join("");
}

// -- RENDER TOURNAMENT SECTION --
function renderTournament() {
  let planning = JSON.parse(localStorage.getItem("planning") || []);
  const el = document.getElementById("tournament");
  let indexMatch = 0;
  el.innerHTML = `
      <div class="sous-header flex justify-start">
        <button class="btn-secondary" onclick="showSection('preparation');"> Retour </button>
        <span>🏆 Tournoi</span>
        <button onclick="toggleStatsPanel()">📊 Statistiques</button>
      </div>
      ${planning
        .map((tour, index) => {
          return `
            <div class="ml-5">
                <h3 class="sous-header-secondary">Tour ${index + 1}</h3>
                <div class="flex justify-center flex-wrap gap-4">
                  ${tour
                    .map((match, index) => {
                      indexMatch++;
                      return `
                        <div class="flex flex-col mx-2">
                          <h4>Match ${indexMatch} - Terrain ${index + 1}</h4>
                          <div class="flex items-center border p-2 rounded">
                              <div class="flex flex-col mx-2">
                                  ${match.team1
                                    .map((player) => {
                                      return `
                                          <span>${player.name}</span>
                                      `;
                                    })
                                    .join("")}
                              </div>
                              🏸
                              <div class="flex flex-col mx-2">
                                  ${match.team2
                                    .map((player) => {
                                      return `
                                          <span>${player.name}</span>
                                      `;
                                    })
                                    .join("")}
                              </div>
                          </div>
                        </div>
                      `;
                    })
                    .join("")}
                </div>
            </div>
        `;
        })
        .join("")}

    `;
}

function renderStats() {
  const panel = document.getElementById("statsPanel");
  let total = 0,
    invalids = 0;
  const opponentsMap = {}; // { playerName: { opponentName: count } }
  const teammateMap = {}; // { playerName: { teammateName: count } }
  const waitCount = {};

  planning.forEach((matches, tourIdx) => {
    const playersInTour = new Set();
    matches.forEach((match, matchIdx) => {
      const allPlayers = [...match.team1, ...match.team2];
      allPlayers.forEach((p) => playersInTour.add(p.name));

      match.team1.forEach((p1) => {
        match.team2.forEach((p2) => {
          opponentsMap[p1.name] = opponentsMap[p1.name] || {};
          opponentsMap[p1.name][p2.name] =
            (opponentsMap[p1.name][p2.name] || 0) + 1;
        });
      });

      [match.team1, match.team2].forEach((team) => {
        team.forEach((p1) => {
          team.forEach((p2) => {
            if (p1.name !== p2.name) {
              teammateMap[p1.name] = teammateMap[p1.name] || {};
              teammateMap[p1.name][p2.name] =
                (teammateMap[p1.name][p2.name] || 0) + 1;
            }
          });
        });
      });

      const s1 = scores[`${tourIdx}-${matchIdx}-t1`];
      const s2 = scores[`${tourIdx}-${matchIdx}-t2`];
      if (typeof s1 === "number" && typeof s2 === "number") {
        total++;
        if (
          !(
            s1 >= 21 &&
            s2 >= 0 &&
            Math.abs(s1 - s2) >= 2 &&
            s1 <= 32 &&
            s2 <= 32
          )
        )
          invalids++;
      }
    });

    players.forEach((p) => {
      if (!playersInTour.has(p.name)) {
        waitCount[p.name] = waitCount[p.name] || [];
        waitCount[p.name].push(tourIdx + 1);
      }
    });
  });

  function renderAccordions(map, label) {
    return Object.entries(map)
      .map(([p, data]) => {
        const repeated = Object.entries(data).filter(([, count]) => count > 1);
        if (!repeated.length) return "";
        return `
        <button class="accordion" onclick="this.classList.toggle('open')">${p} - ${label}</button>
        <div class="accordion-content">
          ${repeated
            .map(([other, count]) => `<div>${other} (${count} fois)</div>`)
            .join("")}
        </div>
      `;
      })
      .join("");
  }

  const waitList = Object.entries(waitCount).sort(
    (a, b) => b[1].length - a[1].length
  );

  panel.innerHTML = `
    <h3>📊 Statistiques</h3>
    <p>Total de scores saisis : ${total}</p>
    <p class="${invalids === 0 ? "valid" : "invalid"}">
      ${
        invalids === 0
          ? "✅ Tous les scores sont valides"
          : `❌ ${invalids} score(s) invalides`
      }
    </p>
    <h4>Adversaires rencontrés plusieurs fois</h4>
    ${renderAccordions(opponentsMap, "adversaires répétés")}
    <h4>Coéquipiers répétés</h4>
    ${renderAccordions(teammateMap, "coéquipiers répétés")}
    <h4>Joueurs souvent en attente</h4>
    ${waitList
      .map(
        ([name, tours]) => `
      <button class="accordion" onclick="this.classList.toggle('open')">${name} - ${
          tours.length
        } attente(s)</button>
      <div class="accordion-content">
        ${tours.map((t) => `<div>Tour ${t}</div>`).join("")}
      </div>
    `
      )
      .join("")}
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

  renderStats();

  localStorage.setItem("planning", JSON.stringify(planning));
}
