var self;
//définition de la vue
var vue = function(ctrl, model){
    this.ctrl = ctrl;
    this.model = model;
    this.body = this.build();
    var divTitreH2 = document.getElementsByClassName("divTitreH2");
    this.show("pageAccueil");
    self = this;
}

vue.prototype.build = function(){
    var body = buildElement("div", undefined, "global");
    body.appendChild(this.buildBandeauHaut());
    var corps = buildElement("div", undefined, "corps");
    var page = buildElement("div", undefined, "page");
    //ajout de tous les sujets
    var sujets = getBd("sujets");
    for (key in sujets){
        page.appendChild(buildContent("sujets_" + key + "_sections", "sujetPage", key));
    }
    page.appendChild(buildContent("pageAccueil", "sujetPage", "pageAccueil"));    
    page.appendChild(buildContent("cv", "sujetPage", "cv"));
    corps.appendChild(page);
    body.appendChild(corps);
    return body;
}

vue.prototype.buildBandeauGauche = function(){
    var div = buildElement("div", undefined, "bandeauGauche");
    return div;
}

vue.prototype.buildBandeauHaut = function(){
    var div = buildElement("div", undefined, "bandeauHaut");
    var boutonRetour = buildElement("div", "boutonRetourNonVisible", "boutonRetour", undefined, "‹");
    boutonRetour.addEventListener('click', function(){
        self.afficherSujet("pageAccueil", true);
    });
    div.appendChild(boutonRetour);
    div.appendChild(this.buildContact());
    div.appendChild(this.buildSujets());
    return div;
}

vue.prototype.selectionSujetPage = function(sujet){
    var sujets = document.getElementsByClassName("sujetPage");
    for (var i = 0; i< sujets.length;i++){
        if (sujets[i].id == sujet){
            sujets[i].style["display"] = "block";                                    
        }else{
            sujets[i].style["display"] = "none";                                    
        }
    }
}

vue.prototype.buildSujets = function(){
    var div = buildElement("div", undefined, "sujets");
    var sujets = getBd("sujets");
    var dec = -25;
    var zIndex = 1;
    for (var key in sujets){
        if (key != "pageAccueil"){
            div.appendChild(buildElement("label", "sujetsBandeau", "sujets_"+key, getBd("sujets_"+ key + "_h1")));
            div.lastChild.setAttribute("sujet", key);
            div.lastChild.addEventListener('click', function(){
                self.afficherSujet(this.getAttribute("sujet"));
            });
            dec-=25;
            zIndex++;
        }
    }
    return div;
}

vue.prototype.afficherSujet = function(sujet, boutonRetour){ 
    //masquer tous les autres sujets
    var sujets = document.getElementsByClassName("sujetsBandeau");
    var nb = sujets.length;
    for (var i = 0; i< nb; i++){
        if (boutonRetour && sujets[i].getAttribute("sujet") == "cv"){
            sujets[i].style["opacity"] = "0";
            sujets[i].style["width"] = "0px";
            sujets[i].style["z-index"] = "-999";            
        }else if (!boutonRetour && sujets[i].getAttribute("sujet") == "cv" & sujet == "cv"){
            sujets[i].style["opacity"] = "1";
            sujets[i].style["width"] = "initial";
            sujets[i].style["z-index"] = "3";     
            sujets[i].style["margin-top"] = "initial";       
        }else if (boutonRetour){
            sujets[i].style["opacity"] = "initial";
            sujets[i].style["width"] = "initial";
            sujets[i].style["margin-top"] = "initial";
            sujets[i].style["margin-right"] = "10px"; 
        }else if (sujets[i].getAttribute("sujet") != sujet){
            sujets[i].style["opacity"] = "0";
            sujets[i].style["width"] = "0px";
            sujets[i].style["margin-top"] = "-500px";
            sujets[i].style["margin-right"] = "0px";            
        }
    }
    if (boutonRetour){
        //arrière plan bandeauHaut
        document.getElementById("bandeauHaut").style["backgroundColor"] = "initial";
        document.getElementById("bandeauHaut").style["color"] = "black";
        //masquer le contact
        document.getElementById("contact").style["opacity"] = "1";
        document.getElementById("contact").style["z-index"] = "2";
        document.getElementById("contact").style["margin-top"] = "initial";
        document.getElementById("contact").style["width"] = "initial";        
        document.getElementById("contact").style["padding"] = "20px";
        //afficher bouton retour
        document.getElementById("boutonRetour").style["opacity"] = "0";  
        document.getElementById("boutonRetour").style["margin-top"] = "-500px";  
    }else{
        //arrière plan bandeauHaut
        document.getElementById("bandeauHaut").style["backgroundColor"] = "black";
        document.getElementById("bandeauHaut").style["color"] = "white";
        //masquer le contact
        document.getElementById("contact").style["opacity"] = "0";
        document.getElementById("contact").style["z-index"] = "2";
        document.getElementById("contact").style["margin-top"] = "-500px";
        document.getElementById("contact").style["width"] = "80px";        
        document.getElementById("contact").style["padding"] = "0px";
        //afficher bouton retour
        document.getElementById("boutonRetour").style["opacity"] = "1";       
        document.getElementById("boutonRetour").style["margin-top"] = "initial";  
        }
    self.selectionSujetPage(sujet);
}

