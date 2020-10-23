

var MTFramework = function(container, config){
    return new MTFrameworkController(container, config);
}

/****  CONTROLLER ******/ 
class MTFrameworkController {
    constructor(container, config, parent) {
        this.init(container, config, parent);
        this.refresh();
    }

    init(container, config, parent) {
        this.model = new MTFrameworkModel(container, config);
        this.view = new MTFrameworkView(this.model, this);
        this.parent = parent == undefined ? null : parent;
        //resize
        window.addEventListener("resize", this.resize.bind(this));
    }

    resize(){
        if (this.view.popupVisible) return;
        this.refresh(); 
    }

    refresh(){
        this.view.refreshPage();
    }

    /****  ACTIONS ******/
    inverseSens(viewName){
        var layout = this.model.getViewAttribute(viewName, "layout");
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
        this.model.setViewAttribute(viewName, "layout", newLayout);
        this.refresh();
    }
    editRecord(viewName, indexRow){
        this.view.modeEdition = viewName;
        this.view.currentEditionIndexRow = indexRow;
        this.view.createPopup();
        this.view.showPopup();
        this.refresh();
    }

    add(viewName){
        this.view.modeEdition = viewName;
        this.view.currentEditionIndexRow = -1;
        this.view.createPopup();
        this.view.showPopup();
        this.refresh();
    }

    valid(viewName, model){
        if (this.view.currentEditionIndexRow != -1){
            this.view.saveInputValues(viewName, model);
        }else{
            this.view.addRecord(viewName, model);
        }
        this.view.modeEdition = null;
        this.view.currentEditionIndexRow = null;
        this.view.hidePopup();
        this.model.saveBD();
        this.refresh();
    }
    cancel(){
        this.view.modeEdition = null;
        this.view.currentEditionIndexRow = null;
        this.view.hidePopup();
        this.refresh();
    }

    remove(viewName, indexRow){
        this.model.removeRecord(viewName, indexRow);
        this.view.modeEdition = null;
        this.view.currentEditionIndexRow = null;
        this.view.hidePopup();
        this.refresh();
    }

    select(idRecord){
        var record = document.querySelector("#" + idRecord);
        var list = record.parentElement;
        if (list.classList.contains("selectionSimple")){
            //on déselectionne tout
            var checkbox;
            for (var i = 0; i < list.children.length; i++){
                checkbox = list.children[i].querySelector("input");
                checkbox.removeAttribute("checked");
            }
        }

        var checkbox = record.querySelector("input");
        checkbox.setAttribute("checked", "");
    }

    showListComboBox(idInputComboBox){
        var inputComboBox = document.querySelector("#" + idInputComboBox);
        if (inputComboBox.nextElementSibling.style["display"] == "block"){
            this.hideListComboBox(inputComboBox.nextElementSibling);
        }else{
            inputComboBox.nextElementSibling.style["display"] = "block";
        }
    }
    hideListComboBox(list){
        list.style["display"] = "";
    }
    selectItemComboBox(idItem){
        var item = document.querySelector("#" + idItem);
        item.parentElement.parentElement.previousElementSibling.innerHTML = item.querySelector(".viewer").innerHTML;
        this.select(idItem);
        this.hideListComboBox(item.parentElement.parentElement);
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
            ctrl.model.loadDatas(json, true);
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
        this.mainConfig["container"] = [container];
        this.dbName = config["dataBaseName"]; 
        this.loadDatas(JSON.parse(localStorage.getItem(this.dbName)), false);
    }

    addRecord(viewName, datas){
        var models = this.mainConfig["models"];
        var views;
        for (var model in models){
            views = models[model]["views"];
            for (var view in views){
                if (view == viewName){
                    models[model]["datas"].push(datas);
                    return true;
                }
            }
        }
        console.error("vue non trouvée : " + viewName);
        return false;
    }

    removeRecord(viewName, indexRow){
        var models = this.mainConfig["models"];
        var views;
        for (var model in models){
            views = models[model]["views"];
            for (var view in views){
                if (view == viewName){
                    models[model]["datas"].splice(indexRow, 1);
                    return true;
                }
            }
        }
        console.error("vue non trouvée : " + viewName);
        return false;
    }

