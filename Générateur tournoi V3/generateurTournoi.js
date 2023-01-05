function preventZoom(e) {
  var t2 = e.timeStamp;
  var t1 = e.currentTarget.dataset.lastTouch || t2;
  var dt = t2 - t1;
  var fingers = e.touches.length;
  e.currentTarget.dataset.lastTouch = t2;

  if (!dt || dt > 500 || fingers > 1) return; // not double-tap

  e.preventDefault();
  e.target.click();
}


window.addEventListener("dblclick", function(evt){evt.preventDefault();});
//Base de données locale
class GlobalDataBase{
    constructor(dbName){
        this.dbName = dbName;
        this.load(JSON.parse(localStorage.getItem(this.dbName)));
    }
    dbName = "";
    joueurs = [];
    tournoi = new Tournoi();

    getNbJoueurSelected(){
        var compt = 0;
        for (var i = 0; i < this.joueurs.length; i++){
            if (this.joueurs[i].selected) compt++;
        }
        return compt;
    }
    getNbContrainteActif(){
        var compt = 0;
        for (var i = 0; i < this.tournoi.contraintes.length; i++){
            if (this.tournoi.contraintes[i].actif) compt++;
        }
        return compt;
    }

    getCurrentTour(){
        return bd.tournoi.tours[bd.tournoi.currentTour];
    }

    allMatchDoneCurrentTour(){
        var currentTour = getCurrenTour();
        for (var i = 0; i < currentTour.matchs.length; i++){
            if (!currentTour.matchs[i].done) return false;
        }
        return true;
    }

    getDatas(){
        return {
            "joueurs": this.getJoueurs(), 
            "tournoi": this.getTournoi()
        }
    }

    getJoueurs(){
        var retour = [];
        for (var i = 0; i < this.joueurs.length; i++){
            retour.push(this.joueurs[i].toJson());
        }
        return retour;
    }
    getTournoi(){
        return this.tournoi.toJson();
    }

    export() {
        var name = "Tournoi - " + bd.tournoi.date.getDate();
        var type = "application/json";
        var anchor = document.createElement("a");
        anchor.href = window.URL.createObjectURL(new Blob([JSON.stringify(this.getDatas())], {type}));
        anchor.download = name;
        anchor.click();
    }

    import(evt) {   
        var fichier = new FileReader(); 
        fichier.onload = function() { 
            var datas = JSON.parse(fichier.result);
            bd.load(datas);
            bd.save();
            selectPage();
        }   
        fichier.readAsText(evt.target.files[0]); 
    }

    save(){
        localStorage.setItem(this.dbName, JSON.stringify(this.getDatas()));
    }

    load(datas){
        if (datas == null) return;
        this.joueurs = [];
        for (var i = 0; i < datas["joueurs"].length; i++){
            this.joueurs.push(new Joueur(
                datas["joueurs"][i].name,
                datas["joueurs"][i].genre,
                datas["joueurs"][i].niveau,
                datas["joueurs"][i].selected,
                datas["joueurs"][i].points
                ));
        }
        this.tournoi = new Tournoi(
            datas["tournoi"].typeTournoi,
            datas["tournoi"].modeTournoi,
            datas["tournoi"].nbTour, 
            datas["tournoi"].nbTerrain,
            datas["tournoi"].departMatchNegatif,
            datas["tournoi"].niveauListe,
            datas["tournoi"].genreListe,
            datas["tournoi"].contraintes,
            datas["tournoi"].tours,
            datas["tournoi"].currentTour,
            datas["tournoi"].limitPoint,
            new Date(datas["tournoi"].date),
            datas["tournoi"].nbPoints
        );
    }

    addJoueur(joueur){
        if (this.joueurs.filter(j => j.name == joueur.name).length > 0) return false;
        this.joueurs.push(joueur);
        this.save();
        return true;
    }

    updateJoueur(index, attributes){
        if (this.joueurs[index] != undefined){
           for (var att in attributes){
               if (this.joueurs[index][att] != undefined){
                if (att == "name"){
                    if (this.joueurs[index][att] != attributes[att] && 
                    this.joueurs.filter(j => j.name == attributes[att]).length > 0) 
                    return false;
                }
                    this.joueurs[index][att] = attributes[att];
               }
           } 
        }
        this.save();
        return true;
    }

    deleteJoueur(index){
        this.joueurs.splice(index, 1);
        this.save();
    }

    updateTournoi(attributes){
        for (var att in attributes){
            if (this.tournoi[att] != undefined){
                this.tournoi[att] = attributes[att];
            }
        } 
        //mise à jour des contraintes disponibles en fonction du type de tournoi
        this.tournoi.contraintes.filter(c => c.name == "COEQUIPIER")[0].disabled = this.tournoi["typeTournoi"] == typeTournoiListe.SIMPLE;
        this.save();
    }

    updateMatch(indexMatch, indexEquipe, score){
        var index = 0;
        for (var i = 0; i < this.tournoi.tours.length; i++){
            for (var j = 0; j < this.tournoi.tours[i].matchs.length; j++){
                if (indexMatch == index){
                    this.tournoi.tours[i].matchs[j][indexEquipe] = score;
                    this.save();
                    return;
                }
                index++;
            }
        }
    }

    updateContraintes(contraintes){
        if (contraintes != undefined) this.tournoi.contraintes = contraintes;
        this.save();
    }
}

//Listes
var typeTournoiListe = {
    "SIMPLE": "Simple",
    "DOUBLE": "Double"
}
var modeTournoiListe = {
    "ONESHOT": "Tous les tours <br> <span> On génére tous les tours en une fois dans le but de faire jouer tout le monde avec tout le monde quelque soit les niveaux. </span>",
    "STEPBYSTEP": "Tour par tour <br> <span> On génére le premier tour,  "
}
var contrainteListe = [
    {
        "name": "ADVERSAIRE",
        "title": "Adversaires différents", 
        "desc": "Eviter de rejouer plusieurs fois contre le même adversaire.",
        "actif": true, 
        "disabled": false, 
    },
    {
        "name": "COEQUIPIER",
        "title": "Coéquipier différents", 
        "desc": "Eviter de rejouer plusieurs fois avec le même coéquipier.",
        "actif": true, 
        "disabled": false, 
    },
    {
        "name": "ATTENTE",
        "title": "Attente minimum", 
        "desc": "On essaye de faire joueur un maximum tout le monde.",
        "actif": true, 
        "disabled": false, 
    },
    {
        "name": "ISOSEXE",
        "title": "Egalité des sexes", 
        "desc": "On ne permet que des matchs où il y a autant d'hommes que de femmes dans chaque équipe.",
        "actif": true, 
        "disabled": false, 
    },
    {
        "name": "LIMITPOINT",
        "title": "Ecart de point limité", 
        "desc": "On limite l'écart des points entre les deux équipes au début du match. Limite : ",
        "actif": true, 
        "disabled": false, 
    }
]
var niveauListe = {
    "P12": {
        "value": "P12", 
        "handicap": 0
    },
    "P11": {
        "value": "P11",
        "handicap": -2
    },
    "P10": {
        "value": "P10",
        "handicap": -4
    },
    "D9": {
        "value": "D9", 
        "handicap": -8
    },
    "D8": {
        "value": "D8",
        "handicap": -10
    },
    "D7": {
        "value": "D7",
        "handicap": -12
    },
    "R6": {
        "value": "R6", 
        "handicap": -13
    },
    "R5": {
        "value": "R5",
        "handicap": -14
    },
    "R4": {
        "value": "R4",
        "handicap": -15
    },
    "N3": {
        "value": "N3", 
        "handicap": -16
    },
    "N2": {
        "value": "N2",
        "handicap": -17
    },
    "N1": {
        "value": "N1",
        "handicap": -18
    }
}
var genreListe = {
    "HOMME": {
        "value": "Homme",
        "handicap": 0
    },
    "FEMME": {
        "value": "Femme",
        "handicap": 2
    }
}

//Models
class Joueur{
    constructor(pName, pGenre, pNiveau, pSelected, pPoints){
        this.name = pName == undefined ? "Nouveau joueur " + (bd.joueurs.length + 1) : pName;
        this.genre = pGenre != undefined ? pGenre : bd.tournoi.genreListe.HOMME;
        this.niveau = pNiveau != undefined ? pNiveau : bd.tournoi.niveauListe.P12;
        this.selected = pSelected != undefined ? pSelected : false;
        this.adversaires = [];
        this.coequipiers = [];
        this.points = pPoints != undefined ? pPoints : 0;
    }
    name = null;
    genre = null;
    niveau = null;
    selected = false;
    adversaires = null;
    coequipiers = null;
    points = 0;

    getPointsHandicap(){
        return this.genre.handicap + this.niveau.handicap;
    }

    toJson(){
        return {
            "name": this.name,
            "genre": this.genre,
            "niveau": this.niveau,
            "selected": this.selected,
            "points": this.points
        }
    }
}

class Tournoi{
    constructor(pTypeTournoi, pModeTournoi, pNbTour, pNbTerrain, pDepartMatchNegatif, pNiveauListe, pGenreListe, pContraintes, pTours, pCurrentTour, pLimitPoint, pDate, pNbPoint){
        this.typeTournoi = pTypeTournoi != undefined ? pTypeTournoi : typeTournoiListe.SIMPLE;
        this.modeTournoi = pModeTournoi != undefined ? pModeTournoi : modeTournoiListe.ONESHOT;
        this.nbTour = pNbTour != undefined ? pNbTour : 5;
        this.nbTerrain = pNbTerrain != undefined ? pNbTerrain : 5;
        this.departMatchNegatif = pDepartMatchNegatif != undefined ? pDepartMatchNegatif : false;
        this.niveauListe = pNiveauListe != undefined ? pNiveauListe : niveauListe;
        this.genreListe = pGenreListe != undefined ? pGenreListe : genreListe;
        this.contraintes = pContraintes != undefined ? pContraintes : contrainteListe;
        this.tours = pTours != undefined ? pTours : [];
        this.currentTour = pCurrentTour != undefined ? pCurrentTour : -1;
        this.limitPoint = pLimitPoint != undefined ? pLimitPoint : 10;
        this.date = pDate != undefined ? pDate : new Date();
        this.nbPoints = pNbPoint != undefined ? pNbPoint : 21;
    }

    typeTournoi = null;
    modeTournoi = null;
    nbTour = null;
    nbTerrain = null;
    departMatchNegatif = null;
    niveauListe = null;
    genreListe = null;
    contraintes = null;
    currentTour = null;
    limitPoint = null;
    date = null;
    nbPoints = null;

    toJson(){
        var tours = [];
        var matchs, currentMatch, equipeA, equipeB;
        for (var i = 0; i < this.tours.length; i++){
            matchs = [];
            for (var j = 0; j < this.tours[i]["matchs"].length; j++){
                currentMatch = this.tours[i]["matchs"][j];
                equipeA = [];
                var currentJoueur;
                for (var k = 0; k < currentMatch["equipeA"].length; k++){
                    currentJoueur = new Joueur(
                        currentMatch["equipeA"][k]["name"], 
                        currentMatch["equipeA"][k]["genre"], 
                        currentMatch["equipeA"][k]["niveau"], 
                        currentMatch["equipeA"][k]["points"])
                    equipeA.push(currentJoueur);
                }
                equipeB = [];
                for (var k = 0; k < currentMatch["equipeB"].length; k++){
                    currentJoueur = new Joueur(
                        currentMatch["equipeB"][k]["name"], 
                        currentMatch["equipeB"][k]["genre"], 
                        currentMatch["equipeB"][k]["niveau"], 
                        currentMatch["equipeB"][k]["points"])
                    equipeB.push(currentJoueur);
                }
                matchs.push({"equipeA": equipeA, "equipeB": equipeB, "ptsEquipeA": currentMatch["ptsEquipeA"], "ptsEquipeB": currentMatch["ptsEquipeB"], "ptsEquipeADepart": currentMatch["ptsEquipeADepart"], "ptsEquipeBDepart": currentMatch["ptsEquipeBDepart"]  })
            }
            var joueurAttente = [];
            for (var j = 0; j < this.tours[i]["joueurAttente"].length; j++){
                joueurAttente.push(new Joueur(
                    this.tours[i]["joueurAttente"][j]["name"], 
                    this.tours[i]["joueurAttente"][j]["genre"], 
                    this.tours[i]["joueurAttente"][j]["niveau"], 
                    this.tours[i]["joueurAttente"][j]["points"]
                ));
            }
            tours.push({"matchs": matchs, "joueurAttente": joueurAttente})
        }
        return {
            "typeTournoi": this.typeTournoi,
            "nbTour": this.nbTour, 
            "nbTerrain": this.nbTerrain,
            "departMatchNegatif": this.departMatchNegatif,
            "niveauListe": this.niveauListe,
            "genreListe": this.genreListe,
            "contraintes": this.contraintes,
            "tours": tours,
            "currentTour": this.currentTour, 
            "date": this.date,
            "nbPoints": this.nbPoints
        };
    }
}

var DB_NAME = "tournoiBad";
var bd = new GlobalDataBase(DB_NAME);

var groupeJoueurs = {
    "Badlevier": [
        new Joueur("John", genreListe.HOMME, niveauListe.D9, 0), 
        new Joueur("Carole", genreListe.FEMME, niveauListe.P10, 0), 
        new Joueur("Olivier", genreListe.HOMME, niveauListe.D9, 0), 
        new Joueur("Christophe", genreListe.HOMME, niveauListe.D9, 0), 
        new Joueur("Norbert", genreListe.HOMME, niveauListe.P10, 0), 
        new Joueur("Marc", genreListe.HOMME, niveauListe.P10, 0), 
        new Joueur("Aurélien", genreListe.HOMME, niveauListe.D9, 0), 
        new Joueur("Gaby", genreListe.HOMME, niveauListe.P11, 0), 
        new Joueur("Marie", genreListe.FEMME, niveauListe.P10, 0), 
        new Joueur("Ludivine", genreListe.FEMME, niveauListe.P10, 0), 
    ], 
    "Knowllence": [
        new Joueur("John", genreListe.HOMME, niveauListe.D9, 0), 
        new Joueur("Olga", genreListe.FEMME, niveauListe.D7, 0), 
        new Joueur("Alexandre", genreListe.HOMME, niveauListe.D9, 0), 
        new Joueur("Christine", genreListe.FEMME, niveauListe.P12, 0), 
        new Joueur("Christophe", genreListe.HOMME, niveauListe.P12, 0), 
        new Joueur("Corinne", genreListe.FEMME, niveauListe.P12, 0), 
        new Joueur("Dominique", genreListe.FEMME, niveauListe.P12, 0), 
        new Joueur("Manu B.", genreListe.HOMME, niveauListe.P10, 0), 
        new Joueur("Manu D.", genreListe.HOMME, niveauListe.P12, 0), 
        new Joueur("Fabien", genreListe.HOMME, niveauListe.P12, 0), 
        new Joueur("Isabelle", genreListe.FEMME, niveauListe.P12, 0), 
        new Joueur("Jean-Denys", genreListe.HOMME, niveauListe.P12, 0), 
        new Joueur("Jorge", genreListe.HOMME, niveauListe.P12, 0), 
        new Joueur("Laetitia", genreListe.FEMME, niveauListe.P12, 0), 
        new Joueur("Laurent", genreListe.HOMME, niveauListe.P12, 0), 
        new Joueur("Lydie", genreListe.FEMME, niveauListe.P12, 0), 
        new Joueur("Marie", genreListe.FEMME, niveauListe.P12, 0), 
        new Joueur("Mehmet", genreListe.HOMME, niveauListe.P12, 0), 
        new Joueur("Michael", genreListe.HOMME, niveauListe.P12, 0), 
        new Joueur("Mireille", genreListe.FEMME, niveauListe.P12, 0), 
        new Joueur("Mohamed", genreListe.HOMME, niveauListe.P12, 0), 
        new Joueur("Oksana", genreListe.FEMME, niveauListe.D9, 0), 
        new Joueur("Olivier", genreListe.HOMME, niveauListe.P12, 0), 
        new Joueur("Samir", genreListe.HOMME, niveauListe.P12, 0), 
        new Joueur("Sandrine", genreListe.FEMME, niveauListe.P12, 0), 
        new Joueur("Sara", genreListe.FEMME, niveauListe.P12, 0), 
        new Joueur("Sebastien", genreListe.HOMME, niveauListe.P12, 0), 
        new Joueur("Stephanie", genreListe.FEMME, niveauListe.P12, 0), 
        new Joueur("Thierry", genreListe.HOMME, niveauListe.P12, 0), 
        new Joueur("Thomas", genreListe.HOMME, niveauListe.P12, 0), 
        new Joueur("Yassine", genreListe.HOMME, niveauListe.P12, 0), 
    ]
}

