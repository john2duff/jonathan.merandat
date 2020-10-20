
var instanceCompt = 0;

var MTFramework = function(container, config){
    instanceCompt++;
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

    valid(model, modelName){
        this.view.saveInputValues(model, modelName);
        this.view.hidePopup();
        this.view.modeEdition = null;
        this.view.modeSelection = null;
    }
    cancel(){
        this.view.hidePopup();
        this.view.modeEdition = null;
        this.view.modeSelection = null; 
    }

    select(idList, idRecord){
        var list = document.querySelector("#" + idList);
        var record = document.querySelector("#" + idRecord);
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
        inputComboBox.nextElementSibling.style["display"] = "block";
    }
    hideListComboBox(idInputComboBox){
        var inputComboBox = document.querySelector("#" + idInputComboBox);
        inputComboBox.nextElementSibling.style["display"] = "";
    }
    selectItemComboBox(idItem){
        var item = document.querySelector("#" + idItem);
        item.parentElement.previousSibling.value = item.querySelector("span").innerHTML;
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
        this.mainConfig["container"] = [container];
        this.dbName = config["dataBaseName"]; 
        this.loadDatas(JSON.parse(localStorage.getItem(this.dbName)), false);
    }

    //charger toutes les données dans la config
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
                    model["datas"][indexRow][indexColumn] = value;
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

    idCompt = 0;
    pageQueue = [];
    TABLEAU = "Tableau";
    FORMULAIRE = "Formulaire";
    modeEdition = null;
    modeSelection = null;
    listEvents = [];

    getNewId(){
        var newId = "id" + instanceCompt + "" + this.idCompt;
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
            this.refreshViews([this.modeEdition]);
            var root = this.model.mainConfig["container"][0];
            if (root.offsetWidth < 500) {
                this.getContainer().style["width"] = "100%";
                this.getContainer().style["height"] = "100%";
            }else{
                this.getContainer().style["width"] = "";
                this.getContainer().style["height"] = "";
            }
        }else{
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
        }
        this.loadEvents();
        this.listEvents = [];
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
    }

    addNewEvent(id, type, func){
        this.listEvents.push({
            "id": id,
            "type": type,
            "function": func
        });
    }

    

    saveInputValues(viewName, model, indexRow){
        var viewName = viewName + "editor";
        var debut = "dataEditor-" + viewName;
        var columns = model["columns"];
        var column;
        var domElement;
        for (var indexColumn = 0; indexColumn < columns.length; indexColumn++){
            column = columns[i];
            domElement = record.querySelector(debut + "-" + indexRow + "-" + indexColumn);
            type = column["type"];
            switch (column["type"]){
                case "string":
                case "integer":
                    this.model.setDataModel(viewName, indexColumn, indexRow, domElement.value);
                default: 
                    this.model.setDataModel(viewName, indexColumn, indexRow, getValueSelection(domElement));
                    break;
            }
        }
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
        var domView = this.initView(modelName);
        domView.innerHTML = this.buildView(model, modelName, view, viewName).innerHTML;
    }

    initView(modelName) {
        if (this.modeEdition != null){
            this.getContainer().innerHTML = "";
            return this.getContainer();
        }
        var domView = document.getElementById(modelName); 
        if (domView == null){
            domView = buildElement("div", undefined, modelName, "container");
            this.getContainer().appendChild(domView);
        }
        domView.innerHTML = "";
        return domView;
    } 

    buildView(model, modelName, view, viewName){
        var div = buildElement("div");
        if (view["showHeader"] == true){
            div.appendChild(this.buildHeaderView(model, view));
        }
        var divBody = buildElement("div", undefined, undefined, this.modeEdition == null ? "" : "bodyPopup");
        divBody.appendChild(this.buildBodyView(model, modelName, view, viewName));
        div.appendChild(divBody);
        if (this.modeEdition != null || this.modeSelection != null){
            div.appendChild(this.buildFooterView());
        }
        return div;
    }

    buildHeaderView(model, view){
        var divTitre = buildElement("div", undefined, undefined, "stickyTop stickyLeft navBarView");
        divTitre.setAttribute("title", model["desc"]);
        divTitre.appendChild(model["title"]); //custom header
        var divInterfaces = buildElement("div");
        this.addActionView(view, divInterfaces);     
        divTitre.appendChild(divInterfaces);
        return divTitre;
    }

    addActionView(view, divInterfaces){
        if (view["actions"].includes("sensRevert")) 
            divInterfaces.appendChild(this.buildInverse());
        //TODO
        //if (actions.includes("add")) divInterfaces.appendChild(this.buildAdd(modelName));
    }

    buildBodyView(model, modelName, view, viewName, selection, dataSelected, comboBox) {
        this.currentViewName = viewName;
        this.currentView = view;
        this.currentModelName = modelName;
        this.currentModel = model;

        this.currentSelection = selection;
        this.currentDataSelected = dataSelected;
        this.currentComboBox = comboBox;

        var layout = view["layout"];
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

    buildFooterView(){
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
        var data = this.model.getDataModel(this.currentViewName, this.currentIndexColumn, this.currentIndexRow);
        switch(column["type"]){
            case "string":
            case "integer":
            default:
            return buildElement("span", data, "dataViewer-" + this.currentViewName + "-" + this.currentIndexColumn + "-" + this.currentIndexRow, "viewer")
        }
    }

    buildNativeEditor(){
        var input;
        var column = this.currentColumn;
        var data = this.model.getDataModel(this.currentViewName, this.currentIndexColumn, this.currentIndexRow);
        if (data == null) data = column["defaultValue"];
        var idData = "dataEditor-" + this.currentViewName + "-" + this.currentIndexColumn + "-" + this.currentIndexRow;


        switch(column["type"]){
            case "string":
                input = buildElement("input", undefined, idData, "valueParamItem");
                input.setAttribute("type", "text");
                input.setAttribute("value", data);
                input.setAttribute("placeholder", column["desc"]);
                return input;
            case "integer":
                input = buildElement("input", undefined, idData, "valueParamItem");
                input.type = "number";
                input.value = data;
                input.placeholder = column["desc"];
                input.setAttribute("min", column["restriction"]["min"]);
                input.setAttribute("max", column["restriction"]["max"]);
                return input;
        }

        var modelName = column["type"];
        var model = this.model.getModel(modelName);
        var viewName = column["view"];
        var view = this.model.getView(viewName);
        var data = this.buildBodyView(model, modelName, view, viewName, column["selection"], data, column["comboBox"]);
        data.setAttribute("id", idData);
        return data;
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
            var input = buildElement("input");
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
        var model = this.currentModel;
        var datas = model["datas"];
        var divRetour = buildElement("div");
        var editable = this.currentView["actions"].includes("edit") && this.modeEdition == null;
        var selection = this.currentSelection;
        var selectionSimple = selection == "simple";
        var selectionMultiple = selection == "multiple";
        var isSelection = selectionSimple || selectionMultiple;
        var newId1 = this.getNewId();

        divRetour = buildElement("div", undefined, newId1, "listComboBox " + selectionSimple ? "selectionSimple" : "" );

        var divAllParams;
        var div;

        for (var indexRow = 0; indexRow < datas.length; indexRow++){
            this.currentRow = datas[indexRow];
            this.currentIndexRow = indexRow;
            if (this.modeEdition == null || indexRow == this.currentEditionIndexRow || isSelection){

                var classDiv;
                if (isSelection){
                    classDiv = "recordFormSelection";
                }else{
                    classDiv = "recordForm" + (this.currentSens ? "" : "Inverse ");
                }

                var newId2 = this.getNewId();
                div = buildElement("div", undefined, newId2, classDiv);

                if (isSelection){
                    this.addNewEvent(newId1, "click", this.ctrl.select.bind(this.ctrl, newId1, newId2));
                }

                if (selectionSimple){
                    var option = buildElement("input", undefined, undefined, "optionButton");
                    if (this.currentDataSelected == datas[indexRow]) option.setAttribute("checked", "");
                    option.setAttribute("type", "checkbox");
                    div.appendChild(option);
                }else if (selectionMultiple){
                    var check = buildElement("input");
                    if (datas[i].includes(dataSelected)) option.setAttribute("checked", "");
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
        }
        
        if (this.currentComboBox){
            return this.buildListComboBox(divRetour);
        }else {
            return divRetour;
        }

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
        var newId = this.getNewId();
        var divParam = buildElement("div", "", newId, "recordItemForm" + (this.currentSens ? "" : "Inverse "));
        var isSelection = this.currentSelection != undefined;
        if (isSelection){
            this.addNewEvent(newId, "click", this.ctrl.selectItemComboBox.bind(this.ctrl, newId)); 
        }
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
        var input = buildElement("input", undefined, newId);
        input.setAttribute("type", "text");
        this.addNewEvent(newId, "click", this.ctrl.showListComboBox.bind(this.ctrl, newId));
        this.addNewEvent(newId, "focusout", this.ctrl.hideListComboBox.bind(this.ctrl, newId));
        var list = buildElement("div", undefined, undefined, "listComboBox");
        list.appendChild(content);
        divList.appendChild(input);
        divList.appendChild(list);
        return divList;
    }

    /****  ACTIONS ******/
    buildInverse(){
        var newId = this.getNewId();
        var buttonInverse = buildElement("button", "Inverser", newId, "btn btn-light barItemInterface");
        buttonInverse.value = "Inverse";
        this.addNewEvent(newId, "click", this.ctrl.inverseSens.bind(this.ctrl, this.currentViewName));
        return buttonInverse;
    }

    buildEditRecord(){
        var newId = this.getNewId();
        var buttonEdition = buildElement("button", "Editer", newId, "btn btn-light barItemInterface");
        this.addNewEvent(newId, "click", this.ctrl.editRecord.bind(this.ctrl, this.currentViewName, this.currentIndexRow));
        buttonEdition.value = "Editer";
        return buttonEdition;
    }
    
    buildValid(){
        var newId = this.getNewId();
        var buttonValid = buildElement("button", "Valider", newId, "btn btn-primary buttonValidEdit");
        this.addNewEvent(newId, "click", this.ctrl.valid.bind(this.ctrl, this.currentViewName, this.currentIndexRow));
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

    /****  POPUP ******/
    popupIsVisible(){
        return popupMask.style["display"] != "none";
    }

    showPopup(){
        this.popupMask.style["display"] = "flex";
    }

    createPopup() {
        this.popupMask = buildElement("div", undefined, "popupMask", "popupMask");
        var popupDiv = buildElement("div", undefined, "popupView", "popupView");
        this.popupMask.appendChild(popupDiv);
        this.getContainer().appendChild(this.popupMask);
        this.model.mainConfig["container"].push(popupDiv);
        return popupDiv;
    }

    hidePopup(){
        this.model.mainConfig["container"].splice(this.model.mainConfig["container"].length - 1, 1);
        this.popupMask.parentElement.removeChild(this.popupMask);
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
    