    //charger toutes les données dans la config
    loadDatas(source, reset){
        var models = this.mainConfig["models"];
        for (var key in source){
            for (var key2 in models){
                if (key === key2){
                    if (reset || models[key2]["datas"] == undefined) models[key2]["datas"] = [];
                    for (var i = 0; i < source[key].length; i++){
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

    //récupère toutes les données à stocker
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

    //récuprère une donnée précise (view - colonne - ligne)
    getDataModel(viewName, indexColumn, indexRow){
        var models = this.mainConfig["models"];
        var views;
        for (var model in models){
            views = models[model]["views"];
            for (var view in views){
                if (view == viewName){
                    return models[model]["datas"][indexRow][indexColumn];
                }
            }
        }
    }

    //met à jour une donnée dans un modèle
    setDataModel(viewName, indexColumn, indexRow, value){
        var models = this.mainConfig["models"];
        var views;
        for (var model in models){
            views = models[model]["views"];
            for (var view in views){
                if (view == viewName){
                    models[model]["datas"][indexRow][indexColumn] = value;
                    return true;
                }
            }
        }
        console.error("vue non trouvée : " + viewName);
        return false;
    }

    getModelDatas(modelName){
        return this.getModel(modelName)["datas"];
    }

    getNativeTypes(){
        return this.mainConfig["nativeTypes"];
    }

    //met à jour une clef dans une view (côté model)
    setViewAttribute(viewName, key, value){
        var models = this.mainConfig["models"];
        var views;
        for (var model in models){
            views = models[model]["views"];
            for (var view in views){
                if (view == viewName){
                    views[view][key] = value;
                    return value;
                }
            }
        }
        return null;
    }

    getViewAttribute(viewName, key){
        var models = this.mainConfig["models"];
        var views;
        for (var model in models){
            views = models[model]["views"];
            for (var view in views){
                if (view == viewName){
                    return views[view][key];
                }
            }
        }
        return null;
    }

    getDefaultValue(viewName){
        var model = this.getModelByViewName(viewName);
        switch (model["dimension"]){
            case "none":
            case "verti":
                return model["columns"][0]["defaultValue"];
            case "horiz":
            case "both":
                var retour = "";
                for (var i = 0; i < model["columns"].length; i++){
                    retour += model["columns"]["defaultValue"];
                    if (i < model["columns"].length) retour += ";";
                }
                return retour;
        }
    }

    getModels(){
        return this.mainConfig["models"];
    }

    getModel(modelName) {
        var retour = this.getModels()[modelName];
        return retour;
    }

    getView(viewName){
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

    getModelByViewName(viewName){
        var models = this.mainConfig["models"];
        var views;
        for (var model in models){
            views = models[model]["views"];
            for (var view in views){
                if (view == viewName){
                    return models[model];
                }
            }
        }
        return false;
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

    saveBD(){
        localStorage.setItem(this.dbName, JSON.stringify(this.getAllDatas(true)));
    }
}

/****  VIEW ******/
class MTFrameworkView {
    constructor(model, ctrl) {
        this.init(model, ctrl);
    }

    context = [];

    currentViewName = null;
    currentPageName = null;
    currentModelName = null;
    currentSelection = null;
    currentDataSelected = null;
    currentComboBox = null;
    currentColumn = null;
    currentIndexColumn = null;
    currentRow = null;
    currentIndexRow = null;
    currentView = null;
    currentModel = null;
    currentSens = null;
    currentEditionIndexRow = null;

    popupVisible = false;

    idCompt = 0;
    pageQueue = [];
    TABLEAU = "Tableau";
    FORMULAIRE = "Formulaire";
    modeEdition = null;
    modeSelection = null;
    listEvents = [];

    getNewId(){
        var newId = "id" + this.idCompt;
        this.idCompt++;
        return newId;
    }

    getColumnTitle(){
        var column = this.currentColumn;
        if (this.model.isNativeType(column)){
            return column["title"];
        }else{
            return this.model.getModel(column["type"])["title"];
        }
    }

    getColumnDesc(){
        var column = this.currentColumn;
        if (this.model.isNativeType(column)){
            return column["desc"];
        }else{
            return this.model.getModel(column["type"])["desc"];
        }
    }

    getContainer() {
        return this.model.mainConfig["container"][this.model.mainConfig["container"].length - 1];
    }

    init(model, ctrl){
        this.model = model;
        this.ctrl = ctrl;
        var container = this.getContainer();
        //création des éléments structurant
        this.headerPage = buildElement("div", undefined, "headerPage", "container");
        container.appendChild(this.headerPage);
        this.globalView = buildElement("div", undefined, "globalView", "container");
        container.appendChild(this.globalView);

    }

    refreshPage(pageName){

        if (this.modeEdition != null){
            this.refreshPopup();
            this.loadEvents();
        }else{
            this.idCompt = 0;

            if (this.pageQueue.length == 0) this.pageQueue.push(this.model.getHomePage()); 
            if (pageName != undefined) this.currentPage = pageName;        
            
            var pages = this.model.getPages();
            for (var page in pages){
                if (page == this.pageQueue[this.pageQueue.length - 1]){
                    this.currentPageName = page;
                    this.refreshHeaderPage(pages[page]);
                    this.refreshViews(pages[page]["views"]);
                }
            }
            this.loadEvents();
        }
        
    }
    
    loadEvents(){
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
    }

    addNewEvent(id, type, func){
        this.listEvents.push({
            "id": id,
            "type": type,
            "function": func
        });
    }

    saveInputValues(viewName, model){
        var indexRow = this.currentEditionIndexRow;
        var debut = "dataEditor-" + viewName;
        var columns = model["columns"];
        var column;
        var domElement;
        var type;
        for (var indexColumn = 0; indexColumn < columns.length; indexColumn++){
            column = columns[indexColumn];
            domElement = document.querySelector("*[datamodel='" + debut + "-" + indexRow + "-" + indexColumn + "']");
            type = column["type"];
            switch (column["type"]){
                case "string":
                case "integer":
                    this.model.setDataModel(viewName, indexColumn, indexRow, domElement.value);
                    break;
                default: 
                    this.model.setDataModel(viewName, indexColumn, indexRow, this.getValueSelection(domElement));
                    break;
            }
        }
    }


    getValueSelection(domElement){
        var retour = "";
        var elt = domElement.querySelector(".buttonComboBox");
        if (elt != null){
            retour = elt.innerHTML;
        }else{
            elt = domElement.querySelectorAll("input[checked]");
            for (var i = 0; i < elt.length; i++){
                retour += elt[i].parentElement.querySelector("span.viewer").innerHTML;
                if (i < elt.length - 1) retour += " ; ";
            }
        }
        return retour;

    }

    addRecord(viewName, model){
        var indexRow = this.currentIndexRow;
        var debut = "dataEditor-" + viewName;
        var columns = model["columns"];
        var column;
        var domElement;
        var type;
        var datas = [];
        for (var indexColumn = 0; indexColumn < columns.length; indexColumn++){
            column = columns[indexColumn];
            domElement = document.querySelector("*[datamodel='" + debut + "-" + indexRow + "-" + indexColumn + "']");
            type = column["type"];
            switch (column["type"]){
                case "string":
                case "integer":
                    datas.push(domElement.value);
                    break;
                default: 
                    datas.push(this.getValueSelection(domElement));
                    break;
            }
        }
        this.model.addRecord(viewName, datas);
    }

    refreshHeaderPage(page){
        var buttonImport = buildElement("label", "Import", undefined, "btn-file");
        var newId = this.getNewId();
        var input = buildElement("input", undefined, newId);
        input.setAttribute("type", "file");
        input.setAttribute("accept", ".json");
        input.style = "display:none;";
        this.addNewEvent(newId,"change",this.ctrl.importBD.bind(input, this.ctrl));
        buttonImport.appendChild(input);
        var newId = this.getNewId();
        var buttonExport = buildElement("label", "Export", newId);
        this.addNewEvent(newId, "click", this.ctrl.exportBD.bind(this.ctrl));
        var dropDownImportExport = BSBuilder.dropDown("Import / Export", [buttonImport, buttonExport]);
        var navBar = BSBuilder.navBar(true, [dropDownImportExport]);
        navBar.insertBefore(page["header"], navBar.childNodes[0]);
        this.headerPage.innerHTML = "";
        this.headerPage.appendChild(navBar);
    }

    refreshViews(views){
        var models = this.model.getModels();
        var viewsInModel;
        for (var i = 0; i < views.length; i++){
            for (var model in models){
                viewsInModel = models[model]["views"];
                for (var view in viewsInModel){
                    if (view === views[i]){
                        this.refreshView(models[model], model, this.model.getView(view), view);
                    }
                }
            }
        }
    }

    refreshView(model, modelName, view, viewName){
        this.currentViewName = viewName;
        this.currentView = view;
        this.currentModelName = modelName;
        this.currentModel = model;

        var domView = this.initView();
        domView.innerHTML = this.buildView().innerHTML;
    }

    initView() {
        if (this.modeEdition != null){
            this.getContainer().innerHTML = "";
            return this.getContainer();
        }
        var domView = document.getElementById(this.currentModelName); 
        if (domView == null){
            domView = buildElement("div", undefined, this.currentModelName, "container");
            this.getContainer().appendChild(domView);
        }
        domView.innerHTML = "";
        return domView;
    } 

    buildView(){
        var view = this.currentView;
        var div = buildElement("div");
        if (view["showHeader"] == true){
            div.appendChild(this.buildHeaderView());
        }
        var divBody = buildElement("div", undefined, undefined, this.modeEdition == null ? "" : "bodyPopup");
        this.currentSelection = view["selection"];
        this.currentDataSelected = undefined;
        this.currentComboBox = view["comboBox"];
        divBody.appendChild(this.buildBodyView());
        div.appendChild(divBody);
        return div;
    }

    buildHeaderView(){
        var model = this.currentModel;
        var divTitre = buildElement("div", undefined, undefined, "stickyTop stickyLeft navBarView");
        divTitre.setAttribute("title", model["desc"]);
        divTitre.appendChild(model["title"]); //custom header
        var divInterfaces = buildElement("div");
        this.addActionView(divInterfaces);     
        divTitre.appendChild(divInterfaces);
        return divTitre;
    }

    addActionView(divInterfaces){
        var view = this.currentView;
        if (view["actions"].includes("add")) 
            divInterfaces.appendChild(this.buildAdd());
        if (view["actions"].includes("sensRevert")) 
            divInterfaces.appendChild(this.buildInverse());
    }

    buildBodyView() {
    
        var layout = this.currentView["layout"];
        switch (layout){
            case "TOFR": //tableOrFormResponsive
            case "TOFR-inverse": //tableOrFormResponsive sens inverse
                this.currentViewMode = this.getContainer().offsetWidth > 500 ? this.TABLEAU : this.FORMULAIRE;
                this.currentSens = layout != "TOFR-inverse";
                if (this.currentViewMode == this.FORMULAIRE) {
                    return this.buildListForm();
                }else {
                    return this.buildListTable();
                }
            case "TR": //tableResponsive
                this.currentSens = true;
                return this.buildListTable(true);
            case "TR-inverse": //tableResponsive sens inverse
                this.currentSens = false;
                return this.buildListTable(false);
            case "FR": //formResponsive sens inverse
                this.currentSens = true;
                return this.buildListForm(true);
            case "FR-inverse": //formResponsive sens inverse
                this.currentSens = false;
                return this.buildListForm(false);
        }
    }

    

    buildContent(isSelection){
        var isSelection = this.currentSelection != undefined;
        if (this.modeEdition != null && !isSelection){
            return this.buildNativeEditor();
        }else{
            return this.buildNativeViewer();
        }
    }
    
    buildNativeViewer(){
        var column = this.currentColumn;
        var data;
        if (this.currentEditionIndexRow == -1){
            data = column["defaultValue"];
        }else{
            var data = this.model.getDataModel(this.currentViewName, this.currentIndexColumn, this.currentIndexRow);
        }
        switch(column["type"]){
            case "string":
            case "integer":
            default:
                var retour =  buildElement("span", data, undefined, "viewer");
                retour.setAttribute("dataModel", "dataViewer-" + this.currentViewName + "-" + this.currentIndexRow + "-" + this.currentIndexColumn);
                return retour;
        }
    }

    buildNativeEditor(){
        var input;
        var column = this.currentColumn;
        var data;
        if (this.currentEditionIndexRow == -1){
            data = column["defaultValue"];
        }else{
            data = this.model.getDataModel(this.currentViewName, this.currentIndexColumn, this.currentIndexRow);
        }
        var dataModel = "dataEditor-" + this.currentViewName + "-" + this.currentIndexRow + "-" + this.currentIndexColumn;

        switch(column["type"]){
            case "string":
                input = buildElement("input", undefined, undefined, "valueParamItem");
                input.setAttribute("dataModel", dataModel);
                input.setAttribute("type", "text");
                input.setAttribute("value", data);
                input.setAttribute("placeholder", column["desc"]);
                return input;
            case "integer":
                input = buildElement("input", undefined, undefined, "valueParamItem");
                input.setAttribute("dataModel", dataModel);
                input.type = "number";
                input.value = data;
                input.placeholder = column["desc"];
                input.setAttribute("min", column["restriction"]["min"]);
                input.setAttribute("max", column["restriction"]["max"]);
                return input;
        }

        this.saveContext();

        this.currentModelName = column["type"];
        this.currentModel = this.model.getModel(this.currentModelName);
        this.currentViewName = column["view"];
        this.currentView = this.model.getView(this.currentViewName);
        this.currentSelection = column["selection"];
        this.currentDataSelected = data == undefined ? this.model.getDefaultValue(this.currentViewName) : data;
        this.currentComboBox = column["comboBox"];
        this.currentEditionIndexRow = null;

        var newData = this.buildBodyView();
        newData.setAttribute("dataModel", dataModel);
        this.loadLastContext();

        return newData;
    }

    saveContext(){
        this.context.push(
            {
                "currentPageName": this.currentPageName,
                "currentModel": this.currentModel,
                "currentModelName": this.currentModelName,
                "currentView": this.currentView,
                "currentViewName": this.currentViewName,
                "currentColumn": this.currentColumn,
                "currentIndexColumn": this.currentIndexColumn,
                "currentRow": this.currentRow,
                "currentIndexRow": this.currentIndexRow,
                "currentSelection": this.currentSelection,
                "currentDataSelected": this.currentDataSelected,
                "currentComboBox": this.currentComboBox,
                "currentSens": this.currentSens, 
                "currentEditionIndexRow": this.currentEditionIndexRow
            }
        );
    }

    loadLastContext(){
        if (this.context.length > 0){
            var lastContext = this.context[this.context.length - 1];
            this.currentPageName = lastContext["currentPageName"];
            this.currentModel = lastContext["currentModel"];
            this.currentModelName = lastContext["currentModelName"];
            this.currentView = lastContext["currentView"];
            this.currentViewName = lastContext["currentViewName"];
            this.currentColumn = lastContext["currentColumn"];
            this.currentIndexColumn = lastContext["currentIndexColumn"];
            this.currentRow = lastContext["currentRow"];
            this.currentIndexRow = lastContext["currentIndexRow"];
            this.currentSelection = lastContext["currentSelection"];
            this.currentDataSelected = lastContext["currentDataSelected"];
            this.currentComboBox = lastContext["currentComboBox"];
            this.currentSens = lastContext["currentSens"]; 
            this.currentEditionIndexRow = lastContext[ "currentEditionIndexRow"];    
        }else{
            console.error("problème de context");
        }
        this.context.splice(this.context.length - 1, 1);
    }

    getInputValues(){
        var retour = [];
        //on récupère les données
        for (var i = 0; i < columns.length; i++){
            retour.push(this.getInputValue(columns[i], popupDiv));
        }
    }
    
    /****  CREATION TABLE  ******/

    buildListTable(){
        var table = buildElement("table", undefined, undefined, "table");
        var selection = this.currentSelection;
        var selectionSimple = selection == "simple";
        var selectionMultiple = selection == "multiple";
        var isSelection = selectionSimple || selectionMultiple;

        //remplissage du header
        if (this.currentSens && !isSelection){
            var thead = this.buildHeaderTable(); 
            table.appendChild(thead);
        }
        
        //remplissage du body
        var tbody;
        if (this.currentSens){
            tbody = this.buildBodyTable();
        }else{
            tbody = this.buildBodyTableSensInverse();
        }

        table.appendChild(tbody);

        if (this.currentComboBox){
            var divList = buildElement("div");
            var input = buildElement("button", undefined, undefined, "btn btn-secondary dropdown-toggle");
            input.setAttribute("type", "text");
            var list = buildElement("div");
            list.appendChild(table);
            divList.appendChild(input);
            divList.appendChild(list);
            return divList;
        }else {
            return table;
        }

    }

    buildHeaderTable(){
        var thead = buildElement("thead", undefined, undefined, "headerTable");
        var currentTr = buildElement("tr");
        var editable = this.currentView["actions"].includes("edit") && this.modeEdition == null;
        var model = this.currentModel;
        var selection = this.currentSelection;
        var dimensionBoth = model["dimension"] === "both";
        var columns = model["columns"];
        var selectionMultiple = selection == "multiple";

        if (selectionMultiple){
            var thSelection = buildElement("th");
            var check = buildElement("input");
            check.setAttribute("type", "checkbox");
            thSelection.appendChild(check);
            currentTr.appendChild(thSelection);
        }

        for (var indexColumn = 0; indexColumn < columns.length; indexColumn++){
            this.currentColumn = columns[indexColumn];
            this.currentIndexColumn = indexColumn;
            currentTr.appendChild(this.buildHeaderCell());
        }

        if (editable && dimensionBoth) currentTr.appendChild(buildElement("th"));
        thead.appendChild(currentTr);
        return thead;
    }

    buildBodyTable() {
        var editable = this.currentView["actions"].includes("edit") && this.modeEdition == null;
        var selection = this.currentSelection;
        var model = this.currentModel;
        var datas = model["datas"];
        if (datas == undefined) datas = [[""]]; //sécurisation
        var dimensionBoth = model["dimension"] === "both";
        var tbody = buildElement("tbody", undefined, undefined, "bodyTable");
        var currentTr;
        var selectionSimple = selection == "simple";
        var selectionMultiple = selection == "multiple";
        var isSelection = selectionSimple || selectionMultiple;

        for (var indexRow = 0; indexRow < datas.length; indexRow++){
            this.currentRow = datas[indexRow];
            this.currentIndexRow = indexRow;
            if (this.modeEdition == null || indexRow == this.currentEditionIndexRow || isSelection){
                currentTr = buildElement("tr");
                this.buildRecordTable(currentTr);
                if (editable && dimensionBoth){
                    currentTr.appendChild(this.buildBodyEditRecord()); 
                }
                tbody.appendChild(currentTr);
            }
        }

        return tbody;
    }

    buildRecordTable(currentTr){
        var selection = this.currentSelection;
        var isSelection = selection != undefined;
        if (isSelection){
            var thSelection = buildElement("th");
            var check = buildElement("input");
            check.setAttribute("type", "checkbox");
            thSelection.appendChild(check);
            currentTr.appendChild(thSelection);
        }
        var columns = this.currentModel["columns"];
        var datas = this.currentRow;
        for (var indexColumn = 0; indexColumn < columns.length; indexColumn++){
            this.currentColumn = columns[indexColumn];
            this.currentIndexColumn = indexColumn;
            if (datas[indexColumn] == this.currentDataSelected){
                check.setAttribute("checked", "");
            }
            currentTr.appendChild(this.buildBodyCell());
        }
    }

    buildBodyTableSensInverse() {
        var model = this.currentModel;
        var columns = model["columns"];
        var datas = model["datas"];
        var dimensionBoth = model["dimension"] === "both";
        var tbody = buildElement("tbody", undefined, undefined, "bodyTable");
        var currentTr;
        var selection = this.currentSelection;
        var selectionSimple = selection == "simple";
        var selectionMultiple = selection == "multiple";
        var isSelection = selectionSimple || selectionMultiple;
        var editable = this.currentView["actions"].includes("edit") && this.modeEdition == null;

        if (editable && dimensionBoth){
            currentTr = buildElement("tr");
            currentTr.appendChild(buildElement("th"));
            if (isSelection){
                var thSelection, option, check;
                for (var indexColumn = 0; indexColumn < datas.length; indexColumn++){
                    this.currentColumn = columns[indexColumn];
                    this.currentIndexColumn = indexColumn;
                    if (selectionSimple){
                        thSelection = buildElement("th");
                        option = buildElement("input", undefined, undefined, "optionButton");
                        if (dataSelected == datas[i]) option.setAttribute("checked", "");
                        option.setAttribute("type", "checkbox");
                        thSelection.appendChild(option);
                        currentTr.appendChild(thSelection);
                    }else if (selectionMultiple){
                        thSelection = buildElement("th");
                        check = buildElement("input");
                        if (datas[i].includes(dataSelected)) option.setAttribute("checked", "");
                        check.setAttribute("type", "checkbox");
                        thSelection.appendChild(check);
                        currentTr.appendChild(thSelection);
                    }                
                }
            }
            
            for (var i = 0; i < datas.length; i++){
                this.currentColumn = columns[indexColumn];
                this.currentIndexColumn = indexColumn;
                currentTr.appendChild(this.buildBodyEditRecord()); 
            }
            tbody.appendChild(currentTr);
        }

        for (var indexColumn = 0; indexColumn < columns.length; indexColumn++){
            this.currentColumn = columns[indexColumn];
            this.currentIndexColumn = indexColumn;
            currentTr = buildElement("tr");
            currentTr.appendChild(this.buildHeaderCell());
            this.buildRecordTableInverse(currentTr);
            tbody.appendChild(currentTr);
        }
        
        return tbody;
    }

    buildRecordTableInverse(currentTr){
        var datas = this.currentModel["datas"];
        for (var indexRow = 0; indexRow < datas.length; indexRow++){
            this.currentRow = datas[indexRow];
            this.currentIndexRow = indexRow;
            currentTr.appendChild(this.buildBodyCell());
        }
    }

    buildHeaderCell(){
        var th = buildElement("th", this.getColumnTitle());
        th.setAttribute("type", this.currentColumn["type"]);
        th.setAttribute("title", this.getColumnTitle());
        return th;
    }

    buildBodyEditRecord(){
        var td = buildElement("td");
        td.appendChild(this.buildEditRecord());
        return td;
    }

    buildBodyCell() {
        var content = this.buildContent();
        var td = buildElement("td", undefined);
        td.appendChild(content);
        return td;
    }

    /****  CREATION FORMULAIRE  ******/
    buildListForm(){
        var divRetour = buildElement("div");
        var selection = this.currentSelection;
        var selectionSimple = selection == "simple";
        var selectionMultiple = selection == "multiple";
        var isSelection = selectionSimple || selectionMultiple;
        var model = this.currentModel;
        var datas = model["datas"];

        divRetour = buildElement("div", undefined, undefined, "listComboBox " + selectionSimple ? "selectionSimple" : "" );

        if (this.currentEditionIndexRow == -1){
            this.currentIndexRow = model["datas"].length;
            this.buildRecordFormSquelette(divRetour);
        }else{
            for (var indexRow = 0; indexRow < datas.length; indexRow++){
                this.currentRow = datas[indexRow];
                this.currentIndexRow = indexRow;
                if (isSelection || this.currentEditionIndexRow == null || indexRow == this.currentEditionIndexRow){
                    this.buildRecordFormSquelette(divRetour);
                }
            }
            var removeable = this.currentView["actions"].includes("remove") && this.modeEdition != null;
            if (removeable){
                divRetour.appendChild(this.buildRemove());
            }
        }

        if (this.currentComboBox){
            return this.buildListComboBox(divRetour);
        }else {
            return divRetour;
        }

    }

    buildRecordFormSquelette(divRetour){
        var editable = this.currentView["actions"].includes("edit") && this.modeEdition == null;
        var selection = this.currentSelection;
        var selectionSimple = selection == "simple";
        var selectionMultiple = selection == "multiple";
        var isSelection = selectionSimple || selectionMultiple;
        var comboBox = this.currentComboBox;
        var data = this.currentModel["datas"][this.currentIndexRow];

        var divAllParams;
        var div;
        var classDiv;
        if (isSelection){
            classDiv = "recordFormSelection";
        }else{
            classDiv = "recordForm" + (this.currentSens ? "" : "Inverse ");
        }


        if (isSelection){
            var newId = this.getNewId();
            if (comboBox){
                this.addNewEvent(newId, "click", this.ctrl.selectItemComboBox.bind(this.ctrl, newId)); 
            }else {
                this.addNewEvent(newId, "click", this.ctrl.select.bind(this.ctrl, newId));
            }
            div = buildElement("div", undefined, newId, classDiv);
        }else{
            div = buildElement("div", undefined, undefined, classDiv);
        }

        if (selectionSimple){
            var option = buildElement("input", undefined, undefined, "optionButton");
            if (this.currentDataSelected == data) option.setAttribute("checked", "");
            option.setAttribute("type", "checkbox");
            div.appendChild(option);
        }else if (selectionMultiple){
            var check = buildElement("input");
            if (datas[i].includes(data)) option.setAttribute("checked", "");
            check.setAttribute("type", "checkbox");
            div.appendChild(check);
        }

        divAllParams = buildElement("div", "", undefined, "allRecordItemForm" + (this.currentSens ? "" : "Inverse "));

        this.buildRecordForm(divAllParams);
        div.appendChild(divAllParams);
        if (editable){
            div.appendChild(this.buildEditRecord());
        }
        divRetour.appendChild(div);
    }

    buildRecordForm(div){
        var columns = this.currentModel["columns"];
        for (var indexColumn = 0; indexColumn < columns.length; indexColumn++){
            this.currentColumn = columns[indexColumn];
            this.currentIndexColumn = indexColumn;
            div.appendChild(this.buildItemForm());
        }
    }

    buildItemForm() {
        var isSelection = this.currentSelection != null;
        var divParam = buildElement("div", "", undefined, "recordItemForm" + (this.currentSens ? "" : "Inverse "));
        var isSelection = this.currentSelection != undefined;
        
        if (!isSelection){
            var label = buildElement("label", this.getColumnTitle(), undefined, "labelRecordItemForm");
            label.setAttribute("type", this.currentColumn["type"]);
            label.setAttribute("title", this.getColumnDesc());
            divParam.appendChild(label);
        }
        var valueDiv = buildElement("div", undefined, undefined, "valueRecordItemForm");
        valueDiv.appendChild(this.buildContent());
        divParam.appendChild(valueDiv);                    
        return divParam;

        
    }

    buildListComboBox(content){
        var divList = buildElement("div", undefined, undefined, "comboBox");
        var newId = this.getNewId();
        var input = buildElement("button", this.currentDataSelected, newId, "buttonComboBox btn btn-light dropdown-toggle");
        input.setAttribute("type", "text");
        this.addNewEvent(newId, "click", this.ctrl.showListComboBox.bind(this.ctrl, newId));
        var list = buildElement("div", undefined, undefined, "listComboBox");
        list.appendChild(content);
        divList.appendChild(input);
        divList.appendChild(list);
        return divList;
    }

    /****  ACTIONS ******/
    buildAdd(){
        var newId = this.getNewId();
        var buttonInverse = buildElement("button", this.buildIcon("add").outerHTML, newId, "btn btn-light barItemInterface");
        buttonInverse.value = "Add";
        this.addNewEvent(newId, "click", this.ctrl.add.bind(this.ctrl, this.currentViewName));
        return buttonInverse;
    }
    buildInverse(){
        var newId = this.getNewId();
        var buttonInverse = buildElement("button", this.buildIcon("inverse").outerHTML, newId, "btn btn-light barItemInterface");
        buttonInverse.value = "Inverse";
        this.addNewEvent(newId, "click", this.ctrl.inverseSens.bind(this.ctrl, this.currentViewName));
        return buttonInverse;
    }

    buildEditRecord(){
        var newId = this.getNewId();
        var buttonEdition = buildElement("button", this.buildIcon("edit").outerHTML, newId, "btn btn-light barItemInterface");
        this.addNewEvent(newId, "click", this.ctrl.editRecord.bind(this.ctrl, this.currentViewName, this.currentIndexRow));
        buttonEdition.value = "Editer";
        return buttonEdition;
    }
    
    buildValid(){
        var newId = this.getNewId();
        var buttonValid = buildElement("button", "Valider", newId, "btn btn-primary buttonValidEdit");
        this.addNewEvent(newId, "click", this.ctrl.valid.bind(this.ctrl, this.currentViewName, this.currentModel));
        buttonValid.value = "Editer";
        return buttonValid;
    }
    buildSelect(){
        var newId = this.getNewId();
        var buttonSelection = buildElement("button", "Sélectionner", newId, "btn btn-primary buttonSelectionEdit");
        this.addNewEvent(newId, "click", this.ctrl.valid.bind(this.ctrl, this.currentViewName));
        buttonSelection.value = "Sélectionner";
        return buttonSelection;
    }
    
    buildCancel(){
        var newId = this.getNewId();
        var buttonCancel = buildElement("button", "Annuler", newId, "btn btn-secondary buttonCancelEdit");
        this.addNewEvent(newId, "click", this.ctrl.cancel.bind(this.ctrl));
        buttonCancel.value = "Annuler";
        return buttonCancel;
    }

    buildRemove(){
        var newId = this.getNewId();
        var buttonSupprimer = buildElement("button", "Supprimer", newId, "btn btn-danger buttonSupprimerEdit");
        this.addNewEvent(newId, "click", this.ctrl.remove.bind(this.ctrl, this.currentViewName, this.currentEditionIndexRow));
        buttonSupprimer.value = "Supprimer";
        return buttonSupprimer;
    }

    /****  POPUP ******/
    refreshPopup(){
        this.bodyPopup.innerHTML = this.buildBodyView().innerHTML;
        var root = this.model.mainConfig["container"][0];
        if (root.offsetWidth < 500) {
            this.getContainer().style["width"] = "100%";
            this.getContainer().style["height"] = "100%";
        }else{
            this.getContainer().style["width"] = "";
            this.getContainer().style["height"] = "";
        }
    }

    buildHeaderPopup(){
        var title = this.currentEditionIndexRow == -1 ? "Création" : "Modification";
        var divTitre = buildElement("div", title, undefined, "stickyTop stickyLeft navBarView");
        return divTitre;
    }

    buildFooterPopup(){
        var divTitre = buildElement("div", undefined, undefined, "stickyBottom stickyLeft footerView");
        if (this.modeEdition != null){
            divTitre.appendChild(this.buildCancel());
            divTitre.appendChild(this.buildValid());
        } else if (this.modeSelection != null){
            divTitre.appendChild(this.buildCancel());
            divTitre.appendChild(this.buildSelect());
        }
        return divTitre;
    }

    showPopup(){
        this.popupMask.style["opacity"] = "1";
        this.popupVisible = true;
    }

    createPopup() {
        this.popupMask = buildElement("div", undefined, "popupMask", "popupMask");
        var popupDiv = buildElement("div", undefined, "popupView", "popupView");
        this.popupMask.appendChild(popupDiv);
        this.getContainer().appendChild(this.popupMask);
        popupDiv.appendChild(this.buildHeaderPopup());
        this.bodyPopup = buildElement("div", undefined, undefined, "bodyPopup");
        popupDiv.appendChild(this.bodyPopup);
        popupDiv.appendChild(this.buildFooterPopup());
        this.model.mainConfig["container"].push(popupDiv);
        return popupDiv;
    }

    hidePopup(){
        this.model.mainConfig["container"].splice(this.model.mainConfig["container"].length - 1, 1);
        this.popupMask.parentElement.removeChild(this.popupMask);
        this.popupVisible = false;
    }

    buildIcon(type){
        var img = buildElement("img");
        var src = "./bootstrap-icons-1.0.0/";
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
            default:
                src += "question.svg";
                break;    
        }
        img.setAttribute("src", src);
        img.setAttribute("width", "16");
        img.setAttribute("heigth", "16");
        return img;
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
    