//Pages
var pages = {
    "ACCUEIL": "Accueil", 
    "SELECTION_JOUEUR": "Sélection des joueurs",
    "MODIFICATION_JOUEUR": "Modification d'un joueur", 
    "MODIFICATION_PREPARATION": "Modification de la préparation",
    "MODIFICATION_HANDICAPS": "Handicaps",
    "MODIFICATION_CONTRAINTES": "Contraintes",
    "EXECUTION_TOURNOI": "Execution",
    "IMPORT_JOUEURS": "Importer des joueurs",
}
var currentPage = bd.tournoi.currentTour == -1 ? pages.ACCUEIL : pages.EXECUTION_TOURNOI;

function selectPage(page, force){
    if (page != undefined) currentPage = page;
    buildPage();
    MH.loadEvents();
    resize();
}

window.addEventListener("resize", resize);
function resize(){
    if (document.getElementById("global") != null)
        document.getElementById("global").style["height"] = window.innerHeight + "px";
}

//on construit tout dans le body
function buildPage(){
    var container = document.getElementById("ssBody");
    container.innerHTML = "";
    var divGlobal = MH.makeDiv("global");
    divGlobal.appendChild(buildHeader());
    divGlobal.appendChild(buildBody());
    divGlobal.appendChild(buildFooter());
    container.appendChild(divGlobal);
}

function buildHeader(){
    var header = MH.makeDiv("header", "container");
    switch (currentPage){
        case pages.ACCUEIL:
            var newId = MH.getNewId();
            var buttonCredit = MH.makeIcon("logoLigue", true, "jpg");
            buttonCredit.setAttribute("id", newId);
            buttonCredit.classList.add("logoLigue");
            buttonCredit.setAttribute("width", "");
            buttonCredit.setAttribute("height", "50");
            MH.addNewEvent(newId, "click", afficheInfo.bind(this));
            header.appendChild(buttonCredit);
            header.appendChild(MH.makeSpan("Générateur de tournoi", "headerTitle"));
            header.appendChild(buildInterfaceHeaderAccueil());
        break;
        case pages.SELECTION_JOUEUR:
            header.appendChild(MH.makeButton({
                type: "click", 
                func: retourSelectionJoueur.bind(this)
            }, "retour"));

            header.appendChild(MH.makeSpan("Sélection des joueurs", "headerTitle"));
            var add = MH.makeButton({
                type: "click", 
                func: addJoueur.bind(this)
            }/*, "add"*/);
            add.innerHTML = "Nouveau joueur";
            add.classList.add("btn-success");
            header.appendChild(add);
            var importJoueur = MH.makeButton({
                type: "click", 
                func: importJoueurs.bind(this)
            });
            importJoueur.innerHTML = "Importer";
            importJoueur.classList.add("btn-primary");
            header.appendChild(importJoueur);
        break;
        case pages.MODIFICATION_JOUEUR:
            header.appendChild(MH.makeButton({
                type: "click", 
                func: retourModificationJoueur.bind(this)
            }, "retour"));

            if (currentEditionId == -1){
                header.appendChild(MH.makeSpan("Création d'un joueur", "headerTitle"));
            }else{
                header.appendChild(MH.makeSpan("Modification d'un joueur", "headerTitle"));
                var del = MH.makeButton({
                    type: "click", 
                    func: showModalDeleteJoueur.bind(this)
                }, "delete");
                del.classList.add("btn-danger");
                header.appendChild(del);
            }
        break;
        case pages.MODIFICATION_PREPARATION:
            header.appendChild(MH.makeButton({
                type: "click", 
                func: retourModificationPreparation.bind(this)
            }, "retour"));
            header.appendChild(MH.makeSpan("Préparation", "headerTitle"));
        break;
        case pages.MODIFICATION_HANDICAPS:
            header.appendChild(MH.makeButton({
                type: "click", 
                func: retourModificationHandicaps.bind(this)
            }, "retour"));
            header.appendChild(MH.makeSpan("Handicaps et avantages", "headerTitle"));
        break;
        case pages.MODIFICATION_CONTRAINTES:
            header.appendChild(MH.makeButton({
                type: "click", 
                func: retourModificationContraintes.bind(this)
            }, "retour"));
            header.appendChild(MH.makeSpan("Choix des contraintes", "headerTitle"));
        break;
        case pages.EXECUTION_TOURNOI:
            header.appendChild(MH.makeSpan("Tournoi en cours", "headerTitle"));
            var buttonFinTournoi = MH.makeButton({
                type: "click", 
                func: showModalFinTournoi.bind(this)
            });
            buttonFinTournoi.innerHTML = "Fin du tournoi";
            buttonFinTournoi.classList.add("btn-danger");
            header.appendChild(buttonFinTournoi);
        break;
        case pages.IMPORT_JOUEURS:
            header.appendChild(MH.makeButton({
                type: "click", 
                func: validImportJoueurs.bind(this)
            }, "retour"));

            header.appendChild(MH.makeSpan("Importer des joueurs", "headerTitle"));
        break;
    }
    return header;
}
var currentIndexMatch;
function buildBody(){
    var body = MH.makeDiv("body", "container");
    switch (currentPage){
        case pages.ACCUEIL:
            body.appendChild(buildListJoueur());
            body.appendChild(buildPreparation());
            if (bd.tournoi.tours.length > 0)
                body.appendChild(buildClassement());
        break;
        case pages.SELECTION_JOUEUR:
            body.appendChild(buildListJoueur());
        break;
        case pages.MODIFICATION_JOUEUR:
            body.appendChild(buildListJoueur());
        break;
        case pages.MODIFICATION_PREPARATION:
            body.appendChild(buildPreparation());
        break;
        case pages.MODIFICATION_HANDICAPS:
            body.appendChild(buildHandicaps());
        break;
        case pages.MODIFICATION_CONTRAINTES:
            body.appendChild(buildListContraintes());
        break;
        case pages.EXECUTION_TOURNOI:
            currentIndexMatch = 0;
            for (var i = 0; i < bd.tournoi.tours.length; i++){
                body.appendChild(buildHeaderTour(i));
                body.appendChild(buildTour(bd.tournoi.tours[i], i));
            }
        break;
        case pages.IMPORT_JOUEURS:
            body.appendChild(buildListImportJoueur());
        break;
    }
    body.addEventListener("keydown", onKeyDown.bind(this));
    return body;
}

function buildFooter(){
    var footer = MH.makeDiv("footer", "container");
    switch (currentPage){
        case pages.ACCUEIL:
            var newId = MH.getNewId();
            var div = MH.makeDiv(newId, "aide");
            var imgAide = MH.makeIcon("question", true, "svg+xml");
            imgAide.setAttribute("width", 30);
            imgAide.setAttribute("height", 30);
            var aide = MH.makeSpan("Infos - Aides", "signature");
            div.appendChild(imgAide);
            div.appendChild(aide);
            MH.addNewEvent(newId, "click", afficheInfo.bind(this));
            footer.appendChild(div);
            var buttonLancerTournoi = MH.makeButton({
                type: "click", 
                func: preLancerTournoi.bind(this)
            });
            var nbJoueurSelected = bd.getNbJoueurSelected();
            var typeTournoi = bd.tournoi.typeTournoi;
            if ((typeTournoi == typeTournoiListe.SIMPLE && nbJoueurSelected < 2) ||
            (typeTournoi == typeTournoiListe.DOUBLE && nbJoueurSelected < 4)){
                buttonLancerTournoi.innerHTML = "Nombre de joueurs insuffisant";
                buttonLancerTournoi.classList.add("btn-secondary");
                buttonLancerTournoi.setAttribute("disabled", true);
            }else{
                buttonLancerTournoi.innerHTML = "Lancer le tournoi";
                buttonLancerTournoi.classList.add("btn-success");
            }

            footer.appendChild(buttonLancerTournoi);
            break;
        case pages.SELECTION_JOUEUR:
            var retour = MH.makeButton({
                type: "click", 
                func: retourSelectionJoueur.bind(this)
            });
            retour.innerHTML = "Retour";
            footer.appendChild(retour);
            footer.classList.add("selection");
            break;
        case pages.MODIFICATION_JOUEUR:
            footer.appendChild(MH.makeButtonCancel({
                type: "click", 
                func: cancelModificationJoueur.bind(this)
            }));
            footer.appendChild(MH.makeButtonValid({
                type: "click", 
                func: validModificationJoueur.bind(this)
            }));
        break;
        case pages.MODIFICATION_PREPARATION:
            footer.appendChild(MH.makeButtonCancel({
                type: "click", 
                func: cancelModificationPreparation.bind(this)
            }));
            footer.appendChild(MH.makeButtonValid({
                type: "click", 
                func: validModificationPreparation.bind(this)
            }));
        break;
        case pages.MODIFICATION_HANDICAPS:
            footer.appendChild(MH.makeButtonCancel({
                type: "click", 
                func: cancelModificationHandicaps.bind(this)
            }));
            footer.appendChild(MH.makeButtonValid({
                type: "click", 
                func: validModificationHandicaps.bind(this)
            }));
        break;
        case pages.MODIFICATION_CONTRAINTES:
            footer.appendChild(MH.makeButtonCancel({
                type: "click", 
                func: cancelModificationContraintes.bind(this)
            }));
            footer.appendChild(MH.makeButtonValid({
                type: "click", 
                func: validModificationContraintes.bind(this)
            }));
        break;
        case pages.EXECUTION_TOURNOI:
            var validTourDom = MH.makeButtonValid({
                type: "click", 
                func: validTour.bind(this)
            });
            if (bd.tournoi.currentTour == bd.tournoi.tours.length - 1){
                validTourDom.innerHTML = "Cloturer le tournoi";
            }else{
                validTourDom.innerHTML = "Cloturer tour " + (bd.tournoi.currentTour + 1);
            }
            footer.appendChild(validTourDom);   
        break;
        case pages.IMPORT_JOUEURS:
            footer.appendChild(MH.makeButtonCancel({
                type: "click", 
                func: cancelImportJoueurs.bind(this)
            }));
            footer.appendChild(MH.makeButtonValid({
                type: "click", 
                func: validImportJoueurs.bind(this)
            }));
        break;
    }
    
    return footer;
}

function buildHeaderPreparation(){
    var header = MH.makeDiv("headerPreparation", "container");
    switch (currentPage){
        case pages.ACCUEIL:
            header.appendChild(MH.makeSpan("Préparation"));
            header.appendChild(MH.makeButton({
                type: "click", 
                func: editPreparation.bind(this)
            }, "edit", "Modifier"));
        break;
        case pages.SELECTION_JOUEUR:

        break;
    }
    return header;
}

function buildPreparation(){
    var listPrep = MH.makeDiv("listPreparation");
    listPrep.appendChild(buildHeaderPreparation());
    var divPrep = MH.makeDiv(null, "divPreparation");
    switch (currentPage){
        case pages.ACCUEIL:
            divPrep.appendChild(buildPropertyViewer("Type de tournoi", bd.tournoi.typeTournoi));
            divPrep.appendChild(buildPropertyViewer("Mode", bd.tournoi.modeTournoi));
            divPrep.appendChild(buildPropertyViewer("Nombre de tour", bd.tournoi.nbTour));
            divPrep.appendChild(buildPropertyViewer("Nombre de terrain", bd.tournoi.nbTerrain));
            listPrep.appendChild(divPrep);
            break;
        case pages.MODIFICATION_PREPARATION:
            var elementsTypeTournoi = [];
            for (var t in typeTournoiListe){
                elementsTypeTournoi.push({"id": t, "name": "typeTournoi", "value": typeTournoiListe[t], "checked": bd.tournoi.typeTournoi ===  typeTournoiListe[t]});
            }
            var typeTournoiRadio = buildPropertyEditor("Type de tournoi", "radio", 
            {name: "typeTournoi", elements : elementsTypeTournoi});
            MH.addNewEvent("SIMPLE", "change", validModificationPreparation.bind(this, true));
            MH.addNewEvent("DOUBLE", "change", validModificationPreparation.bind(this, true));

            divPrep.appendChild(typeTournoiRadio);

            var elementsModeTournoi = [];
            for (var t in modeTournoiListe){
                if (t == "STEPBYSTEP") continue; //pas encore développé
                elementsModeTournoi.push({"id": t, "name": "modeTournoi", "value": modeTournoiListe[t], "checked": bd.tournoi.modeTournoi ===  modeTournoiListe[t]});
            }
            divPrep.appendChild(buildPropertyEditor("Mode", "radio", 
            {name: "modeTournoi", elements : elementsModeTournoi}));

            divPrep.appendChild(buildPropertyEditor("Nombre de tour", "numberSpinner", {
                "min": 1, 
                "max": 10, 
                "value": bd.tournoi.nbTour, 
                "id": "nbTour"
            }));
            divPrep.appendChild(buildPropertyEditor("Nombre de terrain", "numberSpinner", {
                "min": 1, 
                "max": 20, 
                "value": bd.tournoi.nbTerrain,
                "id": "nbTerrain"
            }));
             divPrep.appendChild(buildPropertyEditor("Nombre de points", "numberSpinner", {
                "min": 1, 
                "max": 30,
                "value": bd.tournoi.nbPoints, 
                "id": "nbPoints"
            }));
            var handicaps = MH.makeButton({
                type: "click", 
                func: editHandicaps.bind(this)
            });
            handicaps.classList.add("btn-secondary");
            handicaps.innerHTML = "Handicaps et avantages";
            divPrep.appendChild(handicaps);
            listPrep.appendChild(divPrep);
            listPrep.appendChild(buildListContraintes());
            break;
    }

    return listPrep;
}

function buildClassement(){
    var listJoueursClassement = MH.makeDiv("listJoueursClassement");
    listJoueursClassement.appendChild(buildHeaderJoueurClassement());
    var divJoueursClassement = MH.makeDiv(null, "divJoueursClassement");
    var tableClassement = MH.makeElt("table", null, "tableClassement");
    var thead = MH.makeElt("thead", "theadClassement");
    thead.appendChild(MH.makeTh("Classement"));
    thead.appendChild(MH.makeTh("Joueur"));
    thead.appendChild(MH.makeTh("Score"));
    thead.appendChild(MH.makeTh("Niveau"));
    tableClassement.appendChild(thead);
    var listJoueursSelected = bd.joueurs.filter(j => j.selected);
    var listJoueurSort = listJoueursSelected.sort((a, b) => b.points - a.points);
    var trJoueur;
    for (var i = 0; i < listJoueurSort.length; i++){
        trJoueur = MH.makeElt("tr", null, "trJoueurClassement");
        trJoueur.appendChild(MH.makeTd(i + 1, "classementJoueur"));
        trJoueur.appendChild(MH.makeTd(listJoueurSort[i].name, "nomJoueur"));
        trJoueur.appendChild(MH.makeTd(listJoueurSort[i].points, "pointsJoueur"));
        trJoueur.appendChild(MH.makeTd(buildBadgeNiveau(listJoueurSort[i]).outerHTML));
        tableClassement.appendChild(trJoueur);
    }
    divJoueursClassement.appendChild(tableClassement);
    listJoueursClassement.appendChild(divJoueursClassement);
    return listJoueursClassement;
}

function buildHandicaps(){

    var all = MH.makeDiv(null, "container handicaps");

    var scoreNeg = buildPropertyEditor("Début de match avec un score négatif ?", "checkbox", 
    {id: "departMatchNegatif", value : bd.tournoi.departMatchNegatif});
    scoreNeg.setAttribute("id", "divMatchNegatif");
    scoreNeg.classList.add("container");
    all.appendChild(scoreNeg);
    
    var divHandicap;

    for (var gen in bd.tournoi.genreListe){
        divHandicap = MH.makeDiv(null, "handicapGenre");
        divHandicap.appendChild(MH.makeSpan(bd.tournoi.genreListe[gen].value));
        divHandicap.appendChild(buildPropertyEditor(undefined, "numberSpinner", {
            "min": -20, 
            "max": 20, 
            "value": bd.tournoi.genreListe[gen].handicap, 
            "id": gen
        }));
        all.appendChild(divHandicap);
    }

    for (var niv in bd.tournoi.niveauListe){
        divHandicap = MH.makeDiv(null, "handicapNiveau");
        divHandicap.appendChild(MH.makeSpan(bd.tournoi.niveauListe[niv].value));
        divHandicap.appendChild(buildPropertyEditor(undefined, "numberSpinner", {
            "min": -20, 
            "max": 20, 
            "value": bd.tournoi.niveauListe[niv].handicap, 
            "id": niv
        }));
        all.appendChild(divHandicap);
    }

    return all;
}

function buildHeaderTour(i){
    var header = MH.makeDiv("headerTour" + i, "headerTour container sticky-top");
    var ssTitle = MH.makeDiv(null, "divSsTitle");
    var ss1 = MH.makeSpan("Tour " + (i + 1), "ssTitle");
    ssTitle.appendChild(ss1);
    var ss2;
    if (bd.tournoi.currentTour == i) {
        ss2 = MH.makeSpan("En cours ...");
        header.classList.add("currentTour");
    } else if (bd.tournoi.currentTour > i) {
        ss2 = MH.makeSpan("Terminé");
        header.classList.add("closedTour");
    } else if (bd.tournoi.currentTour < i) {
        ss2 = MH.makeSpan("A venir ...");
        header.classList.add("forPlayingTour");
    }
    ssTitle.appendChild(ss2);
    header.appendChild(ssTitle);
    return header;
}