vue.prototype.clickTitre = function(idTitre){
    var elt = document.getElementById(idTitre);
    var next = elt.nextElementSibling;
    while ( next != null){
        if (next.style["display"] == "block" || next.style["display"] == ""){
            next.style["display"] = "none";
        }else{
            next.style["display"] = "block";        
        } 
        next = next.nextElementSibling;
    }
}

vue.prototype.buildContact = function(){
    var divContact = buildElement("div", undefined, "contact");
    var photo = buildElement("img", undefined, "photoCv");
    photo.setAttribute("src", "img/photoCv.jpg");
    var divCoordonne = buildElement("div", undefined, "coordonnee");
    divCoordonne.appendChild(buildElementFromData("span", "contact_prenom"));
    divCoordonne.appendChild(buildElementFromData("span", "contact_nom"));
    divContact.appendChild(photo);
    divContact.appendChild(divCoordonne);
    divContact.addEventListener("click", function(){
        self.afficherSujet("cv");

    });
    return divContact;
}

vue.prototype.show = function(sujet){
    var j = document.getElementById("fond").children.length;
		for (var i = 0; i< j;i++){
			document.getElementById("fond").removeChild(document.getElementById("fond").children[0]);
		}
        document.getElementById("fond").appendChild(this.body);
        this.selectionSujetPage(sujet);
}

vue.prototype.showById = function(id, element){
    document.getElementById(id).innerHTML = "";
    document.getElementById(id).appendChild(element);
}

//COMMON FUNCTIONS

function buildNavigation(selector){
    var div = buildElement("div");
    var node = getBd(selector);
    for (var key in node){
        if (key == "h2" || key == "h3" || key == "h4"){
            div.appendChild(buildElement(key, "navigation", undefined, node[key]));
            div.lastChild.setAttribute("href", "#"+ selector + "_" + key);
        }else if (typeof node[key] == "object"){
            div.appendChild(this.buildNavigation(selector + "_" + key));
        }
    }
    return div;
}

function buildContent(selector, className, id){
    var div = buildElement("div");
    var node = getBd(selector);
    div.className = className;
    div.id = id;
    for (var key in node){
        if (key == "img"){
            var div2 = buildElement(key);
            for (var key2 in node[key]){
                div2.setAttribute(key2, node[key][key2]);
            }
            div.appendChild(div2);
        }else if (key == "app"){
            div.appendChild(getApp(node[key]["nomApp"]));
        }else if (key.substring(0,5) == "liste"){
            var ul = buildElement("ul");
            for (var k = 0; k < node[key].length;k++){
                ul.appendChild(buildElement("li", undefined, undefined, node[key][k]));
            }
            div.appendChild(ul);
        }else if (typeof node[key] == "object"){
            div.appendChild(this.buildContent(selector + "_" + key, key));
        }else{
            if (key == "h2" || key == "h3" || key == "h4"){
                className += " titres";
                var divTitre = buildElement("div", "divTitre", selector);
                if (key=="h2"){divTitre.className += " divTitreH2";}
                if (key=="h3"){divTitre.className += " divTitreH3";}
                if (key=="h4"){divTitre.className += " divTitreH4";}
                var elt = buildElement(key, className, selector + "_" + key, node[key]);
                divTitre.addEventListener('click', function(){
                    self.clickTitre(this.getAttribute("id"));
                });
                divTitre.appendChild(elt);
                div.appendChild(divTitre);
            }else{
                var classe = "contenu";
                if (key.substring(0,5) == "liste"){
                    classe += " listeItem";
                }
                var type = "p";
                if (key.substring(0,4) == "span"){
                    type = "span";
                }
                div.appendChild(buildElement(type, classe, selector + "_" + key, node[key]));
            }
        }
    }
    return div;
}

