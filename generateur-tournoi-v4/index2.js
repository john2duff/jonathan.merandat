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

const levelValue = {
  NC: 0,
  P12: 1,
  P11: 2,
  P10: 3,
  D9: 4,
  D8: 5,
  D7: 6,
  R6: 7,
  R5: 8,
  R4: 9,
  N3: 10,
  N2: 11,
  N1: 12,
};

const defaultConfig = {
  terrains: 2,
  tours: 3,
  ecartMax: 10,
  priorities: { equipier: 1, adversaire: 1, attente: 2, sexe: 2, niveau: 1 },
};
let tournoi = JSON.parse(localStorage.getItem("gen-tournoi") || "{}");
let players = tournoi.players || [];
let settings = tournoi.settings || defaultConfig;
let scores = tournoi.scores || {};
let planning = tournoi.planning || [];
let manualMode = false;

// -- DOM CREATION --
window.addEventListener("DOMContentLoaded", () => {
  document.body.innerHTML = `
  <div id="global" class="flex flex-col overflow-auto">
    <header class="header flex justify-between items-center">
        <span>🏸 Générateur de tournoi de Badminton</span>
      <button class="btn-primary" onclick="reset();">Reset</button>
    </header>
    <div id="main" class="flex">
      <section id="preparation" class="flex-auto"></section>
      <section id="tournament" class="flex-auto" style="display:none"></section>
    </div>
  </div>
  <aside id="panel" class="h-screen overflow-auto"></aside>
`;

  renderPreparationSection();
  renderTournament();
  renderPanel();
  renderStats();
});

// -- UI FUNCTIONS --
function showSection(id) {
  document
    .querySelectorAll("section")
    .forEach((sec) => (sec.style.display = "none"));
  document.getElementById(id).style.display = "block";
}

function togglePanel(forceHide = null) {
  const panel = document.getElementById("panel");
  if (forceHide === true) {
    panel.classList.remove("open");
  } else {
    panel.classList.toggle("open");
  }
  const global = document.getElementById("global");
  if (panel.classList.contains("open")) {
    global.classList.add("withPanel");
  } else {
    global.classList.remove("withPanel");
  }
}

function reset() {
  if (confirm("Reset ?")) {
    players = [];
    settings = defaultConfig;
    scores = {};
    planning = [];
    saveData();
    renderPreparationSection();
    renderTournament();
    renderStats();
  }
}

function saveData() {
  localStorage.setItem(
    "gen-tournoi",
    JSON.stringify({
      players,
      settings,
      scores,
      planning,
    })
  );
}

// -- RENDER PLAYERS SECTION --
function renderPreparationSection() {
  const el = document.getElementById("preparation");
  el.innerHTML = `
    <div class="sous-header">
      <h2> ⚙️Paramètres</h2>
    </div>
    <div class="flex flex-wrap gap-4 m-5">
      <label>Nombre de terrains : <input type="number" min="1" value="${
        settings.terrains
      }" onchange="settings.terrains=parseInt(this.value);saveData()"></label> 
      <label>Nombre de tours : <input type="number" min="1" value="${
        settings.tours
      }" onchange="settings.tours=parseInt(this.value);saveData()"></label>
      
      ${renderContraintes("preparation", false)}
    </div>

    <div class="sous-header justify-between">
      <h2>👥 Liste des joueurs</h2>
      <span>${players.length} joueurs enregistrés</span>
    </div>
    <div class="">

    <form id="form-add-player" class="sous-header-secondary flex flex-wrap gap-1">
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
        <button class="btn-primary rounded" type="submit" id="addPlayer">+ Ajouter un joueur</button>

    </form>
    <div id="playerList" class="m-5"></div>
    </div>

    <footer class="footer flex justify-end">
    ${
      planning.length == 0
        ? `
      <button class="btn-primary" onclick="regenerate();"> 🏆 Générer le tournoi</button>
      `
        : `
      <div class="flex justify-between w-full p-2">
        <button class="btn-primary" onclick="regenerate(true);"> 🏆 Régénérer le tournoi</button>
        <button class="btn-secondary" onclick="showSection('tournament');"> Tournoi en cours ➜</button>
      </div>
      `
    }
    </footer>
  `;

  el.querySelector("#form-add-player").onsubmit = () => {
    let name = el.querySelector("#name-player").value.trim();
    const wasEmpty = name == "";
    if (name == "" || players.find((p) => p.name === name)) {
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
        name = wasEmpty
          ? "[Auto] " +
            names[Math.floor(Math.random() * names.length)] +
            "_" +
            Math.floor(Math.random() * 100)
          : name + "_" + Math.floor(Math.random() * 100);
        tries++;
      } while (players.find((p) => p.name === name) && tries < 50);
    }
    const newPlayer = {
      name,
      gender: el.querySelector("#gender-player").value,
      level: el.querySelector("#level-player").value,
      id: crypto.randomUUID?.(),
    };
    players.splice(0, 0, newPlayer);
    saveData();
    renderPreparationSection();
    if (!wasEmpty) {
      el.querySelector("#name-player").focus();
    }
  };

  const list = el.querySelector("#playerList");
  list.innerHTML = players
    .map(
      (p, i) => `
    <div class="mb-1">
      <input id="name_${i}" value="${
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
      <button class="w-10" onclick="players.splice(${i},1);saveData();renderPreparationSection()"> 🗑 </button>
    </div>
  `
    )
    .join("");
}

