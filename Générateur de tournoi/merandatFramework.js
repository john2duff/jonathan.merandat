
//---------- INIT
{
    var globalDiv;
    var popupMask;
    var popupDiv;

    function init(){
        //création des éléments structurant
        globalDiv = buildElement("div", undefined, "global", "container-fluid");
        document.body.appendChild(globalDiv);
        popupMask = buildElement("div", undefined, "popupMask", "popupMask");
        document.body.appendChild(popupMask);
        popupDiv = buildElement("div", undefined, "popupView", "popupView");
        popupMask.appendChild(popupDiv);

        //import
        document.getElementById("bdTournoi").addEventListener('change', function() {   
            var fichier = new FileReader(); 
            fichier.onload = function() { 
                var json = JSON.parse(fichier.result);
                saveBD(json);
                refresh();
            }   
            fichier.readAsText(this.files[0]); 
        });
    }

}   

//--------- MODEL

    //explication de la syntaxe 
    //... TODO

    //Récupération de la configuration principale
    var mainConfig = {
        "nativeTypes": ["string", "integer"],
        "model": {
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
                "multiplicity": "n",
                "persistent": false 
            },
            "niveau": {
                "title": "Liste des niveaux", 
                "desc": "Les niveaux existants", 
                "columns": [
                    {   "title": "Niveau",
                        "desc": "Le genre", 
                        "type": "string",
                        "datas": ["P12", "P11", "P10"],
                        "defaultValue": "P12"
                    }
                ],
                "multiplicity": "n",
                "persistent": false
            },
            "typeTournoi": {
                "title": "Les types de tournoi", 
                "desc": "Il peut s'agir d'un tournoi simple ou double", 
                "columns": [
                    {   "title": "Type de tournoi",
                        "desc": "Le type de tournoi", 
                        "type": "string",
                        "datas": ["Simple", "Double"],
                        "defaultValue": "Simple"
                    }
                ],
                "multiplicity": "n",
                "persistent": false
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
                "multiplicity": "1",
                "persistent": false
            },
            "joueurs": {
                "title": "Joueurs",
                "desc": "Il s'agit de la liste des joueurs",
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
                    {   "type": "genre" },
                    {   "type": "niveau" }
                ], 
                "multiplicity": "n",
                "persistent": true
            }, 
            "preparation": {
                "title": "Préparation",
                "desc": "Préparation du tournoi", 
                "columns": [
                    { "type": "typeTournoi" },
                    { "type": "nombreTour" }
                ],
                "multiplicity": "1",
                "persistent": true
            },
            "nomDataBase": {
                "title": "Nom base de données", 
                "desc": "Nom du fichier base de données",
                "columns": [
                    {   "title": "Nom base de données", 
                        "desc": "Nom base de données",
                        "type": "string", 
                        "datas": "generateurTournoi"
                    }
                ],
                "multiplicity": "n",
                "persistent": false
            }
        },
        "views": {
            "joueurs": {
                "modelLink": "joueurs",
                "actions": ["add", "remove", "edit", "sensRevert"], 
                "sens": true
            }, 
            "preparation": {
                "modelLink": "preparation",
                "actions": ["edit", "sensRevert"], 
                "sens": true
            }
        }
    }

