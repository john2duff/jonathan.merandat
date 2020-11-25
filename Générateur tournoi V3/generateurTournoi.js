
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
        return {
            "typeTournoi": this.tournoi.typeTournoi,
            "nbTour": this.tournoi.nbTour, 
            "nbTerrain": this.tournoi.nbTerrain,
            "departMatchNegatif": this.tournoi.departMatchNegatif,
            "niveauListe": this.tournoi.niveauListe,
            "genreListe": this.tournoi.genreListe,
            "contraintes": this.tournoi.contraintes,
            "tours": this.tournoi.tours,
            "currentTour": this.tournoi.currentTour
        };
    }

    export() {
        var name = "Tournoi - " + new Date().getDate();
        var type = "application/json";
        var anchor = document.createElement("a");
        anchor.href = window.URL.createObjectURL(new Blob([this.getDatas()], {type}));
        anchor.download = name;
        anchor.click();
    }

    import(evt) {   
        var fichier = new FileReader(); 
        fichier.onload = function() { 
            var datas = JSON.parse(fichier.result);
            this.load(datas);
            this.save();
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
        "name": "ISOSEXE",
        "title": "Egalité des sexes", 
        "desc": "On ne permet que des match où il y a autant d'homme que de femme dans chaque équipe.",
        "actif": true, 
        "disabled": false 
    },
    {
        "name": "LIMITPOINT",
        "title": "Ecart de point limité", 
        "desc": "On ne permet pas plus de 10 points d'écart au début du match",
        "actif": true, 
        "disabled": false 
    }
]
var niveauListe = {
    "P12": {
        "value": "P12", 
        "handicap": 0
    },
    "P11": {
        "value": "P11",
        "handicap": 2
    },
    "P10": {
        "value": "P10",
        "handicap": 4
    },
    "D9": {
        "value": "D9", 
        "handicap": 8
    },
    "D8": {
        "value": "D8",
        "handicap": 10
    },
    "D7": {
        "value": "D7",
        "handicap": 12
    },
    "R6": {
        "value": "R6", 
        "handicap": 13
    },
    "R5": {
        "value": "R5",
        "handicap": 14
    },
    "R4": {
        "value": "R4",
        "handicap": 15
    },
    "N3": {
        "value": "N3", 
        "handicap": 16
    },
    "N2": {
        "value": "N2",
        "handicap": 17
    },
    "N1": {
        "value": "N1",
        "handicap": 18
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
    }
    name = null;
    genre = null;
    niveau = null;
    selected = false;

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
    constructor(pTypeTournoi, pNbTour, pNbTerrain, pDepartMatchNegatif, pNiveauListe, pGenreListe, pContraintes, pTours, pCurrentTour){
        this.typeTournoi = pTypeTournoi != undefined ? pTypeTournoi : typeTournoiListe.SIMPLE;
        this.nbTour = pNbTour != undefined ? pNbTour : 1;
        this.nbTerrain = pNbTerrain != undefined ? pNbTerrain : 5;
        this.departMatchNegatif = pDepartMatchNegatif != undefined ? pDepartMatchNegatif : false;
        this.niveauListe = pNiveauListe != undefined ? pNiveauListe : niveauListe;
        this.genreListe = pGenreListe != undefined ? pGenreListe : genreListe;
        this.contraintes = pContraintes != undefined ? pContraintes : contrainteListe;
        this.tours = pTours != undefined ? pTours : [];
        this.currentTour = pCurrentTour != undefined ? pCurrentTour : -1;
    }
    typeTournoi = null;
    nbTour = null;
    nbTerrain = null;
    departMatchNegatif = null;
    niveauListe = null;
    genreListe = null;
    contraintes = null;
    currentTour = null;
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
                body.appendChild(buildTour(bd.tournoi.tours[i]));
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
    var header = MH.makeDiv("headerTour", "container sticky-top");
    var ssTitle = MH.makeDiv(null, "divSsTitle");
    var ss1 = MH.makeSpan("Tour " + (i + 1), "ssTitle");
    ssTitle.appendChild(ss1);
    header.appendChild(ssTitle);
    return header;
}

