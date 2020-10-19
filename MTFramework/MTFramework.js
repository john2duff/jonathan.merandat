


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
    inverseSens(viewName){
        var layout = this.model.updateModel(viewName, "layout");
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
        this.model.updateModel(viewName, "layout", newLayout);
        this.refresh();
    }
    edit(modelName, idEdition){
        this.view.buildPopup(modelName, idEdition);
        this.view.showPopup();
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

    importBD(ctrl, evt) {   
        var fichier = new FileReader(); 
        fichier.onload = function() { 
            var json = JSON.parse(fichier.result);
            ctrl.model.saveBD(json);
            ctrl.refresh();
        }   
        fichier.readAsText(evt.target.files[0]); 
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

    //elementName peut être modelName ou viewName
    updateModel(elementName, key, value){
        var models = this.mainConfig["models"];
        var views;
        for (var model in models){
            if (model == elementName){
                if (value != undefined) models[model][key] = value;
                return models[model][key];
            }else{
                views = models[model]["views"];
                for (var view in views){
                    if (view == elementName){
                        if (value != undefined) views[view][key] = value;
                        return views[view][key];
                    }
                }
            }
        }
    }

    getModels(){
        return this.mainConfig["models"];
    }

    getModel(modelName) {
        var retour = this.mainConfig["models"][modelName];
        if (retour == undefined) console.error("Model inconnu : " + modelName);
        return retour;
    }

    getView(viewName) {
        var models = this.mainConfig["models"];
        var views;
        for (var model in models){
            views = models[model]["views"];
            for (var view in views){
                if (view == viewName){
                    return views[view];
                }
            }
        }
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
    listEvents = [];

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
        this.loadEvents();
        this.listEvents = [];
    }
    
    loadEvents(){
        for (var i = 0; i < this.listEvents.length; i++){
            document.getElementById(this.listEvents[i]["id"]).addEventListener(
                this.listEvents[i]["type"], 
                this.listEvents[i]["function"]);
        }
    }

    addNewEvent(id, type, func){
        this.listEvents.push({
            "id": id,
            "type": type,
            "function": func
        });
    }

    refreshHeaderPage(page){
        var buttonImport = buildElement("label", "Import", undefined, "btn-file");
        var input = buildElement("input", undefined, "buttonImport");
        input.setAttribute("type", "file");
        input.setAttribute("accept", ".json");
        input.style = "display:none;";
        this.addCustomEventListener("input#buttonImport","change",this.ctrl.importBD.bind(input, this.ctrl));
        buttonImport.appendChild(input);
        var buttonExport = buildElement("label", "Export");
        buttonExport.addEventListener("click", this.ctrl.exportBD.bind(this.ctrl));
        var dropDownImportExport = BSBuilder.dropDown("Import / Export", [buttonImport, buttonExport]);
        var navBar = BSBuilder.navBar(true, [dropDownImportExport]);
        navBar.insertBefore(page["header"], navBar.childNodes[0]);
        this.headerPage.innerHTML = "";
        this.headerPage.appendChild(navBar);
    }



    addCustomEventListener(selector, event, handler) {
        var rootElement = document.querySelector('body');
        rootElement.addEventListener(event, function (evt) {
                var targetElement = evt.target;
                while (targetElement != null) {
                    if (targetElement.matches(selector)) {
                        handler(evt);
                        return;
                    }
                    targetElement = targetElement.parentElement;
                }
            },
            true
        );
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

    buildHeaderView(model, modelName, view, viewName, id){
        var divTitre = buildElement("div", undefined, undefined, "stickyTop stickyLeft navBarView");
        divTitre.setAttribute("title", model["desc"]);
        divTitre.appendChild(model["title"]); //custom header
        var divInterfaces = buildElement("div");
        this.addActionView(viewName, view["actions"], id, divInterfaces);     
        divTitre.appendChild(divInterfaces);
        return divTitre;
    }

    addActionView(viewName, actions, id, divInterfaces){
        if (actions.includes("sensRevert")) 
            divInterfaces.appendChild(this.buildInverse(viewName, id));
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

    buildContent(column, data){
        if (this.currentIdEdition != null){
            return this.buildNativeEditor(column, data);
        }else{
            return this.buildNativeViewer(column, data);
        }
    }
    
    buildNativeViewer(column, data){
        switch(column["type"]){
            case "string":
            case "integer":
            default:
            return buildElement("span", data);
        }
    }

    buildNativeEditor(column, data){
        var input;
        if (data == null) data = column["defaultValue"];

        switch(column["type"]){
            case "string":
                input = buildElement("input", undefined, undefined, "valueParamItem");
                input.type = "text";
                input.value = datas;
                input.placeholder = column["desc"];
                return input;
            case "integer":
                input = buildElement("input", undefined, undefined, "valueParamItem");
                input.type = "number";
                input.value = datas;
                input.placeholder = column["desc"];
                input.setAttribute("min", column["restriction"]["min"]);
                input.setAttribute("max", column["restriction"]["max"]);
                return input;
        }

        var modelName = column["type"];
        var model = this.model.getModel(modelName);
        var viewName = column["view"];
        var view = this.model.getView(viewName);
        return this.buildView(model, modelName, view, viewName);
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
        if (datas == undefined) datas = [[""]];
        var dimensionBoth = model["dimension"] === "both";
        var tbody = buildElement("tbody", undefined, undefined, "bodyTable");
        var currentTr;

        for (var i = 0; i < datas.length; i++){
            currentTr = buildElement("tr", undefined, i);
            this.buildRecordTable(columns, datas[i], i, currentTr);
            if (editable && dimensionBoth){
                currentTr.appendChild(this.buildBodyEditRecord(modelName, i)); 
            }

            tbody.appendChild(currentTr);
        }

        return tbody;
    }

    buildRecordTable(columns, datas, id, currentTr){
        for (var i = 0; i < columns.length; i++){
            currentTr.appendChild(this.buildBodyCell(columns[i], datas[i], id));
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
                currentTr.appendChild(this.buildBodyEditRecord(modelName, i)); 
            }
            tbody.appendChild(currentTr);
        }
        
        return tbody;
    }

    buildRecordTableInverse(column, datas, id, currentTr){
        for (var i = 0; i < datas.length; i++){
            currentTr.appendChild(this.buildBodyCell(column, datas[i], id));
        }
    }

    buildHeaderCell(title, type, desc){
        var th = buildElement("th", title);
        th.setAttribute("type", type);
        th.setAttribute("title", desc);
        return th;
    }

    buildBodyEditRecord(modelName, idEdition){
        var td = buildElement("td");
        td.appendChild(this.buildEdit(modelName, idEdition));
        return td;
    }

    buildBodyCell(column, data, id) {
        var content = this.buildContent(column, data);
        return buildElement("td", content.innerHTML, id);
    }

    /****  CREATION FORMULAIRE  ******/
    buildListForm(model, modelName, view, sens){
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
            this.buildRecordForm(columns, datas[i], sens, i, divAllParams);
            div.appendChild(divAllParams);
            if (editable){
                div.appendChild(this.buildEdit(modelName, i));
            }
            divRetour.appendChild(div);
        }
        
        return divRetour;
    }

    buildRecordForm(columns, datas, sens, id, div){
        for (var i = 0; i < columns.length; i++){
            div.appendChild(this.buildItemForm(columns[i], datas[i], sens, id));
        }
    }

    buildItemForm(column, datas, sens, id) {
        var divParam = buildElement("div", "", undefined, "recordItemForm" + (sens ? "" : "Inverse "));
        var label = buildElement("label", this.model.getColumnTitle(column), undefined, "labelRecordItemForm");
        label.setAttribute("type", column["type"]);
        label.setAttribute("title", this.model.getColumnDesc(column));
        divParam.appendChild(label);
        var valueDiv = buildElement("div", undefined, undefined, "valueRecordItemForm");
        valueDiv.appendChild(this.buildContent(column, datas, id));
        divParam.appendChild(valueDiv);                    
        return divParam;
    }

    /****  ACTIONS ******/
    buildInverse(viewName, id){
        var idInverse = viewName + id;
        var buttonInverse = buildElement("button", "Inverser", idInverse, "btn btn-light barItemInterface");
        buttonInverse.value = "Inverse";
        this.addNewEvent(idInverse, "click", this.ctrl.inverseSens.bind(this.ctrl, viewName));
        return buttonInverse;
    }

    buildEdit(modelName, id){
        var buttonEdition = buildElement("button", "Editer", "modelName" + id, "btn btn-light barItemInterface");
        //this.addCustomEventListener("button#" + "modelName" + id,"click",this.ctrl.edit.bind(this.ctrl, modelName, id));
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

    buildPopup(modelName, idEdition) {

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
    