//----------View
    var TABLEAU = "Tableau";
    var FORMULAIRE = "Formulaire";
    var currentModeAffichage = TABLEAU;

    window.addEventListener("resize", function(){
        refresh();
    });

    function refresh(){
        currentModeAffichage = window.innerWidth > 500 ? TABLEAU : FORMULAIRE;
        for (var viewName in mainConfig["views"]){
            refreshView(mainConfig["views"][viewName], viewName);
        }
    }

    function refreshView(view, viewName){
        var domView = initView(viewName);
        domView.innerHTML = "";
        var modelLink = getConfigModel(view["modelLink"]);
        if (modelLink == undefined){
            console.error("Model lié à la vue introuvable : " + view["modelLink"]);
            return;
        }
        domView.appendChild(buildHeaderView(view, viewName, modelLink));
        domView.appendChild(buildBodyView(view, viewName, modelLink, false));
    }

    function initView(viewName) {
        var domView = document.getElementById(viewName); 
        if (domView == null){
            domView = buildElement("div", undefined, viewName, "container");
            globalDiv.appendChild(domView);
        }
        domView.innerHTML = "";
        return domView;
    }   

    //Construit l'entête de la vue
    function buildHeaderView(view, viewName, modelLink){
        var divTitre = buildElement("div", undefined, undefined, "stickyTop stickyLeft barItem");
        divTitre.setAttribute("title", modelLink["desc"]);
        var titre = buildElement("h4", modelLink["title"], undefined, "titleBarItem");
        divTitre.appendChild(titre);
        var divInterfaces = buildElement("div");
        if (view["actions"].includes("sensRevert")) 
            divInterfaces.appendChild(buildInverse(viewName));
        divTitre.appendChild(divInterfaces);
        return divTitre;
    }

    function buildBodyView(view, viewName, modelLink, modeEdition) {
        var datasLS = getBDItem(viewName);
        if (currentModeAffichage == FORMULAIRE || modeEdition) {
            return buildListForm(view, viewName, modelLink, datasLS, modeEdition);
        }else {
            return buildListTable(view, viewName, modelLink, datasLS);
        }
    }

    /****  CREATION TABLE  ******/
    {
        function buildListTable (view, viewName, modelLink, datasLS){
            var table = buildElement("table", undefined, undefined, "table");
            var columns = getColumns(modelLink);
            var sens = view["sens"];
            
            var editable = view["actions"].includes("edit");

            //remplissage du header
            if (sens){
                var thead = buildHeaderTable(columns, editable, sens); 
                table.appendChild(thead);
            }
            
            //remplissage du body
            var tbody;
            if (sens){
                tbody = buildBodyTable(view, viewName, columns, datasLS, editable);
            }else{
                tbody = buildBodyTableSensInverse(view, viewName, columns, datasLS, editable);
            }

            table.appendChild(tbody);
            return table;
        }

        function buildHeaderTable(columns, editable, sens){
            if (!sens) return;
            var thead = buildElement("thead", undefined, undefined, "headerTable");
            var currentTr = buildElement("tr");
            for (var i = 0; i < columns.length; i++){
                currentTr.appendChild(this.buildHeaderCell(columns[i]));
            }
            if (editable) currentTr.appendChild(buildElement("th"));
            thead.appendChild(currentTr);
            return thead;
        }

        function buildBodyTable(view, viewName, columns, datasLS, editable, idEdition) {
            editable &= idEdition == undefined; 
            var tbody = buildElement("thead", undefined, undefined, "bodyTable");
            var currentTr;
            currentTr = buildElement("tr");
            for (var i = 0; i < datasLS.length; i++){
                if (typeof(datasLS[i]) === "object"){
                    currentTr = buildRecordTable(datasLS[i], i);
                    if (editable) {
                        currentTr.appendChild(buildBodyEditCell(view, viewName, columns, datasLS)); 
                    }
                }else{
                    for (var i = 0; i < columns.length; i++){
                        buildRecordTable(datasLS[i], i, currentTr);
                    }
                }
                tbody.appendChild(currentTr);
            }

            if (editable && typeof(datasLS[0]) !== "object"){
                currentTr = buildElement("tr");
                for (var i = 0; i < columns.length; i++){
                    currentTr.appendChild(buildBodyEditCell(view, viewName, columns, datasLS)); 
                }
                tbody.appendChild(currentTr);
            }

            return tbody;
        }

        function buildBodyTableSensInverse(view, viewName, columns, datasLS, editable, id) {
            var tbody = buildElement("thead", undefined, undefined, "bodyTable");
            var currentTr;
        
            for (var i = 0; i < columns.length; i++){
                currentTr = buildElement("tr");
                currentTr.appendChild(this.buildHeaderCell(columns[i]));
                if (typeof(datasLS[i]) === "object"){
                    for (var j = 0; j < datasLS.length; j++){
                        buildRecordTable(datasLS[j][i], j, currentTr);
                    }
                }else{
                    buildRecordTable(datasLS[i], 0, currentTr);
                    currentTr.appendChild(buildBodyEditCell(view, viewName, columns, datasLS)); 
                }
                
                tbody.appendChild(currentTr);
            }
            if (editable && typeof(datasLS[0]) === "object"){
                currentTr = buildElement("tr");
                currentTr.appendChild(buildHeaderCell(view, viewName, columns, datasLS)); 
                for (var j = 0; j < datasLS.length; j++){
                    currentTr.appendChild(buildBodyEditCell(view, viewName, columns, datasLS)); 
                }
                tbody.appendChild(currentTr);
            }
            
            return tbody;
        }

        function buildRecordTable(datasLS, id, currentTr){
            if (currentTr == undefined) currentTr = buildElement("tr", undefined, id);
            if (typeof(datasLS) === "object"){
                for (var j = 0; j < datasLS.length; j++){
                    currentTr.appendChild(this.buildBodyCell(datasLS[j], j));
                }
            }else{
                currentTr.appendChild(this.buildBodyCell(datasLS, 0));
            }
            return currentTr;
        }

        function buildHeaderCell(modelLink){
            if (modelLink == undefined) {
                return buildElement("th");
            }else{
                currentTd = buildElement("th", modelLink["title"]);
                currentTd.setAttribute("type", modelLink["type"]);
                currentTd.setAttribute("title", modelLink["desc"]);
                return currentTd;
            }
        }

        function buildBodyEditCell(view, viewName, modelLink, datasLS){
            var td = buildElement("td");
            td.appendChild(buildEdit(view, viewName, modelLink, datasLS));
            return td;
        }

        function buildBodyCell(datasLS, id) {
            return buildElement("td", datasLS, id);
        }

    }

    /****  CREATION FORMULAIRE  ******/
    {
        function buildListForm(view, viewName, modelLink, datasLS, modeEdition){
            var columns = getColumns(modelLink);

            var sens = view["sens"];
            var divRetour = buildElement("div", undefined, viewName);
            var editable = view["actions"].includes("edit");
            
            divRetour = buildElement("div");

            var divAllParams;
            for (var i = 0; i < datasLS.length; i++){
                div = buildElement("div", undefined, undefined, "itemList ");
                divAllParams = buildElement("div", "", "allParamItem" + i, "allParamItem" + (sens ? "" : "Inverse "));
                divAllParams.appendChild(buildRecordForm(columns, datasLS[i], sens, i, modeEdition));
                if (editable){
                    divAllParams.appendChild(buildEdit(view, viewName, modelLink, datasLS[i]));
                }
                div.appendChild(divAllParams);
                
                divRetour.appendChild(div);
            }
            return divRetour;
        }

        function buildRecordForm(columns, datasLS, sens, id, modeEdition){
            var div = buildElement("div", null, id, "recordForm" + (sens ? "" : "Inverse "));
            if (typeof(datasLS) === "object"){
                for (var j = 0; j < columns.length; j++){
                    div.appendChild(this.buildItemForm(columns[j], datasLS[j], sens, id, modeEdition));
                }
            }else{
                div.appendChild(this.buildItemForm(columns, datasLS, modeEdition, sens, id, modeEdition));
            }
            return div;
        }

        //construire l'affichage d'un item dans une liste
        function buildItemForm(column, datasLS, sens, id, modeEdition){
            var divParam = buildElement("div", "", undefined, "recordItemForm" + (sens ? "" : "Inverse "));
            var label = buildElement("label", column["title"], undefined, "labelParamItem");
            label.setAttribute("type", column["type"]);
            divParam.appendChild(label);
            if (modeEdition){
                divParam.appendChild(buildItemEdition(column, datasLS)); 
            }else {
                divParam.appendChild(buildElement("span", datasLS, undefined, "valueParamItem"));                    
            }
            return divParam;
        }

        function buildItemEdition(column, datasLS, divRetour){
            
            if (divRetour == undefined) 
                divRetour = buildElement("div");

            if (mainConfig["nativeTypes"].includes(column["type"])){
                if (column["type"] == "string") {
                    input = buildElement("input", undefined, undefined, "valueParamItem");
                    input.value = datasLS;
                    input.placeholder = column["desc"];
                }else {
                    
                }
                return input;
            }else{
                for (var i in mainConfig["model"]){
                    if (i == column["type"]){
                        for (var j = 0; j < mainConfig["model"][i]["columns"].length; j++){
                            divRetour.appendChild(buildItemEdition(mainConfig["model"][i]["columns"][j], datasLS, divRetour));
                        }
                    }
                }
            }

            return divRetour;
        }

    }

    function getColumns(modelLink){
        var columns = [];
        for (var i = 0; i < modelLink["columns"].length; i++) {
            if (!mainConfig["nativeTypes"].includes(modelLink["columns"][i]["type"])){
                getRecursifColumn(mainConfig["model"], modelLink["columns"][i], columns);
            }else{
                columns.push(modelLink["columns"][i]);
            }
        }
        return columns;
    }
    function getRecursifColumn(node, column, columns){
        for (var i in node){
            if (i == column["type"]){
                for (var j = 0; j < node[i]["columns"].length; j++){
                    if (!mainConfig["nativeTypes"].includes(node[i]["columns"][j]["type"])){
                        var retour = [];
                        getRecursifColumn(mainConfig["model"], node[i]["columns"][j], retour);
                    }else{
                        columns.push(node[i]["columns"][j]);
                    }
                } 
            }
        }
        return null;
    }

    function buildNativeType(dynObj){
        return buildElement("span", dynObj);
    }

    function buildInverse(viewName){
        var buttonInverse = buildElement("button", "Inverser", undefined, "btn btn-light barItemInterface");
        buttonInverse.setAttribute("onclick", "inverseSens('" + viewName + "');");
        buttonInverse.value = "Inverse";
        return buttonInverse;
    }

    function buildEdit(view, viewName, modelLink, datasLS){
        var buttonEdition = buildElement("button", "Editer", undefined, "btn btn-light barItemInterface");
        buttonEdition.onclick = edit.bind(this, view, viewName, modelLink, datasLS);
        buttonEdition.value = "Editer";
        return buttonEdition;
    }

    function refreshPopup(actionName, view, viewName, modelLink, datasLS){
        popupDiv.innerHTML = "";
        popupDiv.innerHTML = buildPopup(actionName, view, viewName, modelLink, datasLS).innerHTML;
    }

    function buildPopup(actionName, view, viewName, modelLink, datasLS) {
        var popup = buildElement("div", undefined, "popupEdition", "popup");

        popup.appendChild(buildHeaderPopup(actionName, view, viewName, modelLink, datasLS));

        var bodyPopup = buildElement("div", undefined, undefined, "bodyPopup");
        bodyPopup.appendChild(buildHeaderView(view, viewName, modelLink));
        bodyPopup.appendChild(buildBodyView(view, viewName, modelLink, true))
        popup.appendChild(bodyPopup);

        popup.appendChild(buildFooterPopup(actionName, view, viewName, modelLink, datasLS));
        return popup;
    }

    function buildHeaderPopup(actionName, view, viewName, mdd, dynObj, dimension){
        var headerPopup = buildElement("div", undefined, undefined, "headerPopup");
        var title = buildElement("h4", actionName, undefined, "titleHeaderPopup");
        headerPopup.appendChild(title);
        return headerPopup;
    }
    function buildFooterPopup(actionName, view, viewName, mdd, dynObj, dimension){
        var footerPopup = buildElement("div", undefined, undefined, "footerPopup");

        return footerPopup;
    }

    function popupIsVisible(){
        return popupMask.style["display"] != "none";
    }

    function showPopup(actionName, view, viewName, modelLink, datasLS){
        refreshPopup(actionName, view, viewName, modelLink, datasLS);
        popupMask.style["display"] = "flex";
    }

    function hidePopup(){
        popupMask.style["display"] = "none";
    }

    //---------- ACTION 

    function inverseSens(viewName){
        mainConfig["views"][viewName]["sens"] = !mainConfig["views"][viewName]["sens"];  
        refresh();
    }
    function edit(view, viewName, modelLink, datasLS){
        showPopup("Modification", view, viewName, modelLink, datasLS);
    }

    

    

    function buildElement(type, innerHTML, id, className){
        var elt = document.createElement(type);
        if (id != undefined) elt.setAttribute("id", id);
        if (className != undefined) elt.setAttribute("class", className);
        if (innerHTML != undefined) elt.innerHTML = innerHTML;
        return elt;
    }   


//---------- BASE DE DONNEE LOCALE
{

    function getConfigModel(item){
        var retour = mainConfig["model"][item];
        if (retour == undefined) console.error("Model config inconnu : " + item);
        return retour;
    }

    function getBDItem(key, source){
        if (source == undefined) source = localStorage.getItem(getConfigModel("nomDataBase"));
        source = JSON.parse(source);           
        return getBDItemRecursif(source, key);
    }

    function getBDItemRecursif(source, key){
        for (var i in source) {
            if (i == key){
                return source[i];
            }else if (typeof(source[i]) == "object"){
                var retour = getBDItemRecursif(source[i], key);
                if (retour != null) return retour;
            }
        }
        return null;
    }

    function saveBD(source){
        localStorage.setItem(getConfigModel("nomDataBase"), JSON.stringify(source));
    }

    

    //export
    function exportTournoi() {
        var data = localStorage.getItem(mainConfig["nomBd"]);
        var name = "tournoi - " + new Date().getDate();
        var type = "application/json";
        var anchor = document.createElement("a");
        anchor.href = window.URL.createObjectURL(new Blob([data], {type}));
        anchor.download = name;
        anchor.click();
    }

}
