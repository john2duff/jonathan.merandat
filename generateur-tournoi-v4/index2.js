// Ce fichier JavaScript contient l'ensemble de l'interface pour gérer
// un tournoi de badminton en double avec des contraintes complexes
// et une interface utilisateur complète responsive et interactive.
const version = 0.3;
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
  NC: 12,
  P12: 11,
  P11: 10,
  P10: 9,
  D9: 8,
  D8: 7,
  D7: 6,
  R6: 5,
  R5: 4,
  R4: 3,
  N3: 2,
  N2: 1,
  N1: 0,
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
let currentTour = tournoi.currentTour === undefined ? -1 : tournoi.currentTour;

let currentStopTimer = null;

let opponentsMap = {}; // { playerName: { opponentName: count } }
let teammateMap = {}; // { playerName: { teammateName: count } }
let waitCount = {};
let sexeIssues = [];
let niveauIssues = [];

// -- DOM CREATION --
window.addEventListener("DOMContentLoaded", () => {
  document.body.innerHTML = `
  <header class="header flex justify-between items-center">
    <span>🏸 Générateur de tournoi de Badminton</span>
    <button class="btn-primary" onclick="reset();">Reset</button>
    <span>v${version}</span>
  </header>
  <section id="preparation" class="flex flex-col flex-auto"></section>
  <section id="tournament" class="flex flex-col flex-auto" style="display:none"></section>
  <section id="results" class="flex flex-col flex-auto" style="display:none"></section>
  <aside id="panel" class="h-screen overflow-auto"></aside>
`;

  renderPreparationSection();
  renderTournament();
  if (currentTour != -1 && currentTour != null) {
    showSection("tournament");
    renderPanelTournament();
    currentStopTimer = afficherTempsEcoule(
      planning[currentTour].startDate,
      currentTour
    );
  }
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
  if (panel.classList.contains("open")) {
    document.body.classList.add("withPanel");
  } else {
    document.body.classList.remove("withPanel");
  }
}

function reset() {
  if (confirm("Reset ?")) {
    if (currentStopTimer) {
      currentStopTimer();
    }
    players = [];
    settings = defaultConfig;
    scores = {};
    planning = [];
    currentTour = -1;
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
      currentTour,
    })
  );
}

function regenerate() {
  if (
    confirm("Un tournoi existe déjà, il va être perdu, voulez vous-continuer ?")
  ) {
    prepareOptimise();
    optimisePlanning();
  }
}