function buildTour(tour) {
    var listMatchs = MH.makeDiv(null, "matchs");
    for (var i = 0; i < tour.length; i++){
        listMatchs.appendChild(buildMatch(tour[i], i));
    }
    return listMatchs;
}

function buildMatch(match, j) {
    var divMatch = MH.makeDiv(null, "divMatch");
    var num = MH.makeSpan(j + 1);
    var matchDom = MH.makeDiv(null, "match");
    var listEquipeA = MH.makeDiv("equipeA");
    for (var j = 0; j < match.equipeA.length; j++){
        listEquipeA.appendChild(buildJoueur(match.equipeA[j], match.equipeA[j].index));
    }
    matchDom.appendChild(listEquipeA);
    matchDom.appendChild(MH.makeSpan("-------------"));
    var listEquipeB = MH.makeDiv("equipeB");
    for (var j = 0; j < match.equipeB.length; j++){
        listEquipeB.appendChild(buildJoueur(match.equipeB[j], match.equipeB[j].index));
    }
    matchDom.appendChild(listEquipeB);
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
    if (pKey != undefined) property.appendChild(key);  
    property.appendChild(value);
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
    bd.tournoi.currentTour = 0;
    selectPage(pages.EXECUTION_TOURNOI);
}
function showModalFinTournoi(){
    $('#modalFinTournoi').modal('show');
}
function finTournoi(){
    bd.tournoi.currentTour = -1;
    $('#modalFinTournoi').modal('hide');
    selectPage(pages.ACCUEIL);
}
function validTour(){
    if (bd.tournoi.currentTour < bd.tournoi.nbTour - 1){
        bd.tournoi.currentTour++;
        selectPage(pages.EXECUTION_TOURNOI);
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
        bd.addJoueur(new Joueur(
            document.getElementById("nomJoueur").value,
            bd.tournoi.genreListe[document.body.querySelector("div.radiogenre input:checked").id],
            bd.tournoi.niveauListe[document.body.querySelector("div.radioniveau input:checked").id],
            false));
    }else{
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

    bd.tournoi.contraintes = [];
    var contraintes = document.body.querySelectorAll(".divContrainte");
    var currentContrainte;
    for (var i = 0; i < contraintes.length; i++){
        currentContrainte = contrainteListe[i];
        currentContrainte["actif"] = contraintes[i].querySelector("input").checked;
        bd.tournoi.contraintes.push(currentContrainte);
    }
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
var sac, allMatchs, selecteurMatch;
function alea(max) {
    return Math.floor(Math.random() * Math.floor(max));
}
function mettreJoueursDansSac(){
    sac = [];
    for (var i = 0; i < bd.joueurs.length; i++){
        if (bd.joueurs[i].selected){
            bd.joueurs[i].pointContrainte = 0;
            bd.joueurs[i].index = i;
            sac.splice(alea(sac.length), 0, bd.joueurs[i]);
        }
    }
}
function populateAllMatchs(){
    allMatchs = [];
    var match;        
    for (var i = 0; i < sac.length; i++){
        for (var j = 0; j < sac.length; j++){
            if (j > i) {
                match = {"equipeA": [sac[i]], "equipeB": [sac[j]], "pointContrainte": 0, "disabled": false};  
                allMatchs.push(match);
            }
        }
    }
    return allMatchs;
}
function setPointContrainte(){
    var facteur;
    var flag;
    for (var i = 0; i < allMatchs.length; i++){
        facteur = 1;
        flag = false;
        for (var j = bd.tournoi.contraintes.length - 1; j >= 0; j--){
            if (bd.tournoi.contraintes[j].actif && !bd.tournoi.contraintes[j].disabled){
                facteur *= 10;
                if (bd.tournoi.contraintes[j].name == "ISOSEXE"){
                    var nbHommeEquipeA = 0;
                    var nbHommeEquipeB = 0;
                    for (var k = 0; k < allMatchs[i]["equipeA"].length; k++){
                        if (allMatchs[i]["equipeA"][k].genre.value == bd.tournoi.genreListe.HOMME.value)
                        nbHommeEquipeA++;
                    }
                    for (var k = 0; k < allMatchs[i]["equipeB"].length; k++){
                        if (allMatchs[i]["equipeB"][k].genre.value == bd.tournoi.genreListe.HOMME.value)
                        nbHommeEquipeB++;
                    }
                    if (nbHommeEquipeA != nbHommeEquipeB){
                        allMatchs[i].pointContrainte += facteur; 
                        flag = true;
                    }
                } else if (bd.tournoi.contraintes[j].name == "LIMITPOINT"){
                    var nbHommeEquipeA = 0;
                    var nbHommeEquipeB = 0;
                    for (var k = 0; k < allMatchs[i]["equipeA"].length; k++){
                        if (allMatchs[i]["equipeA"][k].genre.value == bd.tournoi.genreListe.HOMME.value)
                        nbHommeEquipeA++;
                    }
                    for (var k = 0; k < allMatchs[i]["equipeB"].length; k++){
                        if (allMatchs[i]["equipeB"][k].genre.value == bd.tournoi.genreListe.HOMME.value)
                        nbHommeEquipeB++;
                    }
                    if (Math.abs(allMatchs[i]["equipeA"].points - allMatchs[i]["equipeB"].points) > 10){
                        allMatchs[i].pointContrainte += facteur; 
                        flag = true;
                    }
                }
            }
        }
        if (flag){
            var m = allMatchs[i];
            allMatchs.splice(i, 1);
            var compt = allMatchs.length - 1;
            var current = allMatchs[compt];
            while(m.pointContrainte < current.pointContrainte){
                current = allMatchs[compt--];
            }
            allMatchs.splice(compt, 0, m);
        }
    }
}
function nextMatch(){
    var m;
    if (selecteurMatch = -1 || selecteurMatch == sac.length - 1){
        selecteurMatch = 0;
        m = allMatchs[selecteurMatch];
    }else{
        m = allMatchs[selecteurMatch++];
    }
    allMatchs.splice(selecteurMatch, 1);
    return m;
}
function elagage(match){
    var flag;
    for (var i = 0; i < allMatchs.length; i++){
        flag = false;
        //equipeA
        for (var j = 0; j < match.equipeA.length; j++){
            for (var k = 0; k < allMatchs[i].equipeA.length; k++){
                if (allMatchs[i].equipeA[k] == match.equipeA[j])
                    flag = true;
            }
        }
        //equipeB
        for (var j = 0; j < match.equipeB.length; j++){
            for (var k = 0; k < allMatchs[i].equipeB.length; k++){
                if (allMatchs[i].equipeB[k] == match.equipeB[j])
                    flag = true;
            }
        }
        if (flag) allMatchs[i].disabled = true; 
    }
    return match;
}

   // A  B  C  D  E
// A  x  1  1  1  1 
// B  x  x  1  1  1
// C  x  x  x  1  1 
// D  x  x  x  x  1
// E  x  x  x  x  x   

function genereTournoi(){

    mettreJoueursDansSac();
    populateAllMatchs();
    setPointContrainte();
    selecteurMatch = -1;

    bd.tournoi.tours = []

    for (var i = 0; i < bd.tournoi.nbTour; i++){
        var tour = [];
        allMatchs = saveAllMatchs;
        for (var j = 0; j < bd.tournoi.nbTerrain; j++){
            tour.push(elagage(nextMatch()));
        }
        bd.tournoi.tours.push(tour);
    }

}


