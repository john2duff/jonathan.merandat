var appCasseTeteChinois = function(){
    //pair = 1x1 et impair = 2x1 ou 1x2
    var scenarios = [
        [
            [1, 3, 3, 5],
            [1, 2, 4, 5],
            [0, 10, 10, 0],
            [7, 10, 10, 9],
            [7, 6, 8, 9]
        ],
        [
            [2, 1, 3, 0],
            [4, 1, 3, 0],
            [5, 5, 10, 10],
            [7, 9, 10, 10],
            [7, 9, 6, 8]
        ],
        [
            [1, 1, 2, 4],
            [3, 3, 0, 5],
            [7, 7, 0, 5],
            [9, 9, 10, 10],
            [6, 8, 10, 10]
        ],
        [
            [1, 1, 3, 3],
            [5, 5, 7, 7],
            [2, 10, 10, 9],
            [4, 10, 10, 9],
            [6, 8, 0, 0]
        ],
        [
            [1, 1, 10, 10],
            [0, 0, 10, 10],
            [2, 4, 6, 8],
            [3, 5, 7, 9],
            [3, 5, 7, 9]
        ],
        [
            [1, 3, 2, 4],
            [1, 3, 5, 5],
            [0, 0, 10, 10],
            [7, 9, 10, 10],
            [7, 9, 6, 8]
        ],
        [
            [2, 1, 1, 4],
            [5, 3, 3, 6],
            [5, 7, 0, 0],
            [8, 7, 10, 10],
            [9, 9, 10, 10]
        ],
        [
            [1, 1, 10, 10],
            [3, 3, 10, 10],
            [5, 5, 0, 0],
            [7, 9, 2, 4],
            [7, 9, 6, 8]
        ],
        [
            [10, 10, 2, 4],
            [10, 10, 1, 1],
            [0, 0, 3, 3],
            [7, 9, 5, 5],
            [7, 9, 6, 8]
        ],
        [
            [1, 3, 5, 5],
            [1, 3, 7, 7],
            [9, 9, 0, 0],
            [2, 4, 10, 10],
            [6, 8, 10, 10]
        ],
        [
            [10, 10, 2, 4],
            [10, 10, 6, 8],
            [0, 0, 1, 1],
            [3, 5, 7, 7],
            [3, 5, 9, 9]
        ],
        [
            [1, 3, 10, 10],
            [1, 3, 10, 10],
            [5, 5, 0, 0],
            [7, 9, 2, 4],
            [7, 9, 6, 8]
        ],
        [
            [2, 10, 10, 6],
            [4, 10, 10, 8],
            [0, 1, 1, 0],
            [3, 5, 7, 9],
            [3, 5, 7, 9]
        ],
        [
            [1, 10, 10, 2],
            [1, 10, 10, 4],
            [0, 3, 3, 0],
            [6, 5, 7, 9],
            [8, 5, 7, 9]
        ],
        [
            [1, 3, 5, 6],
            [1, 3, 5, 8],
            [0, 0, 2, 4],
            [9, 9, 10, 10],
            [7, 7, 10, 10]
        ],
        [
            [2, 3, 5, 7],
            [4, 3, 5, 7],
            [8, 6, 0, 0],
            [10, 10, 1, 1],
            [10, 10, 9, 9]
        ],
        [
            [2, 4, 6, 8],
            [1, 3, 3, 5],
            [1, 0, 0, 5],
            [7, 10, 10, 9],
            [7, 10, 10, 9]
        ],
        [
            [2, 10, 10, 6],
            [4, 10, 10, 8],
            [0, 1, 1, 0],
            [3, 5, 7, 7],
            [3, 5, 9, 9]
        ],
        [
            [1, 2, 4, 3],
            [1, 6, 8, 3],
            [5, 10, 10, 0],
            [5, 10, 10, 0],
            [7, 7, 9, 9]
        ],
        [
            [1, 2, 4, 3],
            [1, 6, 8, 3],
            [0, 10, 10, 5],
            [0, 10, 10, 5],
            [7, 7, 9, 9]
        ]
    ]
    var DIMENSION_CASE = 50;
    var divCasseTeteChinois = buildElement("div", undefined, "divCasseTeteChinois");

    var getDimension = function (i, j, scenario, getHeight) {
        var valeur = scenario[i][j];
        var height = 0;
        var width = 0;
        for (var t = i; t < scenario.length; t++) {
            if (scenario[t][j] == valeur) {
                height++;
            }
            for (var p = j; p < scenario[t].length; p++) {
                if (scenario[t][p] == valeur) {
                    width++;
                }
            }
            if (!getHeight) {
                return width;
            }
        }
        return height;
    }

    var buildJeuCasseTeteChinois = function (scenario, idJeu) {
        var NBRE_CASE = scenario.length;
        var mouvement = false;
        var elementParcouru = [];
        var ajoutHeight = 0;
        var padding = 5;

        for (var i = 0; i < scenario.length; i++) {
            for (var j = 0; j < scenario[i].length; j++) {
                if (!elementParcouru.includes(scenario[i][j]) && scenario[i][j] != 0) {
                    var newElement2 = buildElement("div", "elementJeuCasseTeteEnglobant");
                    var newElement = buildElement("div", "elementJeuCasseTeteChinois" + " elementJeuCasseTeteChinois" + scenario[i][j], "elementJeuCasseTeteChinois" + idJeu + scenario[i][j]);
                    newElement2.style["left"] = (j * DIMENSION_CASE) + "px";
                    newElement2.style["top"] = ((i * DIMENSION_CASE) - ajoutHeight) + "px";
                    var height = getDimension(i, j, scenario, true) * DIMENSION_CASE;
                    var width = getDimension(i, j, scenario, false) * DIMENSION_CASE;
                    newElement2.style["height"] = height + "px";
                    newElement2.style["width"] = width + "px";
                    var newElement3 = buildElement("div", "elementJeuCasseTeteEnglobant3");
                    newElement.appendChild(newElement3);
                    newElement3.appendChild(buildElement("div", "rondInterieurCasseTete"));
                    newElement2.appendChild(newElement);
                    divJeuCasseTeteChinois.appendChild(newElement2);
                    elementParcouru.push(scenario[i][j]);
                    ajoutHeight += (height);
                }
            }
        }
    }

    var compt = 0;
    for (var i = 0; i < scenarios.length; i++) {
        var divJeuCasseTeteChinois = buildElement("div", "divJeuCasseTeteChinois", "divJeuCasseTeteChinois" + i);
        divJeuCasseTeteChinois.style["height"] = (DIMENSION_CASE * scenarios[i].length) + 15 + "px";
        divJeuCasseTeteChinois.style["width"] = (DIMENSION_CASE * scenarios[i][0].length) + 15 + "px";
        buildJeuCasseTeteChinois(scenarios[i], i);
        var divEnglobe = buildElement("div", "divJeuCasseTeteChinoisEnglobe");
        divEnglobe.appendChild(buildElement("span", "niveauJeuCasseTete", undefined, compt));
        divEnglobe.appendChild(divJeuCasseTeteChinois);
        divCasseTeteChinois.appendChild(divEnglobe);
        compt++;
    }

    var divGlobalCasseTeteChinois = buildElement("div");
    divGlobalCasseTeteChinois.appendChild(divCasseTeteChinois);
    document.write(divGlobalCasseTeteChinois.innerHTML);
}