// -- RENDER PLAYERS SECTION --
function renderPreparationSection() {
  const el = document.getElementById("preparation");
  el.innerHTML = `
    <div class="sous-header">
      <h2> ⚙️Paramètres</h2>
    </div>
    <div class="flex flex-wrap gap-4 m-5">
      <div class="flex flex-col flex-auto">
        <label class="mb-2">Nombre de terrains</label> 
          <div class="flex items-center justify-between">
            <div class="slider-param-terrains flex-auto mr-6"> </div>
            <span id="terrains-value" class="w-8">${settings.terrains} </span>
          </div>
      </div>
      <div class="flex flex-col flex-auto">
        <label class="mb-2">Nombre de tour</label> 
        <div class="flex items-center justify-between">
            <div class="slider-param-tours flex-auto mr-6"> </div>
            <span id="tours-value" class="w-8">${settings.tours} </span>
          </div>
      </div>
      
      ${"" /*renderContraintes("preparation", false)*/}
    </div>

    <div class="sous-header justify-between">
      <h2>👥 Liste des joueurs</h2>
      <span>${
        players.length == 0 ? "Aucun joueur" : ` ${players.length} joueurs`
      }</span>
    </div>
    <div class="flex-auto">
      <form id="form-add-player" class=" sous-header-secondary flex flex-wrap gap-1">
          <div class="flex items-start gap-1" >
            <div class="flex flex-auto flex-wrap gap-1" >
              <input class="w-full" id="name-player" placeholder="Nouveau joueur" value="" />
              <div class="flex flex-auto gap-1" >
                <select id="gender-player" class="flex-auto" >
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
              </div>
            </div>
            <button class="btn-primary rounded min-w-12" type="submit" id="addPlayer">Ajouter</button>
          </div>
      </form>
      <div id="playerList" class="m-5 flex flex-wrap gap-4"></div>
    </div>

    <footer class="footer flex justify-end">
    ${
      planning.length == 0
        ? `
      <button class="btn-primary" onclick="prepareOptimise(); optimisePlanning();"> 🏆 Générer le tournoi</button>
      `
        : `
      <div class="flex justify-between w-full p-2">
        <button class="btn-secondary" onclick="regenerate();"> ↺ Régénérer le tournoi</button>
        <button class="btn-primary" onclick="showSection('tournament');renderPanelTournament();"> Tournoi ${
          currentTour == null ? "terminé" : "en cours"
        } ➜</button>
      </div>
      `
    }
    </footer>
  `;

  el.querySelector("#form-add-player").onsubmit = () => {
    let name = el.querySelector("#name-player").value.trim();
    let gender = el.querySelector("#gender-player").value;
    const wasEmpty = name == "";
    if (name == "" || players.find((p) => p.name === name)) {
      const names = [
        ["Paul", "H"],
        ["Robin", "H"],
        ["Celine", "F"],
        ["John", "H"],
        ["Olivier", "H"],
        ["Fabien", "H"],
        ["Marie", "F"],
        ["Ludivine", "F"],
        ["Audrey", "F"],
        ["Katy", "F"],
      ];
      let tries = 0;
      do {
        const rdm = Math.floor(Math.random() * names.length);
        name = wasEmpty
          ? names[rdm][0] + "_" + Math.floor(Math.random() * 100)
          : name + "_" + Math.floor(Math.random() * 100);
        gender = names[rdm][1];
        tries++;
      } while (players.find((p) => p.name === name) && tries < 50);
    }
    const newPlayer = {
      name,
      gender,
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
      <div class="player player-preparation-${
        p.gender
      } w-96 flex items-start gap-1 p-2 border rounded-lg 
      }" >
        <div class="flex flex-col flex-auto" >
          <input class="w-full" id="name_${i}" value="${
        p.name
      }" onchange="players[${i}].name=this.value;saveData();renderPreparationSection()" />
          <div class="flex" >
            <select class="flex-auto" onchange="players[${i}].gender=this.value;saveData();renderPreparationSection()">
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
          </div>
        </div>
          <button class="text-2xl" onclick="requestDeletePlayer(event, ${i});"> ⛔ </button>
      </div>
  `
    )
    .join("");

  const sliderTerrains = document.body.querySelector(".slider-param-terrains");
  noUiSlider.create(sliderTerrains, {
    start: parseInt(settings.terrains),
    connect: [true, false],
    step: 1,
    range: {
      min: 0,
      max: 20,
    },
  });
  sliderTerrains.noUiSlider.on("slide", (values, handle) => {
    settings.terrains = parseInt(values[handle]);
    saveData();
    renderPreparationSection();
  });

  const sliderTours = document.body.querySelector(".slider-param-tours");
  noUiSlider.create(sliderTours, {
    start: parseInt(settings.tours),
    connect: [true, false],
    step: 1,
    range: {
      min: 0,
      max: 20,
    },
  });
  sliderTours.noUiSlider.on("slide", (values, handle) => {
    settings.tours = parseInt(values[handle]);
    saveData();
    renderPreparationSection();
  });
}

function requestDeletePlayer(event, i) {
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.innerHTML = "⛔ Supprimer";
  event.currentTarget.setAttribute("class", "text-base btn-warning");
  const listener = (event) => {
    event.preventDefault();
    players.splice(i, 1);
    saveData();
    renderPreparationSection();
  };
  event.currentTarget.addEventListener("click", listener, { once: true });
  document.body.addEventListener(
    "click",
    ((target, listener, evt) => {
      target.innerHTML = "⛔";
      target.setAttribute("class", "text-2xl");
      target.removeEventListener("click", listener);
    }).bind(this, event.currentTarget, listener),
    { once: true }
  );
}

// -- RENDER TOURNAMENT SECTION --
function renderTournament() {
  const el = document.getElementById("tournament");
  let indexMatch = 0;
  el.innerHTML = `
      <div class="sous-header flex justify-between">
        <button onclick="togglePanel(true);showSection('preparation');"> <div style="transform:rotate(180deg)">➜<div>  </button>
        <div class="flex flex-auto justify-between mx-3 gap-4">
          ${
            "" /*<span>${
            players.length == 0 ? "Aucun joueur" : ` ${players.length} joueurs`
          }</span>
          */
          }

          <span>${
            currentTour == null
              ? `Temps total du tournoi : ${getTpsTotal()}`
              : currentTour == -1
              ? "Prêt à lancer !"
              : `Tour ${currentTour + 1} en cours`
          }</span>
          
          ${
            currentTour != -1
              ? `<span class="justify-center inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-yellow-600/20 ring-inset" id="tps-ecoule-${currentTour}"> </span>`
              : ``
          }
          
        </div>
        ${
          currentTour == -1 || currentTour === null
            ? `<button onclick="togglePanel()">⚙️ Paramètres</button>`
            : ""
        }
      </div>
      ${planning
        .map((tour, indexTour) => {
          return `
            <div class="">
                <h3 class="sous-header-secondary ${
                  currentTour == indexTour && "bg-green-100"
                }">Tour ${indexTour + 1} ${
            currentTour == indexTour
              ? "en cours"
              : tour.closed
              ? "terminé"
              : "à venir"
          }</h3>
                <div class="flex justify-center flex-wrap gap-4">
                  ${tour.matchs
                    .map((match, index) => {
                      indexMatch++;
                      return `
                        <div class="flex flex-col mx-2">
                          <div class="flex justify-between items-center w-full">
                            <h3>Match ${indexMatch}</h3>
                            <h3>Terrain ${index + 1}</h3>
                          </div>
                          <div class="flex flex-col items-center border p-2 rounded">
                              <div class="flex flex-auto items-center ${
                                currentTour === indexTour && "h-48"
                              }">
                                <div class="flex justify-between items-center h-full">
                                  <div class="flex flex-col ">
                                        ${match.team1
                                          .map((player) => {
                                            return `
                                                <span class="player-tournament player-tournament-${
                                                  player.gender
                                                }">${player.name}</span>
                                                ${getLevelTournament()}
                                            `;
                                          })
                                          .join("")}
                                  </div>
                                  ${
                                    currentTour === indexTour
                                      ? `
                                      <div class="flex flex-col justify-between h-full items-center">
                                        <span class="text-2xl">${
                                          match.scoreTeam1
                                        }</span>
                                        <div id="${
                                          indexTour +
                                          "-" +
                                          index +
                                          "-scoreTeam1"
                                        }" class="slider-score flex-auto my-4"> 
                                        </div>
                                      </div>`
                                      : ``
                                  }

                                <span class="text-4xl mx-2">🏸</span>
                                
                                <div class="flex justify-end items-center h-full">
                                ${
                                  currentTour === indexTour
                                    ? `
                                     <div class="flex flex-col justify-between h-full items-center">
                                        <span class="text-2xl">${
                                          match.scoreTeam2
                                        }</span>
                                        <div id="${
                                          indexTour +
                                          "-" +
                                          index +
                                          "-scoreTeam2"
                                        }"class="slider-score flex-auto my-4"> 
                                        </div>
                                    </div>`
                                    : ``
                                }
                                  <div class="flex flex-col ">
                                        ${match.team2
                                          .map((player) => {
                                            return `
                                                <span class="player-tournament player-tournament-${player.gender}">${player.name}</span>
                                            `;
                                          })
                                          .join("")}
                                  </div>
                                  
                                </div>

                              </div>
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
      
      <footer class="footer flex justify-end">
      ${
        currentTour === null
          ? `<button class="btn-primary" onclick="renderResults(); showSection('results');renderPanelResults();">Résultats ➜</button>`
          : currentTour == -1
          ? `<button class="btn-primary" onclick="launchTournoi();"> 🏆 Lancer le tournoi</button>`
          : `${
              currentTour < planning.length - 1
                ? `
            <div class="flex justify-between w-full p-2">
              <button class="btn-secondary" onclick="clotureTournoi();"> Clotûrer le tournoi</button>
              <button class="btn-primary" onclick="clotureTour();"> Clotûrer le tour</button>
            </div>`
                : `<button class="btn-primary" onclick="clotureTournoi();"> Clotûrer le tournoi</button>`
            }
          `
      }
      </footer>
    `;

  document.body.querySelectorAll(".slider-score").forEach((slider) => {
    const obj = slider.id.split("-");
    const start = planning[obj[0]].matchs[obj[1]][obj[2]];
    noUiSlider.create(slider, {
      start: start,
      connect: [true, false],
      direction: "rtl",
      step: 1,
      orientation: "vertical",
      range: {
        min: start,
        max: 32,
      },
    });
    slider.noUiSlider.on("slide", (values, handle) => {
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
    });
  });
}

function getLevelTournament(p) {
  return `
  
  `;
}

function getTpsTotal() {
  const timeTotal = planning.reduce((acc, tour) =>
    acc + tour ? getTempsEcoule(tour.startDate, tour.endDate, true) : 0
  );
  const minutes = Math.floor(timeTotal / 60);
  const secondes = timeTotal % 60;
  return timeTotal > 59
    ? `${minutes} min. ${secondes} sec.`
    : `${secondes} sec.`;
}

function renderResults() {
  const el = document.getElementById("results");
  el.innerHTML = `
  <h1>Résultats</h1>
    ${Object.entries(scores).map((score) => {
      return `${score}`;
    })}
  `;
}

function afficherTempsEcoule(dateDepart, currentTour) {
  let frameId;

  function update() {
    document.getElementById(
      "tps-ecoule-" + currentTour
    ).textContent = `${getTempsEcoule(dateDepart)}`;
    frameId = requestAnimationFrame(update);
  }

  frameId = requestAnimationFrame(update);
  return () => cancelAnimationFrame(frameId); // retourne une fonction pour stopper
}

function getTempsEcoule(dateDepart, dateFin = null, formatInteger = false) {
  const maintenant = dateFin ? dateFin : new Date();
  const ecoule = Math.floor((maintenant - dateDepart) / 1000);
  if (formatInteger) return ecoule;

  const jours = Math.floor(ecoule / 86400);
  const heures = Math.floor((ecoule % 86400) / 3600);
  const minutes = Math.floor((ecoule % 3600) / 60);
  const secondes = ecoule % 60;
  if (jours >= 1) return `+ de ${jours} jour${jours > 1 ? "s" : ""}`;
  if (heures > 0) return `${heures}h ${minutes}' ${secondes}''`;
  if (minutes > 0) return `${minutes}' ${secondes}''`;
  return `${secondes}''`;
}

function launchTournoi() {
  togglePanel(true);
  currentTour = 0;
  planning[currentTour].startDate = Date.now();
  renderTournament();
  currentStopTimer = afficherTempsEcoule(
    planning[currentTour].startDate,
    currentTour
  );
  saveData();
}

function clotureTournoi() {
  planning[currentTour].endDate = Date.now();
  planning[currentTour].closed = true;
  currentTour = null;
  currentStopTimer();
  renderTournament();
  saveData();
}

function clotureTour() {
  currentStopTimer();
  planning[currentTour].endDate = Date.now();
  planning[currentTour].closed = true;
  if (currentTour < planning.length) {
    currentTour++;
    renderTournament();
    planning[currentTour].startDate = Date.now();
    currentStopTimer = afficherTempsEcoule(
      planning[currentTour].startDate,
      currentTour
    );
  } else {
    currentTour = -1;
  }
  saveData();
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

function renderPanelTournament() {
  const panel = document.getElementById("panel");
  panel.innerHTML = `
  <h3 class="header flex justify-between items-center">
  ⚙️ Paramètres
  <button onclick="togglePanel(true);">✖</button>
  </h3>
  ${"" /*<div id="contrainte-panel">*/}
  ${"" /*renderContraintes("panel", true)*/}
  </div>
  <h3 class="sous-header flex justify-between">
  📊 Contraintes <button onclick="evaluerPlanning();">↺</button>
  </h3>
  <div id="stats-tournament-panel" class="flex flex-col"></div>
  <h3 class="sous-header flex justify-between">
  📊 Handicaps et avantages
  </h3>
  <div id="misc-tournament-panel" class="flex flex-col"></div>
  `;
  evaluerPlanning();
  renderStats();
  renderMiscTournament();
}

function evaluerPlanning() {
  let total = 0,
    invalids = 0;
  opponentsMap = {}; // { playerName: { opponentName: count } }
  teammateMap = {}; // { playerName: { teammateName: count } }
  waitCount = {};
  sexeIssues = [];
  niveauIssues = [];

  planning.forEach((tour, tourIdx) => {
    const playersInTour = new Set();
    tour.matchs.forEach((match, matchIdx) => {
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
        j;
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
    repeatOpponentCount += Object.entries(opponentsMap[key]).reduce(
      (acc, data) => (acc + data > 1 ? data - 1 : 0)
    );
  }
  repeatOpponentCount /= 2;
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

function renderAccordions(map, label) {
  return Object.entries(map)
    .map(([p, data]) => {
      const repeated = Object.entries(data).filter(([, count]) => count > 1);
      if (!repeated.length) return "";
      return `
      <button class="accordion w-full flex justify-between" onclick="this.classList.toggle('open')">
        <span class="w-full">+ ${p} ${label}</span> 
        <span class="justify-center inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-yellow-600/20 ring-inset">x${
          repeated.length
        }</span>
      </button>
      <div class="accordion-content pl-4">
        <div class="flex flex-col w-full">
          ${repeated
            .map(
              ([other, count]) =>
                `<div class="flex justify-between w-full p-2 pl-4 ">
              <div class="">${other}</div>
              <div class="justify-center inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-yellow-600/20 ring-inset">x${count}</div>
              </div>`
            )
            .join("")}
          </div>
      </div>
    `;
    })
    .join("");
}

function renderMiscTournament() {
  const miscTournament = document.getElementById("misc-tournament-panel");
  miscTournament.innerHTML = `
  `;
}

function renderStats() {
  const stats = document.getElementById("stats-tournament-panel");

  const waitList = Object.entries(waitCount).sort(
    (a, b) => b[1].length - a[1].length
  );

  const coequipierContrainte = renderAccordions(teammateMap, "");
  const nbCoequipierContrainte = Object.entries(teammateMap).reduce(
    (acc, [p, data]) =>
      acc +
      Object.entries(data).reduce(
        (acc2, [p2, data2]) => acc2 + (data2 > 1 ? data2 - 1 : 0),
        0
      ),
    0
  );
  const adversaireContrainte = renderAccordions(opponentsMap, "");
  const nbAdversaireContrainte = Object.entries(opponentsMap).reduce(
    (acc, [p, data]) =>
      acc +
      Object.entries(data).reduce(
        (acc2, [p2, data2]) => acc2 + (data2 > 1 ? data2 - 1 : 0),
        0
      ),
    0
  );

  stats.innerHTML = `
  ${
    coequipierContrainte == ""
      ? `<span class="p-2">✅ Aucun coéquipier identique</span>`
      : `<button class="accordion flex justify-between items-center" onclick="this.classList.toggle('open')">
          <span>❌ ${nbCoequipierContrainte} coéquipiers répétés</span>
          <span>▼</span>
        </button>
      </div>
      <div class="accordion-content">
        <div class="flex flex-col w-full pl-4">
          ${coequipierContrainte}
        </div>
      </div>`
  }

  ${
    adversaireContrainte == ""
      ? `<span class="p-2">✅ Aucun adversaire identique</span>`
      : `<button class="accordion flex justify-between items-center" onclick="this.classList.toggle('open')">
          <span>⚠ ${nbAdversaireContrainte} adversaires répétés</span>
          <span>▼</span>
        </button>
       <div class="accordion-content">
        <div class="flex flex-col w-full pl-4">
          ${adversaireContrainte}
        </div>
      </div>`
  }

  ${
    waitList.length == 0
      ? `<span class="p-2">✅ Aucun joueur en attente</span>`
      : `<button class="accordion  flex justify-between items-center" onclick="this.classList.toggle('open')">
        <span>⚠ ${waitList.length} joueurs en attente </span>
        <span>▼</span>
        </button> 
        <div class="accordion-content pl-4">
        <div class="flex flex-col w-full">
           ${waitList
             .map(
               ([name, tours]) => `
                <button class="accordion" onclick="this.classList.toggle('open')">
                  <div class="flex pl-4">
                    <span class="w-full">+ ${name}</span>
                    <span class="justify-center inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-yellow-600/20 ring-inset">x${
                      tours.length
                    }</span>
                  </div></button>
                <div class="accordion-content pl-4">
                  <div class="flex pl-4 gap-1">
                    ${tours
                      .map(
                        (t) =>
                          `<span class="justify-center inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-yellow-600/20 ring-inset" >Tour ${t}</span>`
                      )
                      .join("")}
                  </div>
                </div>
              `
             )
             .join("")}
        </div>
      </div>`
  }

  ${
    sexeIssues.length == 0
      ? `<span class="p-2">✅ Aucun problème de mixité</span>`
      : `<button class="accordion  flex justify-between items-center" onclick="this.classList.toggle('open')">
          <span>⚠ ${sexeIssues.length} problèmes de mixité</span>
          <span>▼</span>
        </button> 
        <div class="accordion-content">
          <div class="flex flex-col w-full">
            ${sexeIssues
              .map((item) => {
                return `
                <button class="accordion w-full flex justify-between" onclick="this.classList.toggle('open')">
                  <span class="w-full">+ Tour ${item.tour} - Terrain ${item.terrain}</span> 
                </button>
                <div class="accordion-content pl-4">
                  <div class="flex flex-col w-full">
                    <span class="flex justify-between w-full p-2 pl-4 ">${item.team1} vs ${item.team2}</span>
                  </div>
                </div>`;
              })
              .join("")}
          </div>
        </div>`
  }

  ${
    niveauIssues.length == 0
      ? `<span class="p-2">✅ Aucun problème d'écart de point</span>`
      : `<button class="accordion  flex justify-between items-center" onclick="this.classList.toggle('open')">
      <span>⚠ ${niveauIssues.length} problèmes d'écart de point</span>
        <span>▼</span>
        </button> 
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
    for (const match of tour.matchs) {
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
    for (const match of tour.matchs) {
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
  combinaisonsTeste++;
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
  tousLesJoueurs.forEach((p) => {
    const attente = joueursAttente[p.id] || 0;
    score -= Math.pow(attente, 2); // ou Math.pow(attente + 1, 1.5)
  });

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

function compositeScore(team1, team2, planning, joueursAttente, priorities) {
  let score = matchScore(team1, team2, planning, joueursAttente, priorities);

  // Bonus pour joueurs ayant attendu
  const bonusAttente = [...team1, ...team2].reduce((acc, p) => {
    const attente = joueursAttente[p.id] || 0;
    return acc + Math.pow(attente, 3); // exponentiel
  }, 0);

  return score + bonusAttente;
}

// -- GÉNÉRATION DU PLANNING --
async function generePlanning() {
  return new Promise(async (resolve, reject) => {
    try {
      settings.priorities = getSettingsPriorities();
      let planning = [];
      let joueursAttente = {};
      maxTries = 3000; // ou settings.maxTries si défini
      permutationUsed = [];

      for (let tour = 0; tour < settings.tours; tour++) {
        const joueursUtilises = new Set();
        const tourMatches = [];

        for (let terrain = 0; terrain < settings.terrains; terrain++) {
          const combinaisons = [];
          let permutationIndex = 0;
          // Construire liste des joueurs disponibles
          const disponibles = players.filter((p) => !joueursUtilises.has(p.id));
          /*.sort((a, b) => {
              const attenteA = joueursAttente[a.id] || 0;
              const attenteB = joueursAttente[b.id] || 0;
              return attenteB - attenteA; // ceux qui ont attendu le plus en premier
            })*/ if (disponibles.length < 4) break;
          permutationTotal = factorial(disponibles.length);

          for (let t = 0; t < maxTries; t++) {
            /*const candidats = [...disponibles];
            shuffle(candidats);
            const groupe = candidats.slice(0, 4);*/
            const groupe = getPermutationsJoueur(disponibles);
            if (groupe == null) break;

            const team1 = [groupe[0], groupe[1]];
            const team2 = [groupe[2], groupe[3]];
            const score = compositeScore(
              team1,
              team2,
              planning,
              joueursAttente,
              settings.priorities
            );

            combinaisons.push({ team1, team2, score });
          }

          /*while (
            tourMatches.length < settings.terrains &&
            permutationIndex < maxTries
          ) {
            //const permutation = getNthPermutation(disponibles, permutationIndex);
            //const groupe = disponibles.slice(0, 4);
            const groupe = getPermutationsJoueur(disponibles);
            if (groupe == null) break;

            const team1 = [groupe[0], groupe[1]];
            const team2 = [groupe[2], groupe[3]];
            const score = compositeScore(
              team1,
              team2,
              planning,
              joueursAttente,
              settings.priorities
            );*/

          /*const score = matchScore(
              team1,
              team2,
              planning,
              joueursAttente,
              settings.priorities
            );*/
          //combinaisons.push({ team1, team2, score });
          // permutationIndex++;
          //}

          combinaisons.sort((a, b) => b.score - a.score);
          for (const comb of combinaisons) {
            //if (tourMatches.length >= settings.terrains) break;
            //if (comb.joueurs.some((p) => joueursUtilises.has(p.id))) continue;
            const scoreTeam1 = comb.team1.reduce(
              (acc, p) => acc + getLevelScore(p),
              0
            );
            const scoreTeam2 = comb.team2.reduce(
              (acc, p) => acc + getLevelScore(p),
              0
            );

            let finalTeam1, finalTeam2;

            if (settings.isScoreNegatif) {
              // On prend la différence, la team avec le plus petit score devient 0
              const diff = scoreTeam1 - scoreTeam2;
              finalTeam1 = diff;
              finalTeam2 = 0;
            } else {
              // Score relatif à la plus faible équipe qui devient 0
              const minScore = Math.min(scoreTeam1, scoreTeam2);
              finalTeam1 = scoreTeam1 - minScore;
              finalTeam2 = scoreTeam2 - minScore;
            }

            tourMatches.push({
              team1: comb.team1,
              team2: comb.team2,
              scoreTeam1: finalTeam1,
              scoreTeam2: finalTeam2,
            });
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

        planning.push({ startDate: null, endDate: null, matchs: tourMatches });
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
  attente: [10, 20],
  equipier: [8, 10],
  sexe: [6, 8],
  adversaire: [4, 6],
  niveau: [2, 4],
};
let contraintesPossible = null;
let permutationUsed = [];
let permutationTotal = null;
let permutationInitiale = null;
let combinaisonsTeste = null;

function prepareOptimise() {
  //totalOrders = factorial(players.length);
  contraintesUsed = [];
  contraintesPossible = generateConstraintCombinations(rangeContraintes);
  permutationInitiale = factorial(players.length);
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
  renderPanelTournament();
  togglePanel();

  let historyBestPlanning = [];
  bestScore = -Infinity;
  scoreStat = -Infinity;
  permutationTotal = factorial(players.length);
  combinaisonsTeste = 0;

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

    document.getElementById("progress-bar").value = i + 1;
    const container = document.getElementById("label-progress-bar");
    container.innerHTML = `
      <center>
        <span>${Math.round(
          (i / contraintesPossible.length) * 100
        )} %</span> </br>
        <span>Combinaisons testées : ${combinaisonsTeste}
      </span></center>
    `;
    await new Promise((r) => requestAnimationFrame(r));

    /*document.getElementById(
      "label-progress-bar"
    ).innerHTML = `Recherche des contraintes ${i + 1} / ${
      contraintesPossible.length
    } </br>
    Respect des contraintes : ${bestScore / 10} % `;*/
    /*updateProgressBar(
      combinaisonsTeste,
      permutationInitiale,
      contraintesPossible,
      i
    );*/

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
  document.body.removeChild(loader);
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
  document.body.append(loader);
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

//let lastUpdateTime = 0;

async function updateProgressBar(
  combinaisonsTeste,
  permutationInitiale,
  contraintesPossible,
  i
) {
  const now = Date.now();
  //if (now - lastUpdateTime < 5000) return;
  //lastUpdateTime = now;

  const container = document.getElementById("label-progress-bar");
  //container.classList.remove("visible");

  //await new Promise((resolve) => setTimeout(resolve, 500)); // fondu sortant
  await new Promise((r) => requestAnimationFrame(r));
  //await new Promise(requestAnimationFrame); // libère le thread UI

  container.innerHTML = `
    <center>
      <span>${Math.round((i / contraintesPossible.length) * 100)} %</span> </br>
      <span>Combinaisons testées : ${combinaisonsTeste}
    </span></center>
  `;

  /*container.innerHTML = `
    <center><span style="text-align: center; width: 100px;">
      Combinaisons testées : ${combinaisonsTeste} </br>
      seulement ${
        (combinaisonsTeste / permutationInitiale) *
        contraintesPossible.length *
        100
      } % </br> 
      sur  </br>${simplifierNombre(
        permutationInitiale * contraintesPossible.length
      )}
    </span></center>
  `;*/

  //container.classList.add("visible");
}

function simplifierNombre(nombre) {
  const suffixes = [
    {
      seuil: 1e36,
      suffixe: "undécillions",
      metaphors: [
        "le nombre d’univers dans le multivers selon certaines théories",
        "le nombre de notes de musique jouées si chaque particule vibrait",
        "le nombre d’univers que pourrait simuler un ordinateur divin",
        "le nombre de moments vécus si le temps était fractal",
        "le nombre d’étoiles dans toutes les galaxies de 1000 univers",
      ],
    },
    {
      seuil: 1e33,
      suffixe: "décillions",
      metaphors: [
        "le nombre d’atomes dans un petit astéroïde",
        "le nombre de scénarios de parties d’échecs possibles en 1 siècle",
        "le nombre de respirations qu’un humain pourrait prendre en 1 milliard d’années",
        "le nombre de livres imaginables en combinant tous les mots du dictionnaire",
        "le nombre d’émotions ressenties par une civilisation immortelle",
      ],
    },
    {
      seuil: 1e30,
      suffixe: "nonillions",
      metaphors: [
        "le nombre de planètes qu’on pourrait imaginer dans des univers parallèles",
        "le nombre de rêves faits par toute l'humanité depuis l'aube du temps",
        "le nombre de permutations possibles d’une bibliothèque infinie",
        "le nombre de grains de poussière dans tous les déserts de toutes les galaxies",
        "le nombre de combinaisons possibles d’une vie humaine au choix près",
      ],
    },
    {
      seuil: 1e27,
      suffixe: "octillions",
      metaphors: [
        "le nombre d’atomes dans une cuillère d’hélium",
        "le nombre de combinaisons de parties de Tetris sur 100 planètes",
        "le nombre de gouttelettes dans toutes les pluies de l'histoire",
        "le nombre de variations possibles d'une symphonie de Beethoven",
        "le nombre de microbes dans 1 milliard d’écosystèmes",
      ],
    },
    {
      seuil: 1e24,
      suffixe: "septillions",
      metaphors: [
        "le nombre d'atomes dans un grain de sel multiplié par toute la Voie Lactée",
        "le nombre de brins d’herbe si chaque planète était un champ",
        "le nombre de secondes dans 100 milliards d’années",
        "le nombre de pixels si chaque centimètre de la Terre était un écran 8K",
        "le nombre de pensées que pourrait avoir une intelligence artificielle éternelle",
      ],
    },
    {
      seuil: 1e21,
      suffixe: "sextillions",
      metaphors: [
        "le nombre de bactéries dans tous les océans de la Terre",
        "le nombre d’empreintes digitales sur toutes les planètes d'une galaxie",
        "le nombre de clics de souris possibles en 10 vies humaines",
        "le nombre de flocons de neige tombés depuis le début de l'humanité",
        "le nombre de neurones simulés dans un superordinateur infini",
      ],
    },
    {
      seuil: 1e18,
      suffixe: "quintillions",
      metaphors: [
        "le nombre d’atomes dans une goutte d’eau",
        "le nombre de mots prononcés par l’humanité en 1 000 ans",
        "le nombre de plumes que 1 milliard d'oies pourraient perdre",
        "le nombre de photos qu’on pourrait prendre chaque jour pendant des millénaires",
        "le nombre d’étoiles dans 1 million de galaxies",
      ],
    },
    {
      seuil: 1e15,
      suffixe: "quadrillions",
      metaphors: [
        "le nombre de fourmis sur Terre pendant 1 million d'années",
        "le nombre de grains de sable sur toutes les plages du monde",
        "le nombre de cellules dans 10 000 corps humains",
        "le nombre de battements de cœur de l’humanité en une semaine",
        "le nombre de secondes écoulées depuis la naissance de la Terre",
      ],
    },
  ];

  for (let i = 0; i < suffixes.length; i++) {
    if (nombre >= suffixes[i].seuil) {
      const val = (nombre / suffixes[i].seuil).toFixed(2);
      const metaphor =
        suffixes[i].metaphors[
          Math.floor(Math.random() * suffixes[i].metaphors.length)
        ];
      return `${val} ${suffixes[i].suffixe} <br/><i>≈ ${metaphor}</i>`;
    }
  }
  return nombre.toLocaleString();
}
