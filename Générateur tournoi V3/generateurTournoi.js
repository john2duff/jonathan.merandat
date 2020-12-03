
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
        var name = "Tournoi - " + new Date().getDate();
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
                datas["joueurs"][i].selected 
                ));
        }
        this.tournoi = new Tournoi(
            datas["tournoi"].typeTournoi,
            datas["tournoi"].nbTour, 
            datas["tournoi"].nbTerrain,
            datas["tournoi"].departMatchNegatif,
            datas["tournoi"].niveauListe,
            datas["tournoi"].genreListe,
            datas["tournoi"].contraintes,
            datas["tournoi"].tours,
            datas["tournoi"].currentTour,
            datas["tournoi"].limitPoint,
        );
    }

    addJoueur(joueur){
        this.joueurs.push(joueur);
        this.save();
    }

    updateJoueur(index, attributes){
        if (this.joueurs[index] != undefined){
           for (var att in attributes){
               if (this.joueurs[index][att] != undefined){
                    this.joueurs[index][att] = attributes[att];
               }
           } 
        }
        this.save();
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
        this.save();
    }
}

//Listes
var typeTournoiListe = {
    "SIMPLE": "Simple",
    "DOUBLE": "Double"
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
        "desc": "On ne permet que des match où il y a autant d'homme que de femme dans chaque équipe.",
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
    constructor(pName, pGenre, pNiveau, pSelected){
        this.name = pName == undefined ? "Nouveau joueur " + (bd.joueurs.length + 1) : pName;
        this.genre = pGenre != undefined ? pGenre : bd.tournoi.genreListe.HOMME;
        this.niveau = pNiveau != undefined ? pNiveau : bd.tournoi.niveauListe.P12;
        this.selected = pSelected != undefined ? pSelected : false;
        this.adversaires = [];
        this.coequipiers = [];
    }
    name = null;
    genre = null;
    niveau = null;
    selected = false;
    adversaires = null;
    coequipiers = null;

    getPointsHandicap(){
        return this.genre.handicap + this.niveau.handicap;
    }

    toJson(){
        return {
            "name": this.name,
            "genre": this.genre,
            "niveau": this.niveau,
            "selected": this.selected,
        }
    }
}

class Tournoi{
    constructor(pTypeTournoi, pNbTour, pNbTerrain, pDepartMatchNegatif, pNiveauListe, pGenreListe, pContraintes, pTours, pCurrentTour, pLimitPoint){
        this.typeTournoi = pTypeTournoi != undefined ? pTypeTournoi : typeTournoiListe.SIMPLE;
        this.nbTour = pNbTour != undefined ? pNbTour : 5;
        this.nbTerrain = pNbTerrain != undefined ? pNbTerrain : 5;
        this.departMatchNegatif = pDepartMatchNegatif != undefined ? pDepartMatchNegatif : false;
        this.niveauListe = pNiveauListe != undefined ? pNiveauListe : niveauListe;
        this.genreListe = pGenreListe != undefined ? pGenreListe : genreListe;
        this.contraintes = pContraintes != undefined ? pContraintes : contrainteListe;
        this.tours = pTours != undefined ? pTours : [];
        this.currentTour = pCurrentTour != undefined ? pCurrentTour : -1;
        this.limitPoint = pLimitPoint != undefined ? pLimitPoint : 10;
    }
    typeTournoi = null;
    nbTour = null;
    nbTerrain = null;
    departMatchNegatif = null;
    niveauListe = null;
    genreListe = null;
    contraintes = null;
    currentTour = null;
    limitPoint = null;

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
                        currentMatch["equipeA"][k]["niveau"])
                    equipeA.push(currentJoueur);
                }
                equipeB = [];
                for (var k = 0; k < currentMatch["equipeB"].length; k++){
                    currentJoueur = new Joueur(
                        currentMatch["equipeB"][k]["name"], 
                        currentMatch["equipeB"][k]["genre"], 
                        currentMatch["equipeB"][k]["niveau"])
                    equipeB.push(currentJoueur);
                }
                matchs.push({"equipeA": equipeA, "equipeB": equipeB, "ptsEquipeA": currentMatch["ptsEquipeA"], "ptsEquipeB": currentMatch["ptsEquipeB"]  })
            }
            var joueurAttente = [];
            for (var j = 0; j < this.tours[i]["joueurAttente"].length; j++){
                joueurAttente.push(new Joueur(
                    this.tours[i]["joueurAttente"][j]["name"], 
                    this.tours[i]["joueurAttente"][j]["genre"], 
                    this.tours[i]["joueurAttente"][j]["niveau"]
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
            "currentTour": this.currentTour
        };
    }
}

