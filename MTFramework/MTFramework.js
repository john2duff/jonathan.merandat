


var MTFramework = function(container, config){
    return new MTFrameworkController(container, config);
}

/****  CONTROLLER ******/ 
class MTFrameworkController {
    constructor(container, config) {
        this.init(container, config);
        this.refresh();
    }

    init(container, config) {
        this.model = new MTFrameworkModel(container, config);
        this.view = new MTFrameworkView(this.model, this);
        //resize
        window.addEventListener("resize", this.resize.bind(this));
    }

    resize(){
        this.refresh(); 
    }

    refresh(){
        this.view.refreshPage();
    }

    /****  ACTIONS ******/
    inverseSens(modelName, viewName){
        var layout = this.model.getModel(modelName)["views"][viewName]["layout"];
        var newLayout;
        if (layout == "TOFR"){
            newLayout = "TOFR-inverse";
        }else if (layout == "TOFR-inverse"){
            newLayout = "TOFR";
        }else if (layout == "TR-inverse"){
            newLayout = "TR";
        }else if (layout == "TR"){
            newLayout = "TR-inverse";
        }else if (layout == "FR"){
            newLayout = "FR-inverse";
        }else if (layout == "FR-inverse"){
            newLayout = "FR";
        }
        this.model.getModel(modelName)["views"][viewName]["layout"] = newLayout;
        this.refresh();
    }
    edit(model, modelName, idEdition){
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

    exportBD() {
        var data = this.model.getDatas(true);
        var name = "export - " + new Date().getDate();
        var type = "application/json";
        var anchor = document.createElement("a");
        anchor.href = window.URL.createObjectURL(new Blob([data], {type}));
        anchor.download = name;
        anchor.click();
    }

    importBD(ctrl) {   
        var fichier = new FileReader(); 
        fichier.onload = function() { 
            var json = JSON.parse(fichier.result);
            ctrl.model.saveBD(json);
            ctrl.refresh();
        }   
        fichier.readAsText(this.files[0]); 
    }

}

/****  MODEL ******/ 
class MTFrameworkModel {
    constructor(container, config) {
        this.init(container, config);
    }

    init(container, config) {
        this.mainConfig = config; 
        this.mainConfig["container"] = container;
        this.dbName = config["dataBaseName"]; 
        this.loadDatas(JSON.parse(localStorage.getItem(this.dbName)), false);
    }

    loadDatas(source, reset){
        var models = this.mainConfig["models"];
        for (var key in source){
            for (var key2 in models){
                if (key === key2){
                    if (reset || models[key2]["datas"] == undefined) models[key2]["datas"] = [];
                    for (var i = 0; i < models[key2]["columns"].length; i++){
                        if (i < source[key].length){
                            models[key2]["datas"].push(source[key][i]);
                        }else{
                            models[key2]["datas"].push("");
                        }
                    }
                }
            }
        }
    }

    getAllDatas(onlyPersistent){
        var datas = {};
        if (onlyPersistent){
            var persistentModels = this.mainConfig["persistentModels"];
            for (var i = 0; i < persistentModels.length; i++){
                datas[persistentModels[i]] = this.getModelDatas(persistentModels[i]);
            }
        }else{
            var models = this.mainConfig["models"];
            for (var model in models){
                datas[model] = this.getModelDatas(model);
            }
        }
        return datas;
    }

    getModelDatas(modelName){
        return this.getModel(modelName)["datas"];
    }

    getNativeTypes(){
        return this.mainConfig["nativeTypes"];
    }

    getModels(){
        return this.mainConfig["models"];
    }

    getModel(modelName) {
        var retour = this.mainConfig["models"][modelName];
        if (retour == undefined) console.error("Model inconnu : " + modelName);
        return retour;
    }

    getColumnTitle(column){
        if (this.isNativeType(column)){
            return column["title"];
        }else{
            return this.getModel(column["type"])["title"];
        }
    }

    getColumnDesc(column){
        if (this.isNativeType(column)){
            return column["desc"];
        }else{
            return this.getModel(column["type"])["desc"];
        }
    }

    isNativeType(column){
        return this.mainConfig["nativeTypes"].includes(column["type"]);
    }

    getPages() {
        return this.mainConfig["pages"];
    }

    getHomePage() {
        return this.mainConfig["homePage"];
    }

    getContainer() {
        return this.mainConfig["container"];
    }

    saveBD(){
        localStorage.setItem(this.dbName, JSON.stringify(this.getAllDatas(true)));
    }
}

/****  VIEW ******/
class MTFrameworkView {
    constructor(model, ctrl) {
        this.init(model, ctrl);
    }

    currentPage = null;
    TABLEAU = "Tableau";
    FORMULAIRE = "Formulaire";
    currentIdEdition = null;

