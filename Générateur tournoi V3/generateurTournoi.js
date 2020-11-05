
//Base de données locale
class GlobalDataBase{
    constructor(bdName){
        this.bdName = bdName;
    }
    bdName = "";
    joueurs = [];
    tournoi = new Tournoi();

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
        return {};
    }

    export() {
        var name = "Tournoi - " + new Date().getDate();
        var type = "application/json";
        var anchor = document.createElement("a");
        anchor.href = window.URL.createObjectURL(new Blob([this.getDatas()], {type}));
        anchor.download = name;
        anchor.click();
    }

    import() {   
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
        if (datas["joueurs"] != undefined) this.joueurs = datas["joueurs"];
        if (datas["tournoi"] != undefined) this.tournoi = datas["tournoi"];
    }
}

//Listes
var niveaux = {
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
}
var genre = {
    "HOMME": {
        "value": "Homme",
        "handicap": 0
    },
    "FEMME": {
        "value": "Femme",
        "handicap": 2
    }
}
var typeTournoi = {
    "SIMPLE": "Simple",
    "DOUBLE": "Double"
}

//Models
class Joueur{
    constructor(pName, genre, niveau, selected){
        this.name = pName == undefined ? "Nouveau joueur " + (bd.joueurs.length + 1) : pName;
        if (genre != undefined) this.genre = genre;
        if (niveau != undefined) this.niveau = niveau;
        if (selected != undefined) this.selected = selected;
    }
    name = "";
    genre = genre.HOMME;
    niveau = niveaux.P12;
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
    constructor(){
    }
    typeTournoi = typeTournoi.SIMPLE;
    nbTour = 1;
}

var DB_NAME = "tournoiBad";
var bd = new GlobalDataBase(DB_NAME);


//Pages
var pages = {
    "ACCUEIL": "Accueil", 
    "SELECTION_JOUEUR": "Sélection des joueurs",
    "MODIFICATION_JOUEUR": "Modification d'un joueur", 
    "MODIFICATION_PREPARATION": "Modification de la préparation"
}
var currentPage = pages.ACCUEIL;

function selectPage(page){
    if (page != undefined) currentPage = page;
    buildPage();
    MH.loadEvents();
    resize();
}

window.addEventListener("resize", resize);
function resize(){
    document.getElementById("global").style["height"] = window.innerHeight + "px";
}

//on construit tout dans le body
function buildPage(){
    var container = document.body;
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
            header.appendChild(buildButtonsImportExport());
        break;
        case pages.SELECTION_JOUEUR:
            header.appendChild(MH.makeButton({
                type: "click", 
                func: retourSelectionJoueur.bind(this)
            }, "retour"));

            header.appendChild(MH.makeSpan("Sélection des joueurs", "headerTitle"));
            header.appendChild(MH.makeButton({
                type: "click", 
                func: addJoueur.bind(this)
            }, "add"));
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
            }
        break;
        case pages.MODIFICATION_PREPARATION:
            header.appendChild(MH.makeButton({
                type: "click", 
                func: retourModificationPreparation.bind(this)
            }, "retour"));
            header.appendChild(MH.makeSpan("Modification de la préparation", "headerTitle"));
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
        case pages.MODIFICATION_JOUEUR:
            body.appendChild(buildPreparation());
        break;
    }
    return body;
}

function buildFooter(){
    var footer = MH.makeDiv("footer", "container");
    switch (currentPage){
        case pages.ACCUEIL:
        case pages.SELECTION_JOUEUR:
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
    }
    return footer;
}