var DB_NAME = "tournoiBad";
var bd = new GlobalDataBase(DB_NAME);

//Pages
var pages = {
    "ACCUEIL": "Accueil", 
    "SELECTION_JOUEUR": "Sélection des joueurs",
    "MODIFICATION_JOUEUR": "Modification d'un joueur", 
    "MODIFICATION_PREPARATION": "Modification de la préparation",
    "MODIFICATION_HANDICAPS": "Handicaps",
    "MODIFICATION_CONTRAINTES": "Contraintes",
    "EXECUTION_TOURNOI": "Execution",
}
var currentPage = bd.tournoi.currentTour == -1 ? pages.ACCUEIL : pages.EXECUTION_TOURNOI;

function selectPage(page){
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
            add.innerHTML = "Ajouter";
            add.classList.add("btn-success");
            header.appendChild(add);
            var importJoueur = MH.makeButton({
                type: "click", 
                func: importJoueurs.bind(this)
            }/*, "add"*/);
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
    }
    return header;
}

function buildBody(){
    var body = MH.makeDiv("body", "container");
    switch (currentPage){
        case pages.ACCUEIL:
            body.appendChild(buildListJoueur());
            body.appendChild(buildPreparation());
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
            for (var i = 0; i < bd.tournoi.tours.length; i++){
                body.appendChild(buildHeaderTour(i));
                body.appendChild(buildTour(bd.tournoi.tours[i], i));
            }
        break;
    }
    body.addEventListener("keydown", onKeyDown.bind(this));
    return body;
}

function buildFooter(){
    var footer = MH.makeDiv("footer", "container");
    switch (currentPage){
        case pages.ACCUEIL:
            var signature = MH.makeSpan("Développé par <br> <b>Jonathan Merandat<b>", "signature");
            footer.appendChild(signature);
            var buttonLancerTournoi = MH.makeButton({
                type: "click", 
                func: lancerTournoi.bind(this)
            });
            buttonLancerTournoi.innerHTML = "Lancer le tournoi";
            buttonLancerTournoi.classList.add("btn-success");
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
            /*footer.appendChild(MH.makeButtonCancel({
                type: "click", 
                func: cancelModificationContraintes.bind(this)
            }));*/
            var validTourDom = MH.makeButtonValid({
                type: "click", 
                func: validTour.bind(this)
            });
            validTourDom.innerHTML = "Cloturer tour " + (bd.tournoi.currentTour + 1);
            //if (!bd.allMatchDoneCurrentTour()) validTourDom.classList.add("disabled");
            footer.appendChild(validTourDom);   
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
            }, "edit"));
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
            divPrep.appendChild(buildPropertyViewer("Nombre de tour", bd.tournoi.nbTour));
            divPrep.appendChild(buildPropertyViewer("Nombre de terrain", bd.tournoi.nbTerrain));
            listPrep.appendChild(divPrep);
            break;
        case pages.MODIFICATION_PREPARATION:
            var elementsTypeTournoi = [];
            for (var t in typeTournoiListe){
                elementsTypeTournoi.push({"id": t, "name": "typeTournoi", "value": typeTournoiListe[t], "checked": bd.tournoi.typeTournoi ===  typeTournoiListe[t]});
            }
            divPrep.appendChild(buildPropertyEditor("Type de tournoi", "radio", 
            {name: "typeTournoi", elements : elementsTypeTournoi}));

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
    if (bd.tournoi.currentTour == i) header.classList.add("currentTour");
    else if (bd.tournoi.currentTour > i) header.classList.add("closedTour");
    else if (bd.tournoi.currentTour < i) header.classList.add("forPlayingTour");
    var ssTitle = MH.makeDiv(null, "divSsTitle");
    var ss1 = MH.makeSpan("Tour " + (i + 1), "ssTitle");
    ssTitle.appendChild(ss1);
    header.appendChild(ssTitle);
    return header;
}