function replaceAll(text, ceciPar, cela){
    var s=text.indexOf(ceciPar);
    while (s >= 0) {
        text=text.replace(ceciPar,cela);
        s=text.indexOf(ceciPar);
    }
    return text;
}

function buildElementFromData(type, data){
    return buildElement(type, replaceAll(data, "_", " "), data, getBd(data));
}

function buildElement(element, className, id, innerHTML, textContent, style){	
    var elementHTML = document.createElement(element);
    if(className != undefined){elementHTML.className = className;}
    if(id != undefined){elementHTML.id = id;}
    if(innerHTML != undefined){elementHTML.innerHTML = innerHTML;}
    if(textContent != undefined){elementHTML.textContent = textContent;}
    if (style != undefined){
        for (var i in style){
            elementHTML.style[i] = style[i];
        }
    }
    return elementHTML;
}

//APP
//SIMULATEURS

function getApp(app){
	
	if (app == "conversionHexaBinDec"){
		
		//conversion hexa binaire
		var divGlobal = buildElement("div", "appHexaBinDec");

		var divHexa = buildElement("div", "blockAppHexaBinDec",  "hexa");
		var divBin = buildElement("div", "blockAppHexaBinDec", "bin");
		var divDec = buildElement("div", "blockAppHexaBinDec", "dec");

		var labelHexa = buildElement("label", "labelHexa", undefined, "Hexadécimal");
		var labelBin = buildElement("label", "labelBin", undefined, "Binaire");
		var labelDec = buildElement("label", "labelDec", undefined, "Décimal");

		var inputHexa = buildElement("input", "inputHexaBinDec", "inputHexa");
		inputHexa.addEventListener('change', function(){
			var hexadecimalValue = document.getElementById("inputDec").value;
			document.getElementById("inputDec").value = parseInt(hexadecimalValue, 16);
			document.getElementById("inputBin").value = (parseInt(hexadecimalValue, 16)).toString(2);
		});
		var inputBin =  buildElement("input", "inputHexaBinDec", "inputBin");
		inputBin.addEventListener('change', function(){
			var binaryValue = document.getElementById("inputDec").value;
			document.getElementById("inputHexa").value = (parseInt(binaryValue, 2)).toString(16);
			document.getElementById("inputDec").value = parseInt(binaryValue, 2);
		});
		var inputDec =  buildElement("input", "inputHexaBinDec", "inputDec");
		inputDec.addEventListener('change', function(){
			var decimalValue = document.getElementById("inputDec").value;
			document.getElementById("inputHexa").value = parseInt(decimalValue, 10).toString(16);
			document.getElementById("inputBin").value = parseInt(decimalValue, 10).toString(2);
		});
		inputDec.type = "number";

		divDec.appendChild(labelDec);
		divDec.appendChild(inputDec);
		
		divHexa.appendChild(labelHexa);
		divHexa.appendChild(inputHexa);

		divBin.appendChild(labelBin);
		divBin.appendChild(inputBin);

		divGlobal.appendChild(divDec);
		divGlobal.appendChild(divHexa);
		divGlobal.appendChild(divBin);	
        
        var divGlobal2 = buildElement("div");
        divGlobal2.appendChild(divGlobal);
        
		return divGlobal2;
    }else if (app == "casseTeteChinois"){
        //pair = 1x1 et impair = 2x1 ou 1x2
        var scenarios = [
            [
                [1,3,3,5],
                [1,2,4,5],
                [0,10,10,0],
                [7,10,10,9],
                [7,6,8,9]
            ],
            [
                [2,1,3,0],
                [4,1,3,0],
                [5,5,10,10],
                [7,9,10,10],
                [7,9,6,8]
            ],
            [
                [1,1,2,4],
                [3,3,0,5],
                [7,7,0,5],
                [9,9,10,10],
                [6,8,10,10]
            ],
            [
                [1,1,3,3],
                [5,5,7,7],
                [2,10,10,9],
                [4,10,10,9],
                [6,8,0,0]
            ],
            [
                [1,1,10,10],
                [0,0,10,10],
                [2,4,6,8],
                [3,5,7,9],
                [3,5,7,9]
            ],
            [
                [1,3,2,4],
                [1,3,5,5],
                [0,0,10,10],
                [7,9,10,10],
                [7,9,6,8]
            ],
            [
                [2,1,1,4],
                [5,3,3,6],
                [5,7,0,0],
                [8,7,10,10],
                [9,9,10,10]
            ],
            [
                [1,1,10,10],
                [3,3,10,10],
                [5,5,0,0],
                [7,9,2,4],
                [7,9,6,8]
            ],
            [
                [10,10,2,4],
                [10,10,1,1],
                [0,0,3,3],
                [7,9,5,5],
                [7,9,6,8]
            ],
            [
                [1,3,5,5],
                [1,3,7,7],
                [9,9,0,0],
                [2,4,10,10],
                [6,8,10,10]
            ],
            [
                [10,10,2,4],
                [10,10,6,8],
                [0,0,1,1],
                [3,5,7,7],
                [3,5,9,9]
            ],
            [
                [1,3,10,10],
                [1,3,10,10],
                [5,5,0,0],
                [7,9,2,4],
                [7,9,6,8]
            ],
            [
                [2,10,10,6],
                [4,10,10,8],
                [0,1,1,0],
                [3,5,7,9],
                [3,5,7,9]
            ],
            [
                [1,10,10,2],
                [1,10,10,4],
                [0,3,3,0],
                [6,5,7,9],
                [8,5,7,9]
            ],
            [
                [1,3,5,6],
                [1,3,5,8],
                [0,0,2,4],
                [9,9,10,10],
                [7,7,10,10]
            ],
            [
                [2,3,5,7],
                [4,3,5,7],
                [8,6,0,0],
                [10,10,1,1],
                [10,10,9,9]
            ],
            [
                [2,4,6,8],
                [1,3,3,5],
                [1,0,0,5],
                [7,10,10,9],
                [7,10,10,9]
            ],
            [
                [2,10,10,6],
                [4,10,10,8],
                [0,1,1,0],
                [3,5,7,7],
                [3,5,9,9]
            ],
            [
                [1,2,4,3],
                [1,6,8,3],
                [5,10,10,0],
                [5,10,10,0],
                [7,7,9,9]
            ],
            [
                [1,2,4,3],
                [1,6,8,3],
                [0,10,10,5],
                [0,10,10,5],
                [7,7,9,9]
            ]
        ]
        var DIMENSION_CASE = 50; 
        var divCasseTeteChinois = buildElement("div", undefined, "divCasseTeteChinois");
       
        var getDimension = function(i, j, scenario, getHeight){
            var valeur = scenario[i][j];
            var height = 0;
            var width = 0;
            for (var t = i ; t< scenario.length;t++){
                if (scenario[t][j] == valeur){
                    height++;
                }
                for (var p = j ; p< scenario[t].length;p++){
                    if (scenario[t][p] == valeur){
                        width++;
                    }
                }  
                if (!getHeight){
                    return width;
                }          
            }
            return height;
        }

        var buildJeuCasseTeteChinois = function(scenario, idJeu){
            var NBRE_CASE = scenario.length; 
            var mouvement = false;
            var elementParcouru = [];
            var ajoutHeight = 0;
            var padding = 5;

            for (var i = 0;i<scenario.length;i++){
                for (var j = 0;j<scenario[i].length;j++){
                    if (!elementParcouru.includes(scenario[i][j]) && scenario[i][j] != 0){
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
                        ajoutHeight += (height );
                    }
                }
            }
        }

        var compt = 0;
        for (var i = 0; i< scenarios.length;i++){
            var divJeuCasseTeteChinois = buildElement("div", "divJeuCasseTeteChinois", "divJeuCasseTeteChinois" + i);
            divJeuCasseTeteChinois.style["height"] = (DIMENSION_CASE * scenarios[i].length) + "px";
            divJeuCasseTeteChinois.style["width"] = (DIMENSION_CASE * scenarios[i][0].length) + "px";
            buildJeuCasseTeteChinois(scenarios[i], i);
            var divEnglobe = buildElement("div", "divJeuCasseTeteChinoisEnglobe" );
            divEnglobe.appendChild(buildElement("span", "niveauJeuCasseTete", undefined, compt));
            divEnglobe.appendChild(divJeuCasseTeteChinois);
            divCasseTeteChinois.appendChild(divEnglobe);
            compt++;
        } 
        
        var divGlobalCasseTeteChinois = buildElement("div");
        divGlobalCasseTeteChinois.appendChild(divCasseTeteChinois);
        return divGlobalCasseTeteChinois;
    }

	
	
}