function regenerate(hasConfirm = false) {
  if (
    !hasConfirm ||
    confirm("Un tournoi existe déjà, il va être perdu, voulez vous-continuer ?")
  ) {
    generePlanning().then(() => {
      renderTournament();
      renderStats();
      showSection("tournament");
    });
  }
}

// -- RENDER TOURNAMENT SECTION --
function renderTournament() {
  const el = document.getElementById("tournament");
  let indexMatch = 0;
  el.innerHTML = `
      <div class="sous-header flex justify-between">
        <button onclick="togglePanel(true);showSection('preparation');"> <div style="transform:rotate(180deg)">➜<div>  </button>
        <button onclick="togglePanel()">📊 Statistiques</button>
      </div>
      ${planning
        .map((tour, index) => {
          return `
            <div class="">
                <h3 class="sous-header-secondary">Tour ${index + 1}</h3>
                <div class="flex justify-center flex-wrap gap-4">
                  ${tour
                    .map((match, index) => {
                      indexMatch++;
                      return `
                        <div class="flex flex-col mx-2">
                          <h4>Match ${indexMatch} - Terrain ${index + 1}</h4>
                          <div class="flex items-center border p-2 rounded">
                              <div class="flex mx-2">
                              <input type="number" min="-32" max="32" value="${
                                match.score?.[0] ?? ""
                              }" onchange="onInputScore(event, 0)" />
                                <div class="flex flex-col mx-2">
                                    ${match.team1
                                      .map((player) => {
                                        return `
                                            <span>${player.name}</span>
                                        `;
                                      })
                                      .join("")}
                                </div>
                              </div>
                              🏸
                              <div class="flex mx-2">
                                <div class="flex flex-col mx-2">
                                    ${match.team2
                                      .map((player) => {
                                        return `
                                            <span>${player.name}</span>
                                        `;
                                      })
                                      .join("")}
                                </div>
                                <input type="number" min="-32" max="32" value="${
                                  match.score?.[0] ?? ""
                                }" onchange="onInputScore(event, 1)" />
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

function renderContraintes(from, refreshTournament) {
  const retour = `<button class="accordion" onclick="this.classList.toggle('open')"> ﹀ Gestion des contraintes</button>
  <div class="accordion-content flex-wrap gap-4"> 
  ${Object.entries(settings.priorities)
    .map(
      ([priority, poids]) =>
        `<label class="flex flex-col" for="${from}_slider_${priority}">${priority} : 
            <div class="flex items-center">
              <span class="w-5" id="${from}_value_slider_${priority}">${poids}</span>
              <input id="${from}_slider_${priority}" type="range" min="1" max="10" value="${poids}" oninput="onInputSlider(event, '${from}', '${priority}', ${refreshTournament})">
            </div>
          </label>`
    )
    .join("")}
  </div>`;
  return retour;
}

function onInputSlider(e, from, priority, refreshTournament) {
  settings.priorities[priority] = parseInt(e.currentTarget.value);
  document.getElementById(from + "_value_slider_" + priority).innerHTML =
    e.currentTarget.value;
  saveData();
  if (refreshTournament) {
    generePlanning().then(() => {
      renderTournament();
      renderStats();
    });
  }
}

function onInputScore(e, from, priority, refreshTournament) {
  /*settings.priorities[priority] = parseInt(e.currentTarget.value);
  document.getElementById(from + "_value_slider_" + priority).innerHTML =
    e.currentTarget.value;
  saveData();
  if (refreshTournament) {
    generePlanning().then(() => {
      renderTournament();
      renderStats();
    });
  }*/
}

function renderPanel() {
  const panel = document.getElementById("panel");
  panel.innerHTML = `
  <h3 class="sous-header flex justify-between">
  📊 Statistiques
  <button onclick="togglePanel(true);">✖</button>
  </h3>
  <div id="contrainte-panel">
  ${renderContraintes("panel", true)}
  </div>
  <div id="stats-panel">
  </div>
  `;
}

function renderStats() {
  const stats = document.getElementById("stats-panel");
  let total = 0,
    invalids = 0;
  const opponentsMap = {}; // { playerName: { opponentName: count } }
  const teammateMap = {}; // { playerName: { teammateName: count } }
  const waitCount = {};
  const sexeIssues = [];
  const niveauIssues = [];

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

      const mixte = (team) => team.filter((p) => p.gender === "F").length === 1;
      if (!mixte(match.team1) || !mixte(match.team2)) {
        sexeIssues.push({
          tour: tourIdx + 1,
          terrain: matchIdx + 1,
          team1: match.team1.map((p) => p.name).join(" & "),
          team2: match.team2.map((p) => p.name).join(" & "),
        });
      }

      const tous = [...match.team1, ...match.team2];
      const ecart =
        Math.max(...tous.map(getLevelScore)) -
        Math.min(...tous.map(getLevelScore));
      if (ecart > settings.ecartMax) {
        niveauIssues.push({
          tour: tourIdx + 1,
          terrain: matchIdx + 1,
          ecart,
          joueurs: tous.map((p) => p.name).join(", "),
        });
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
        <button class="accordion" onclick="this.classList.toggle('open')">${p} ${label}</button>
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

  const adversaireContrainte = renderAccordions(opponentsMap, "");
  const coequipierContrainte = renderAccordions(teammateMap, "");

  stats.innerHTML = `
  ${
    adversaireContrainte == ""
      ? `✅ Aucun adversaire identique</h4>`
      : `<button class="accordion" onclick="this.classList.toggle('open')">❌ Adversaire répétés</button>
       <div class="accordion-content">
        <div class="flex flex-col w-full">
          ${adversaireContrainte}
        </div>
      </div>`
  }
  ${
    coequipierContrainte == ""
      ? `✅ Aucun coéquipier identique</h4>`
      : `<button class="accordion" onclick="this.classList.toggle('open')">❌ Coéquipiers répétés</button> 
      <div class="accordion-content">
        <div class="flex flex-col w-full">
          ${coequipierContrainte}
        </div>
      </div>`
  }

  ${
    sexeIssues.length == 0
      ? `✅ Aucun problème de mixité</h4>`
      : `<button class="accordion" onclick="this.classList.toggle('open')">❌ ${
          sexeIssues.length
        } problèmes de mixité</button> 
    <div class="accordion-content">
      <div class="flex flex-col w-full">
      ${sexeIssues
        .map((item) => {
          return `<div>
          Tour ${item.tour} - Terrain ${item.terrain} : ${item.team1} vs ${item.team2}
        </div>
        `;
        })
        .join("")}
      </div>
    </div>`
  }

  ${
    niveauIssues.length == 0
      ? `✅ Aucun problème d'écart de point</h4>`
      : `<button class="accordion" onclick="this.classList.toggle('open')">❌ ${
          niveauIssues.length
        } problèmes d'écart de point</button> 
    <div class="accordion-content">
      <div class="flex flex-col w-full">
      ${sexeIsniveauIssuessues
        .map((item) => {
          return `<div>
          Tour ${item.tour} - Terrain ${item.terrain} : Ecart ${item.ecart} - ${item.joueurs}
        </div>
        `;
        })
        .join("")}
      </div>
    </div>`
  }

  ${
    waitList.length == 0
      ? `✅ Aucun joueur en attente`
      : `<button class="accordion" onclick="this.classList.toggle('open')">❌ ${
          waitList.length
        } joueurs en attente</button> 
        <div class="accordion-content">
        <div class="flex flex-col w-full">
           ${waitList
             .map(
               ([name, tours]) => `
                <button class="accordion" onclick="this.classList.toggle('open')">${name} - ${
                 tours.length
               } attente(s)</button>
                <div class="accordion-content">
                  <div class="flex flex-wrap">
                    ${tours
                      .map(
                        (t) => `<div class="border-purple-200" >Tour ${t}</div>`
                      )
                      .join("")}
                  </div>
                </div>
              `
             )
             .join("")}
        </div>
      </div>
       `
  }
`;
}

// -- UTILITAIRES --
function shuffle(array) {
  return array
    .map((x) => [Math.random(), x])
    .sort()
    .map((x) => x[1]);
}

function getLevelScore(p) {
  return levelValue[p.level] || 0;
}

function sameTeamCount(p1, p2, planning) {
  let count = 0;
  for (const tour of planning) {
    for (const match of tour) {
      if (
        (match.team1.includes(p1) && match.team1.includes(p2)) ||
        (match.team2.includes(p1) && match.team2.includes(p2))
      ) {
        count++;
      }
    }
  }
  return count;
}

function sameOpponentCount(p1, p2, planning) {
  let count = 0;
  for (const tour of planning) {
    for (const match of tour) {
      if (
        (match.team1.includes(p1) && match.team2.includes(p2)) ||
        (match.team2.includes(p1) && match.team1.includes(p2))
      ) {
        count++;
      }
    }
  }
  return count;
}

function getMatchStartScore(match) {
  const joueurs = [...match.team1, ...match.team2];
  return joueurs.reduce((acc, p) => acc + getLevelScore(p), 0);
}

function matchScore(team1, team2, planning, joueursAttente, params) {
  let score = 100;
  const { equipe, adversaire, attente, sexe, niveau } = params;

  // Coéquipiers déjà ensemble
  if (sameTeamCount(team1[0], team1[1], planning) > 0) score -= 10 * equipe;
  if (sameTeamCount(team2[0], team2[1], planning) > 0) score -= 10 * equipe;

  // Adversaires déjà rencontrés
  for (const p1 of team1) {
    for (const p2 of team2) {
      if (sameOpponentCount(p1, p2, planning) > 0) score -= 5 * adversaire;
    }
  }

  // Attente minimisée
  for (const p of [...team1, ...team2]) {
    if (joueursAttente[p.id]) score -= 2 * attente;
  }

  // Mixité
  const mixte = (t) => t.filter((p) => p.gender === "F").length === 1;
  if (!(mixte(team1) && mixte(team2))) score -= 5 * sexe;

  // Écart de niveau max autorisé
  const tous = [...team1, ...team2];
  const ecart =
    Math.max(...tous.map(getLevelScore)) - Math.min(...tous.map(getLevelScore));
  if (ecart > settings.ecartMax) score -= (ecart - settings.ecartMax) * niveau;

  return score;
}

// -- GÉNÉRATION DU PLANNING --
async function generePlanning() {
  return new Promise(async (resolve, reject) => {
    try {
      const loader = document.createElement("div");
      loader.id = "loader";
      loader.style.position = "fixed";
      loader.style.top = "0";
      loader.style.left = "0";
      loader.style.width = "100%";
      loader.style.height = "100%";
      loader.style.background = "rgba(255,255,255,0.8)";
      loader.style.display = "flex";
      loader.style.flexDirection = "column";
      loader.style.alignItems = "center";
      loader.style.justifyContent = "center";
      loader.style.zIndex = "1000";
      const progress = document.createElement("progress");
      progress.max = settings.tours;
      progress.value = 0;
      const label = document.createElement("div");
      label.style.marginTop = "1em";
      loader.append("Génération du planning en cours...", progress, label);
      document.getElementById("global").append(loader);

      planning = [];
      const joueursParTour = players.length / 4;
      let joueursAttente = {};

      for (let tour = 0; tour < settings.tours; tour++) {
        label.innerHTML = `Tour ${tour + 1} / ${settings.tours}`;
        await new Promise((r) => requestAnimationFrame(r));
        const joueursUtilises = new Set();

        const tourMatches = [];
        let disponibles = shuffle(
          players.filter((p) => !joueursUtilises.has(p.id))
        );
        const combinaisons = [];

        // Générer toutes les combinaisons possibles
        for (let i = 0; i < disponibles.length; i++) {
          for (let j = i + 1; j < disponibles.length; j++) {
            for (let k = j + 1; k < disponibles.length; k++) {
              for (let l = k + 1; l < disponibles.length; l++) {
                const groupe = [
                  disponibles[i],
                  disponibles[j],
                  disponibles[k],
                  disponibles[l],
                ];
                const team1 = [groupe[0], groupe[1]];
                const team2 = [groupe[2], groupe[3]];
                const score = matchScore(
                  team1,
                  team2,
                  planning,
                  joueursAttente,
                  settings.priorities
                );
                combinaisons.push({ team1, team2, score, joueurs: groupe });
              }
            }
          }
        }

        console.log(
          `Tour ${tour + 1} - ${combinaisons.length} combinaisons trouvées`
        );

        // Trier et sélectionner les meilleures combinaisons sans chevauchement
        combinaisons.sort((a, b) => b.score - a.score);
        const selectionnes = new Set();
        for (const comb of combinaisons) {
          if (tourMatches.length >= settings.terrains) break;
          if (comb.joueurs.some((p) => selectionnes.has(p.id))) continue;
          tourMatches.push({ team1: comb.team1, team2: comb.team2 });
          comb.joueurs.forEach((p) => selectionnes.add(p.id));
        }

        // Marquer les joueurs qui n'ont pas joué pour les contraintes futures
        players.forEach((p) => {
          if (!selectionnes.has(p.id)) {
            joueursAttente[p.id] = (joueursAttente[p.id] || 0) + 1;
          }
        });

        planning.push(tourMatches);
        progress.value = tour + 1;
      }

      saveData();
      renderPreparationSection();
      document.getElementById("global").removeChild(loader);
      resolve();
    } catch {
      reject();
    }
  });
}
