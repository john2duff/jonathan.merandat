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
  terrains: 7,
  tours: 8,
  ecartMax: 10,
  priorities: { equipier: 1, adversaire: 1, attente: 2, sexe: 2, niveau: 1 },
};
let tournoi = JSON.parse(localStorage.getItem("gen-tournoi") || "{}");
let players = tournoi.players || [];
let settings = tournoi.settings || defaultConfig;
let scores = tournoi.scores || {};
let planning = tournoi.planning || [];
let manualMode = false;

let opponentsMap = {}; // { playerName: { opponentName: count } }
let teammateMap = {}; // { playerName: { teammateName: count } }
let waitCount = {};
let sexeIssues = [];
let niveauIssues = [];
let maxTries = 0;

// -- DOM CREATION --
window.addEventListener("DOMContentLoaded", () => {
  document.body.innerHTML = `
  <div id="global" class="flex flex-col">
    <header class="header flex justify-between items-center">
        <span>🏸 Générateur de tournoi de Badminton</span>
      <button class="btn-primary" onclick="reset();">Reset</button>
    </header>
    <div id="main" class="flex flex-auto">
      <section id="preparation" class="flex flex-col flex-auto"></section>
      <section id="tournament" class="flex flex-col flex-auto" style="display:none"></section>
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
      
      ${"" /*renderContraintes("preparation", false)*/}
    </div>

    <div class="sous-header justify-between">
      <h2>👥 Liste des joueurs</h2>
      <span>${players.length} joueurs enregistrés</span>
    </div>
    <div class="flex-auto">
      <form id="form-add-player" class=" sous-header-secondary flex flex-wrap gap-1">
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
      <button class="btn-primary" onclick="prepareOptimise(); optimisePlanning();"> 🏆 Générer le tournoi</button>
      `
        : `
      <div class="flex justify-between w-full p-2">
        <button class="btn-primary" onclick="prepareOptimise(); optimisePlanning();"> 🏆 Régénérer le tournoi</button>
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
  ${"" /*<div id="contrainte-panel">*/}
  ${"" /*renderContraintes("panel", true)*/}
  </div>
  <div id="stats-panel" class="flex flex-col">
  </div>
  `;
}

function evaluerPlanning() {
  let total = 0,
    invalids = 0;
  opponentsMap = {}; // { playerName: { opponentName: count } }
  teammateMap = {}; // { playerName: { teammateName: count } }
  waitCount = {};
  sexeIssues = [];
  niveauIssues = [];

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

      const isMixte = (team) =>
        team.filter((p) => p.gender === "F").length === 1;
      const isDoubleHomme = (team) => team.every((p) => p.gender === "M");
      const isDoubleFemme = (team) => team.every((p) => p.gender === "F");

      const team1Mixte = isMixte(match.team1);
      const team2Mixte = isMixte(match.team2);
      const team1H = isDoubleHomme(match.team1);
      const team2H = isDoubleHomme(match.team2);
      const team1F = isDoubleFemme(match.team1);
      const team2F = isDoubleFemme(match.team2);

      if (
        (team1Mixte && (team2H || team2F)) ||
        (team2Mixte && (team1H || team1F)) ||
        (team1H && team2F) ||
        (team2H && team1F)
      ) {
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

  let score = 1000;
  let comptIssue = 0;

  // Adversaires rencontrés plusieurs fois
  let repeatOpponentCount = 0;
  for (const key in opponentsMap) {
    repeatOpponentCount += Object.entries(opponentsMap[key]).length;
  }
  if (repeatOpponentCount > 0) comptIssue++;
  score -= repeatOpponentCount * settings.priorities.adversaire;

  // Coéquipiers répétés
  let repeatTeammateCount = 0;
  for (const key in teammateMap) {
    repeatTeammateCount += Object.entries(teammateMap[key]).length;
  }
  if (repeatTeammateCount > 0) comptIssue++;
  score -= repeatTeammateCount * settings.priorities.equipier;

  // Nombre total d'attentes
  const totalWaits = Object.values(waitCount).reduce((a, b) => a + b.length, 0);
  if (totalWaits > 0) comptIssue++;
  score -= totalWaits * settings.priorities.attente;

  // Problèmes d'équilibre des sexes
  if (sexeIssues.length > 0) comptIssue++;
  score -= sexeIssues.length * settings.priorities.sexe;

  // Problèmes d'écart de niveau
  if (niveauIssues.length > 0) comptIssue++;
  score -= niveauIssues.length * settings.priorities.niveau;

  scoreStat = (comptIssue / 5) * 100;
  return Math.max(0, score); // Pour éviter un score négatif
}

function renderStats() {
  const stats = document.getElementById("stats-panel");

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
  <span>Respect des contraintes : ${bestScoreStat} %</span>

  ${
    adversaireContrainte == ""
      ? `<span>✅ Aucun adversaire identique</span>`
      : `<button class="accordion" onclick="this.classList.toggle('open')">❌ ${
          Object.entries(opponentsMap).length
        } adversaire répétés</button>
       <div class="accordion-content">
        <div class="flex flex-col w-full">
          ${adversaireContrainte}
        </div>
      </div>`
  }
  ${
    coequipierContrainte == ""
      ? `<span>✅ Aucun coéquipier identique</span>`
      : `<button class="accordion" onclick="this.classList.toggle('open')">❌ ${
          Object.entries(teammateMap).length
        } coéquipiers répétés</button> 
      <div class="accordion-content">
        <div class="flex flex-col w-full">
          ${coequipierContrainte}
        </div>
      </div>`
  }

  ${
    sexeIssues.length == 0
      ? `<span>✅ Aucun problème de mixité</span>`
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
      ? `<span>✅ Aucun problème d'écart de point</span>`
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
      ? `<span>✅ Aucun joueur en attente</span>`
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

function attentePenalty(joueurs, joueursAttente) {
  let penalty = 0;
  for (const joueur of joueurs) {
    const attente = joueursAttente[joueur.id] || 0;
    // pénalité exponentielle (2^n - 1) : 0, 1, 3, 7, 15...
    penalty += Math.pow(2, attente) - 1;
  }
  return penalty;
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
  const { equipier, adversaire, attente, sexe, niveau } = params;

  // Coéquipiers déjà ensemble
  let sameCount1 = sameTeamCount(team1[0], team1[1], planning);
  if (sameCount1 > 0) score -= sameCount1 * equipier;
  let sameCount2 = sameTeamCount(team2[0], team2[1], planning);
  if (sameCount2 > 0) score -= sameCount2 * equipier;

  // Adversaires déjà rencontrés
  for (const p1 of team1) {
    for (const p2 of team2) {
      let sameOpponent1 = sameOpponentCount(p1, p2, planning);
      if (sameOpponent1 > 0) score -= sameOpponent1 * adversaire;
    }
  }

  // Attente minimisée
  const tousLesJoueurs = [...team1, ...team2];
  const attentePen = attentePenalty(tousLesJoueurs, joueursAttente);
  score -= attentePen * attente;

  // Mixité
  const mixte = (t) => t.filter((p) => p.gender === "F").length === 1;
  if (!(mixte(team1) && mixte(team2))) score -= 1 * sexe;

  // Écart de niveau max autorisé
  const tous = [...team1, ...team2];
  const ecart =
    Math.max(...tous.map(getLevelScore)) - Math.min(...tous.map(getLevelScore));
  if (ecart > settings.ecartMax) score -= 1 * niveau;

  return score;
}

function permutations(arr) {
  if (arr.length <= 1) return [arr];
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const p of permutations(rest)) {
      result.push([arr[i], ...p]);
    }
  }
  return result;
}

// -- GÉNÉRATION DU PLANNING --
async function generePlanning() {
  return new Promise(async (resolve, reject) => {
    try {
      settings.priorities = getSettingsPriorities();
      let planning = [];
      let joueursAttente = {};
      const maxTries = 100; // ou settings.maxTries si défini
      permutationTotal = factorial(players.length);
      permutationUsed = [];

      for (let tour = 0; tour < settings.tours; tour++) {
        const joueursUtilises = new Set();
        const tourMatches = [];

        for (let terrain = 0; terrain < settings.terrains; terrain++) {
          const combinaisons = [];
          let permutationIndex = 0;
          // Construire liste des joueurs disponibles
          const disponibles = players
            .filter((p) => !joueursUtilises.has(p.id))
            .sort((a, b) => {
              const attenteA = joueursAttente[a.id] || 0;
              const attenteB = joueursAttente[b.id] || 0;
              return attenteB - attenteA; // ceux qui ont attendu le plus en premier
            });
          if (disponibles.length < 4) break;
          permutationTotal = factorial(disponibles.length);
          while (
            tourMatches.length < settings.terrains &&
            permutationIndex < maxTries
          ) {
            //const permutation = getNthPermutation(disponibles, permutationIndex);
            const groupe = disponibles.slice(0, 4);
            //const groupe = getPermutationsJoueur(disponibles);
            //if (groupe == null) break;

            const team1 = [groupe[0], groupe[1]];
            const team2 = [groupe[2], groupe[3]];
            const score = matchScore(
              team1,
              team2,
              planning,
              joueursAttente,
              settings.priorities
            );
            combinaisons.push({ team1, team2, score });
            permutationIndex++;
          }

          combinaisons.sort((a, b) => b.score - a.score);
          for (const comb of combinaisons) {
            //if (tourMatches.length >= settings.terrains) break;
            //if (comb.joueurs.some((p) => joueursUtilises.has(p.id))) continue;
            tourMatches.push({ team1: comb.team1, team2: comb.team2 });
            comb.team1.forEach((p) => joueursUtilises.add(p.id));
            comb.team2.forEach((p) => joueursUtilises.add(p.id));
            break;
            //on ne prend que le premier
          }
          permutationUsed = [];
        }

        // Vérifie qu'aucun joueur déjà utilisé
        /*if (groupe.every((p) => !joueursUtilises.has(p.id))) {
          tourMatches.push({ team1, team2 });
          groupe.forEach((p) => joueursUtilises.add(p.id));
          permutationUsed = [];
        }*/

        // Marquer les joueurs qui n'ont pas joué
        players.forEach((p) => {
          if (!joueursUtilises.has(p.id)) {
            joueursAttente[p.id] = (joueursAttente[p.id] || 0) + 1;
          }
        });

        planning.push(tourMatches);
      }

      resolve(planning);
    } catch (e) {
      console.error("error generatePlanning", e);
      reject();
    }
  });
}

let bestPlanning = null;
let bestScore = -Infinity;
let bestScoreStat = -Infinity;
let scoreStat = -Infinity;
let stopRequested = false;
let shuffledOrders = null;
let shuffledOrdersIndex = -1;
let totalOrdersMessage = null;
let totalOrders = null;
let contraintesUsed = [];
const rangeContraintes = {
  equipier: [8],
  adversaire: [4],
  attente: [10],
  sexe: [6],
  niveau: [2],
};
let contraintesPossible = null;
let permutationUsed = [];
let permutationTotal = null;

function prepareOptimise() {
  //totalOrders = factorial(players.length);
  contraintesUsed = [];
  contraintesPossible = generateConstraintCombinations(rangeContraintes);
  permutationTotal = factorial(players.length);
  //console.log(contraintesPossible.length); // total de combinaisons
  //console.log(contraintesPossible); // tableau de toutes les combinaisons possibles
  /*shuffledOrders = [];
  if (totalOrders > 100) {
    totalOrdersMessage =
      "Combinaisons possibles : " +
      totalOrders +
      ". Seulement 100 au hasard seront testé";
  }
  var t = Math.min(totalOrders, 100);
  for (let i = 0; i < t; i++) {
    shuffledOrders.push(
      getNthPermutation(players, Math.floor(Math.random() * (totalOrders + 1)))
    );
  }*/
  //shuffledOrders = generateShuffledOrders(100);
  //shuffledOrdersIndex = 0;
  //maxTries = shuffledOrders.length;
  addProgressBar();
}

/*function getOrder() {
  let candidateOrder = null;
  while (ordersUsed.length < totalOrders) {
    let random = Math.floor(Math.random() * totalOrders);
    if (!ordersUsed.includes(random)) {
      candidateOrder = getNthPermutation(players, random);
      ordersUsed.push(random);
      break;
    }
  }
  return candidateOrder;
}
*/

function getSettingsPriorities() {
  let candidateSettingsPriorities = null;
  while (contraintesUsed.length < contraintesPossible.length) {
    let random = Math.floor(Math.random() * contraintesPossible.length);
    if (!contraintesUsed.includes(random)) {
      candidateSettingsPriorities = contraintesPossible[random];
      contraintesUsed.push(random);
      break;
    }
  }
  return candidateSettingsPriorities;
}

function getPermutationsJoueur(disponibles) {
  let candidatePermutation = null;
  while (permutationUsed.length < permutationTotal) {
    let random = Math.floor(Math.random() * permutationTotal);
    if (!permutationUsed.includes(random)) {
      candidatePermutation = getNthPermutation(disponibles, random);
      permutationUsed.push(random);
      break;
    }
  }
  return candidatePermutation;
}

async function optimisePlanning() {
  showSection("tournament");
  togglePanel();

  let historyBestPlanning = [];
  bestScore = -Infinity;
  scoreStat = -Infinity;

  for (let i = 0; i < contraintesPossible.length && !stopRequested; i++) {
    planning = await generePlanning();
    //c'est que l'on n'a plus de set de joueurs
    if (planning === false) {
      break;
    }
    const score = evaluerPlanning();

    if (score > bestScore) {
      bestScore = score;
      bestScoreStat = scoreStat;
      bestPlanning = planning;
      historyBestPlanning.push(`${bestScore / 10} % `);
      renderTournament();
      renderStats();
    }

    document.getElementById(
      "label-progress-bar"
    ).innerHTML = `Recherche des contraintes ${i + 1} / ${
      contraintesPossible.length
    } </br>
    Respect des contraintes : ${bestScore / 10} % `;
    document.getElementById("progress-bar").value = i + 1;

    if (score === 1000) break;
    await new Promise((r) => requestAnimationFrame(r));
  }

  if (bestPlanning) {
    planning = bestPlanning;
    saveData();
    renderPreparationSection();
    renderTournament();
    renderStats();
    console.log(settings.priorities);
  }
  document.getElementById("global").removeChild(loader);
  stopRequested = false;
  bestPlanning = null;
}

function stopRequest() {
  stopRequested = true;
}

function addProgressBar() {
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
  progress.id = "progress-bar";
  progress.max = contraintesPossible.length;
  progress.value = 0;
  const label = document.createElement("div");
  label.style.marginTop = "1em";
  label.id = "label-progress-bar";
  loader.innerHTML = `<center><span calss="flex w-80 justidy-between" >Génération du tournoi en cours... </br> </br><button class="btn-secondary" onclick="stopRequest()"> Arrêter la recherche </button></span> </br>
  <span style="font-size:0.8em; font-style:italic;">La meilleure distribution sera retenue</span> </br></br><center>`;
  loader.appendChild(progress);
  loader.appendChild(label);
  document.getElementById("global").append(loader);
}

/*function generateShuffledOrders(maxTries) {
  const seen = new Set();
  const results = [];
  const totalOrders = factorial(players.length);

  while (results.length < maxTries && results.length < totalOrders) {
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const key = shuffled.map((p) => p.id).join("-");
    if (!seen.has(key)) {
      seen.add(key);
      results.push(shuffled);
    }
  }

  return results;
}*/

function factorial(n) {
  return n <= 1 ? 1 : n * factorial(n - 1);
}
function getNthPermutation(arr, n) {
  const result = [];
  const items = [...arr];
  let k = n;

  for (let i = arr.length; i > 0; i--) {
    const f = factorial(i - 1);
    const index = Math.floor(k / f);
    result.push(items[index]);
    items.splice(index, 1);
    k = k % f;
  }

  return result;
}

function generateConstraintCombinations(ranges) {
  const keys = Object.keys(ranges);
  const result = [];

  function backtrack(index, current) {
    if (index === keys.length) {
      result.push({ ...current });
      return;
    }

    const key = keys[index];
    for (const value of ranges[key]) {
      current[key] = value;
      backtrack(index + 1, current);
    }
  }

  backtrack(0, {});
  return result;
}
