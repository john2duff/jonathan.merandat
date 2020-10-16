
var MTFramework = function(config){
    return new MTFrameworkController(config);
}

/****  CONTROLLER ******/ 
class MTFrameworkController {
    constructor(config) {
        this.init(config);
    }

    init(config) {
        this.model = new MTFrameworkModel(config);
        this.view.init(this.model, idButtonImport);
    }

    /****  ACTIONS ******/
    inverseSens(modelName){
        this.model.inverseSens();
        refresh();
    }
    edit(model, modelName, modelLink, datas){
        this.view.showPopup("Modification - " + modelName, model, modelName, modelLink, datas, true);
    }

    validEdit(model, modelName){
        var columns = model["columns"];
        var datas = this.view.getInputValues(columns);
        this.model.saveBDItem(modelName, datas);
        this.view.hidePopup(); //fermer la popup
        this.view.refreshPage();
    }
    cancelEdit(model, modelName, modelLink, datas){
        this.view.showPopup("Modification - " + modelName, model, modelName, modelLink, datas, true);
    }

    getInputValue(column, div){
        var input = div.querySelector(column["title"]);
        var type = column["type"];
        if (this.model.getNativeTypes().includes(type)) {
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

/****  MODEL ******/ 
class MTFrameworkModel {
    constructor(config) {
        this.init(config);
    }

    init(config) {
        this.mainConfig = config; 
        this.dbName = config["dataBaseName"]; 
        this.db = null;
        if (dbName != undefined){
            db = JSON.parse(localStorage.getItem(dbName));
        }
    }

    inverseSens(){
        this.mainConfig["models"][modelName]["view"]["sens"] = !this.mainConfig["models"][modelName]["view"]["sens"];  
    }

    getColumn(column, first){
        var retour = [];
        if (this.getNativeTypes().includes(column["type"])){
            retour.push(column);
            return first ? column : retour;
        }else {
            var model = this.getModel(column["type"]);
            if (model == null){
                console.error("Ce type : " + column["type"] + " n'est pas défini dans les modèles");
            }else{
                for (var i = 0; i < model["columns"].length; i++){
                    retour.push(this.getColumn(model["columns"][i], first));
                }
                return first ? model["columns"][0] : retour;
            }
        }
    
    }

    getNativeTypes(){
        return this.mainConfig["nativeTypes"];
    }

    getModels = function(){
        return this.mainConfig["models"];
    }

    getModel = function(item) {
        var retour = this.mainConfig["models"][item];
        if (retour == undefined) console.error("Model inconnu : " + item);
        return retour;
    }

    isNativeType(column){
        return this.mainConfig["nativeTypes"].includes(column["type"]);
    }

    getPages() {
        return this.mainConfig["pages"];
    }

    getHomePage() {
        return this.getPages()["Home"];
    }

    saveBDItem(itemName, item, root) {
        if (root == undefined) root = this.db;
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

    getBDItem(key, root){
        if (root == undefined) root = this.db;
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

    exportBD() {
        var data = localStorage.getItem(this.dataBaseName);
        var name = "export - " + new Date().getDate();
        var type = "application/json";
        var anchor = document.createElement("a");
        anchor.href = window.URL.createObjectURL(new Blob([data], {type}));
        anchor.download = name;
        anchor.click();
    }

}

/****  VIEW ******/
class MTFrameworkView {
    constructor(model, idButtonImport) {
        this.init(model, idButtonImport);
    }

    currentPage = null;

    init(model, idButtonImport){
        this.model = model;
        //création des éléments structurant
        this.headerPage = buildElement("div", undefined, "headerPage", "container");
        document.body.appendChild(this.headerPage);
        this.globalView = buildElement("div", undefined, "globalView", "container");
        document.body.appendChild(this.globalView);
        this.popupMask = buildElement("div", undefined, "popupMask", "popupMask");
        document.body.appendChild(this.popupMask);
        this.popupDiv = buildElement("div", undefined, "popupView", "popupView");
        popupMask.appendChild(this.popupDiv);
        //resize
        window.addEventListener("resize", function(){
            this.refresh();
        });
        //import
        if (idButtonImport != undefined){
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

    refreshPage(pageName){
        if (currentPage == null) currentPage = this.model.getHomePage();
        var pages = this.model["pages"];
        for (var page in pages){
            if (pageName != undefined && page == pageName){
                this.refreshHeaderPage(pages[page]);
                this.refreshViews(pages[page]["modelViews"]);
            }
        }
    }

    refreshHeaderPage(page){
        this.headerPage.innerHTML = page["header"].innerHTML;
    }

    refreshViews(models){
        this.currentViewMode = window.innerWidth > 500 ? TABLEAU : FORMULAIRE;
        var model;
        var modelsInCurrentPage = this.model.getModels();
        for (var modelView in modelsInCurrentPage){
            for (var model in models){
                if (modelView === model && models[model]["view"]["display"] === true){
                    this.refreshView(model, modelName, getBDItem(modelName));
                }
            }
        }
    }

    refreshView(model, modelName, datas, root, titre){
        switch (model["view"]["layout"]){
            case "TOFR": //tableOrFormResponsive
                this.refreshViewTOFR(model, modelName, datas, root, titre);
            break;
        }
    }

    refreshViewTOFR(model, modelName, datas, root, titre){
        var domView = this.initView(modelName, root);
        domView.innerHTML = this.buildView(model, modelName, datas, false, titre).innerHTML;
    }

    initView(modelName, root) {
        if (root == undefined) root = globalDiv;
        var domView = document.getElementById(modelName); 
        if (domView == null){
            domView = buildElement("div", undefined, modelName, "container");
            root.appendChild(domView);
        }
        domView.innerHTML = "";
        return domView;
    } 

    buildView(model, modelName, datas, modeEdition, titre){
        var div = buildElement("div");
        div.appendChild(this.buildHeaderView(model, modelName, datas, titre));
        div.appendChild(this.buildBodyView(model, modelName, datas, modeEdition));
        div.appendChild(this.buildFooterView(model, modelName, datas, titre));

        return div;
    }

    buildHeaderView(model, modelName, titre){
        if (titre == undefined) titre = model["title"];
        var divTitre = buildElement("div", undefined, undefined, "stickyTop stickyLeft barItem");
        divTitre.setAttribute("title", model["desc"]);
        var titre = buildElement("h4", titre, undefined, "titleBarItem");
        divTitre.appendChild(titre);
        var divInterfaces = buildElement("div");
        if (model["view"]["actions"].includes("sensRevert")) {
            divInterfaces.appendChild(this.buildInverse(modelName));
        }
        divTitre.appendChild(divInterfaces);
        return divTitre;
    }

    buildBodyView(model, modelName, datas, modeEdition) {
        if (currentViewMode == FORMULAIRE || modeEdition) {
            return this.buildListForm(model, modelName, datas, modeEdition);
        }else {
            return this.buildListTable(model, modelName, datas);
        }
    }

    buildHeaderView(model, modelName){
        var divTitre = buildElement("div", undefined, undefined, "stickyBottom stickyLeft barItem");
        divTitre.setAttribute("title", model["desc"]);
        var titre = buildElement("h4", titre, undefined, "titleBarItem");
        divTitre.appendChild(titre);
        var divInterfaces = buildElement("div");
        if (model["view"]["actions"].includes("sensRevert")) {
            divInterfaces.appendChild(this.buildInverse(modelName));
        }
        divTitre.appendChild(divInterfaces);
        return divTitre;
    }
    
    buildNativeType(dynObj){
        return buildElement("span", dynObj);
    }

    getInputValues(){
        var retour = [];
        //on récupère les données
        for (var i = 0; i < columns.length; i++){
            retour.push(this.getInputValue(columns[i], popupDiv));
        }
    }
    
    /****  CREATION TABLE  ******/

    buildListTable(model, modelName, datas, croisement){
        var table = buildElement("table", undefined, modelName, "table");
        var sens = model["view"]["sens"];
        var editable = model["view"]["actions"].includes("edit");
        var croisement1 = croisement === "1";

        //remplissage du header
        if (sens && !croisement1){
            var thead = this.buildHeaderTable(model, editable, sens); 
            table.appendChild(thead);
        }
        
        //remplissage du body
        var tbody;
        if (sens){
            tbody = this.buildBodyTable(model, modelName, datas, editable, croisement);
        }else{
            tbody = this.buildBodyTableSensInverse(model, modelName, datas, editable);
        }

        table.appendChild(tbody);
        return table;
    }

    buildHeaderTable(model, editable){
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

    buildBodyTable(model, modelName, datas, editable) {
        var columns = model["columns"];
        var dimensionBoth = model["dimension"] === "both";
        var tbody = buildElement("tbody", undefined, undefined, "bodyTable");
        var currentTr;
        if (typeof(datas) != "object") datas = [datas];

        for (var i = 0; i < datas.length; i++){
            currentTr = buildElement("tr", undefined, i);
            this.buildRecordTable(columns, datas[i], i, currentTr);
            if (editable && dimensionBoth){
                currentTr.appendChild(this.buildBodyEditCell(model, modelName, columns, datas)); 
            }

            tbody.appendChild(currentTr);
        }

        return tbody;
    }

    buildRecordTable(columns, datas, id, currentTr){
        for (var i = 0; i < columns.length; i++){
            if (this.isNativeType(columns[i])){
                currentTr.appendChild(this.buildBodyCell(datas[i], id));
            }else{
                var croisement = columns[i]["croisement"];
                if (croisement === "1"){
                    currentTr.appendChild(this.buildBodyCell(datas[i], id));
                }else{
                    var model = getModel(columns[i]["type"]);
                    currentTr.appendChild(this.buildListTable(model, columns[i]["type"], datas[i], croisement));
                }
            }
        }
    }

    buildBodyTableSensInverse(model, modelName, datas, editable) {
        var columns = model["columns"];
        var dimensionBoth = model["dimension"] === "both";
        var tbody = buildElement("tbody", undefined, undefined, "bodyTable");
        var currentTr;
        var datasCustom;
        var column;
        for (var i = 0; i < columns.length; i++){
            currentTr = buildElement("tr");
            column = this.model.getColumn(columns[i], true);
            currentTr.appendChild(this.buildHeaderCell(column["title"], column["type"], column["desc"]));
            datasCustom = [];
            for (var j = 0; j < datas.length; j++){
                datasCustom.push(datas[j][i]);
            }
            this.buildRecordTableInverse(columns[i], datasCustom, i, currentTr);
            tbody.appendChild(currentTr);
        }
        if (editable && dimensionBoth){
            currentTr = buildElement("tr");
            currentTr.appendChild(buildElement("th"));
            for (var i = 0; i < datas.length; i++){
                currentTr.appendChild(this.buildBodyEditCell(model, modelName, columns, datas)); 
            }
            tbody.appendChild(currentTr);
        }
        
        return tbody;
    }

    buildRecordTableInverse(column, datas, id, currentTr){
        for (var i = 0; i < datas.length; i++){
            if (this.isNativeType(column)){
                currentTr.appendChild(this.buildBodyCell(datas[i], id));
            }else{
                var croisement = column["croisement"];
                if (croisement === "1"){
                    currentTr.appendChild(this.buildBodyCell(datas[i], id));
                }else{
                    var model = this.model.getModel(column["type"]);
                    currentTr.appendChild(this.buildListTable(model, column["type"], datas[i], croisement));
                }
            }
        }
    }

    buildHeaderCell(title, type, desc){
        var th = buildElement("th", title);
        th.setAttribute("type", type);
        th.setAttribute("title", desc);
        return th;
    }

    buildBodyEditCell(model, modelName, datas){
        var td = buildElement("td");
        td.appendChild(this.buildEdit(model, modelName, datas));
        return td;
    }

    buildBodyCell(datas, id) {
        return buildElement("td", datas, id);
    }

    /****  CREATION FORMULAIRE  ******/
    buildListForm(model, modelName, datas, modeEdition){
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
            this.buildRecordForm(columns, datas[i], sens, modeEdition, divAllParams);
            div.appendChild(divAllParams);
            if (editable){
                div.appendChild(this.buildEdit(model, modelName, datas[i]));
            }
            divRetour.appendChild(div);
        }
        
        return divRetour;
    }

    buildRecordForm(columns, datas, sens, modeEdition, div){
        for (var i = 0; i < columns.length; i++){
            if (this.isNativeType(columns[i])){
                div.appendChild(this.buildItemForm(columns[i], datas[i], sens, i, modeEdition));
            }else{
                var croisement = columns[i]["croisement"];
                if (croisement === "1"){
                    var column = getColumn(columns[i], true);
                    div.appendChild(this.buildItemForm(column, datas[i], sens, i, modeEdition));
                }else{
                    var model = getModel(columns[i]["type"]);
                    currentTr.appendChild(this.buildListForm(model, columns[i]["type"], datas[i], modeEdition));
                }
            }

        }
    }

    buildItemForm(column, datas, sens, id, modeEdition) {
        var divParam = buildElement("div", "", undefined, "recordItemForm" + (sens ? "" : "Inverse "));
        var label = buildElement("label", column["title"], undefined, "labelParamItem");
        label.setAttribute("type", column["type"]);
        divParam.appendChild(label);
        if (modeEdition){
            divParam.appendChild(this.buildItemEdition(column, datas)); 
        }else {
            divParam.appendChild(buildElement("span", datas, undefined, "valueParamItem"));                    
        }
        return divParam;
    }

    buildItemEdition(column, datas){
        
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

     /****  ACTIONS ******/
     buildInverse(modelName){
        var buttonInverse = buildElement("button", "Inverser", undefined, "btn btn-light barItemInterface");
        buttonInverse.setAttribute("onclick", "inverseSens('" + modelName + "');");
        buttonInverse.value = "Inverse";
        return buttonInverse;
    }

    buildEdit(model, modelName, columns, datas){
        var buttonEdition = buildElement("button", "Editer", undefined, "btn btn-light barItemInterface");
        buttonEdition.onclick = edit.bind(this, model, modelName, columns, datas);
        buttonEdition.value = "Editer";
        return buttonEdition;
    }
    
    buildValid(model, modelName, modelLink, datas){
        var buttonValid = buildElement("button", "Valider", undefined, "btn btn-primary buttonValidEdit");
        buttonValid.onclick = validEdit.bind(this, model, modelName, columns);
        buttonValid.value = "Editer";
        return buttonValid;
    }
    
    buildCancel(){
        var buttonCancel = buildElement("button", "Editer", undefined, "btn btn-secondary buttonCancelEdit");
        buttonCancel.onclick = cancelEdit.bind(this);
        buttonCancel.value = "Editer";
        return buttonCancel;
    }

    /****  POPUP ******/
    refreshPopup(actionName, model, modelName, modelLink, datas, modeEdition){
        popupDiv.innerHTML = "";
        popupDiv.innerHTML = buildPopup(actionName, model, modelName, modelLink, datas, modeEdition).innerHTML;
    }

    buildPopup(titre, model, modelName, modelLink, datas, modeEdition) {
        var popup = buildElement("div", undefined, "popupEdition", "popup");

        var bodyPopup = buildElement("div", undefined, undefined, "bodyPopup");
        bodyPopup.appendChild(buildView(model, modelName, modelLink, datas, modeEdition, titre));
        popup.appendChild(bodyPopup);

        popup.appendChild(buildFooterPopup(actionName, model, modelName, modelLink, datas));
        return popup;
    }

    buildHeaderPopup(actionName, model, modelName, mdd, dynObj, dimension){
        var headerPopup = buildElement("div", undefined, undefined, "headerPopup");
        var title = buildElement("h4", actionName, undefined, "titleHeaderPopup");
        headerPopup.appendChild(title);
        return headerPopup;
    }
    buildFooterPopup(actionName, model, modelName, mdd, dynObj, dimension){
        var footerPopup = buildElement("div", undefined, undefined, "footerPopup");

        return footerPopup;
    }

    popupIsVisible(){
        return popupMask.style["display"] != "none";
    }

    showPopup(actionName, model, modelName, modelLink, datas, modeEdition){
        refreshPopup(actionName, model, modelName, modelLink, datas, modeEdition);
        popupMask.style["display"] = "flex";
    }

    hidePopup(){
        popupMask.style["display"] = "none";
    }

}

/****  MISC ******/
{
    function buildElement(type, innerHTML, id, className, style){
        var elt = document.createElement(type);
        if (id != undefined) elt.setAttribute("id", id);
        if (className != undefined) elt.setAttribute("class", className);
        if (innerHTML != undefined) elt.innerHTML = innerHTML;
        if (style != undefined) elt.style = style;
        return elt;
    }  
}
    

