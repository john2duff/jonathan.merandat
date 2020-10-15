
//---------- INIT
{
    var mainConfig;
    var globalDiv;
    var popupMask;
    var popupDiv;
    var dbName; //le nom de la base de données globale
    var db; //la base de données globale

    function init(dataBaseName, idButtonImport, config){

        dbName = dataBaseName;
        if (dbName != undefined){
            db = JSON.parse(localStorage.getItem(dbName));
        }else{
            console.error("problème dans le nom de la base de données");
        }

        mainConfig = config;

        //création des éléments structurant
        globalDiv = buildElement("div", undefined, "global", "container");
        document.body.appendChild(globalDiv);
        popupMask = buildElement("div", undefined, "popupMask", "popupMask");
        document.body.appendChild(popupMask);
        popupDiv = buildElement("div", undefined, "popupView", "popupView");
        popupMask.appendChild(popupDiv);


        //import
        document.getElementById(idButtonImport).addEventListener('change', function() {   
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

/****  VIEW ******/
{
    var TABLEAU = "Tableau";
    var FORMULAIRE = "Formulaire";
    var currentModeAffichage = TABLEAU;

    window.addEventListener("resize", function(){
        refresh();
    });

    function refresh(){
        currentModeAffichage = window.innerWidth > 500 ? TABLEAU : FORMULAIRE;
        var model;
        for (var modelName in mainConfig["models"]){
            model = mainConfig["models"][modelName];
            if (model["view"]["display"] === true){
                refreshView(model, modelName, getBDItem(modelName));
            }
        }
    }

    function refreshView(model, modelName, datas, root, titre){
        switch (model["view"]["layout"]){
            case "TOFR": //tableOrFormResponsive
                refreshViewTOFR(model, modelName, datas, root, titre);
            break;
        }
    }

    function refreshViewTOFR(model, modelName, datas, root, titre){
        var domView = initView(modelName, root);
        domView.innerHTML = buildView(model, modelName, datas, false, titre).innerHTML;
    }

    function initView(modelName, root) {
        if (root == undefined) root = globalDiv;
        var domView = document.getElementById(modelName); 
        if (domView == null){
            domView = buildElement("div", undefined, modelName, "container");
            root.appendChild(domView);
        }
        domView.innerHTML = "";
        return domView;
    }   

    function buildView(model, modelName, datas, modeEdition, titre){
        var div = buildElement("div");
        div.appendChild(buildHeaderView(model, modelName, datas, titre));
        div.appendChild(buildBodyView(model, modelName, datas, modeEdition));
        return div;
    }

    //Construit l'entête de la vue
    function buildHeaderView(model, modelName, datas, titre){
        if (titre == undefined) titre = model["title"];
        var divTitre = buildElement("div", undefined, undefined, "stickyTop stickyLeft barItem");
        divTitre.setAttribute("title", model["desc"]);
        var titre = buildElement("h4", titre, undefined, "titleBarItem");
        divTitre.appendChild(titre);
        var divInterfaces = buildElement("div");
        if (model["view"]["actions"].includes("sensRevert")) {
            divInterfaces.appendChild(buildInverse(modelName));
        }
        divTitre.appendChild(divInterfaces);
        return divTitre;
    }

    function buildBodyView(model, modelName, datas, modeEdition) {
        if (currentModeAffichage == FORMULAIRE || modeEdition) {
            return buildListForm(model, modelName, datas, modeEdition);
        }else {
            return buildListTable(model, modelName, datas);
        }
    }
}

/****  CREATION TABLE  ******/
{
    function buildListTable (model, modelName, datas, croisement){
        var table = buildElement("table", undefined, modelName, "table");
        var sens = model["view"]["sens"];
        var dimensionNone = model["dimension"] === "none";
        var dimensionVerti = model["dimension"] === "verti";
        var editable = model["view"]["actions"].includes("edit");
        var croisement1 = croisement === "1";

        //remplissage du header
        if (sens && !croisement1){
            var thead = buildHeaderTable(model, editable, sens); 
            table.appendChild(thead);
        }
        
        //remplissage du body
        var tbody;
        if (sens){
            tbody = buildBodyTable(model, modelName, datas, editable, croisement);
        }else{
            tbody = buildBodyTableSensInverse(model, modelName, datas, editable);
        }

        table.appendChild(tbody);
        return table;
    }

    function buildHeaderTable(model, editable){
        var thead = buildElement("thead", undefined, undefined, "headerTable");
        var currentTr = buildElement("tr");
        var dimensionBoth = model["dimension"] === "both";
        var columns = model["columns"];

        var column;
        for (var i = 0; i < columns.length; i++){
            column = getColumn(columns[i], true);
            currentTr.appendChild(this.buildHeaderCell(column["title"], column["type"], column["desc"]));
        }

        if (editable && dimensionBoth) currentTr.appendChild(buildElement("th"));
        thead.appendChild(currentTr);
        return thead;
    }

    function buildBodyTable(model, modelName, datas, editable) {
        var columns = model["columns"];
        var dimensionBoth = model["dimension"] === "both";
        var tbody = buildElement("tbody", undefined, undefined, "bodyTable");
        var currentTr;
        if (typeof(datas) != "object") datas = [datas];

        for (var i = 0; i < datas.length; i++){
            currentTr = buildElement("tr", undefined, i);
            buildRecordTable(columns, datas[i], i, currentTr);
            if (editable && dimensionBoth){
                currentTr.appendChild(buildBodyEditCell(model, modelName, columns, datas)); 
            }

            tbody.appendChild(currentTr);
        }

        return tbody;
    }

    function buildRecordTable(columns, datas, id, currentTr){
        for (var i = 0; i < columns.length; i++){
            if (isNativeType(columns[i])){
                currentTr.appendChild(buildBodyCell(datas[i], id));
            }else{
                var croisement = columns[i]["croisement"];
                if (croisement === "1"){
                    currentTr.appendChild(buildBodyCell(datas[i], id));
                }else{
                    var model = getModel(columns[i]["type"]);
                    currentTr.appendChild(buildListTable(model, columns[i]["type"], datas[i], croisement));
                }
            }
        }
    }

    function buildBodyTableSensInverse(model, modelName, datas, editable) {
        var columns = model["columns"];
        var dimensionBoth = model["dimension"] === "both";
        var tbody = buildElement("tbody", undefined, undefined, "bodyTable");
        var currentTr;
        var datasCustom;
        var column;
        for (var i = 0; i < columns.length; i++){
            currentTr = buildElement("tr");
            column = getColumn(columns[i], true);
            currentTr.appendChild(this.buildHeaderCell(column["title"], column["type"], column["desc"]));
            datasCustom = [];
            for (var j = 0; j < datas.length; j++){
                datasCustom.push(datas[j][i]);
            }
            buildRecordTableInverse(columns[i], datasCustom, i, currentTr);
            tbody.appendChild(currentTr);
        }
        if (editable && dimensionBoth){
            currentTr = buildElement("tr");
            currentTr.appendChild(buildElement("th"));
            for (var i = 0; i < datas.length; i++){
                currentTr.appendChild(buildBodyEditCell(model, modelName, columns, datas)); 
            }
            tbody.appendChild(currentTr);
        }
        
        return tbody;
    }

    function buildRecordTableInverse(column, datas, id, currentTr){
        for (var i = 0; i < datas.length; i++){
            if (isNativeType(column)){
                currentTr.appendChild(buildBodyCell(datas[i], id));
            }else{
                var croisement = column["croisement"];
                if (croisement === "1"){
                    currentTr.appendChild(buildBodyCell(datas[i], id));
                }else{
                    var model = getModel(column["type"]);
                    currentTr.appendChild(buildListTable(model, column["type"], datas[i], croisement));
                }
            }
        }
    }

    function buildHeaderCell(title, type, desc){
        var th = buildElement("th", title);
        th.setAttribute("type", type);
        th.setAttribute("title", desc);
        return th;
    }

    function buildBodyEditCell(model, modelName, datas){
        var td = buildElement("td");
        td.appendChild(buildEdit(model, modelName, datas));
        return td;
    }

    function buildBodyCell(datas, id) {
        return buildElement("td", datas, id);
    }

}

/****  CREATION FORMULAIRE  ******/
{
    function buildListForm(model, modelName, datas, modeEdition){
        var dimension = model["dimension"];

        var sens = model["view"]["sens"];
        var divRetour = buildElement("div", undefined, modelName);
        var editable = model["view"]["actions"].includes("edit");
        var columns = model["columns"];
        
        divRetour = buildElement("div");

        var divAllParams;
        var div;
        if (typeof(datas) != "object") datas = [datas];

        for (var i = 0; i < datas.length; i++){
            div = buildElement("div", undefined, undefined, "recordForm" + (sens ? "" : "Inverse "));
            divAllParams = buildElement("div", "", "allRecordItemForm" + i, "allRecordItemForm" + (sens ? "" : "Inverse "));
            buildRecordForm(columns, datas[i], sens, modeEdition, divAllParams);
            div.appendChild(divAllParams);
            if (editable){
                div.appendChild(buildEdit(model, modelName, datas[i]));
            }
            divRetour.appendChild(div);
        }
        
        return divRetour;
    }

    function buildRecordForm(columns, datas, sens, modeEdition, div){
        for (var i = 0; i < columns.length; i++){
            if (isNativeType(columns[i])){
                div.appendChild(buildItemForm(columns[i], datas[i], sens, i, modeEdition));
            }else{
                var croisement = columns[i]["croisement"];
                if (croisement === "1"){
                    var column = getColumn(columns[i], true);
                    div.appendChild(buildItemForm(column, datas[i], sens, i, modeEdition));
                }else{
                    var model = getModel(columns[i]["type"]);
                    currentTr.appendChild(buildListForm(model, columns[i]["type"], datas[i], modeEdition));
                }
            }

        }
    }

    //construire l'affichage d'un item dans une liste
    function buildItemForm(column, datas, sens, id, modeEdition) {
        var divParam = buildElement("div", "", undefined, "recordItemForm" + (sens ? "" : "Inverse "));
        var label = buildElement("label", column["title"], undefined, "labelParamItem");
        label.setAttribute("type", column["type"]);
        divParam.appendChild(label);
        if (modeEdition){
            divParam.appendChild(buildItemEdition(column, datas)); 
        }else {
            divParam.appendChild(buildElement("span", datas, undefined, "valueParamItem"));                    
        }
        return divParam;
    }

    function buildItemEdition(column, datas){
        
        if (datas == null) datas = column["defaultValue"];

        if (column["type"] == "string") {
            input = buildElement("input", undefined, undefined, "valueParamItem");
            input.type = "text";
            input.value = datas;
            input.placeholder = column["desc"];
        }else if (column["type"] == "integer") {
            input = buildElement("input", undefined, undefined, "valueParamItem");
            input.type = "number";
            input.value = datas;
            input.placeholder = column["desc"];
            input.setAttribute("min", column["restriction"]["min"]);
            input.setAttribute("max", column["restriction"]["max"]);
        }
        return input;
    }

}

function getColumn(column, first){
    var retour = [];
    if (mainConfig["nativeTypes"].includes(column["type"])){
        retour.push(column);
        return first ? column : retour;
    }else {
        var model = getModel(column["type"]);
        if (model == null){
            console.error("Ce type : " + column["type"] + " n'est pas défini dans les modèles");
        }else{
            for (var i = 0; i < model["columns"].length; i++){
                retour.push(getColumn(model["columns"][i], first));
            }
            return first ? model["columns"][0] : retour;
        }
    }

}

function isNativeType(column){
    return mainConfig["nativeTypes"].includes(column["type"]);
}

function buildNativeType(dynObj){
    return buildElement("span", dynObj);
}

/****  ACTIONS ******/
{
    function buildInverse(modelName){
        var buttonInverse = buildElement("button", "Inverser", undefined, "btn btn-light barItemInterface");
        buttonInverse.setAttribute("onclick", "inverseSens('" + modelName + "');");
        buttonInverse.value = "Inverse";
        return buttonInverse;
    }

    function buildEdit(model, modelName, columns, datas){
        var buttonEdition = buildElement("button", "Editer", undefined, "btn btn-light barItemInterface");
        buttonEdition.onclick = edit.bind(this, model, modelName, columns, datas);
        buttonEdition.value = "Editer";
        return buttonEdition;
    }

    
    function buildValid(model, modelName, modelLink, datas){
        var buttonValid = buildElement("button", "Valider", undefined, "btn btn-primary buttonValidEdit");
        buttonValid.onclick = validEdit.bind(this, model, modelName, columns);
        buttonValid.value = "Editer";
        return buttonValid;
    }

    
    function buildCancel(){
        var buttonCancel = buildElement("button", "Editer", undefined, "btn btn-secondary buttonCancelEdit");
        buttonCancel.onclick = cancelEdit.bind(this);
        buttonCancel.value = "Editer";
        return buttonCancel;
    }

    function inverseSens(modelName){
        mainConfig["models"][modelName]["view"]["sens"] = !mainConfig["models"][modelName]["view"]["sens"];  
        refresh();
    }
    function edit(model, modelName, modelLink, datas){
        showPopup("Modification - " + modelName, model, modelName, modelLink, datas, true);
    }
    function validEdit(model, modelName){

        var columns = model["columns"];
        //on récupère les données
        for (var i = 0; i < columns.length; i++){
            getInputValue(columns[i], popupDiv);
        }
        //enregistrer les modif

        //fermer la popup
        hidePopup();
        refresh();
    }
    function cancelEdit(model, modelName, modelLink, datas){
        showPopup("Modification - " + modelName, model, modelName, modelLink, datas, true);
    }

    function getInputValue(column, div){
        var input = div.querySelector(column["title"]);
        var type = column["type"];
        if (mainConfig["nativeTypes"].includes(type)) {
            console.error("type non reconnu : " + type);
            return;
        }
        switch (column["type"]){
            case "string":
                return input.value;
            case "integer":
                return input.value;
            default: 
            console.error("type onn reconnu : " + column["type"]);
                break;
        }
    }
}

/****  POPUP ******/
{
    function refreshPopup(actionName, model, modelName, modelLink, datas, modeEdition){
        popupDiv.innerHTML = "";
        popupDiv.innerHTML = buildPopup(actionName, model, modelName, modelLink, datas, modeEdition).innerHTML;
    }

    function buildPopup(titre, model, modelName, modelLink, datas, modeEdition) {
        var popup = buildElement("div", undefined, "popupEdition", "popup");

        var bodyPopup = buildElement("div", undefined, undefined, "bodyPopup");
        bodyPopup.appendChild(buildView(model, modelName, modelLink, datas, modeEdition, titre));
        popup.appendChild(bodyPopup);

        popup.appendChild(buildFooterPopup(actionName, model, modelName, modelLink, datas));
        return popup;
    }

    function buildHeaderPopup(actionName, model, modelName, mdd, dynObj, dimension){
        var headerPopup = buildElement("div", undefined, undefined, "headerPopup");
        var title = buildElement("h4", actionName, undefined, "titleHeaderPopup");
        headerPopup.appendChild(title);
        return headerPopup;
    }
    function buildFooterPopup(actionName, model, modelName, mdd, dynObj, dimension){
        var footerPopup = buildElement("div", undefined, undefined, "footerPopup");

        return footerPopup;
    }

    function popupIsVisible(){
        return popupMask.style["display"] != "none";
    }

    function showPopup(actionName, model, modelName, modelLink, datas, modeEdition){
        refreshPopup(actionName, model, modelName, modelLink, datas, modeEdition);
        popupMask.style["display"] = "flex";
    }

    function hidePopup(){
        popupMask.style["display"] = "none";
    }
}

/****  MISC ******/
{
    function buildElement(type, innerHTML, id, className){
        var elt = document.createElement(type);
        if (id != undefined) elt.setAttribute("id", id);
        if (className != undefined) elt.setAttribute("class", className);
        if (innerHTML != undefined) elt.innerHTML = innerHTML;
        return elt;
    }  
}
    
//---------- BASE DE DONNEE LOCALE
{

    function getModel(item){
        var retour = mainConfig["models"][item];
        if (retour == undefined) console.error("Model inconnu : " + item);
        return retour;
    }

    function saveBDItem(itemName, item, root){
        if (root == undefined) root = db;
        for (var i in root) {
            if (i == itemName){
                root[i] = item;
                saveBD();
                return;
            }else if (typeof(root[i]) == "object"){
                saveItem(itemName, item, root[i]);
            }
        }
        console.error("Item pour enregistrement non trouvé");
        return null;
    }

    function getBDItem(key, root){
        if (root == undefined) root = db;
        for (var i in root) {
            if (i == key){
                return root[i];
            }else if (typeof(root[i]) == "object"){
                var retour = getBDItem(key, root[i]);
                if (retour != null) return retour;
            }
        }
        return null;
    }

    function saveBD(source){
        if (source == undefined) source = db;
        localStorage.setItem(dbName, JSON.stringify(source));
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