function buildTour(tour, i) {
    var globalTour = MH.makeDiv(null, "tour");
    if (bd.tournoi.currentTour == i) globalTour.classList.add("currentTour");
    else if (bd.tournoi.currentTour > i) globalTour.classList.add("closedTour");
    else if (bd.tournoi.currentTour < i) globalTour.classList.add("forPlayingTour");
    var listMatchs = MH.makeDiv(null, "matchs");
    for (var j = 0; j < tour.matchs.length; j++){
        listMatchs.appendChild(buildMatch(tour.matchs[j], j));
    }
    globalTour.appendChild(listMatchs);
    if (tour.joueurAttente.length > 0){
        var listJoueurAttente = MH.makeDiv(null, "joueurAttente");
        listJoueurAttente.appendChild(MH.makeSpan("Joueurs en attente..."));
        for (var i = 0; i < tour.joueurAttente.length; i++){
            listJoueurAttente.appendChild(buildJoueur(tour.joueurAttente[i], i));
        }
        globalTour.appendChild(listJoueurAttente);
    }
    return globalTour;
}

function buildMatch(match, j) {
    var divMatch = MH.makeDiv(null, "divMatch");
    var headerMatch = MH.makeDiv(null, "headerMatch");
    var num = MH.makeSpan("Match " + (currentIndexMatch + 1));

    var matchDom = MH.makeDiv(null, "match");
    var listEquipeA = MH.makeDiv(null, "equipe");
    
    for (var k = 0; k < match.equipeA.length; k++){
        listEquipeA.appendChild(buildJoueur(match.equipeA[k], match.equipeA[k].index));
    }
    var ptEquipeA = buildPropertyEditor(null , "numberSpinner", {
        "min": match["ptsEquipeADepart"], 
        "max": 50, 
        "value": match["ptsEquipeA"], 
        "id": "match" + j,
        "indexmatch": currentIndexMatch,  
        "indexequipe": "ptsEquipeA",  
        "vertical": true
    });
    ptEquipeA.classList.add("pointMatch");
    matchDom.appendChild(ptEquipeA);
    matchDom.appendChild(listEquipeA);

    var divImgVolant = MH.makeElt("div", null, "divImgVolant");
    divImgVolant.appendChild(MH.makeElt("div", null, "sepVolant"));
    var img = MH.makeElt("img", null, "volant");
    img.setAttribute("src", "data:image/png;base64, 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");
    divImgVolant.appendChild(img);
    divImgVolant.appendChild(MH.makeElt("div", null, "sepVolant"));
    matchDom.appendChild(divImgVolant);
    
    var listEquipeB = MH.makeDiv(null, "equipe");
    for (var k = 0; k < match.equipeB.length; k++){
        listEquipeB.appendChild(buildJoueur(match.equipeB[k], match.equipeB[k].index));
    }
    var ptEquipeB = buildPropertyEditor(null, "numberSpinner", {
        "min": match["ptsEquipeBDepart"], 
        "max": 50, 
        "value": match["ptsEquipeB"], 
        "id": "match" + j, 
        "indexmatch": currentIndexMatch,  
        "indexequipe": "ptsEquipeB",  
        "vertical": true
    });
    ptEquipeB.classList.add("pointMatch");
    matchDom.appendChild(listEquipeB);
    matchDom.appendChild(ptEquipeB);
    
    var victoireEquipeA = MH.makeButton({
        type: "click", 
        func: victoire.bind(this, ptEquipeA.querySelector("span"))
    }, "victoire");
    victoireEquipeA.classList.add("victoire");
    var victoireEquipeB = MH.makeButton({
        type: "click", 
        func: victoire.bind(this, ptEquipeB.querySelector("span"))
    }, "victoire");
    victoireEquipeB.classList.add("victoire");
    headerMatch.appendChild(victoireEquipeA);
    headerMatch.appendChild(num);
    headerMatch.appendChild(victoireEquipeB);
    
    divMatch.appendChild(headerMatch);

    divMatch.appendChild(matchDom);
    currentIndexMatch++;

    refreshMatch(matchDom, match);
    return divMatch;
}

function buildHeaderJoueur(){
    var header = MH.makeDiv("headerJoueur", "container sticky-top");
    switch (currentPage){
        case pages.ACCUEIL:
            var ssTitle = MH.makeDiv(null, "divSsTitle");
            var ss1 = MH.makeSpan("Participants", "ssTitle");
            var ss2 = MH.makeSpan(bd.getNbJoueurSelected() + "/" + bd.joueurs.length, "nbSsTitle");
            ssTitle.appendChild(ss1);
            ssTitle.appendChild(ss2);
            header.appendChild(ssTitle);
            header.appendChild(MH.makeButton({
                type: "click", 
                func: editSelectionJoueurs.bind(this)
            }, "edit", "Modifier"));
        break;
        case pages.SELECTION_JOUEUR:

        break;
    }
    return header;
}

function buildHeaderJoueurClassement(){
    var header = MH.makeDiv("headerJoueurClassement", "container sticky-top");
    var ssTitle = MH.makeDiv(null, "divSsTitle");
    var ss1 = MH.makeSpan("Classement", "ssTitle");
    var ss2 = MH.makeSpan("Tournoi du " + bd.tournoi.date.toLocaleDateString() + " à " + bd.tournoi.date.toLocaleTimeString(), "nbSsTitle");
    ssTitle.appendChild(ss1);
    ssTitle.appendChild(ss2);
    header.appendChild(ssTitle);
    return header;
}

function buildHeaderContrainte(){
    var header = MH.makeDiv("headerContrainte", "container sticky-top");
    switch (currentPage){
        case pages.MODIFICATION_PREPARATION:
            var ssTitle = MH.makeDiv(null, "divSsTitle");
            var ss1 = MH.makeSpan("Règles", "ssTitle");
            var ss2 = MH.makeSpan(bd.getNbContrainteActif() + "/" + bd.tournoi.contraintes.length, "nbSsTitle");
            ssTitle.appendChild(ss1);
            ssTitle.appendChild(ss2);
            header.appendChild(ssTitle);
            header.appendChild(MH.makeButton({
                type: "click", 
                func: editContraintes.bind(this)
            }, "edit", "Modifier"));
        break;
    }
    return header;
}

function buildListContraintes(){
    var listContraintes = MH.makeDiv("listContraintes");
    var divContrainte;
    if (currentPage == pages.MODIFICATION_PREPARATION){
        listContraintes.appendChild(buildHeaderContrainte());
    }
    var flag = false;
    var compt = 1;
    for (var i = 0; i < bd.tournoi.contraintes.length; i++){
        switch (currentPage){
            case pages.MODIFICATION_PREPARATION:
                if (bd.tournoi.contraintes[i].actif && !bd.tournoi.contraintes[i].disabled){
                    listContraintes.appendChild(buildContrainte(bd.tournoi.contraintes[i], i, compt));
                    flag = true;
                    compt++;
                }
            break;
            case pages.MODIFICATION_CONTRAINTES:
                listContraintes.appendChild(buildContrainte(bd.tournoi.contraintes[i], i, compt));
                flag = true;
                compt++;
            break;
        }
    }
    if (!flag){
    var contrainteDom = MH.makeDiv(null, "divContrainte");
    contrainteDom.appendChild(MH.makeSpan("Aucune contrainte", "noData"));
    listContraintes.appendChild(contrainteDom);
    }
    return listContraintes;
}
function buildListImportJoueur(){
    var listGroupes = MH.makeDiv("listGroupeJoueur");
    var flag = false;
    var currentGroup;
    var newId;
    for (var i in groupeJoueurs){
        newId = MH.getNewId();
        currentGroup = MH.makeDiv(newId, "groupeJoueur");
        var curCheck = MH.makeInput("checkbox", {"id" : i});
        curCheck.classList.add("checkInclude");
        currentGroup.appendChild(curCheck);
        currentGroup.appendChild(MH.makeSpan(i));
        listGroupes.appendChild(currentGroup);
        MH.addNewEvent(newId, "click", selectGroupe.bind(this, currentGroup));
        flag = true;
    }
    if (!flag){
        currentGroup = MH.makeDiv(null, "groupe");
        currentGroup.appendChild(MH.makeSpan("Aucun groupe", "noData"));
        listGroupes.appendChild(currentGroup);
    }
    return listGroupes;
}

function buildContrainte(contrainte, i, compt){
    var contrainteDom = MH.makeDiv("contrainte" + i, "divContrainte");
    switch (currentPage){
        case pages.MODIFICATION_PREPARATION:
            contrainteDom.classList.add("accueil");
            contrainteDom.appendChild(MH.makeSpan(compt, "numContrainte"));
            var div = MH.makeLabel(null, "ssContrainte");
            div.appendChild(MH.makeSpan(contrainte.title, "contrainteTitle"));
            div.appendChild(MH.makeSpan(contrainte.desc, "contrainteDesc"));
            if (contrainte.name == "LIMITPOINT") div.appendChild(MH.makeSpan(bd.tournoi.limitPoint));
            contrainteDom.appendChild(div);
            break;
        case pages.MODIFICATION_CONTRAINTES:
            var check = MH.makeInput("checkbox");
            if (contrainte.actif === true) check.setAttribute("checked", "true");
            check.setAttribute("id", "checkContrainte" + i);            
            check.classList.add("checkInclude");            
            contrainteDom.appendChild(check);
            contrainteDom.appendChild(MH.makeSpan(compt, "numContrainte"));
            var div = MH.makeLabel(null, "ssContrainte");
            div.setAttribute("for", "checkContrainte" + i);
            div.setAttribute("data-name", contrainte.name);
            div.setAttribute("data-title", contrainte.title);
            div.setAttribute("data-desc", contrainte.desc);
            div.appendChild(MH.makeSpan(contrainte.title, "contrainteTitle"));
            div.appendChild(MH.makeSpan(contrainte.desc, "contrainteDesc"));
            contrainteDom.appendChild(div);
            if (contrainte.name == "LIMITPOINT"){
                contrainteDom.appendChild(MH.makeInput("number", {"id": "limitPoint", "value": bd.tournoi.limitPoint}));
            } 

            var monter = MH.makeButton({
                type: "click", 
                func: monterContrainte.bind(this, i)
            }, "monter");
            monter.classList.add("btn-secondary");
            if (i == 0) monter.classList.add("disabled");
            contrainteDom.appendChild(monter);
            var descendre = MH.makeButton({
                type: "click", 
                func: descendreContrainte.bind(this, i)
            }, "descendre");
            descendre.classList.add("btn-secondary");
            if (i == bd.tournoi.contraintes.length - 1) descendre.classList.add("disabled");
            contrainteDom.appendChild(descendre);
            
            break;
    }
    return contrainteDom;
}

function buildListJoueur(){
    var listJoueurs = MH.makeDiv("listJoueurs");
    var divJoueurs = MH.makeDiv(null, "divJoueurs");
    var divJoueur;
    if (currentPage == pages.MODIFICATION_JOUEUR){
        if (currentEditionId == -1){
            divJoueur = buildJoueur(new Joueur(), currentEditionId);
            divJoueur.classList.add("homme");
        }else{
            divJoueur = buildJoueur(bd.joueurs[currentEditionId], currentEditionId);
            divJoueur.classList.add("modificationJoueur");
        }
        divJoueurs.appendChild(divJoueur);
    }else{
        if (currentPage == pages.ACCUEIL) {
            listJoueurs.appendChild(buildHeaderJoueur());
            divJoueurs.classList.add("accueil");
        } else if (currentPage == pages.SELECTION_JOUEUR){
            var newId = MH.getNewId();
            var divSelectAll = MH.makeElt("label", null, "joueur allSelect");
            divSelectAll.setAttribute("for", newId);
            var selectAllInput = MH.makeInput("checkbox", {"id": newId});
            selectAllInput.classList.add("checkInclude");
            MH.addNewEvent(newId, "click", selectAll.bind(this, selectAllInput));
            divSelectAll.appendChild(selectAllInput);
            divSelectAll.appendChild(MH.makeSpan("Tout sélectionner", "nomJoueur"));
            listJoueurs.appendChild(divSelectAll);

            listJoueurs.appendChild(buildHeaderJoueur());
        }
        if (bd.joueurs.length == 0){
            divJoueur = MH.makeSpan("Aucun joueur", "noData");
            divJoueurs.appendChild(divJoueur);
        }else{
            var flag = false;
            var compt = 0;
            for (var i = 0; i < bd.joueurs.length; i++){
                switch (currentPage){
                    case pages.ACCUEIL:
                        if (bd.joueurs[i].selected){
                            divJoueur = buildJoueur(bd.joueurs[i], i);
                            divJoueur.classList.add("accueil");
                            divJoueur.classList.add(bd.joueurs[i].genre.value == bd.tournoi.genreListe.HOMME.value ? "homme" : "femme");
                            divJoueurs.appendChild(divJoueur);
                            flag = true;
                        }
                    break;
                    case pages.SELECTION_JOUEUR:
                        if (bd.joueurs[i].selected) compt++;
                        var newId = MH.getNewId();
                        var divJoueurSelection = MH.makeDiv(newId, "joueurSelection");
                        divJoueur = buildJoueur(bd.joueurs[i], i);
                        divJoueurSelection.classList.add(bd.joueurs[i].genre.value == bd.tournoi.genreListe.HOMME.value ? "homme" : "femme");
                        divJoueurSelection.appendChild(divJoueur);
                        divJoueurSelection.appendChild(MH.makeButton({
                            type: "click", 
                            func: editJoueur.bind(this, i)
                        }, "edit"));
                        divJoueurs.appendChild(divJoueurSelection);
                        MH.addNewEvent(newId, "click", selectJoueur.bind(this, divJoueur));
                        flag = true;
                    break;
                }
            }
            if (selectAllInput != undefined) selectAllInput.checked = compt == bd.joueurs.length;
            if (!flag){
                divJoueur = MH.makeSpan("Aucun joueur sélectionné", "noData");
                divJoueurs.appendChild(divJoueur);
            }
        }
    }
    listJoueurs.appendChild(divJoueurs);
    return listJoueurs;
}

function buildJoueur(joueur, i){
    var joueurDom = MH.makeDiv(null, "joueur");
    if (i == -1){
        joueurDom.classList.add("homme");
    }else{
        joueurDom.classList.add(joueur.genre.value == bd.tournoi.genreListe.HOMME.value ? "homme" : "femme");
    }
    switch (currentPage){
        case pages.SELECTION_JOUEUR:
            var check = MH.makeInput("checkbox");
            if (joueur.selected === true) check.setAttribute("checked", "true");
            check.setAttribute("id", "joueur" + i);
            joueurDom.appendChild(check);
            joueurDom.classList.add("selection");
            joueurDom.appendChild(MH.makeSpan(joueur.name, "nomJoueur"));
            joueurDom.appendChild(buildBadgeNiveau(joueur));
            break;
        case pages.ACCUEIL:
        case pages.EXECUTION_TOURNOI:
            joueurDom.classList.add("accueil");
            joueurDom.appendChild(MH.makeSpan(joueur.name, "nomJoueur"));
            joueurDom.appendChild(buildBadgeNiveau(joueur));
            break;
        case pages.MODIFICATION_JOUEUR:
            joueurDom.appendChild(buildPropertyEditor("Nom", "text", {"id": "nomJoueur", value : joueur.name}));
            var elementsGenre = [];
            for (var gen in bd.tournoi.genreListe){
                elementsGenre.push({"id": gen, "name": "genre", "value": bd.tournoi.genreListe[gen].value, "checked": joueur.genre.value === bd.tournoi.genreListe[gen].value})
            }
            
            joueurDom.appendChild(buildPropertyEditor("Genre", "radio", 
            {name: "genre", elements : elementsGenre}));
            MH.addNewEvent("HOMME", "change", changeGenre.bind(this));
            MH.addNewEvent("FEMME", "change", changeGenre.bind(this));
            var elementsNiv = [];
            for (var niv in bd.tournoi.niveauListe){
                elementsNiv.push({"id": niv, "name": "niveau", "value": bd.tournoi.niveauListe[niv].value, "checked": joueur.niveau.value === bd.tournoi.niveauListe[niv].value})
            }
            joueurDom.appendChild(buildPropertyEditor("Niveau", "radio", 
            {name: "niveau", elements : elementsNiv}));
            for (var niv in bd.tournoi.niveauListe){
                var nive = joueurDom.querySelector("#" + niv).nextSibling;
                nive.classList.add("badge");
                if (niv[0] == "P"){
                    nive.classList.add("badge-secondary");
                }else if (niv[0] == "D"){
                    nive.classList.add("badge-warning");
                }else if (niv[0] == "R"){
                    nive.classList.add("badge-danger");
                }else if (niv[0] == "N"){
                    nive.classList.add("badge-dark");
                }
            }
        break;
    }
    return joueurDom;
}