    init(model, ctrl){
        this.model = model;
        this.ctrl = ctrl;
        var container = this.model.getContainer();
        //création des éléments structurant
        this.headerPage = buildElement("div", undefined, "headerPage", "container");
        container.appendChild(this.headerPage);
        this.globalView = buildElement("div", undefined, "globalView", "container");
        container.appendChild(this.globalView);
        this.popupMask = buildElement("div", undefined, "popupMask", "popupMask");
        container.appendChild(this.popupMask);
        this.popupDiv = buildElement("div", undefined, "popupView", "popupView");
        popupMask.appendChild(this.popupDiv);
    }

    refreshPage(pageName){
        if (this.currentPage == null) this.currentPage = this.model.getHomePage(); 
        if (pageName != undefined) this.currentPage = pageName;        
        
        var pages = this.model.getPages();
        for (var page in pages){
            if (page == this.currentPage){
                this.refreshHeaderPage(pages[page]);
                this.refreshViews(pages[page]["views"]);
            }
        }
    }

    refreshHeaderPage(page){
        var buttonImport = buildElement("label", "Import", undefined, "btn-file");
        var input = buildElement("input", undefined, "buttonImport");
        input.setAttribute("type", "file");
        input.setAttribute("accept", ".json");
        input.style = "display:none;";
        buttonImport.appendChild(input);
        var buttonExport = buildElement("label",  "Export");
        buttonExport.addEventListener("click", this.ctrl.exportBD.bind(this.ctrl));
        var dropDownImportExport = BSBuilder.dropDown("Import / Export", [buttonImport, buttonExport]);
        var navBar = BSBuilder.navBar(true, [dropDownImportExport]);
        navBar.insertBefore(page["header"], navBar.childNodes[0]);
        this.headerPage.innerHTML = "";
        this.headerPage.appendChild(navBar);
        document.getElementById("buttonImport").addEventListener("change", this.ctrl.importBD.bind(document.getElementById("buttonImport"), this.ctrl));
    }

    refreshViews(views){
        var models = this.model.getModels();
        var viewsInModel;
        for (var i = 0; i < views.length; i++){
            for (var model in models){
                viewsInModel = models[model]["views"];
                for (var view in viewsInModel){
                    if (view === views[i]){
                        this.refreshView(models[model], model, viewsInModel[view], view);
                    }
                }
            }
        }
        
    }

    refreshView(model, modelName, view, viewName){
        var domView = this.initView(modelName);
        domView.innerHTML = this.buildView(model, modelName, view, viewName).innerHTML;
    }

    initView(modelName) {
        var domView = document.getElementById(modelName); 
        if (domView == null){
            domView = buildElement("div", undefined, modelName, "container");
            this.model.getContainer().appendChild(domView);
        }
        domView.innerHTML = "";
        return domView;
    } 

    buildView(model, modelName, view, viewName){
        var div = buildElement("div");
        div.appendChild(this.buildHeaderView(model, modelName, view, viewName));
        div.appendChild(this.buildBodyView(model, modelName, view));
        div.appendChild(this.buildFooterView(model, modelName, view));
        return div;
    }

    buildHeaderView(model, modelName, view, viewName){
        var divTitre = buildElement("div", undefined, undefined, "stickyTop stickyLeft navBarView");
        divTitre.setAttribute("title", model["desc"]);
        divTitre.appendChild(view["header"]); //custom header
        var divInterfaces = buildElement("div");
        this.addActionView(modelName, viewName, view["actions"], divInterfaces);     
        divTitre.appendChild(divInterfaces);
        return divTitre;
    }

    addActionView(modelName, viewName, actions, divInterfaces){
        if (actions.includes("sensRevert")) divInterfaces.appendChild(this.buildInverse(modelName, viewName));
        //TODO
        //if (actions.includes("add")) divInterfaces.appendChild(this.buildAdd(modelName));
    }

    buildBodyView(model, modelName, view) {
        var layout = view["layout"];
        switch (layout){
            case "TOFR": //tableOrFormResponsive
            case "TOFR-inverse": //tableOrFormResponsive sens inverse
                this.currentViewMode = window.innerWidth > 500 ? this.TABLEAU : this.FORMULAIRE;
                if (this.currentViewMode == this.FORMULAIRE) {
                    return this.buildListForm(model, modelName, view, layout != "TOFR");
                }else {
                    return this.buildListTable(model, modelName, view, layout != "TOFR-inverse");
                }
            case "TR": //tableResponsive
                return this.buildListTable(model, modelName, view, true);
            case "TR-inverse": //tableResponsive sens inverse
                return this.buildListTable(model, modelName, view, false);
            case "FR": //formResponsive sens inverse
                return this.buildListForm(model, modelName, view, true);
            case "FR-inverse": //formResponsive sens inverse
                return this.buildListForm(model, modelName, view, false);
        }
    }

