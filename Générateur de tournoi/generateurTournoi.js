//Récupération de la configuration principale
var config = {
    "nativeTypes": ["string", "integer"],
    "models": {
        "genre": { 
            "title": "Genre", 
            "desc": "Etes-vous un homme ou une femme ?",
            "columns": [
                {   "title": "Genre",
                    "desc": "Le genre", 
                    "type": "string",
                    "datas": ["Homme", "Femme"], 
                    "defaultValue": "Homme"
                }
            ],
            "dimension": "verti",
            "persistent": false,
            "views": {}
        },
        "niveau": {
            "title": "Niveaux", 
            "desc": "Les niveaux existants", 
            "columns": [
                {   "title": "Niveau",
                    "desc": "Le genre", 
                    "type": "string",
                    "datas": ["P12", "P11", "P10"],
                    "defaultValue": "P12"
                }
            ],
            "dimension": "verti",
            "persistent": false, 
            "views": {}
        },
        "typeTournoi": {
            "title": "Type de tournoi", 
            "desc": "Il peut s'agir d'un tournoi simple ou double", 
            "columns": [
                {   "title": "Type de tournoi",
                    "desc": "Le type de tournoi", 
                    "type": "string",
                    "datas": ["Simple", "Double"],
                    "defaultValue": "Simple"
                }
            ],
            "dimension": "verti",
            "persistent": false, 
            "views": {}
        },
        "nombreTour": {
            "title": "Nombre de tour", 
            "desc": "Combien de tour va-t-on faire ?", 
            "columns": [
                {   "title": "Nombre de tour",
                    "desc": "Le nombre de tour", 
                    "type": "integer",
                    "defaultValue": 1,
                    "restriction": {
                        "min": 0,
                        "max": 10
                    }
                }
            ],
            "dimension": "none",
            "persistent": false,
            "views": {}
        },
        "joueurs": {
            "title": "Joueurs",
            "desc": "C'est ici que vous pouvez renseigner la liste des joueurs. \n Cochez ceux qui participent au tournoi.",
            "columns": [
                {   "title": "Nom", 
                    "desc": "Ton petit nom",
                    "type": "string", 
                    "defaultValue": "",
                },
                {   "title": "Prénom", 
                    "desc": "Ton petit prénom",
                    "type": "string", 
                    "defaultValue": "",
                }, 
                {   "type": "genre", 
                    "croisement": "1"    
                },
                {   "type": "niveau", 
                    "croisement": "1"   
                }
            ], 
            "dimension": "both",
            "persistent": true,
            "views": {
                "joueursPage1": {
                    "layout": "TOFR",
                    "actions": ["add", "remove", "edit", "sensRevert"],
                }
            }
        }, 
        "preparation": {
            "title": "Préparation",
            "desc": "Préparation du tournoi", 
            "columns": [
                { "type": "typeTournoi", 
                  "croisement": "1"
                },
                { "type": "nombreTour", 
                  "croisement": "1" 
                }
            ],
            "dimension": "horiz",
            "persistent": true,
            "actions": ["edit", "sensRevert"],
            "sens": true, 
            "view": {
                "defaultPreparation": {
                    "layout": "TOFR",
                    "actions": ["edit", "sensRevert"],
                }
            }
        }
    },
    "pages": {
        "page1": {
            "header": buildTitlePage("Générateur de tournoi"), 
            "views": ["joueursPage1", "defaultPreparation"], 
        }
    },
    "homePage": "page1",
    "dataBaseName": "generateurTournoi",
    "container": null //signifie que cela se construit dans le body
}

function loadMTFramework(){
    new MTFramework(config);
}

function buildTitlePage(title){

    var div = buildElement("div", undefined, undefined, undefined, "display:flex; justify-content:left;align-items:center;");
    var img = buildElement("img", undefined, undefined);
    img.setAttribute("src", "./logoBadLevier.jpg");
    var span = buildElement("img", title, undefined, undefined, "line-height:1.2rem;font-weight:700;font-size:1rem;text-align:center;width:100px;padding:10px;color:lightgray;");
    div.appendChild(img);
    div.appendChild(span);
    return div;
}

function buildButtonLancerTournoi() {
    var buttonInverse = buildElement("button", "Inverser", undefined, "btn btn-primary");
    buttonInverse.setAttribute("onclick", "lancerTournoi('" + modelName + "');");
    buttonInverse.value = "Inverse";
    return buttonInverse;
}

function lancerTournoi(){
    
}