function buildBadgeNiveau(joueur){
    var niveau = MH.makeSpan(joueur.niveau.value);
    niveau.classList.add("badge");
    if (joueur.niveau.value[0] == "P"){
        niveau.classList.add("badge-secondary");
    }else if (joueur.niveau.value[0] == "D"){
        niveau.classList.add("badge-warning");
    }else if (joueur.niveau.value[0] == "R"){
        niveau.classList.add("badge-danger");
    }else if (joueur.niveau.value[0] == "N"){
        niveau.classList.add("badge-dark");
    }
    return niveau;
}

function buildPropertyViewer(pKey, pValue){
    var property = MH.makeDiv(null, "property");
    var key = MH.makeLabel(pKey);
    key.classList.add("propertyKey");
    var value = MH.makeSpan(pValue);
    value.classList.add("propertyValue");
    property.appendChild(key);
    property.appendChild(value);
    return property;
}

function buildPropertyEditor(pKey, type, attributes){
    var property = MH.makeDiv(null, "property");
    if (type == "checkbox") property.classList.add("propertyRow");
    var key = MH.makeLabel(pKey);
    key.classList.add("propertyKey");
    key.setAttribute("for", attributes["id"]);
    var value = buildEditor(type, attributes);
    value.classList.add("propertyValue");
    if (attributes["column-reverse"] == true){
        key.classList.add("columnReverse");
        property.appendChild(value);
        if (pKey != null) property.appendChild(key);  
    }else{
        if (pKey != null) property.appendChild(key);  
        property.appendChild(value);
    }
    
    return property;
}

function buildEditor(type, attributes){
    switch (type){
        case "radio": 
            var divInput, input, label;
            var retour = MH.makeDiv();
            for (var i = 0; i < attributes["elements"].length; i++){
                divInput = MH.makeDiv(null, "divRadio radio" + attributes["name"]);
                input = MH.makeInput("radio", {
                    "id": attributes["elements"][i]["id"],
                    "name": attributes["elements"][i]["name"],
                    "value": attributes["elements"][i]["value"]
                });
                if (attributes["elements"][i]["checked"] === true) input.setAttribute("checked", "true");
                label = MH.makeElt("label", null, "labelCheckbox");
                label.setAttribute("for", attributes["elements"][i]["id"]);
                label.innerHTML = attributes["elements"][i]["value"];
                divInput.appendChild(input);
                divInput.appendChild(label);
                retour.appendChild(divInput);
            }
            return retour;
        case "checkbox":
            var input = MH.makeInput("checkbox");
            if (attributes["value"] === true){
                input.setAttribute("checked", "true");
            }
            input.setAttribute("id", attributes["id"]);
            return input;
        case "number":
            var input = MH.makeInput("number");
            input.setAttribute("min", attributes["min"]);
            input.setAttribute("max", attributes["max"]);
            input.setAttribute("value", attributes["value"]);
            input.setAttribute("id", attributes["id"]);
            return input;
        case "numberSpinner":
            var vertical = attributes["vertical"] == true;
            var divInputNumber = MH.makeDiv(attributes["id"], "numberSpinner" + (vertical ? " vertical" : ""));
            for (var att in attributes){
                divInputNumber.setAttribute(att, attributes[att]);
            }
            var spanNumber = MH.makeSpan(attributes["value"], "numberSpinnerValue");
            divInputNumber.appendChild(spanNumber);

            var buttonMoins = MH.makeButton({
                type: "click", 
                func: numberPlusOuMoins.bind(this, false, spanNumber, undefined, )
            });
            buttonMoins.addEventListener('touchstart', preventZoom); 
            buttonMoins.innerHTML = "-";
            buttonMoins.classList.add("btn-secondary");
            buttonMoins.classList.add("numberSpinnerPlusMoins");
            buttonMoins.classList.add("numberSpinnerMoins"+ (vertical ? "Vertical" : ""));
            divInputNumber.insertBefore(buttonMoins, spanNumber);

            var buttonPlus = MH.makeButton({
                type: "click", 
                func: numberPlusOuMoins.bind(this, true, spanNumber, undefined)
            });
            buttonPlus.addEventListener('touchstart', preventZoom); 
            buttonPlus.innerHTML = "+";
            buttonPlus.classList.add("btn-secondary");
            buttonPlus.classList.add("numberSpinnerPlusMoins");
            buttonPlus.classList.add("numberSpinnerPlus"+ (vertical ? "Vertical" : ""));
            divInputNumber.appendChild(buttonPlus);
           
            return divInputNumber;
        default:
            return MH.makeInput(type, attributes);
    }
}

//interfaces
function buildInterfaceHeaderAccueil(){

    var listIcon = MH.makeIcon("gear");

    var interfaces = [];

    var buttonImport = MH.makeElt("label", null, "btn-file", "margin:0px;");
    var newId = MH.getNewId();
    var input = MH.makeInput("file", {"id": newId, "accept": ".json", "style" : "display:none;"});
    MH.addNewEvent(newId,"change", bd.import.bind(input));
    buttonImport.setAttribute("title", "Importer un tournoi");
    buttonImport.classList.add("btn");
    buttonImport.classList.add("btn-light");
    buttonImport.appendChild(MH.makeSpan("Importer")/*MH.makeIcon("import")*/);
    buttonImport.appendChild(input);
    interfaces.push(buttonImport);

    var exp = MH.makeButton({
        type: "click", 
        func: bd.export.bind(bd)
    }/*, "export"*/);
    exp.innerHTML = "Exporter";
    exp.setAttribute("title", "Exporter un tournoi");
    exp.classList.add("bouton");
    exp.style = "margin:0px;";
    interfaces.push(exp);

    var reset = MH.makeButton({
        type: "click", 
        func: showModalReset.bind(this)
    }/*, "reset"*/);
    reset.innerHTML = "Reset";
    reset.classList.add("btn-danger");
    reset.style = "margin:0px;";
    interfaces.push(reset);

    return MH.makeDropDown(listIcon.outerHTML, interfaces);
}

//actions
function onKeyDown(evt){
    if (evt.code == "Enter"){
        switch(currentPage){
            case pages.MODIFICATION_JOUEUR:
                validModificationJoueur();
                break;
        }
    }else if (evt.code == "Escape"){
        switch(currentPage){
            case pages.MODIFICATION_JOUEUR:
                cancelModificationJoueur();
                break;
        }
    }
}
function showModalDeleteJoueur(){
    $('#modalDeleteJoueur').modal('show');
}
function showModalReset(){
    $('#modalReset').modal('show');
}
function reset(){
    bd.joueurs = [];
    bd.tournoi = new Tournoi();
    bd.save();
    $('#modalReset').modal('toggle');
    selectPage(pages.ACCUEIL);
}
function preLancerTournoi(){
    if (bd.tournoi.tours.length > 0){
        $('#modalPreLancer').modal('toggle');
    }else{
        lancerTournoi();
    }
}

function afficheInfo(evt){
    $('#modalInfoCredit').modal('toggle');
        document.getElementById("buttonApropos").click();
        /*setTimeout(function(evt){
    }, 1000, evt);*/
}

function lancerTournoi(){
    $('#modalPreLancer').modal('hide');

    genereTournoi();
    bd.updateTournoi({"date": new Date()});
    bd.updateTournoi({"currentTour": 0});
    selectPage(pages.EXECUTION_TOURNOI);
}

function showModalFinTournoi(){
    $('#modalFinTournoi').modal('show');
}
function finTournoi(){
    var scoreEquipeA, scoreEquipeB, equipeAGagne, equipeAGagneMoins, equipeBGagneMoins;
    for (var i = 0; i < bd.tournoi.tours.length; i++){
        for (var j = 0; j < bd.tournoi.tours[i].matchs.length; j++){
            scoreEquipeA = bd.tournoi.tours[i].matchs[j].ptsEquipeA;
            scoreEquipeB = bd.tournoi.tours[i].matchs[j].ptsEquipeB;
            egalite = scoreEquipeA == scoreEquipeB;
            equipeAGagne = scoreEquipeA > scoreEquipeB && (scoreEquipeA - scoreEquipeB > 2);
            equipeAGagneMoins = scoreEquipeA > scoreEquipeB && (scoreEquipeA - scoreEquipeB <= 2);
            equipeBGagneMoins = scoreEquipeB > scoreEquipeA && (scoreEquipeB - scoreEquipeA <= 2);
            for (var k = 0; k < bd.tournoi.tours[i].matchs[j].equipeA.length; k++){
                bd.tournoi.tours[i].matchs[j].equipeA[k].points += 
                egalite ? 4 : (equipeAGagne ? 5 : (equipeAGagneMoins ? 3 : (equipeBGagneMoins ? 2 : 1)));
            }
            for (var m = 0; m < bd.tournoi.tours[i].matchs[j].equipeB.length; m++){
                bd.tournoi.tours[i].matchs[j].equipeB[m].points += 
                egalite ? 4 : (equipeAGagne ? 1 : (equipeAGagneMoins ? 2 : (equipeBGagneMoins ? 3 : 5)));
            }
        }
    }

    bd.updateTournoi({"currentTour": -1});
    $('#modalFinTournoi').modal('hide');
    selectPage(pages.ACCUEIL);
}
function validTour(){   
    var matchsNonTermine = false;
    for (var i = 0; i < bd.tournoi.tours[bd.tournoi.currentTour].matchs.length; i++){
        if (bd.tournoi.tours[bd.tournoi.currentTour].matchs[i].ptsEquipeA < bd.tournoi.nbPoints &&
            bd.tournoi.tours[bd.tournoi.currentTour].matchs[i].ptsEquipeB < bd.tournoi.nbPoints){
                matchsNonTermine = true;
                break;
            }
    }

    if (matchsNonTermine){
        showModalMatchsNonTermine();
        return;
    }
    if (bd.tournoi.currentTour < bd.tournoi.nbTour - 1){
        bd.tournoi.currentTour++;
        bd.save();
        selectPage(pages.EXECUTION_TOURNOI);
        document.body.querySelector("#headerTour" + bd.tournoi.currentTour).scrollIntoView({
            behavior: 'smooth'
        });
        //window.location.href = "#headerTour" + bd.tournoi.currentTour;
    }else{
        finTournoi();
    }
}
function retourModificationPreparation(){
    validModificationPreparation();
}
function retourModificationHandicaps(){
    validModificationHandicaps();
}
function retourModificationContraintes(){
    selectPage(pages.MODIFICATION_PREPARATION);
}

function retourModificationJoueur(){
    cancelModificationJoueur();
}
function retourSelectionJoueur(){
    updateSelectJoueur();
    selectPage(pages.ACCUEIL);
}
function addJoueur(evt){
    editJoueur(-1, evt);
}

function importJoueurs(evt){
    selectPage(pages.IMPORT_JOUEURS);

    /*$.ajax({
        crossOrigin: true,
        url: "https://www.google.com/",
        success: function(data) {
          $('#test').html(data);
        }
      });*/

    /*$.get("http://jsontest.com/", function(response){
        console.log(response);
    });*/
   /*$.ajax({
        url : 'https://badnet.org/',
        type : 'GET',
        success : function(code_html, statut){
            console.log("ok");
        },
 
        error : function(resultat, statut, erreur){
            console.log("error");
          
        },
 
        complete : function(resultat, statut){
            console.log("complete");
 
        }
 
     });*/
}
function cancelImportJoueurs(){
    selectPage(pages.SELECTION_JOUEUR);
}
function validImportJoueurs(){
    var list =  document.getElementById("listGroupeJoueur").querySelectorAll("input");
    for (var i = 0; i < list.length; i++){
        if (list[i].checked){
            var listJoueurs = groupeJoueurs[list[i].parentElement.querySelector("span").innerHTML];
            for (var j = 0; j < listJoueurs.length; j++){
                bd.addJoueur(listJoueurs[j]);
            }
        }
    }
    selectPage(pages.SELECTION_JOUEUR);
}
function showModalJoueurExist(nomJoueur){
    $('#modalJoueurExist div.modal-body').html('Le joueur : ' + nomJoueur + ' existe déjà.');
    $('#modalJoueurExist').modal('show');
}
function showModalMatchsNonTermine(nomJoueur){
    $('#modalMatchNonTermine div.modal-body').html('Tous les matchs ne sont pas terminés pour ce tour !');
    $('#modalMatchNonTermine').modal('show');
}

function editPreparation(){
    selectPage(pages.MODIFICATION_PREPARATION);
}
function editContraintes(){
    selectPage(pages.MODIFICATION_CONTRAINTES);
}
function editSelectionJoueurs(){
    selectPage(pages.SELECTION_JOUEUR);
}
function validModificationJoueur(){
    var ok = true;
    var nomJoueur = document.getElementById("nomJoueur").value;
    if (currentEditionId == -1){
        ok = bd.addJoueur(new Joueur(
            nomJoueur,
            bd.tournoi.genreListe[document.body.querySelector("div.radiogenre input:checked").id],
            bd.tournoi.niveauListe[document.body.querySelector("div.radioniveau input:checked").id],
            false, 
            0));
    }else{
        ok = bd.updateJoueur(currentEditionId, {
            "name": nomJoueur,
            "niveau": bd.tournoi.niveauListe[document.body.querySelector("div.radioniveau input:checked").id],
            "genre": bd.tournoi.genreListe[document.body.querySelector("div.radiogenre input:checked").id],
        });
    }
    if (ok) selectPage(pages.SELECTION_JOUEUR);
    else showModalJoueurExist(nomJoueur);
}
function cancelModificationJoueur(){
    selectPage(pages.SELECTION_JOUEUR);
}
function validModificationHandicaps(){
    var genreListe = {};
    var handicapGenre = document.body.querySelectorAll(".handicapGenre");
    var inter;
    for (var i = 0; i< handicapGenre.length; i++){
        inter = handicapGenre[i].querySelector(".propertyValue");
        genreListe[inter.id] = {
            "value": handicapGenre[i].children[0].innerHTML, 
            "handicap": parseInt(handicapGenre[i].querySelector(".numberSpinnerValue").innerHTML)
        };
    }

    var niveauListe = {};
    var handicapNiveau = document.body.querySelectorAll(".handicapNiveau");
    for (var i = 0; i< handicapNiveau.length; i++){
        inter = handicapNiveau[i].querySelector(".propertyValue");
        niveauListe[inter.id] = {
            "value": handicapNiveau[i].children[0].innerHTML, 
            "handicap": parseInt(handicapNiveau[i].querySelector(".numberSpinnerValue").innerHTML)
        };
    }

    bd.updateTournoi({
        "niveauListe": niveauListe, 
        "genreListe": genreListe, 
        "departMatchNegatif": document.body.querySelector("#departMatchNegatif").checked
    });
    selectPage(pages.MODIFICATION_PREPARATION);
}
function cancelModificationHandicaps(){
    selectPage(pages.MODIFICATION_PREPARATION);
}
function validModificationContraintes(){

    var contraintes = document.body.querySelectorAll(".divContrainte");
    var retourContraintes = [];
    var currentContrainte;
    for (var i = 0; i < contraintes.length; i++){
        currentContrainte = {
            "name": bd.tournoi.contraintes[i].name,
            "title": bd.tournoi.contraintes[i].title, 
            "desc": bd.tournoi.contraintes[i].desc,
            "actif": contraintes[i].querySelector("input").checked, 
            "disabled": bd.tournoi.contraintes[i].disabled, 
        }
        retourContraintes.push(currentContrainte);
        if (currentContrainte.name == "LIMITPOINT") {
            bd.updateTournoi({"limitPoint": contraintes[i].querySelector("#limitPoint").value });
        }
    }
    bd.updateContraintes(retourContraintes);
    selectPage(pages.MODIFICATION_PREPARATION);
}
function cancelModificationContraintes(){
    selectPage(pages.MODIFICATION_PREPARATION);
}
function validModificationPreparation(dontExit){
    bd.updateTournoi({
        "typeTournoi": typeTournoiListe[document.body.querySelector("div.radiotypeTournoi input:checked").id],
        "nbTour": parseInt(document.body.querySelector("#nbTour .numberSpinnerValue").innerHTML),
        "nbTerrain": parseInt(document.body.querySelector("#nbTerrain .numberSpinnerValue").innerHTML),
        "nbPoints": parseInt(document.body.querySelector("#nbPoints .numberSpinnerValue").innerHTML)
    }); 
    bd.updateContraintes();
    if (dontExit === true) {
        selectPage(pages.MODIFICATION_PREPARATION);
    }else{
        selectPage(pages.ACCUEIL);
    }

}
function cancelModificationPreparation(){
    selectPage(pages.ACCUEIL);
}
function editJoueur(i, evt){
    evt.preventDefault();
    evt.cancelBubble = true;
    currentEditionId = i;
    selectPage(pages.MODIFICATION_JOUEUR);
}
function changeGenre(evt){
    var divJoueur = evt.currentTarget.closest(".joueur");
    if (evt.currentTarget.id == "HOMME"){
        divJoueur.classList.remove("femme");
        divJoueur.classList.add("homme");
    }else{
        divJoueur.classList.remove("homme");
        divJoueur.classList.add("femme");
    }
}
function deleteJoueur(){
    bd.deleteJoueur(currentEditionId);
    $('#modalDeleteJoueur').modal('toggle');
    selectPage(pages.SELECTION_JOUEUR);
}
function updateSelectJoueur(evt){
    var list = document.getElementById("listJoueurs").parentElement.parentElement.querySelectorAll("input[type=checkbox]");   
    for (var i = 1; i < list.length; i++){
        bd.updateJoueur(i - 1, {"selected": list[i].checked});
    }
}
function selectJoueur(div){
    var input = div.querySelector("input[type=checkbox]");
    input.checked = !input.checked;
}
function selectGroupe(div){
    var input = div.querySelector("input[type=checkbox]");
    input.checked = !input.checked;
}
function selectAll(input){
    var list = input.parentElement.parentElement.querySelectorAll("input[type=checkbox]");   
    var inputChecked = input.checked; 
    for (var i = 0; i < list.length; i++){
        list[i].checked = inputChecked;
    }
}
function monterContrainte(i){
    if (i > 0){
        var cDisabled = bd.tournoi.contraintes[i - 1].disabled;
        var movedElt = bd.tournoi.contraintes[i];
        bd.tournoi.contraintes.splice(i, 1);
        bd.tournoi.contraintes.splice(i - 1 - (cDisabled ? 1 : 0), 0, movedElt);
    }
    selectPage(pages.MODIFICATION_CONTRAINTES);
}
function descendreContrainte(i){
    if (i < bd.tournoi.contraintes.length - 1){
        var cDisabled = bd.tournoi.contraintes[i + 1].disabled;
        var movedElt = bd.tournoi.contraintes[i];
        bd.tournoi.contraintes.splice(i, 1);
        bd.tournoi.contraintes.splice(i + 1 + (cDisabled ? 1 : 0), 0, movedElt);
    }
    selectPage(pages.MODIFICATION_CONTRAINTES);
}
function numberPlusOuMoins(sens, span, newValue){
    var retourValue;
    var value =  parseInt(span.innerHTML);
    if (newValue == undefined){
        if (sens){
            var max = parseInt(span.parentElement.getAttribute("max"));
            if (value < max) span.innerHTML = value + 1;
            span.parentElement.setAttribute("value", span.innerHTML);
            retourValue = parseInt(span.innerHTML);
        } else{
            var min = parseInt(span.parentElement.getAttribute("min"));
            if (value > min) span.innerHTML = value - 1;
            span.parentElement.setAttribute("value", span.innerHTML);
            retourValue = parseInt(span.innerHTML);
        }
    }else{
        span.innerHTML = newValue;
        span.parentElement.setAttribute("value", span.innerHTML);
        retourValue = parseInt(span.innerHTML);
    }
    
    switch (currentPage){
        case pages.EXECUTION_TOURNOI:
            var indexMatch = parseInt(span.parentElement.getAttribute("indexmatch"));
            var indexEquipe = span.parentElement.getAttribute("indexequipe");
            changeScore(indexMatch, indexEquipe, retourValue);
            refreshMatch(span.closest(".match"));
        break;
    }

}
function editHandicaps(){
    selectPage(pages.MODIFICATION_HANDICAPS);
}
function changeScore(indexMatch, indexEquipe, value){
    bd.updateMatch(indexMatch, indexEquipe, value);
}
function victoire(span){
    var match = span.closest(".match");
    var equipes = match.querySelectorAll("div.pointMatch>div.numberSpinner");
    var equipeA = equipes[0];
    var scoreEquipeA = parseInt(equipeA.getAttribute("value"));
    var equipeB = equipes[1];
    var scoreEquipeB = parseInt(equipeB.getAttribute("value"));

    var equipeCurrent = span.closest(".numberSpinner");
    var currentIsEquipeA = equipeCurrent.getAttribute("indexequipe") == "ptsEquipeA";
    var scoreEquipeOppose = currentIsEquipeA ? scoreEquipeB : scoreEquipeA;
    var target;
    if (scoreEquipeOppose <= bd.tournoi.nbPoints -2){
        target = bd.tournoi.nbPoints;
    }else{
        target = scoreEquipeOppose + 2;
    }
    numberPlusOuMoins(null, span, target);
}