function buildHeaderPreparation(){
    var header = MH.makeDiv("headerPreparation", "container");
    switch (currentPage){
        case pages.ACCUEIL:
            header.appendChild(MH.makeSpan("Préparation du tournoi"));
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
    var divPrep = MH.makeDiv("divPreparation");
    switch (currentPage){
        case pages.ACCUEIL:
            divPrep.appendChild(buildPropertyViewer("Type de tournoi", bd.tournoi.typeTournoi));
            divPrep.appendChild(buildPropertyViewer("Nombre de tour", bd.tournoi.nbTour));
        break;
        case pages.MODIFICATION_PREPARATION:
            divPrep.appendChild(buildPropertyEditor("Type de tournoi", "radio", {
                name: "typeTournoi",
                elements: [
                    {"id": "typeTournoiSimple", "name": "typeTournoi", "value": typeTournoi.SIMPLE, "checked": bd.tournoi.typeTournoi === typeTournoi.SIMPLE}, 
                {"id": "typeTournoiDouble", "name": "typeTournoi", "value": typeTournoi.DOUBLE, "checked": bd.tournoi.typeTournoi === typeTournoi.DOUBLE},
                ]
            }));
            divPrep.appendChild(buildPropertyEditor("Nombre de tour", "number", {
                "min": 1, 
                "max": 10, 
                "value": bd.tournoi.nbTour
            }));
        break;
    }
    listPrep.appendChild(divPrep);

    return listPrep;
}

function buildHeaderJoueur(){
    var header = MH.makeDiv("headerJoueur", "container");
    switch (currentPage){
        case pages.ACCUEIL:
            header.appendChild(MH.makeSpan("Liste des joueurs"));
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

function buildListJoueur(){
    var listJoueurs = MH.makeDiv("listJoueurs");
    if (currentPage == pages.ACCUEIL) listJoueurs.appendChild(buildHeaderJoueur());
    var divJoueur = MH.makeDiv("divJoueur");
    if (currentPage == pages.MODIFICATION_JOUEUR){
        if (currentEditionId == -1){
            divJoueur.appendChild(buildJoueur(new Joueur()));
        }else{
            divJoueur.appendChild(buildJoueur(bd.joueurs[currentEditionId]));
        }
    }else{
        if (bd.joueurs.length == 0){
            divJoueur.appendChild(MH.makeSpan("Aucun joueur", "noData"));
        }else{
            var flag = false;
            for (var i = 0; i < bd.joueurs.length; i++){
                switch (currentPage){
                    case pages.ACCUEIL:
                        if (bd.joueurs[i].selected){
                            divJoueur = MH.makeDiv();
                            divJoueur.appendChild(buildJoueur(bd.joueurs[i]));
                            flag = true;
                        }
                    break;
                    case pages.SELECTION_JOUEUR:
                        divJoueur = MH.makeDiv();
                        divJoueur.appendChild(buildJoueur(bd.joueurs[i]));
                        divJoueur.appendChild(MH.makeButton({
                            type: "click", 
                            func: editJoueur.bind(this, i)
                        }, "edit"));
                        flag = true;
                    break;
                }
            }
            if (!flag){
                divJoueur.appendChild(MH.makeSpan("Aucun joueur sélectionné", "noData"));
            }
        }
    }
    listJoueurs.appendChild(divJoueur);
    return listJoueurs;
}

function buildJoueur(joueur, i){
    var joueurDom = MH.makeDiv(null, "joueur");
    switch (currentPage){
        case pages.ACCUEIL:
            joueurDom.appendChild(MH.makeSpan(joueur.name + " - " + joueur.niveau));
            break;
        case pages.SELECTION_JOUEUR:
            joueurDom.classList.add("selectionJoueur");
            var check = MH.makeInput("checkbox");
            if (joueur.selected === true) check.setAttribute("checked", "true");
            check.addEventListener("click", selectJoueur.bind(this, i));
            joueurDom.appendChild(check);
            joueurDom.appendChild(MH.makeSpan(joueur.name + " - " + joueur.niveau));
            break;
        case pages.MODIFICATION_JOUEUR:
            joueurDom.classList.add("modificationJoueur")
            joueurDom.appendChild(buildPropertyEditor("Nom", "text", {"id": "nomJoueur", value : joueur.name}));
            joueurDom.appendChild(buildPropertyEditor("Genre", "radio", 
            {name: "genre", elements : [
                {"id": "HOMME", "name": "genre", "value": genre.HOMME.value, "checked": joueur.genre.value === genre.HOMME.value}, 
                {"id": "FEMME", "name": "genre", "value": genre.FEMME.value, "checked": joueur.genre.value === genre.FEMME.value}, 
            ]}));
            joueurDom.appendChild(buildPropertyEditor("Niveau", "radio", 
            {name: "niveau", elements : [
                {"id": "P12", "name": "niveau", "value": niveaux.P12.value, "checked": joueur.niveau.value === niveaux.P12.value}, 
                {"id": "P11", "name": "niveau", "value": niveaux.P11.value, "checked": joueur.niveau.value === niveaux.P11.value}, 
                {"id": "P10", "name": "niveau", "value": niveaux.P10.value, "checked": joueur.niveau.value === niveaux.P10.value},  
            ]}));

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
    var key = MH.makeLabel(pKey);
    key.classList.add("propertyKey");
    var value = this.buildEditor(type, attributes);
    value.classList.add("propertyValue");
    property.appendChild(key);  
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
        case "number":
            var input = MH.makeInput("number");
            input.setAttribute("min", attributes["min"]);
            input.setAttribute("max", attributes["max"]);
            input.setAttribute("value", attributes["value"]);
            return input;
        default:
            return MH.makeInput(type, attributes);
    }
}

//interfaces
function buildButtonsImportExport(){
    var retour = MH.makeDiv();

    var imp = MH.makeButton({
        type: "click", 
        func: bd.import.bind(bd)
    }, "import");
    imp.classList.add("bouton");
    retour.appendChild(imp);

    var exp = MH.makeButton({
        type: "click", 
        func: bd.export.bind(bd)
    }, "export");
    exp.classList.add("bouton");
    exp.style = "transform:rotate(180deg);";
    retour.appendChild(exp);
    
    return retour;
}

//actions
function retourModificationPreparation(){
    selectPage(pages.ACCUEIL);
}
function retourModificationJoueur(){
    selectPage(pages.SELECTION_JOUEUR);
}
function retourSelectionJoueur(){
    selectPage(pages.ACCUEIL);
}
function addJoueur(){
    editJoueur(-1);
}
function editPreparation(){
    selectPage(pages.MODIFICATION_PREPARATION);
}
function editSelectionJoueurs(){
    selectPage(pages.SELECTION_JOUEUR);
}
function validModificationJoueur(){
    if (currentEditionId == -1){
        bd.joueurs.push(new Joueur(
            document.getElementById("nomJoueur").value,
            niveaux[document.body.querySelector("div.radioniveau input[checked]").id],
            genre[document.body.querySelector("div.radiogenre input[checked]").id],
            false));
    }else{
        bd.joueurs[i].name = document.getElementById("nomJoueur").value;
        bd.joueurs[i].niveau = niveau[document.body.querySelector("div.radioniveau input[checked]").value];
        bd.joueurs[i].genre = genre[document.body.querySelector("div.radiogenre input[checked]").value];
    }
    selectPage(pages.SELECTION_JOUEUR);
}
function cancelModificationJoueur(){
    selectPage(pages.SELECTION_JOUEUR);
}
function editJoueur(i){
    currentEditionId = i;
    selectPage(pages.MODIFICATION_JOUEUR);
}
function selectJoueur(value, i){
    bd.joueurs[i].selected = !value;
}
function validSelectionJoueur(){
    selectPage(pages.ACCUEIL);
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
    static makeLabel(content, className){var label = this.makeElt("label", undefined, className); label.innerHTML = content; return label;};
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
                src += "plus-circle.svg";
                break;
            case "import":
            case "export":
                src += "box-arrow-down.svg";
                break;
            case "retour":
                src += "arrow-left-short.svg";
                break;  
            default:
                src += "question.svg";
                break;    
        }
        img.setAttribute("src", src);
        img.setAttribute("width", "16");
        img.setAttribute("heigth", "16");
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

}