    buildFooterView(model, modelName){
        var divTitre = buildElement("div", undefined, undefined, "stickyBottom stickyLeft barItem");
        divTitre.setAttribute("title", model["desc"]);
        var titre = buildElement("h4", titre, undefined, "titleBarItem");
        divTitre.appendChild(titre);
        var divInterfaces = buildElement("div");
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

    buildListTable(model, modelName, view, sens, croisement){
        var table = buildElement("table", undefined, modelName, "table");
        var editable = view["actions"].includes("edit");

        //remplissage du header
        if (sens){
            var thead = this.buildHeaderTable(model, editable, sens); 
            table.appendChild(thead);
        }
        
        //remplissage du body
        var tbody;
        if (sens){
            tbody = this.buildBodyTable(model, modelName, editable, croisement);
        }else{
            tbody = this.buildBodyTableSensInverse(model, modelName, editable);
        }

        table.appendChild(tbody);
        return table;
    }

    buildHeaderTable(model, editable){
        var thead = buildElement("thead", undefined, undefined, "headerTable");
        var currentTr = buildElement("tr");
        var dimensionBoth = model["dimension"] === "both";
        var columns = model["columns"];

        var title;
        var desc;
        for (var i = 0; i < columns.length; i++){
            title = this.model.getColumnTitle(columns[i]);
            desc = this.model.getColumnDesc(columns[i]);
            currentTr.appendChild(this.buildHeaderCell(title, columns[i]["type"], desc));
        }

        if (editable && dimensionBoth) currentTr.appendChild(buildElement("th"));
        thead.appendChild(currentTr);
        return thead;
    }

    buildBodyTable(model, modelName, editable) {
        var columns = model["columns"];
        var datas = model["datas"];
        var dimensionBoth = model["dimension"] === "both";
        var tbody = buildElement("tbody", undefined, undefined, "bodyTable");
        var currentTr;

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
            currentTr.appendChild(this.buildBodyCell(datas[i], id));
        }
    }

    buildBodyTableSensInverse(model, modelName, editable) {
        var columns = model["columns"];
        var datas = model["datas"];
        var dimensionBoth = model["dimension"] === "both";
        var tbody = buildElement("tbody", undefined, undefined, "bodyTable");
        var currentTr;
        var datasCustom;
        var title;
        var desc;
        for (var i = 0; i < columns.length; i++){
            currentTr = buildElement("tr");
            title = this.model.getColumnTitle(columns[i]);
            desc = this.model.getColumnDesc(columns[i]);
            currentTr.appendChild(this.buildHeaderCell(title, columns[i]["type"], desc));
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

    buildRecordTableInverse(datas, id, currentTr){
        for (var i = 0; i < datas.length; i++){
            currentTr.appendChild(this.buildBodyCell(datas[i], id));
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
    buildListForm(model, modelName, view, modeEdition, sens){
        var columns = model["columns"];
        var datas = model["datas"];
        var divRetour = buildElement("div", undefined, modelName);
        var editable = view["actions"].includes("edit");
        
        divRetour = buildElement("div");

        var divAllParams;
        var div;

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
            div.appendChild(this.buildItemForm(columns[i], datas[i], sens, i, modeEdition));
        }
    }

    buildItemForm(column, datas, sens, id, modeEdition) {
        var divParam = buildElement("div", "", undefined, "recordItemForm" + (sens ? "" : "Inverse "));
        var label = buildElement("label", column["title"], undefined, "labelRecordItemForm");
        label.setAttribute("type", column["type"]);
        divParam.appendChild(label);
        if (modeEdition){
            divParam.appendChild(this.buildItemEdition(column, datas)); 
        }else {
            divParam.appendChild(buildElement("span", datas, undefined, "valueRecordItemForm"));                    
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
    buildInverse(modelName, viewName){
        var buttonInverse = buildElement("button", "Inverser", undefined, "btn btn-light barItemInterface");
        buttonInverse.addEventListener("click", this.ctrl.inverseSens.bind(this.ctrl, modelName, viewName));
        buttonInverse.value = "Inverse";
        return buttonInverse;
    }

    buildEdit(model, modelName, columns, datas){
        var buttonEdition = buildElement("button", "Editer", undefined, "btn btn-light barItemInterface");
        buttonEdition.onclick = this.ctrl.edit.bind(this, model, modelName, columns, datas);
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
    refreshPopup(popupName){
        var popups = this.model.getPopups();
        for (var popup in popups){
            if (popup == popupName){
                this.refreshHeaderPopup(popups[popup]);
                this.refreshViews(popups[popup]["views"]);
            }
        }
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
    