function refreshMatch(domMatch, match){
    var equipes = domMatch.querySelectorAll("div.pointMatch>div.numberSpinner");
    var equipeA = equipes[0];
    var scoreEquipeA = parseInt(equipeA.getAttribute("value"));
    var equipeB = equipes[1];
    var scoreEquipeB = parseInt(equipeB.getAttribute("value"));

    if (scoreEquipeA == scoreEquipeB){
        equipeA.classList.remove("perd");
        equipeA.classList.remove("gagne");
        equipeB.classList.remove("perd");
        equipeB.classList.remove("gagne");
        equipeA.classList.add("egalite");
        equipeB.classList.add("egalite");
    }else{
        equipeA.classList.remove("egalite");
        equipeB.classList.remove("egalite");
        equipeA.classList.add(scoreEquipeA > scoreEquipeB ? "gagne" : "perd");
        equipeA.classList.remove(scoreEquipeA > scoreEquipeB ? "perd" : "gagne");
        equipeB.classList.add(scoreEquipeB > scoreEquipeA ? "gagne" : "perd");
        equipeB.classList.remove(scoreEquipeB > scoreEquipeA ? "perd" : "gagne");
    } 

}

//***** MAKER HTML */
class MH {
    static idCompt = 0;
    static listEvents = [];
    static getNewId(){
        var newId = "id" + this.idCompt;
        this.idCompt++;
        return newId;
    }
    static makeElt(type, id, className, style){
        var elt = document.createElement(type);
        if (id != undefined) elt.setAttribute("id", id);
        if (className != undefined) elt.setAttribute("class", className);
        if (style != undefined) elt.style = style;
        return elt;
    } 
    static makeTh(content, className){var span = this.makeElt("span", undefined, className); span.innerHTML = content; var th = MH.makeElt("th"); th.appendChild(span); return th;};
    static makeTd(content, className){var span = this.makeElt("span", undefined, className); span.innerHTML = content; var td = MH.makeElt("td"); td.appendChild(span); return td;};
    static makeSpan(content, className){var span = this.makeElt("span", undefined, className); span.innerHTML = content; return span;};
    static makeLabel(content, className, forr){var label = this.makeElt("label", undefined, className); label.innerHTML = content; if (forr != undefined) label.setAttribute("for", forr); return label;};
    static makeDiv(id, className, style){return this.makeElt("div", id, className, style)}
    static makeInput(type, attributes){ 
        var input = MH.makeElt("input"); 
        input.setAttribute("type", type); 
        for (var elt in attributes){
            input.setAttribute(elt, attributes[elt]);
        }
        return input;
    }
    static makeIcon(type, base64, typeImage){
        if (base64 == undefined) base64 = true;
        if (typeImage == undefined) typeImage = "svg+xml";
        var img = MH.makeElt("img");
        var src = base64 ? "data:image/" + typeImage + ";base64, " : "";
        switch (type){
            case "edit":
                src += "PHN2ZyB3aWR0aD0iMWVtIiBoZWlnaHQ9IjFlbSIgdmlld0JveD0iMCAwIDE2IDE2IiBjbGFzcz0iYmkgYmktcGVuY2lsLWZpbGwiIGZpbGw9ImN1cnJlbnRDb2xvciIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCiAgPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTIuODU0LjE0NmEuNS41IDAgMCAwLS43MDcgMEwxMC41IDEuNzkzIDE0LjIwNyA1LjVsMS42NDctMS42NDZhLjUuNSAwIDAgMCAwLS43MDhsLTMtM3ptLjY0NiA2LjA2MUw5Ljc5MyAyLjUgMy4yOTMgOUgzLjVhLjUuNSAwIDAgMSAuNS41di41aC41YS41LjUgMCAwIDEgLjUuNXYuNWguNWEuNS41IDAgMCAxIC41LjV2LjVoLjVhLjUuNSAwIDAgMSAuNS41di4yMDdsNi41LTYuNXptLTcuNDY4IDcuNDY4QS41LjUgMCAwIDEgNiAxMy41VjEzaC0uNWEuNS41IDAgMCAxLS41LS41VjEyaC0uNWEuNS41IDAgMCAxLS41LS41VjExaC0uNWEuNS41IDAgMCAxLS41LS41VjEwaC0uNWEuNDk5LjQ5OSAwIDAgMS0uMTc1LS4wMzJsLS4xNzkuMTc4YS41LjUgMCAwIDAtLjExLjE2OGwtMiA1YS41LjUgMCAwIDAgLjY1LjY1bDUtMmEuNS41IDAgMCAwIC4xNjgtLjExbC4xNzgtLjE3OHoiLz4NCjwvc3ZnPg==";
                break;
            case "inverse":
                src += "arrow-repeat.svg";
                break;
            case "add":
                src += "plus.svg";
                break;
            case "import":
            case "export":
                src += "box-arrow-down.svg";
                break;
            case "retour":
                src += 'PHN2ZyB3aWR0aD0iMWVtIiBoZWlnaHQ9IjFlbSIgdmlld0JveD0iMCAwIDE2IDE2IiBjbGFzcz0iYmkgYmktYXJyb3ctbGVmdCIgZmlsbD0iY3VycmVudENvbG9yIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPg0KICA8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xNSA4YS41LjUgMCAwIDAtLjUtLjVIMi43MDdsMy4xNDctMy4xNDZhLjUuNSAwIDEgMC0uNzA4LS43MDhsLTQgNGEuNS41IDAgMCAwIDAgLjcwOGw0IDRhLjUuNSAwIDAgMCAuNzA4LS43MDhMMi43MDcgOC41SDE0LjVBLjUuNSAwIDAgMCAxNSA4eiIvPg0KPC9zdmc+';
                break;  
            case "delete":
            case "reset":
                src += "PHN2ZyB3aWR0aD0iMWVtIiBoZWlnaHQ9IjFlbSIgdmlld0JveD0iMCAwIDE2IDE2IiBjbGFzcz0iYmkgYmktdHJhc2giIGZpbGw9ImN1cnJlbnRDb2xvciIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCiAgPHBhdGggZD0iTTUuNSA1LjVBLjUuNSAwIDAgMSA2IDZ2NmEuNS41IDAgMCAxLTEgMFY2YS41LjUgMCAwIDEgLjUtLjV6bTIuNSAwYS41LjUgMCAwIDEgLjUuNXY2YS41LjUgMCAwIDEtMSAwVjZhLjUuNSAwIDAgMSAuNS0uNXptMyAuNWEuNS41IDAgMCAwLTEgMHY2YS41LjUgMCAwIDAgMSAwVjZ6Ii8+DQogIDxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTE0LjUgM2ExIDEgMCAwIDEtMSAxSDEzdjlhMiAyIDAgMCAxLTIgMkg1YTIgMiAwIDAgMS0yLTJWNGgtLjVhMSAxIDAgMCAxLTEtMVYyYTEgMSAwIDAgMSAxLTFINmExIDEgMCAwIDEgMS0xaDJhMSAxIDAgMCAxIDEgMWgzLjVhMSAxIDAgMCAxIDEgMXYxek00LjExOCA0TDQgNC4wNTlWMTNhMSAxIDAgMCAwIDEgMWg2YTEgMSAwIDAgMCAxLTFWNC4wNTlMMTEuODgyIDRINC4xMTh6TTIuNSAzVjJoMTF2MWgtMTF6Ii8+DQo8L3N2Zz4=";
                break; 
            case "list":
                src += "list.svg";
                break; 
            case "gear":
                src += "PHN2ZyB3aWR0aD0iMWVtIiBoZWlnaHQ9IjFlbSIgdmlld0JveD0iMCAwIDE2IDE2IiBjbGFzcz0iYmkgYmktZ2Vhci1maWxsIiBmaWxsPSJjdXJyZW50Q29sb3IiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+DQogIDxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTkuNDA1IDEuMDVjLS40MTMtMS40LTIuMzk3LTEuNC0yLjgxIDBsLS4xLjM0YTEuNDY0IDEuNDY0IDAgMCAxLTIuMTA1Ljg3MmwtLjMxLS4xN2MtMS4yODMtLjY5OC0yLjY4Ni43MDUtMS45ODcgMS45ODdsLjE2OS4zMTFjLjQ0Ni44Mi4wMjMgMS44NDEtLjg3MiAyLjEwNWwtLjM0LjFjLTEuNC40MTMtMS40IDIuMzk3IDAgMi44MWwuMzQuMWExLjQ2NCAxLjQ2NCAwIDAgMSAuODcyIDIuMTA1bC0uMTcuMzFjLS42OTggMS4yODMuNzA1IDIuNjg2IDEuOTg3IDEuOTg3bC4zMTEtLjE2OWExLjQ2NCAxLjQ2NCAwIDAgMSAyLjEwNS44NzJsLjEuMzRjLjQxMyAxLjQgMi4zOTcgMS40IDIuODEgMGwuMS0uMzRhMS40NjQgMS40NjQgMCAwIDEgMi4xMDUtLjg3MmwuMzEuMTdjMS4yODMuNjk4IDIuNjg2LS43MDUgMS45ODctMS45ODdsLS4xNjktLjMxMWExLjQ2NCAxLjQ2NCAwIDAgMSAuODcyLTIuMTA1bC4zNC0uMWMxLjQtLjQxMyAxLjQtMi4zOTcgMC0yLjgxbC0uMzQtLjFhMS40NjQgMS40NjQgMCAwIDEtLjg3Mi0yLjEwNWwuMTctLjMxYy42OTgtMS4yODMtLjcwNS0yLjY4Ni0xLjk4Ny0xLjk4N2wtLjMxMS4xNjlhMS40NjQgMS40NjQgMCAwIDEtMi4xMDUtLjg3MmwtLjEtLjM0ek04IDEwLjkzYTIuOTI5IDIuOTI5IDAgMSAwIDAtNS44NiAyLjkyOSAyLjkyOSAwIDAgMCAwIDUuODU4eiIvPg0KPC9zdmc+";
                break; 
            case "check":
                src += "check.svg";
                break;
            case "monter":
                src += "PHN2ZyB3aWR0aD0iMWVtIiBoZWlnaHQ9IjFlbSIgdmlld0JveD0iMCAwIDE2IDE2IiBjbGFzcz0iYmkgYmktY2FyZXQtdXAtZmlsbCIgZmlsbD0iY3VycmVudENvbG9yIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPg0KICA8cGF0aCBkPSJNNy4yNDcgNC44NmwtNC43OTYgNS40ODFjLS41NjYuNjQ3LS4xMDYgMS42NTkuNzUzIDEuNjU5aDkuNTkyYTEgMSAwIDAgMCAuNzUzLTEuNjU5bC00Ljc5Ni01LjQ4YTEgMSAwIDAgMC0xLjUwNiAweiIvPg0KPC9zdmc+";
                break;
            case "descendre":
                src += "PHN2ZyB3aWR0aD0iMWVtIiBoZWlnaHQ9IjFlbSIgdmlld0JveD0iMCAwIDE2IDE2IiBjbGFzcz0iYmkgYmktY2FyZXQtZG93bi1maWxsIiBmaWxsPSJjdXJyZW50Q29sb3IiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+DQogIDxwYXRoIGQ9Ik03LjI0NyAxMS4xNEwyLjQ1MSA1LjY1OEMxLjg4NSA1LjAxMyAyLjM0NSA0IDMuMjA0IDRoOS41OTJhMSAxIDAgMCAxIC43NTMgMS42NTlsLTQuNzk2IDUuNDhhMSAxIDAgMCAxLTEuNTA2IDB6Ii8+DQo8L3N2Zz4=";
                break;
            case "victoire":
                src += "PHN2ZyB3aWR0aD0iMWVtIiBoZWlnaHQ9IjFlbSIgdmlld0JveD0iMCAwIDE2IDE2IiBjbGFzcz0iYmkgYmktdHJvcGh5LWZpbGwiIGZpbGw9ImN1cnJlbnRDb2xvciIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCiAgPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMi41LjVBLjUuNSAwIDAgMSAzIDBoMTBhLjUuNSAwIDAgMSAuNS41YzAgLjUzOC0uMDEyIDEuMDUtLjAzNCAxLjUzNmEzIDMgMCAxIDEtMS4xMzMgNS44OWMtLjc5IDEuODY1LTEuODc4IDIuNzc3LTIuODMzIDMuMDExdjIuMTczbDEuNDI1LjM1NmMuMTk0LjA0OC4zNzcuMTM1LjUzNy4yNTVMMTMuMyAxNS4xYS41LjUgMCAwIDEtLjMuOUgzYS41LjUgMCAwIDEtLjMtLjlsMS44MzgtMS4zNzljLjE2LS4xMi4zNDMtLjIwNy41MzctLjI1NUw2LjUgMTMuMTF2LTIuMTczYy0uOTU1LS4yMzQtMi4wNDMtMS4xNDYtMi44MzMtMy4wMTJhMyAzIDAgMSAxLTEuMTMyLTUuODlBMzMuMDc2IDMzLjA3NiAwIDAgMSAyLjUuNXptLjA5OSAyLjU0YTIgMiAwIDAgMCAuNzIgMy45MzVjLS4zMzMtMS4wNS0uNTg4LTIuMzQ2LS43Mi0zLjkzNXptMTAuMDgzIDMuOTM1YTIgMiAwIDAgMCAuNzItMy45MzVjLS4xMzMgMS41OS0uMzg4IDIuODg1LS43MiAzLjkzNXoiLz4NCjwvc3ZnPg==";
                break;
            case "logoLigue":
                src += "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QmxkIFVudEYjUmx0AAAAAAAAAAAAAAAAUnNsdFVudEYjUHhsQHLAAAAAAAAAAAAKdmVjdG9yRGF0YWJvb2wBAAAAAFBnUHNlbnVtAAAAAFBnUHMAAAAAUGdQQwAAAABMZWZ0VW50RiNSbHQAAAAAAAAAAAAAAABUb3AgVW50RiNSbHQAAAAAAAAAAAAAAABTY2wgVW50RiNQcmNAWQAAAAAAAAAAABBjcm9wV2hlblByaW50aW5nYm9vbAAAAAAOY3JvcFJlY3RCb3R0b21sb25nAAAAAAAAAAxjcm9wUmVjdExlZnRsb25nAAAAAAAAAA1jcm9wUmVjdFJpZ2h0bG9uZwAAAAAAAAALY3JvcFJlY3RUb3Bsb25nAAAAAAA4QklNA+0AAAAAABABLAAAAAEAAgEsAAAAAQACOEJJTQQmAAAAAAAOAAAAAAAAAAAAAD+AAAA4QklNBA0AAAAAAAQAAABaOEJJTQQZAAAAAAAEAAAAHjhCSU0D8wAAAAAACQAAAAAAAAAAAQA4QklNJxAAAAAAAAoAAQAAAAAAAAACOEJJTQP1AAAAAABIAC9mZgABAGxmZgAGAAAAAAABAC9mZgABAKGZmgAGAAAAAAABADIAAAABAFoAAAAGAAAAAAABADUAAAABAC0AAAAGAAAAAAABOEJJTQP4AAAAAABwAAD/////////////////////////////A+gAAAAA/////////////////////////////wPoAAAAAP////////////////////////////8D6AAAAAD/////////////////////////////A+gAADhCSU0EAAAAAAAAAgABOEJJTQQCAAAAAAAEAAAAADhCSU0EMAAAAAAAAgEBOEJJTQQtAAAAAAAGAAEAAAADOEJJTQQIAAAAAAAQAAAAAQAAAkAAAAJAAAAAADhCSU0EHgAAAAAABAAAAAA4QklNBBoAAAAAA00AAAAGAAAAAAAAAAAAAADTAAADIAAAAAwAUwBhAG4AcwAgAHQAaQB0AHIAZQAtADEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAyAAAADTAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAEAAAAAAABudWxsAAAAAgAAAAZib3VuZHNPYmpj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Z2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxMzIgNzkuMTU5Mjg0LCAyMDE2LzA0LzE5LTEzOjEzOjQwICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxNS41IChNYWNpbnRvc2gpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAxNi0wNi0zMFQyMDoyNDo1OSswMjowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAxNi0wNi0zMFQyMDoyNDo1OSswMjowMCIgeG1wOk1vZGlmeURhdGU9IjIwMTYtMDYtMzBUMjA6MjQ6NTkrMDI6MDAiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NzQ4MDMxNzktODhmNC00ZjFhLWJiY2MtYWJiYTA2NjBiYmVhIiB4bXBNTTpEb2N1bWVudElEPSJhZG9iZTpkb2NpZDpwaG90b3Nob3A6NDgxMmVkOWYtN2Y3ZS0xMTc5LTkwZDQtZDJmY2E2ZmFkZGY4IiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6MjE3ODdjNWUtYTdhYy00MjRjLTlhZjQtMGEwYjhiN2VhY2JiIiBkYzpmb3JtYXQ9ImltYWdlL2pwZWciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJEaXNwbGF5Ij4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDoyMTc4N2M1ZS1hN2FjLTQyNGMtOWFmNC0wYTBiOGI3ZWFjYmIiIHN0RXZ0OndoZW49IjIwMTYtMDYtMzBUMjA6MjQ6NTkrMDI6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE1LjUgKE1hY2ludG9zaCkiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjc0ODAzMTc5LTg4ZjQtNGYxYS1iYmNjLWFiYmEwNjYwYmJlYSIgc3RFdnQ6d2hlbj0iMjAxNi0wNi0zMFQyMDoyNDo1OSswMjowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUuNSAoTWFjaW50b3NoKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPD94cGFja2V0IGVuZD0idyI/Pv/iD0RJQ0NfUFJPRklMRQABAQAADzRhcHBsAhAAAG1udHJSR0IgWFlaIAfgAAYAEAAIADMAH2Fjc3BBUFBMAAAAAEFQUEwAAAAAAAAAAAAAAAAAAAABAAD21gABAAAAANMtYXBwbAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEWRlc2MAAAFQAAAAYmRzY20AAAG0AAAEGmNwcnQAAAXQAAAAI3d0cHQAAAX0AAAAFHJYWVoAAAYIAAAAFGdYWVoAAAYcAAAAFGJYWVoAAAYwAAAAFHJUUkMAAAZEAAAIDGFhcmcAAA5QAAAAIHZjZ3QAAA5wAAAAMG5kaW4AAA6gAAAAPmNoYWQAAA7gAAAALG1tb2QAAA8MAAAAKGJUUkMAAAZEAAAIDGdUUkMAAAZEAAAIDGFhYmcAAA5QAAAAIGFhZ2cAAA5QAAAAIGRlc2MAAAAAAAAACERpc3BsYXkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABtbHVjAAAAAAAAACIAAAAMaHJIUgAAABQAAAGoa29LUgAAAAwAAAG8bmJOTwAAABIAAAHIaWQAAAAAABIAAAHaaHVIVQAAABQAAAHsY3NDWgAAABYAAAIAZGFESwAAABwAAAIWdWtVQQAAABwAAAIyYXIAAAAAABQAAAJOaXRJVAAAABQAAAJicm9STwAAABIAAAJ2bmxOTAAAABYAAAKIaGVJTAAAABYAAAKeZXNFUwAAABIAAAJ2ZmlGSQAAABAAAAK0emhUVwAAAAwAAALEdmlWTgAAAA4AAALQc2tTSwAAABYAAALeemhDTgAAAAwAAALEcnVSVQAAACQAAAL0ZnJGUgAAABYAAAMYbXMAAAAAABIAAAMuY2FFUwAAABgAAANAdGhUSAAAAAwAAANYZXNYTAAAABIAAAJ2ZGVERQAAABAAAANkZW5VUwAAABIAAAN0cHRCUgAAABgAAAOGcGxQTAAAABIAAAOeZWxHUgAAACIAAAOwc3ZTRQAAABAAAAPSdHJUUgAAABQAAAPiamFKUAAAAA4AAAP2cHRQVAAAABYAAAQEAEwAQwBEACAAdQAgAGIAbwBqAGnO7LfsACAATABDAEQARgBhAHIAZwBlAC0ATABDAEQATABDAEQAIABXAGEAcgBuAGEAUwB6AO0AbgBlAHMAIABMAEMARABCAGEAcgBlAHYAbgD9ACAATABDAEQATABDAEQALQBmAGEAcgB2AGUAcwBrAOYAcgBtBBoEPgQ7BEwEPgRABD4EMgQ4BDkAIABMAEMARCAPAEwAQwBEACAGRQZEBkgGRgYpAEwAQwBEACAAYwBvAGwAbwByAGkATABDAEQAIABjAG8AbABvAHIASwBsAGUAdQByAGUAbgAtAEwAQwBEIA8ATABDAEQAIAXmBdEF4gXVBeAF2QBWAOQAcgBpAC0ATABDAERfaYJyACAATABDAEQATABDAEQAIABNAOAAdQBGAGEAcgBlAGIAbgDpACAATABDAEQEJgQyBDUEQgQ9BD4EOQAgBBYEGgAtBDQEOARBBD8EOwQ1BDkATABDAEQAIABjAG8AdQBsAGUAdQByAFcAYQByAG4AYQAgAEwAQwBEAEwAQwBEACAAZQBuACAAYwBvAGwAbwByAEwAQwBEACAOKg41AEYAYQByAGIALQBMAEMARABDAG8AbABvAHIAIABMAEMARABMAEMARAAgAEMAbwBsAG8AcgBpAGQAbwBLAG8AbABvAHIAIABMAEMARAOIA7MDxwPBA8kDvAO3ACADvwO4A8wDvQO3ACAATABDAEQARgDkAHIAZwAtAEwAQwBEAFIAZQBuAGsAbABpACAATABDAEQwqzDpMPwAIABMAEMARABMAEMARAAgAGEAIABDAG8AcgBlAHMAAHRleHQAAAAAQ29weXJpZ2h0IEFwcGxlIEluYy4sIDIwMTYAAFhZWiAAAAAAAADzFgABAAAAARbKWFlaIAAAAAAAAHHAAAA5igAAAWdYWVogAAAAAAAAYSMAALnmAAAT9lhZWiAAAAAAAAAj8gAADJAAAL3QY3VydgAAAAAAAAQAAAAABQAKAA8AFAAZAB4AIwAoAC0AMgA2ADsAQABFAEoATwBUAFkAXgBjAGgAbQByAHcAfACBAIYAiwCQAJUAmgCfAKMAqACtALIAtwC8AMEAxgDLANAA1QDbAOAA5QDrAPAA9gD7AQEBBwENARMBGQEfASUBKwEyATgBPgFFAUwBUgFZAWABZwFuAXUBfAGDAYsBkgGaAaEBqQGxAbkBwQHJAdEB2QHhAekB8gH6AgMCDAIUAh0CJgIvAjgCQQJLAlQCXQJnAnECegKEAo4CmAKiAqwCtgLBAssC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3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691rn/zm/wCZT8n/AIXdz9X9c9DZraeDw+7Oq/745ipzmz8buTInKvu3cOET7SfKPLTQU60mJT0GFvUSb82EKe5/PO/8r7pYWW0SxpFJb62LIGNdbLiuKUHp1nP91X2E9vfdblXmHfecrS5murbcfAQRztEujwY5MhKEnU5zq4dUV53+df8AzLs5rQ/I58TTvf8AYwXV3TuN0X/1FYmwHyQ4/wCb59xLL7p89S1H770j0WKEfz8Ov8+swbP7pvsFZ0I5EErjzku71v8AjP1Oj/jPQN53+Z7/ADBNxa/4h8tu56fXfV/At0SbXtf/AFH92YcR4/8AkG3ssm595ynrr5juh/pX0f8AHadCqz+757KWNPB9tNqan+/IRN/1dL16BrO/MD5abn1jcnyh+Q+fWS+tMz3V2RkoyD9V8dZuWaMJbgKBYDi3srl5l5jnr4+/3r/6aeU/4W6FNn7Ye2u30+g9vdjhI/gsLVD+1Yh1i6W3hvLd3f3SMO5N1bn3IanuDrSN1zeeyuWaUy70wq6Sa6rnLFr2/r71tdzc3O8bUJ7iSStzF8TE/jX1PVua9r2vbOS+bmsNut4Au13R/TjRKUgk/hA6+ml7zt64Bde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvdf//Q3+Pfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3XvfuvdaY//AApFm1fLjpSn1MfF8csXNo50r5+zOyE1D8am+3sf9Ye8Yfe8/wDIj2tf+XEf9XZf83XVT7h609s+bHpx31x+y1tf8/WvB7hfrODr3v3Xuve/de6HD4xxCb5J/HuEkqJe8Op4iw5IEm/cApIH9Rf2a7CK75sw9buH/q4vQR9wW0chc7vThtF4f2W8nX05/eePXz89e9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvdf/0d/j37r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+6910SACSQABck8AAfUk/09+690HGd7k6g2vr/ALy9q9b7d8d/J/Hd87YxOi311/f5Sn02/wAfaGXc9tt6+PuECf6aRR/hI6PrPlbmfcKfQcuX89f9928r/wDHUPQNZz53fCfbesZn5cfG2kljvrpV7q66q65bfW9BRbhqa3/rH7LJubuVoK+LzHYg+njxk/sDE9Cqz9nfdm/p9J7Z78ynz+guVX/emiC/z6BrO/zZv5dG3df8Q+VvXdRovq/gVNurdF7f6j+7O3cv5P8AkG/ssm9xeSYK6+YYD/pQ7/8AHVPQps/u1++d9Twfbi+Wv+/DDD/1dlSnQN53+ef/AC1sRrFF3XuHcrJcacF1J2pFrYfVUfcG0cDE3P0OrSf6259lcvuzyNHXRuryf6WGX/n5F6FVn90D36uqeNynBbg/78vbM/8AVuaQ/wAq9A1nf+FD/wADMTrGPwHyE3OVuFOE6+2rTK/9CDuTsTAMqn/EX/w9lkvvRyhHXRDeyf6WNB/x6RehTZ/cf95Lmnj3uyW//NS5mP8A1atpOgazv/Ck745U+v8Au18eu7Mva/j/AI7kti7d1/01/wAPzW6PHf8Aw1W9lk3vjsi18DZrpv8ATGNf8DP0KrP7hnPT0+v532mL18NLiX/j0cVf5dA3nP8AhTLSrqj238OZ5Rf0VWc70jp7D/aqCg6mqdRP+FSLf4+yuX32XhByyftaf/IIT/h6FNp9wKQ0N/7pAfKPbyf+NNeD/jvQdz/8KW+z2l1UvxV2HDBY3jn7L3DUy3/snzR7XpUAH5/b5/w9oj76X9e3l6EL/wA1WP8Az4P8HR4n3BuXgtJPca8L+otYwP2GU/4elftv/hTFklqETd/xBoZ6VntJVbb7onpaiBLj1JQZPrSsjqnA/smphB/qPamD31fUBc8tgr6rPQ/sMRr+0dFl/wDcDgKE7Z7nOJKYEtiCD/tkulI/3luj49Lf8KAvg12VVUmK3+vZPRWTqGSJ6ze22Y8/tIVEpCpHFn9i1m4sjFDrNmmrMdRQp9WZVBYC/a/eLlO+ZY7zx7SQ+brqT/eoyx/NlUDqG+a/uV+72wRy3Oymw3i3XOmCUxzUHmY7hYlJ9FSV2PAAnHVyuwexdg9q7Xx+9us96bW3/tDKqWx25dnZ3G7iwlWVCmSKLI4qpqqX7iAsBJGWEkTel1B49ybZ3tnuFul1YXUc1s3BkYMp/MEj7R5dYsb1sW9cubhPtO/7TcWW5x/FFPG8Ug9CVcA0PkaUIyCR0s/aroq697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de60tP+FH8xb5o9R0+oERfF/akwSwupn7X7iQsTa9n+2sP+C+8Xfe4/8AIo20f8uCf9Xpv83XVz7iS09qeZnpx5hmH7LOx/z9a+fuG+s2Ove/de697917owXxKiM/yr+MsKgFpvkH0xEA36SZOx9toA314JPPs55cFeYdhHrewf8AV1egT7lsE9uOf3PAbJfH9lrL19NX3nb1wB697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de6//S3+Pfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3XvfuvddEgAkkAAXJPAAH1JP9PfuvdV1/Ib+a18FvjVUV2H3r3dhd0bvoGlin2P1bDJ2JuOGqhv5aDIS4Ay7c2/XxmwMOTyFE4J+nsFb17hcpbEzxXW6rJcj/Q4v1Gr6HT2qfkzL1OXJH3cPeDn1IbraeUpbfbHoRcXZFtEQeDKJKSyKf4oo5B1Uf2Z/wpY2bSzVFN058XdzZ2nJYUua7M39itqTIBfS8+2drYXeSSFvyq5ZLf1PuOL/AN87VSy7ZsEjjyaWQJ/xlFf/AI/1kxsH3B91kRJOafcO3hfzS1tnmH5SzSQU/OE/Z0UrN/8ACkT5c1ErnbvS3xyxMBv40zOK7Mz86C/9qei7I25G7Bfz4gL82/HsOy+9/MjE+Btdiq/0hK3+CVf8HUl2n3EPbNFH13Ne+yv56HtYx+xrWU/z6i4z/hSD8x4qhWzPTvxmr6UMC8OM272niKhk/tKtTVdsZuNGP4JiYD+h91j97+Zg36u2WBX5LKD+0zN/g6cuPuI+1rIRa80b+knq8to4/YLOM/z6Nh1b/wAKV8BPUU9J3X8X8vi6W6/d5/q7flHnZ7EgP9vtHdmH27GNA5GrNnV9OPqRFt/vnCWVd12BlXzaKQN/xhwv/H+o25i+4Reojy8p+4UUknlHd27Rj85oXlP7IP29XSfGP+ZZ8NflrNR4fqjuDE0+96wAR9bb5ik2TvyScrralxuHzRiptzTRx+pzh6jIRoL6mFjaUNh555Y5jKxbduSi6P8AoUnZJ9gVsN/tC3WKXuD7B+6ftokt1zJyxK20Jxurcie3A9XeOpiBOB46xE+Q4dHw9i7qHOkjv+YU+w97TksBBtHckxKfrAjw1a5K8j1DTx/j7TXh02l0fSNv+Onoz2Vde87SnrcxD9rr18tb3gF19EPXvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Rm/i58v+/fh3v2m370bvmv29M09O24dq1ck1fsfetDA12xe7tsPPHRZSneIsiTr4q2k1l6aeGSzg92DmXeOWrxbzabtkNe5DmNx6OvA/bhhxUg56AHuH7Ycl+6OzSbNzfs6TpQ+HMoC3EDH8cMtCyGtCVzG9AJEdcdb6P8v753ddfPXpaLsTatOm2t8bcnpcH2n1zNWrWV2ztxzQNNTzU05SGXI7W3BFDJNjK0xoJljlhcLPTzomXnJ3N1lzftYvbdfDukIWWOtSjfL1RuKtTOQcggca/er2d3z2a5rbY9xc3G0TgyWl0F0rPEDQgjIWaMkLLHU0JVhVHQk9fsW9Q91737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3XvfuvdaUP/CjeUyfOPrZDp/yf4t7FiGn62btPumf18n1Xm/w4t7xa97TXmyxHpt8f/V2frrJ9xVdPtDvx9eYrg/8AZpYD/J1QN7h7rNDr3v3Xuve/de6Mn8M4hP8AMD4pQMpYTfJPouIqt9TCTtDayFVtzcg8W9nnLArzLy8P+X6D/q6nQC91G0e1/uQ4ORsO4H9lpN19MT3nV1wI697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de6//9Pf49+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691xd0jRpJGVERWd3dgqIigszMzEBVUC5J4A9+JAFTw62AWIVRUnopWc+fXwe25rGW+Xfxuikiv5Kak7m2BlaxCPqHocVnq2sVv8Clz7DkvOHKkFfE5ksa+gnjJ/YGJ6kuz9mPd2+0/Te2W/FTwLWNyin/AGzxqv8APoGs7/Ny/lx7d1/xD5Vb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dG3dlbO23QTZXcW7N25vG7c21gMXTAGoyWazuYqaPF4qggBu808scaj6ke0/SvpQI6yKroyujqHR0IZXVgCrKwJDKwNwRwR7917rl7917r3v3Xuve/de6B3rzvbrztHsDvHrPaFdk6vdPx43jtvYnZcNZhshjqGh3FuvYG2eysTT4jI1cUdNnKc7Y3ZRtLLTlkinLxk3Xn1ePXuhi9+691737r3QDdmd94HrLt743dP5LB5fJZj5Kbt7D2jtzK0MlGmN29VdddT7t7ayNXm0qJkqpaevxW0ZaWAQK7ComUtZAT71XgOvdDz7317r3v3Xuve/de64u6xqzuyoiKXd3IVUVQSzMxICqoFyTwB7917pj29urbG7aOTIbU3HgdzUEVRJSy123sxj81RxVUJtLTSVONqKmFKiI/qQsGX8j37r3T97917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de6//0a4vkTN9z8ge9KjWJPP3H2dNrAAD+XeubfWAAAA2q/0HvMHahTbNuHpBH/xwdc+98Oret3avG6l/6uN0Dntf0V9e9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+6912qszBVBZmIVVUEszE2AAHJJPv3W+PW1d1n8Dcl8P/AOS98v8Aszs3CSY3vDv/AK0wOYzmKroWhyexthQbkwZ2bs6sinXzUOZnOTlyeVitG6TTw0syeSiv7hm75kTfeftjtLSSu3WszAEcHfSdbD1GAqn0BYYbrImw5Pk5Y9rOZr+/i07te26swPGOPUuhD6Nku4xkhSKp1qoe5m6x1697917r3v3Xuve/de63BP8AhMzEB1D8pp/VeTsjr+Ij+zaHbGacW4vqvOb/AOw9wZ7tn/HtmH/Cn/48Osm/YQf7rOYW/wCHx/8AHG/z9bOnuIup9697917r3v3Xuve/de697917r3v3Xuve/de6pe/mb/yfetfm9T1/afWtRiOrvkvSUKxjcslNJHtLs2Kig8VDiexaaghlqYclDFGkNNnKeKWrggCxTxVUMcCQD7lHnm75eK2d2Gm2kn4fxR14lK+XmUNATkFSTWLOfvbKw5sV9xsGW334D4qdktBg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OqKoKTVJC3mHqYA691bN7t17otnRvx+l6c7L+WXYMm649wp8m+9cF3LBiUwrYttmRYboLpbpQ7elrWyuQGfkqJupXyIqhFRhVrhB4iYjLJr1690X/e/wg7G232Xv3tb4afKLPfFXK9v56o3h3D1zlesdtd6dE727Aq4KSlyHaGO633Dmto5XYPZG4KWkQZmuweboqTOTRRVNdST1Yknm9T0PXuhH6A+IcnV3YWb717f7o7A+THyHzmByGzYezN/UuB2zgdhbByWVx+YrNg9Q9W7No8bszrvbuVrsJj5spNHHV5fMVFBBJW104iiSPwHn59e6FL42fHTYXxY6uXqTrer3JW7ZXffavYf3O68hQ5PMtne4OzN2drboiaqx2Lw9J/DqXce8aqKijEAeKjSJJHlkV5X8BTr3Sv311B1/2TubqPeG8sJJldwdGb8r+y+sq5Mplseu395ZPr7e/V1ZlJaXHV1JSZmOXZXYmWpRT1qVFOrVAmCCaKN0317qT2n1N1j3hsXPdY9w7C2p2X19uem+0zu0N6YSg3BgshGrCSCWShyEM0cVbRTqstNUx6KilnRZYnSRVYe49e6LD1T/AC3fhN0vvPA9ibH6Iw8299oyzz7J3Nv7dO/+3cpsCacxFpOu5u2t2b3HXzRiILF/BRQ+BGdY9KySBtUHp17o8HvfXuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de6//X22v5aP8Ax43yz/8AGj3z3/8Agi94e6r5/b17qx73br3VUuwv+313yV/8Zw/Ff/4IT5Ne6/i/Lr3Uv+W/FQd45z5QfOLdMVBuDfvbHyP7x6W623FU0rNkNkfGr41dnbi6Z2D13gFrIY5tv4zNbk2Xltz5WKBYmyOTzHlqtbQQLDsZqevdIb+ev0js7tf+XJ3ruvMQx47e3SmA/wBInXe8qUfb5zAVP3+Owm8sDSV8Tw1H8E7F2Pka7CZKjZzT1UNWjPG8kMJTTcD17pefMD/t45/KE/8AD8+a3/wJG6vfjxXr3Vpnu3Xute7Bdm7o6c/kD/KPsnZVRU0O7dsbY/mPTbdydFO1NWYXL5H5TfJHD0WepJ0imaOqwM2RFZHYC7wAak/WtPwnr3Ro+jO9Pkd1Z0x1L1D01/Ki+RmK2T1l1/s/r/b0e9O7PhLsShgxG3MBjcRiK2GHbvyG3rUVVJUU9N5quZKfzhyWWKZ2I97BOO3r3Tj011/8uN9/zDaL5XdpfHza/wAdOuofiDuroHdGKTu/b3am6997nh7e2f2D1vXT4/aW3Mdisfjtq0NTuZIZ5aueVf4jIoWMSWbea1p17q133vr3VT24eo+qe1v5uW/ou0eseveyYsD/AC5ujajBxb+2XtveMeGnr/kv8joa6fFJuLG5FcdNWQwIkrQhGkVFDEgD3X8X5de6PlWfGX43ZHDzbdyHx86Qr9v1FEMbPgqzqjYdVh58cIxCMfNjJ8A9FJRCJQviZDHpFrW97oPTr3VJ+5+h87u/42fztP5dPQj5PNdd9cbVocZ8adiPLlcmuwdz9vfHTE9sZX4/7Uy+QNTGdpUO+WgnxGNhLrhKfcQo1ZYo4Y4tUwwHXuro/ix3Vsz5F/HLpbu7YFZHV7W7G6723nqONZ456jEV5oI6LP7YyhjCiHPbS3DSVWLyMBCvT19HNE6qyECwz17onfyryNL3f83Pgl8atp1f8QynR3ZeZ+bveEtBBJUjYextl9YdmdWdS0ObrNAosfk+0OzeydNBStL91Pj8JkJxH44g5qckDr3Tf09V4vrT+bZ809qbsyEeLzvyd+OfxK7V6fp6z7emg3hg+j/9MnWvaePwc71TPk81svJZ3D1VdTJGs0FFlqeYr4jrPvxHr3Qbfz0O+dsde/AbvHqWiqqXN9t9y7Er8btXYlHVUr5pNk4Svoc52b2JlqMy/cYrZmztnYusDZCVBTy5iegxyN91XQI3mOD17pf/AM3r/mR3xn/8aPfy9v8A4KLr/wB+by+3r3VkPZ3XO0+4Ot+wOpt+47+L7H7O2Vujr/eGK8rQHI7Y3jhK7b2doknT1wSVOMyEqLIvqRiGHIHu3Xuqv+rO0vnD8NtkbZ+OPZfxE7e+ZlF15T0XX3UHyQ+Pe6OiaCn7H2HhYaPG7GqO7Nm9pdodZZfq/sDFbdWKmztbBHk8HWVVK9VBU3m8K1yMU690CW6dl937j/mTfyz+9vkhDiNqdl7j3V8qcf158f8AZ+cfd2A6B6WxPxY39HueXcO86Wkosdvfsveu99y7e/vNlKaGLEUbRYrF437iOmmyWS9moJ690e35SfHXtis7d62+YvxWqNnL8j+qdnbj6w3HsDsPI5DBdffIvorcuTpNx5Hqfc268Rjc1ldjbm21uvHpmtp52Kjq6ehyjzwV1NNRVkxh2R5jj17oNN0b1/mS/InDVfVG3vjjhfg5jtyR1GE318iN5987D7a3ltPbdUr0WZrvj/sLqmDJx5bflXR1BbC5bc1fgabEzL9zPj6l40pn1k+VOvdHJ2h1X0X8bvjliOnxTbX2x8ferutTs7JRdhZDGS7YTYtDipKLO1fYGX3O6YvJQ5qmlnnzNVkGKVstRNJOT5HvvgOvdEuwH8uDLbPx2L2h8fPn18wOlfjS9PLLhujti5/pjduE2zt+uFTUY3bvUfa/YnUm+O19ibHpIK1Vo6SDNVhpKZI0opqaNIwuqehx17oOPiNsHqis+em7Mx8XsRSH43/FP4u5/wCNWW7Ax1bkNyYzsD5Jdyd14HuLtmiHYuUyOWr+z987NoNgY2r3hmqiqra2XP7laOsqZK2OoWPwpXHDr3R7dh/GSl2P8t/kP8q03jUZKr796w6C61l2S2DjpKfa0XRlV2nUx5ePPjK1MuZk3Oey7GA0dKKP7K+ubzftbpknr3QhfIjpPbXyU6F7l+Pe8snnMNtLu3rLe3Vm5Mvtmagp9xYzCb629kNuZKvwc+Vx+WxsWVpKTIs8DVFLUQiRRrjZbg7Ocde6XmW2XtXce0KzYO68Bht37OymDO283tvdeKx24MHuDCSUgoanG53D5KlnxeVoq2mBWaGaFoZASCtjb37r3RIdo/yq/wCX9snPYbP4f42bXrm21lafObU23vDcnYHYPXez8vRq4oshszq3fu7ty9a7PqqFnDwNjMTS+GVI5E0vHGy60j0691YN7317r3v3XumHa+1dsbI2/idpbL25gdobVwNImPwW2dr4fH4Db+FoIixjosThsTT0mOx1JGWJWOGNEBJsPfuvdP3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r/9Dba/lo/wDHjfLP/wAaPfPf/wCCL3h7qvn9vXurHvduvdVS7C/7fXfJX/xnD8V//ghPk17r+L8uvdI3aO8d0fyy+yu+9o9l9Y9r75+G3cPb2/fkd1F3L0r1lvnuWq6W3R2/nzunuHp/uDr/AK2xG5d7bd27D2LlK7O7dz1FiqjFS0eVlpaqWKpp/wBz3w/Z17oqX81DvLsH5l/AT5EydXdf9r9PfFzZ+w6bfG+O1u7Ng7m6Z3l3dnsRmsFleuOreoOtd+0GE7Bg2lXbvOPr8/uLL43HU9bT00eIxkVc9fWVOO01SDTh17qwv+YPtvd20N3/AA8+ZWz9hbm7Qg+Hfc28NwdobI2Tia7cW+J+jO5Oot59R9lbs2VtjHVC5Ddm4uvJc7jM4cVSwVNdXY+hqo6ZHm0RybPkevdRMp/NK6A7Hwk22/hlX5P5Yd9Z+M4nZfW+w9ob5jxG3tw5CKeHHZrvbdeV2/h8P0v1/gq1RJmarMz0uQSnjkio6WqrNFO26+nHr3SS/l5/GfK5b+VnSfFX5JYbcz1O9E+YvWHaFNurbVZs7cefwfYXyG74oKzcrbfzFMKjEf3v27n0y1AxR4zBWQzRM8bI7aA7aHr3UPpz5I/IL4h7D2d8bvlD8Xvkv3BuPq7A4rYOx/kV8ZesKjuzrzvfaO26c4PZ269xYzbWUk3V072JksLj6dc/j9wUsOKgyXlnp8nLRyxuvqkYI690b3449i/J3tzcG9d+9s9N0Hx46aq6DCY/p3q7eldj8/8AInJ1EU+Rq852B2pU7O3NmevOvKDL0NVR01BtammzWTp2p5Z62uppH+xGxXr3Rtfe+vdVp90dEfM2i+atd8nPjJXfGKXbu5vi/sPofcuL73yHaseaostsjtXtPsGPI4PGdf4J6Gox2RpewYYjNUZJJY5KZ1FOwZZBqhrUde6jS9UfzX+waZcPvb5dfEro3EVNJAmUzPx0+Lu+909hLLIG++h27ne9O7t0bMwsiKdENXU7byRvZ/t0Isfd3r17o43x9+PvX/xr6/8A9H/X/wDeDIrkdwZzeu9N6b1zlRunsLsvsLdNQlZuvsTsTddYkdTuLd+4qmNDPOUighgiipqaKCkgggj3w690Wjd/8uXrGv31vDf/AE/3P8nfinkeyc5Pujs3b3xp7Zg2ZsHf26q9ZEzW7cp19unbG+dn4Dd+40ZDksvgaPEZOtmiWeWdqgyTPqnz690YT48/GHqH4w7dz2D6uw+ZbKbzzjbr7H7B3vuncPYXafaW8JKeOlm3X2P2NvDI5fdW7MyYIxHD9xUGmoof2aWKCALGPAU691k+Qfxb6B+VG3cJtjvvrTD7/oNr5n+8W0q+arzW391bNz5p3o5M1srfG08ngd6bNys9HI0MtRjMhSSywko7MvHvxAPHr3SD62+BXw+6o2/vjbW1eg9kV9B2dhk252TW9hJle3dzdg7bin+6p9tb33l2zk97bv3Vtukqf3IMfXV09HA4DRxqQD79QenXujLbn2btDe1JjaDee1dt7uocPuDA7sxFFufB4zP0mK3VtXJ0+a2xubG0+VpauGh3BtzM0kVXQVsQWpo6mJJYnR1DDfXunnIQ1VRQVtPQ1n8Orp6Spho8h9vHV/Y1UsLpT1n2kxWGq+1mYP43IV9NjwffuvdVuUGF/m67Hgj2zTby+BXf9BSeWlo+0d+Yju/oTe9XSh1WkyO6evthUHbGycvmkiYtUDF1+Bo53QCKGmDXTXd8uvdCh8fvizvrbvauc+Tvye7MwvdHyUzO1anr3a9Vs/atbsbqLorqzI5LG57M9c9PbPyee3Pmmk3RuHFUtVntxZevqsvmjQUUVqWmpUp/fgPM8evdHe97691737r3TLuPbW3d44HL7V3dgMLurbG4KCoxWe25uPFUOcwObxdZGYqvG5fD5OCqx+SoKqJiskM0bxupswI9+691Xz/w0b/L0ikkjx3x8XAYGZmM2wdqdq927Q6nmRpJJnppen9r9k4jq2WieWUsYGw5hJtdfSttaR6de6PjsHr7YnVWzsB171ls3a/X2w9q0X8O21s3ZmCxm2tsYGh80tS1LicHh6ajx1BDJUzySuI411yyM7XZmJ317pX+/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de697917r3v3Xuve/de6/9G03rP+G/3y+Zv8e/4eN/gH/Dgny183+yPf3s/0J+H/AGYPcP3X8F/0bf8AGTP419/r/vD4P8o8nl+3/wAj8funrx49e6H7oX/ZbP8AZlOlf4Z/w57/AH9/0xJ/Cf8AZzP+HY/7tfef3a3D4Pvv73f842/xfRf7T+Nf5B4vL5vVp9+xjj/Pr3VnG1f7sf8ADmPc/h/0M/3x/wBkw6G/iH8M/wBL3+nz+7n+mLvL+F/3t+//AOME/wCjD+I/dfwf+Gf7+r+I/e/xD/If4f7t5/l17o+vvfXuquv5tvk/2WzYfn/i38B/2ab4r/3h/iH2v+hL7f8A07bF/hP+zM/w7/jJH+hX+8X2fm/ux/lX8a/h38S/3B/xP3puHXurRfe+vde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691737r3Xvfuvde9+691//9k=";
            break;
            case "question":
                src += "PHN2ZyB3aWR0aD0iMWVtIiBoZWlnaHQ9IjFlbSIgdmlld0JveD0iMCAwIDE2IDE2IiBjbGFzcz0iYmkgYmktcXVlc3Rpb24tY2lyY2xlIiBmaWxsPSJjdXJyZW50Q29sb3IiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+DQogIDxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTggMTVBNyA3IDAgMSAwIDggMWE3IDcgMCAwIDAgMCAxNHptMCAxQTggOCAwIDEgMCA4IDBhOCA4IDAgMCAwIDAgMTZ6Ii8+DQogIDxwYXRoIGQ9Ik01LjI1NSA1Ljc4NmEuMjM3LjIzNyAwIDAgMCAuMjQxLjI0N2guODI1Yy4xMzggMCAuMjQ4LS4xMTMuMjY2LS4yNS4wOS0uNjU2LjU0LTEuMTM0IDEuMzQyLTEuMTM0LjY4NiAwIDEuMzE0LjM0MyAxLjMxNCAxLjE2OCAwIC42MzUtLjM3NC45MjctLjk2NSAxLjM3MS0uNjczLjQ4OS0xLjIwNiAxLjA2LTEuMTY4IDEuOTg3bC4wMDMuMjE3YS4yNS4yNSAwIDAgMCAuMjUuMjQ2aC44MTFhLjI1LjI1IDAgMCAwIC4yNS0uMjV2LS4xMDVjMC0uNzE4LjI3My0uOTI3IDEuMDEtMS40ODYuNjA5LS40NjMgMS4yNDQtLjk3NyAxLjI0NC0yLjA1NiAwLTEuNTExLTEuMjc2LTIuMjQxLTIuNjczLTIuMjQxLTEuMjY3IDAtMi42NTUuNTktMi43NSAyLjI4NnptMS41NTcgNS43NjNjMCAuNTMzLjQyNS45MjcgMS4wMS45MjcuNjA5IDAgMS4wMjgtLjM5NCAxLjAyOC0uOTI3IDAtLjU1Mi0uNDItLjk0LTEuMDI5LS45NC0uNTg0IDAtMS4wMDkuMzg4LTEuMDA5Ljk0eiIvPg0KPC9zdmc+";
            break;
                default:
                src += "question.svg";
                break;    
        }
        img.setAttribute("src", src);
        img.setAttribute("width", "12");
        img.setAttribute("heigth", "12");
        return img;
    }
    static makeButton(callBack, icon, txt){
        var newId = undefined;
        if (callBack != undefined){
            newId = MH.getNewId();
            this.addNewEvent(newId, callBack.type, callBack.func);
        }
        var button = MH.makeElt("button", newId, "btn");
        if (icon != undefined){
            button.innerHTML = MH.makeIcon(icon).outerHTML;
        }
        if (txt != undefined){
            button.innerHTML += txt;
        }
        return button;
    }

