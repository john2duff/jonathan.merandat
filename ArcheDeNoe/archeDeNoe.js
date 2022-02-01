
var largeurGrilleItem, hauteurGrilleItem;

function ArcheDeNoeItem(name, dimension, color){
    this.dimension = dimension;
    this.name = name;
    this.position = null;
    this.color = color;
}

ArcheDeNoeItem.prototype.build = function(){
    var table = document.createElement("table");
    table.classList.add("tableItem");
    var currentTd, currentTr;
    for (var i = 0; i < this.dimension.length; i++){
        currentTr = document.createElement("tr");
        for (var j = 0; j < this.dimension[i].length; j++){
            currentTd = document.createElement("td");
            currentTd.appendChild(this.buildItem(this.dimension[i][j]));
            currentTr.appendChild(currentTd);
        } 
        table.appendChild(currentTr);
    }

    if (this.position != null) {
        table.style["left"] = this.position[0] * largeurGrilleItem;
        table.style["top"] = this.position[1] * hauteurGrilleItem;
        table.style["position"] = "absolute";
    }
    return table;
}

ArcheDeNoeItem.prototype.buildItem = function(value){
    var intItem = document.createElement("div");
    intItem.style["backgroundColor"] = value != 0 ? this.color : "transparent";
    intItem.style["height"] = hauteurGrilleItem + "px";
    intItem.style["width"] = largeurGrilleItem + "px";
    return intItem;
}

function ArcheDeNoe(divRoot){
    this.divRoot = divRoot;
    this.init();
}

ArcheDeNoe.prototype.init = function(config){
    this.grille = [
        [-1, 0, 0, 0, 0, 0, -1], 
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [-1, 0, 0, 0, 0, 0, -1],
    ];

    this.pieces = [];
    //ajout des pièces
    this.pieces.push(new ArcheDeNoeItem("Lion Male", [[1, 1]], "orange"));
    this.pieces.push(new ArcheDeNoeItem("Lion Femelle", [[1, 1], [1, 0]], "orange"));
    this.pieces.push(new ArcheDeNoeItem("Girafe Male", [[0, 1], [1, 1]], "green"));
    this.pieces.push(new ArcheDeNoeItem("Girafe Femelle", [[0, 1], [0, 1]], "green"));
    this.pieces.push(new ArcheDeNoeItem("Zebre Male", [[1, 1]], "gray"));
    this.pieces.push(new ArcheDeNoeItem("Zebre Femelle", [[0, 1], [0, 1]], "gray"));
    this.pieces.push(new ArcheDeNoeItem("Elephant Male", [[1, 0], [1, 1]], "pink"));
    this.pieces.push(new ArcheDeNoeItem("Elephant Femelle", [[1, 1]], "pink"));
    this.pieces.push(new ArcheDeNoeItem("Hypopotame Male", [[1, 1, 1]], "lightblue"));
    this.pieces.push(new ArcheDeNoeItem("Hypopotame Femelle", [[1, 1]], "lightblue"));

    if(config != undefined){
        if (config == 0){
            this.pieces.filter(a => a.name == "Lion Male")[0].position = [1, 0];
        }
    }

}

ArcheDeNoe.prototype.show = function(){
    this.divRoot.innerHTML = "";
    //affichage de l'arche
    this.divArche = document.createElement("div");
    this.divArche.setAttribute("id", "arche");

    var currentTd, currentTr;
    var table = document.createElement("table");
    for (var i = 0; i < this.grille.length; i++){
        currentTr = document.createElement("tr");
        for (var j = 0; j < this.grille[i].length; j++){
            currentTd = document.createElement("td");
            currentTd.appendChild(this.buildGrilleItem(this.grille[i][j]));
            currentTr.appendChild(currentTd);
        }
        table.appendChild(currentTr);
    }
    this.divArche.appendChild(table);
    this.divRoot.appendChild(this.divArche);

    this.divArche.style["width"] = (document.body.offsetWidth * 0.5) + "px";
    this.divArche.style["height"] = (this.divArche.offsetWidth / (7 / 4)) + "px";

    largeurGrilleItem = document.getElementById("arche").offsetWidth / 7;
    hauteurGrilleItem = document.getElementById("arche").offsetHeight / 4;

    this.tas = document.createElement("div");
    this.tas.setAttribute("id", "tas");
    //affichage des pieces
    for (var i = 0; i < this.pieces.length; i++){
        if (this.pieces[i].position != null){
            this.divArche.appendChild(this.pieces[i].build());
        } else {
            this.tas.appendChild(this.pieces[i].build());
        }
    }
    this.divRoot.appendChild(this.tas);
    //affichage de la toolbar

}

ArcheDeNoe.prototype.buildGrilleItem = function(value){
    var grilleItem = document.createElement("div");
    grilleItem.classList.add("grilleItem");
    grilleItem.classList.add(value != -1 ? "caseValide" : "caseInvalide");
    return grilleItem;
}

var adn;
function init(){
    adn = new ArcheDeNoe(document.getElementById("root"));
    adn.show();
}