function buildTour(tour, i) {
    var globalTour = MH.makeDiv(null, "tour");
    if (bd.tournoi.currentTour == i) globalTour.classList.add("currentTour");
    else if (bd.tournoi.currentTour > i) globalTour.classList.add("closedTour");
    else if (bd.tournoi.currentTour < i) globalTour.classList.add("forPlayingTour");
    var listMatchs = MH.makeDiv(null, "matchs");
    for (var i = 0; i < tour.matchs.length; i++){
        listMatchs.appendChild(buildMatch(tour.matchs[i], i));
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
    var num = MH.makeSpan("Match " + (j + 1));
    var matchDom = MH.makeDiv(null, "match");
    var listEquipeA = MH.makeDiv(null, "equipe");
    
    for (var j = 0; j < match.equipeA.length; j++){
        listEquipeA.appendChild(buildJoueur(match.equipeA[j], match.equipeA[j].index));
    }
    var ptEquipeA = buildPropertyEditor("Score", "numberSpinner", {
        "min": match["ptsEquipeA"], 
        "max": 50, 
        "value": match["ptsEquipeA"], 
        "id": "match" + j
    });
    matchDom.appendChild(ptEquipeA);
    matchDom.appendChild(listEquipeA);
    matchDom.appendChild(MH.makeSpan("-------------"));
    var listEquipeB = MH.makeDiv(null, "equipe");
    for (var j = 0; j < match.equipeB.length; j++){
        listEquipeB.appendChild(buildJoueur(match.equipeB[j], match.equipeB[j].index));
    }
    var ptEquipeB = buildPropertyEditor("Score", "numberSpinner", {
        "min": match["ptsEquipeB"], 
        "max": 50, 
        "value": match["ptsEquipeB"], 
        "id": "match" + j,
        "column-reverse": true
    });
    matchDom.appendChild(listEquipeB);
    matchDom.appendChild(ptEquipeB);
    divMatch.appendChild(num);
    
    divMatch.appendChild(matchDom);
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
            }, "edit"));
        break;
        case pages.SELECTION_JOUEUR:

        break;
    }
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
            }, "edit"));
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
                if (bd.tournoi.contraintes[i].actif){
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
            contrainteDom.appendChild(check);
            contrainteDom.appendChild(MH.makeSpan(compt, "numContrainte"));
            var div = MH.makeLabel(null, "ssContrainte");
            div.setAttribute("for", "checkContrainte" + i);
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
        }
        if (bd.joueurs.length == 0){
            divJoueur = MH.makeSpan("Aucun joueur", "noData");
            divJoueurs.appendChild(divJoueur);
        }else{
            var flag = false;
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
                        var newId = MH.getNewId();
                        var divJoueurSelection = MH.makeDiv(null, "joueurSelection");
                        divJoueur = buildJoueur(bd.joueurs[i], i);
                        divJoueur.setAttribute("id", newId);
                        divJoueurSelection.classList.add(bd.joueurs[i].genre.value == bd.tournoi.genreListe.HOMME.value ? "homme" : "femme");
                        MH.addNewEvent(newId, "click", selectJoueur.bind(this, i));
                        divJoueurSelection.appendChild(divJoueur);
                        divJoueurSelection.appendChild(MH.makeButton({
                            type: "click", 
                            func: editJoueur.bind(this, i)
                        }, "edit"));
                        divJoueurs.appendChild(divJoueurSelection);
                        flag = true;
                    break;
                }
            }
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
            joueurDom.appendChild(niveau);
            break;
        case pages.ACCUEIL:
        case pages.EXECUTION_TOURNOI:
            joueurDom.classList.add("accueil");
            joueurDom.appendChild(MH.makeSpan(joueur.name, "nomJoueur"));
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
            joueurDom.appendChild(niveau);
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
    var value = this.buildEditor(type, attributes);
    value.classList.add("propertyValue");
    if (attributes["column-reverse"] == true){
        key.classList.add("columnReverse");
        property.appendChild(value);
        if (pKey != undefined) property.appendChild(key);  
    }else{
        if (pKey != undefined) property.appendChild(key);  
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
                label = MH.makeElt("label", null, "labelCkeckbox");
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
            var divInputNumber = MH.makeDiv(attributes["id"], "numberSpinner");
            divInputNumber.setAttribute("min", attributes["min"]);
            divInputNumber.setAttribute("max", attributes["max"]);
            divInputNumber.setAttribute("value", attributes["value"]);
            divInputNumber.setAttribute("id", attributes["id"]);
            var buttonMoins = MH.makeButton({
                type: "click", 
                func: numberPlusOuMoins.bind(this, false)
            });
            buttonMoins.innerHTML = "-";
            buttonMoins.classList.add("btn-secondary");
            buttonMoins.classList.add("numberSpinnerPlusMoins");
            buttonMoins.classList.add("numberSpinnerMoins");
            var buttonPlus = MH.makeButton({
                type: "click", 
                func: numberPlusOuMoins.bind(this, true)
            });
            buttonPlus.innerHTML = "+";
            buttonPlus.classList.add("btn-secondary");
            buttonPlus.classList.add("numberSpinnerPlusMoins");
            buttonPlus.classList.add("numberSpinnerPlus");
            var spanNumber = MH.makeSpan(attributes["value"], "numberSpinnerValue");
            divInputNumber.appendChild(buttonMoins);
            divInputNumber.appendChild(spanNumber);
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
function lancerTournoi(){
    genereTournoi();
    bd.updateTournoi({"currentTour": 0});
    selectPage(pages.EXECUTION_TOURNOI);
}
function showModalFinTournoi(){
    $('#modalFinTournoi').modal('show');
}
function finTournoi(){
    bd.updateTournoi({"currentTour": -1});
    $('#modalFinTournoi').modal('hide');
    selectPage(pages.ACCUEIL);
}
function validTour(){
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
    validModificationJoueur();
}
function retourSelectionJoueur(){
    selectPage(pages.ACCUEIL);
}
function addJoueur(evt){
    editJoueur(-1, evt);
}
function importJoueurs(evt){

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
    if (currentEditionId == -1){

        if (bd.joueurs.filter(j => j.name == document.getElementById("nomJoueur").value).length > 0) 
            return;

        bd.addJoueur(new Joueur(
            document.getElementById("nomJoueur").value,
            bd.tournoi.genreListe[document.body.querySelector("div.radiogenre input:checked").id],
            bd.tournoi.niveauListe[document.body.querySelector("div.radioniveau input:checked").id],
            false));
    }else{

        if (bd.joueurs[currentEditionId].name != document.getElementById("nomJoueur").value && 
        bd.joueurs.filter(j => j.name == document.getElementById("nomJoueur").value).length > 0) 
        return;
        
        bd.updateJoueur(currentEditionId, {
            "name": document.getElementById("nomJoueur").value,
            "niveau": bd.tournoi.niveauListe[document.body.querySelector("div.radioniveau input:checked").id],
            "genre": bd.tournoi.genreListe[document.body.querySelector("div.radiogenre input:checked").id],
        });
    }
    selectPage(pages.SELECTION_JOUEUR);
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
    var currentContrainte;
    for (var i = 0; i < contraintes.length; i++){
        currentContrainte = bd.tournoi.contraintes[i];
        currentContrainte["actif"] = contraintes[i].querySelector("input").checked;
        if (currentContrainte.name == "LIMITPOINT") {
            bd.updateTournoi({"limitPoint": contraintes[i].querySelector("#limitPoint").value });
        }
    }
    bd.updateTournoi(); //pour sauvegarder
    selectPage(pages.MODIFICATION_PREPARATION);
}
function cancelModificationContraintes(){
    selectPage(pages.MODIFICATION_PREPARATION);
}
function validModificationPreparation(){
    bd.updateTournoi({
        "typeTournoi": typeTournoiListe[document.body.querySelector("div.radiotypeTournoi input:checked").id],
        "nbTour": parseInt(document.body.querySelector("#nbTour .numberSpinnerValue").innerHTML),
        "nbTerrain": parseInt(document.body.querySelector("#nbTerrain .numberSpinnerValue").innerHTML)
    });
    selectPage(pages.ACCUEIL);
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
function selectJoueur(i, evt){
    var check = evt.currentTarget.querySelector("input");
    check.checked = !check.checked;
    bd.updateJoueur(i, {"selected": check.checked});
}
function monterContrainte(i){
    if (i > 0){
        var movedElt = bd.tournoi.contraintes[i];
        bd.tournoi.contraintes.splice(i, 1);
        bd.tournoi.contraintes.splice(i-1, 0, movedElt);
    }
    selectPage(pages.MODIFICATION_CONTRAINTES);
}
function descendreContrainte(i){
    if (i < bd.tournoi.contraintes.length -1){
        var movedElt = bd.tournoi.contraintes[i];
        bd.tournoi.contraintes.splice(i, 1);
        bd.tournoi.contraintes.splice(i+1, 0, movedElt);
    }
    selectPage(pages.MODIFICATION_CONTRAINTES);
}
function validSelectionJoueur(){
    selectPage(pages.ACCUEIL);
}
function numberPlusOuMoins(sens, evt){
    if (sens){
        var value =  parseInt(evt.currentTarget.previousSibling.innerHTML);
        var max = parseInt(evt.currentTarget.parentElement.getAttribute("max"));
        if (value < max) evt.currentTarget.previousSibling.innerHTML = value + 1;
    } else{
        var value =  parseInt(evt.currentTarget.nextSibling.innerHTML);
        var min = parseInt(evt.currentTarget.parentElement.getAttribute("min"));
        if (value > min) evt.currentTarget.nextSibling.innerHTML = value - 1;
    }
}
function editHandicaps(){
    selectPage(pages.MODIFICATION_HANDICAPS);
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
    static makeIcon(type){
        var img = MH.makeElt("img");
        var src = "../bootstrap-icons-1.0.0/";
        switch (type){
            case "edit":
                src += "pencil-fill.svg";
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
                src += "arrow-left.svg";
                break;  
            case "delete":
            case "reset":
                src += "trash.svg";
                break; 
            case "list":
                src += "list.svg";
                break; 
            case "gear":
                src += "gear-fill.svg";
                break; 
            case "check":
                src += "check.svg";
                break;
            case "monter":
                src += "caret-up-fill.svg";
                break;
            case "descendre":
                src += "caret-down-fill.svg";
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
    static makeButton(callBack, icon){
        var newId = undefined;
        if (callBack != undefined){
            newId = MH.getNewId();
            this.addNewEvent(newId, callBack.type, callBack.func);
        }
        var button = MH.makeElt("button", newId, "btn");
        if (icon != undefined){
            button.innerHTML = MH.makeIcon(icon).outerHTML;
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