    static makeButtonCancel(callBack){
        var but = this.makeButton(callBack);
        but.classList.add("btn-light");
        but.innerHTML = "Annuler";
        return but;
    }
    static makeButtonValid(callBack){
        var but = this.makeButton(callBack);
        but.classList.add("btn-primary");
        but.innerHTML = "Valider";
        return but;
    }
    

    static addNewEvent(id, type, func){
        this.listEvents.push({
            "id": id,
            "type": type,
            "function": func
        });
    }
    static loadEvents(){
        var elt;
        for (var i = 0; i < this.listEvents.length; i++){
            elt = document.getElementById(this.listEvents[i]["id"]);
            elt.removeEventListener(
                this.listEvents[i]["type"],
                window);
            elt.addEventListener(
                this.listEvents[i]["type"], 
                this.listEvents[i]["function"]);
        }
        this.listEvents = [];
        this.idCompt = 0;
    }

    static makeDropDown = function(titre, interfaces){
        var div = MH.makeElt("div");
        var a = MH.makeElt("a", "navbarDropdownMenuLink", " btn-light nav-link dropdown-toggle");
        a.innerHTML = titre;
        a.setAttribute("data-toggle", "dropdown");
        a.setAttribute("aria-haspopup", "true");
        a.setAttribute("aria-expanded", "false");
        a.setAttribute("href", "#")
    
        var dropDownMenu = MH.makeElt("div", undefined, "dropdown-menu");
        dropDownMenu.style = "z-index:1030;";
        dropDownMenu.setAttribute("aria-labelledby", "navbarDropdownMenuLink");
    
        for (var i = 0; i < interfaces.length; i++){
            interfaces[i].classList.add("dropdown-item");
            dropDownMenu.appendChild(interfaces[i]);
        }
    
        div.appendChild(a);
        div.appendChild(dropDownMenu);
        return div;
    }

}


/********GENERATION DU TOURNOI */
var sac, allMatchs, joueurAttente;
function alea(max) {
    return Math.floor(Math.random() * Math.floor(max));
}
//on met les joueurs dans le sac de façon aléatoire
function mettreJoueursDansSac() {
    sac = [];
    for (var i = 0; i < bd.joueurs.length; i++){
        if (bd.joueurs[i].selected){
            bd.joueurs[i].index = i;
            sac.splice(alea(sac.length), 0, bd.joueurs[i]);
        }
    }
}

//on créé tous les matchs possibles
function populateAllMatchs(){
    allMatchs = [];
    var match, equipeA, equipeB, ptsEquipeA, ptsEquipeB;        
    var tournoiSimple = bd.tournoi.typeTournoi == typeTournoiListe.SIMPLE;

    if (tournoiSimple){
        for (var i = 0; i < sac.length; i++){
            for (var j = 0; j < sac.length; j++){
                equipeA = [sac[i]];
                equipeB = [sac[j]];
                if (matchCoherent(equipeA, equipeB)) {
                    allMatchs.push(newMatch(equipeA, equipeB));
                }
            }
        }
    }else{

        //on génére tous les binomes possible
        var binomes = [];
        for (var i = 0; i < sac.length; i++){
            for (var j = 0; j < sac.length; j++){
                if (j > i) {
                    binomes.push([sac[i], sac[j]]);
                }
            }
        }
        //on génére tous les matchs possibles
        for (var i = 0; i < binomes.length; i++){
            for (var j = 0; j < binomes.length; j++){
                equipeA = binomes[i];
                equipeB = binomes[j];
                if (matchCoherent(equipeA, equipeB)) {
                    allMatchs.push(newMatch(equipeA, equipeB));
                }
            }
        }
    }
    return allMatchs;
}

function newMatch(equipeA, equipeB){
    var ptsEquipeA = 0;
    for (var m = 0; m < equipeA.length; m++){
        ptsEquipeA += equipeA[m].getPointsHandicap();
    }
    var ptsEquipeB = 0;
    for (var m = 0; m < equipeB.length; m++){
        ptsEquipeB += equipeB[m].getPointsHandicap();
    }

    //équilibrage des points
    var departNegatif = bd.tournoi.departMatchNegatif;
    if (ptsEquipeA > ptsEquipeB){
        ptsEquipeA -= ptsEquipeB;
        ptsEquipeB = 0;
        if ((departNegatif && ptsEquipeA > 0) ||
        (!departNegatif && ptsEquipeA < 0)){
            ptsEquipeB = ptsEquipeA * (-1);
            ptsEquipeA = 0;
        }
    }else {
        ptsEquipeB -= ptsEquipeA;
        ptsEquipeA = 0;
        if ((departNegatif && ptsEquipeB > 0) ||
        (!departNegatif && ptsEquipeB < 0)){
            ptsEquipeA = ptsEquipeB * (-1);
            ptsEquipeB = 0;
        }
    }
    
    var max = Math.max(ptsEquipeA, ptsEquipeB);
    if (max > 15){
        ptsEquipeA -= (max - 15);
        ptsEquipeB -= (max - 15);
    }

    return {
        "equipeA": equipeA, 
        "equipeB": equipeB, 
        "pointContrainte": 0, 
        "ptsEquipeA": ptsEquipeA, 
        "ptsEquipeB": ptsEquipeB, 
        "ptsEquipeADepart": ptsEquipeA, 
        "ptsEquipeBDepart": ptsEquipeB
    }; 
}

function matchCoherent(equipeA, equipeB){
    for (var i = 0; i < equipeA.length; i++){
        for (var j = 0; j < equipeB.length; j++){
            if (equipeA[i] == equipeB[j]) return false;
        }
    }
    return true;
}

function testContraintes(match){
    var facteur = 1;
    for (var j = bd.tournoi.contraintes.length - 1; j >= 0; j--){
        if (bd.tournoi.contraintes[j].actif && !bd.tournoi.contraintes[j].disabled){
            facteur *= 10;
            if (bd.tournoi.contraintes[j].name == "ISOSEXE"){
                var nbHommeEquipeA = 0;
                var nbHommeEquipeB = 0;
                for (var k = 0; k < match["equipeA"].length; k++){
                    if (match["equipeA"][k].genre.value == bd.tournoi.genreListe.HOMME.value)
                    nbHommeEquipeA++;
                }
                for (var k = 0; k < match["equipeB"].length; k++){
                    if (match["equipeB"][k].genre.value == bd.tournoi.genreListe.HOMME.value)
                    nbHommeEquipeB++;
                }
                if (nbHommeEquipeA != nbHommeEquipeB){
                    match.pointContrainte += facteur; 
                }
            } else if (bd.tournoi.contraintes[j].name == "LIMITPOINT"){
                if (Math.abs(match["ptsEquipeA"] - match["ptsEquipeB"]) > bd.tournoi.limitPoint){
                    match.pointContrainte += facteur; 
                }
            } else if (bd.tournoi.contraintes[j].name == "ADVERSAIRE"){
                var j1, j2;
                for (var k = 0; k < match["equipeA"].length; k++){
                    j1 = match["equipeA"][k];
                    for (var m = 0; m < match["equipeB"].length; m++){
                        j2 = match["equipeB"][m];
                        if (j1.adversaires.includes(j2)) 
                            match.pointContrainte += facteur; 
                        if (j2.adversaires.includes(j1)) 
                            match.pointContrainte += facteur; 
                    }
                }
            }  else if (bd.tournoi.contraintes[j].name == "COEQUIPIER"){
                var j1, j2;
                for (var k = 0; k < match["equipeA"].length; k++){
                    j1 = match["equipeA"][k];
                    for (var m = 0; m < match["equipeA"].length; m++){
                        j2 = match["equipeA"][m];
                        if (j1 != j2 && 
                            (j1.coequipiers.includes(j2)) || j2.coequipiers.includes(j1))
                            match.pointContrainte += facteur; 
                    }
                }
                for (var k = 0; k < match["equipeB"].length; k++){
                    j1 = match["equipeB"][k];
                    for (var m = 0; m < match["equipeB"].length; m++){
                        j2 = match["equipeB"][m];
                        if (j1 != j2 && 
                            (j1.coequipiers.includes(j2)) || j2.coequipiers.includes(j1))
                            match.pointContrainte += facteur; 
                    }
                }
            } else if (bd.tournoi.contraintes[j].name == "ATTENTE"){
                var j;
                for (var m = 0; m < match["equipeA"].length; m++){
                    j = match["equipeA"][m];
                    if (joueurAttente.filter(joueur => joueur.name == j.name).length > 0){
                        match.pointContrainte -= (facteur * joueurAttente[0]["nb"]); 
                    }
                }
                for (var m = 0; m < match["equipeB"].length; m++){
                    j = match["equipeB"][m];
                    if (joueurAttente.filter(joueur => joueur.name == j.name).length > 0){
                        match.pointContrainte -= (facteur * joueurAttente[0]["nb"]); 
                    }
                }
            }
        }
    }
}

   // A  B  C  D  E
// A  x  1  1  1  1 
// B  x  x  1  1  1
// C  x  x  x  1  1 
// D  x  x  x  x  1
// E  x  x  x  x  x   

function genereTournoi(){

    selecteurMatch = -1;
    bd.tournoi.tours = [];
    joueurAttente = [];

    //init
    for (var i = 0; i < bd.joueurs.length; i++){
        bd.joueurs[i].adversaires = [];
        bd.joueurs[i].coequipiers = [];
        bd.joueurs[i].points = 0;
    }

    var nbMatch;
    for (var i = 0; i < bd.tournoi.nbTour; i++){
        mettreJoueursDansSac(); //on met tous les joueurs selectionné dans un sac et on mélange
        populateAllMatchs(); //on générre tous les matchs possibles à partir des joueurs dans sac

        //nombre de mathc par tour
        nbMatch = Math.min(
            Math.floor(sac.length / (typeTournoiListe.SIMPLE ? 2 : 4)), 
            allMatchs.length,
            bd.tournoi.nbTerrain
        );

        //on teste tous les matchs en les priorisant
        for (var j = 0; j < allMatchs.length; j++){
            testContraintes(allMatchs[j]);
        }
        //on tri la liste
        allMatchs.sort((m1, m2) => m1.pointContrainte - m2.pointContrainte);
        var matchs = [];
        var currentMatch;
        for (var j = 0; j < nbMatch; j++){
            if (allMatchs.length == 0) break; //s'il n'y a plus de match dispo on sort
            currentMatch = allMatchs[0];
            matchs.push(currentMatch);
            //attribution adversaires
            for (var k = 0; k < currentMatch["equipeA"].length; k++){
                j1 = currentMatch["equipeA"][k];
                for (var m = 0; m < currentMatch["equipeB"].length; m++){
                    j2 = currentMatch["equipeB"][m];
                    if (!j1.adversaires.includes(j2)) j1.adversaires.push(j2); 
                    if (!j2.adversaires.includes(j1)) j2.adversaires.push(j1); 
                }
            }
            //et coequipiers equipe A
            var j1, j2;
            for (var k = 0; k < currentMatch["equipeA"].length; k++){
                j1 = currentMatch["equipeA"][k];
                for (var m = 0; m < currentMatch["equipeA"].length; m++){
                    j2 = currentMatch["equipeA"][m];
                    if (j1 != j2){
                        if (!j1.coequipiers.includes(j2)) j1.coequipiers.push(j2);
                        if (!j2.coequipiers.includes(j1)) j2.coequipiers.push(j1);
                    }
                }
            }
            //et coequipiers equipe B
            var j1, j2;
            for (var k = 0; k < currentMatch["equipeB"].length; k++){
                j1 = currentMatch["equipeB"][k];
                for (var m = 0; m < currentMatch["equipeB"].length; m++){
                    j2 = currentMatch["equipeB"][m];
                    if (j1 != j2){
                        if (!j1.coequipiers.includes(j2)) j1.coequipiers.push(j2);
                        if (!j2.coequipiers.includes(j1)) j2.coequipiers.push(j1);
                    }
                }
            }
            //on supprime tous les match ayant des joueurs déjà affecté sur ce tour
            allMatchs = allMatchs.filter(match => 
                match.equipeA.filter(joueur => currentMatch.equipeA.includes(joueur)).length == 0 && 
                match.equipeB.filter(joueur => currentMatch.equipeB.includes(joueur)).length == 0 &&
                match.equipeA.filter(joueur => currentMatch.equipeB.includes(joueur)).length == 0 &&
                match.equipeB.filter(joueur => currentMatch.equipeA.includes(joueur)).length == 0
            );

            //on supprime du sac les joueurs affectés a currentMatch
            var currentIndexOf;
            for (var k = 0; k < currentMatch.equipeA.length; k++){
                currentIndexOf = sac.indexOf(currentMatch.equipeA[k]);
                if (currentIndexOf != -1) sac.splice(currentIndexOf, 1);
            }
            for (var k = 0; k < currentMatch.equipeB.length; k++){
                currentIndexOf = sac.indexOf(currentMatch.equipeB[k]);
                if (currentIndexOf != -1) sac.splice(currentIndexOf, 1);
            }

        }

         //on ajoute dans joueur attente les joueurs restant dans le sac
         var flag;
         for (var k = 0; k < sac.length; k++){
             flag = false;
             for (var m = 0; m < joueurAttente.length; m++) {
                 if (joueurAttente[m].name == sac[k].name){
                     joueurAttente[m]["nb"]++;
                     flag = true;
                 }
             }
             if (!flag) joueurAttente.push({"name": sac[k].name, "nb": 1});
         }

        bd.tournoi.tours.push({"matchs": matchs, "joueurAttente": sac});
    }

}


