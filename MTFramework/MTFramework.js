


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
    editRecord(viewName, id){
        this.view.modeEdition = viewName;
        this.view.idElement = id;
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

    saveRecord(modelName, idColumn, idRow, value){
        this.updateModel(modelName)["datas"][idRow][idColumn] = value;
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
        return this.mainConfig["container"][this.mainConfig["container"].length - 1];
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

    pageQueue = [];
    TABLEAU = "Tableau";
    FORMULAIRE = "Formulaire";
    modeEdition = null;
    modeSelection = null;
    idElement = false;
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

    }

    refreshPage(pageName){
        if (this.modeEdition != null){
            this.refreshViews([this.modeEdition]);
            var root = this.model.mainConfig["container"][0];
            if (root.offsetWidth < 500) {
                this.model.getContainer().style["width"] = "100%";
                this.model.getContainer().style["height"] = "100%";
            }else{
                this.model.getContainer().style["width"] = "";
                this.model.getContainer().style["height"] = "";
            }
        }else{
            if (this.pageQueue.length == 0) this.pageQueue.push(this.model.getHomePage()); 
            if (pageName != undefined) this.currentPage = pageName;        
            
            var pages = this.model.getPages();
            for (var page in pages){
                if (page == this.pageQueue[this.pageQueue.length - 1]){
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

    saveInputValues(model, modelName){
        var record = this.model.getContainer().querySelector("#" + modelName + this.idElement);
        var columns = model["columns"];
        var column;
        var type;
        var domElement;
        for (var i = 0; i < columns.length; i++){
            column = columns[i];
            domElement = record.querySelector(modelName + "column" + i);
            type = column["type"];
            if (this.model.getNativeTypes().includes(type)) {
                console.error("type non reconnu : " + type);
                return;
            }
            switch (column["type"]){
                case "string":
                case "integer":
                    this.ctrl.parent.model.saveRecord(modelName, indexColumn, this.idElement, domElement.value);
                default: 
                console.error("type non reconnu : " + column["type"]);
                    break;
            }
        }
    }

    refreshHeaderPage(page){
        var buttonImport = buildElement("label", "Import", undefined, "btn-file");
        var input = buildElement("input", undefined, "buttonImport");
        input.setAttribute("type", "file");
        input.setAttribute("accept", ".json");
        input.style = "display:none;";
        this.addNewEvent("buttonImport","change",this.ctrl.importBD.bind(input, this.ctrl));
        buttonImport.appendChild(input);
        var buttonExport = buildElement("label", "Export", "buttonExport");
        this.addNewEvent("buttonExport", "click", this.ctrl.exportBD.bind(this.ctrl));
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
        if (this.modeEdition != null){
            this.model.getContainer().innerHTML = "";
            return this.model.getContainer();
        }
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
        if (view["showHeader"] == true){
            div.appendChild(this.buildHeaderView(model, modelName, view, viewName));
        }
        var divBody = buildElement("div", undefined, undefined, this.modeEdition == null ? "" : "bodyPopup");
        divBody.appendChild(this.buildBodyView(model, modelName, view, viewName))
        div.appendChild(divBody);
        if (this.modeEdition != null || this.modeSelection != null){
            div.appendChild(this.buildFooterView(viewName));
        }
        return div;
    }

    buildHeaderView(model, modelName, view, viewName){
        var divTitre = buildElement("div", undefined, undefined, "stickyTop stickyLeft navBarView");
        divTitre.setAttribute("title", model["desc"]);
        divTitre.appendChild(model["title"]); //custom header
        var divInterfaces = buildElement("div");
        this.addActionView(viewName, view["actions"], divInterfaces);     
        divTitre.appendChild(divInterfaces);
        return divTitre;
    }

    addActionView(viewName, actions, divInterfaces){
        if (actions.includes("sensRevert")) 
            divInterfaces.appendChild(this.buildInverse(viewName, this.modeEdition));
        //TODO
        //if (actions.includes("add")) divInterfaces.appendChild(this.buildAdd(modelName));
    }

    buildBodyView(model, modelName, view, viewName, selection, dataSelected, comboBox) {
        var layout = view["layout"];
        switch (layout){
            case "TOFR": //tableOrFormResponsive
            case "TOFR-inverse": //tableOrFormResponsive sens inverse
                this.currentViewMode = this.model.getContainer().offsetWidth > 500 ? this.TABLEAU : this.FORMULAIRE;
                if (this.currentViewMode == this.FORMULAIRE) {
                    return this.buildListForm(model, modelName, view, viewName, layout != "TOFR-inverse", selection, dataSelected, comboBox);
                }else {
                    return this.buildListTable(model, modelName, view, viewName, layout != "TOFR-inverse", selection, dataSelected, comboBox);
                }
            case "TR": //tableResponsive
                return this.buildListTable(model, modelName, view, viewName, true, selection, dataSelected, comboBox);
            case "TR-inverse": //tableResponsive sens inverse
                return this.buildListTable(model, modelName, view, viewName, false, selection, dataSelected, comboBox);
            case "FR": //formResponsive sens inverse
                return this.buildListForm(model, modelName, view, viewName, true, selection, dataSelected, comboBox);
            case "FR-inverse": //formResponsive sens inverse
                return this.buildListForm(model, modelName, view, viewName, false, selection, dataSelected, comboBox);
        }
    }

    buildFooterView(viewName){
        var divTitre = buildElement("div", undefined, undefined, "stickyBottom stickyLeft footerView");
        if (this.modeEdition != null){
            divTitre.appendChild(this.buildCancel(viewName));
            divTitre.appendChild(this.buildValid(viewName));
        } else if (this.modeSelection != null){
            divTitre.appendChild(this.buildCancel(viewName));
            divTitre.appendChild(this.buildSelect(modelName));
        }
        return divTitre;
    }

    buildContent(column, data, isSelection){
        if (this.modeEdition != null && !isSelection){
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
                input.setAttribute("type", "text");
                input.setAttribute("value", data);
                input.setAttribute("placeholder", column["desc"]);
                return input;
            case "integer":
                input = buildElement("input", undefined, undefined, "valueParamItem");
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
        return this.buildBodyView(model, modelName, view, viewName, column["selection"], data, column["comboBox"]);
    }

    getInputValues(){
        var retour = [];
        //on récupère les données
        for (var i = 0; i < columns.length; i++){
            retour.push(this.getInputValue(columns[i], popupDiv));
        }
    }
    
    /****  CREATION TABLE  ******/

    buildListTable(model, modelName, view, viewName, sens, selection, dataSelected, comboBox){
        var table = buildElement("table", undefined, modelName, "table");
        var editable = view["actions"].includes("edit") && this.modeEdition == null;
        var selectionSimple = selection == "simple";
        var selectionMultiple = selection == "multiple";
        var isSelection = selectionSimple || selectionMultiple;

        //remplissage du header
        if (sens && !isSelection){
            var thead = this.buildHeaderTable(model, editable, sens, selection); 
            table.appendChild(thead);
        }
        
        //remplissage du body
        var tbody;
        if (sens){
            tbody = this.buildBodyTable(model, viewName, editable, selection, dataSelected);
        }else{
            tbody = this.buildBodyTableSensInverse(model, viewName, editable, selection, dataSelected);
        }

        table.appendChild(tbody);

        if (comboBox){
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

    buildHeaderTable(model, editable, selection){
        var thead = buildElement("thead", undefined, undefined, "headerTable");
        var currentTr = buildElement("tr");
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

    buildBodyTable(model, viewName, editable, selection) {
        var columns = model["columns"];
        var datas = model["datas"];
        if (datas == undefined) datas = [[""]];
        var dimensionBoth = model["dimension"] === "both";
        var tbody = buildElement("tbody", undefined, undefined, "bodyTable");
        var currentTr;
        var selectionSimple = selection == "simple";
        var selectionMultiple = selection == "multiple";
        var isSelection = selectionSimple || selectionMultiple;

        for (var i = 0; i < datas.length; i++){
            if (this.modeEdition == null || i == this.idElement || isSelection){
                currentTr = buildElement("tr", undefined, i);
                this.buildRecordTable(columns, datas[i], i, currentTr, isSelection);
                if (editable && dimensionBoth){
                    currentTr.appendChild(this.buildBodyEditRecord(viewName, i)); 
                }
                tbody.appendChild(currentTr);
            }
        }

        return tbody;
    }

    buildRecordTable(columns, datas, id, currentTr, isSelection, dataSelected){
        if (isSelection){
            var thSelection = buildElement("th");
            var check = buildElement("input");
            check.setAttribute("type", "checkbox");
            thSelection.appendChild(check);
            currentTr.appendChild(thSelection);
        }
        for (var i = 0; i < columns.length; i++){
            if (datas[i] == dataSelected){
                check.setAttribute("checked", "");
            }
            currentTr.appendChild(this.buildBodyCell(columns[i], datas[i], id, isSelection));
        }
    }

    buildBodyTableSensInverse(model, viewName, editable, selection, dataSelected) {
        var columns = model["columns"];
        var datas = model["datas"];
        var dimensionBoth = model["dimension"] === "both";
        var tbody = buildElement("tbody", undefined, undefined, "bodyTable");
        var currentTr;
        var datasCustom;
        var title;
        var desc;
        var selectionSimple = selection == "simple";
        var selectionMultiple = selection == "multiple";
        var isSelection = selectionSimple || selectionMultiple;

        if (editable && dimensionBoth){
            currentTr = buildElement("tr");
            currentTr.appendChild(buildElement("th"));
            if (isSelection){
                for (var i = 0; i < datas.length; i++){
                    var thSelection = buildElement("th");
                    var check = buildElement("input");
                    check.setAttribute("type", "checkbox");
                    thSelection.appendChild(check);
                    currentTr.appendChild(thSelection);
                }
            }
            for (var i = 0; i < datas.length; i++){
                currentTr.appendChild(this.buildBodyEditRecord(viewName, i)); 
            }
            tbody.appendChild(currentTr);
        }

        for (var i = 0; i < columns.length; i++){
            currentTr = buildElement("tr");
            title = this.model.getColumnTitle(columns[i]);
            desc = this.model.getColumnDesc(columns[i]);
            currentTr.appendChild(this.buildHeaderCell(title, columns[i]["type"], desc));
            datasCustom = [];
            for (var j = 0; j < datas.length; j++){
                if (this.modeEdition == null || j == this.idElement || isSelection){
                    datasCustom.push(datas[j][i]);
                }
            }
            this.buildRecordTableInverse(columns[i], datasCustom, i, currentTr, isSelection);
            tbody.appendChild(currentTr);
        }
        
        
        return tbody;
    }

    buildRecordTableInverse(column, datas, id, currentTr, isSelection){
        for (var i = 0; i < datas.length; i++){
            currentTr.appendChild(this.buildBodyCell(column, datas[i], id, isSelection));
        }
    }

    buildHeaderCell(title, type, desc){
        var th = buildElement("th", title);
        th.setAttribute("type", type);
        th.setAttribute("title", desc);
        return th;
    }

    buildBodyEditRecord(viewName, id){
        var td = buildElement("td");
        td.appendChild(this.buildEditRecord(viewName, id));
        return td;
    }

    buildBodyCell(column, data, id, isSelection) {
        var content = this.buildContent(column, data, isSelection);
        var td = buildElement("td", undefined, id);
        td.appendChild(content);
        return td;
    }

    /****  CREATION FORMULAIRE  ******/
    buildListForm(model, modelName, view, viewName, sens, selection, dataSelected, comboBox){
        var columns = model["columns"];
        var datas = model["datas"];
        var divRetour = buildElement("div", undefined, modelName);
        var editable = view["actions"].includes("edit") && this.modeEdition == null;
        var selectionSimple = selection == "simple";
        var selectionMultiple = selection == "multiple";
        var isSelection = selectionSimple || selectionMultiple;
        divRetour = buildElement("div");

        var divAllParams;
        var div;

        for (var i = 0; i < datas.length; i++){
            if (this.modeEdition == null || i == this.idElement || isSelection){

                var classDiv;
                if (isSelection){
                    classDiv = "recordFormSelection";
                }else{
                    classDiv = "recordForm" + (sens ? "" : "Inverse ");
                }

                div = buildElement("div", undefined, undefined, classDiv);
               
                if (comboBox){

                }else{
                    if (selectionSimple){
                        var option = buildElement("input", undefined, undefined, "optionButton");
                        if (dataSelected == datas[i]) option.setAttribute("checked", "");
                        option.setAttribute("type", "checkbox");
                        div.appendChild(option);
                    }else if (selectionMultiple){
                        var check = buildElement("input");
                        if (datas[i].includes(dataSelected)) option.setAttribute("checked", "");
                        check.setAttribute("type", "checkbox");
                        div.appendChild(check);
                    }
                }

                divAllParams = buildElement("div", "", "allRecordItemForm" + i, "allRecordItemForm" + (sens ? "" : "Inverse "));

                this.buildRecordForm(columns, datas[i], sens, i, divAllParams, isSelection);
                div.appendChild(divAllParams);
                if (editable){
                    div.appendChild(this.buildEditRecord(viewName, i));
                }
                divRetour.appendChild(div);
            }
        }
        
        if (comboBox){
            var divList = buildElement("div");
            var input = buildElement("input");
            input.setAttribute("type", "text");
            var list = buildElement("div");
            list.appendChild(divRetour);
            divList.appendChild(input);
            divList.appendChild(list);
            return divList;
        }else {
            return divRetour;
        }

    }

    buildRecordForm(columns, datas, sens, id, div, isSelection){
        for (var i = 0; i < columns.length; i++){
            div.appendChild(this.buildItemForm(columns[i], datas[i], sens, id, isSelection));
        }
    }

    buildItemForm(column, datas, sens, id, isSelection) {         
        var divParam = buildElement("div", "", undefined, "recordItemForm" + (sens ? "" : "Inverse "));
        if (!isSelection){
            var label = buildElement("label", this.model.getColumnTitle(column), undefined, "labelRecordItemForm");
            label.setAttribute("type", column["type"]);
            label.setAttribute("title", this.model.getColumnDesc(column));
            divParam.appendChild(label);
        }
        var valueDiv = buildElement("div", undefined, undefined, "valueRecordItemForm");
        valueDiv.appendChild(this.buildContent(column, datas, isSelection));
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

    buildEditRecord(viewName, id){
        var idButtonEdition = viewName + id;
        var buttonEdition = buildElement("button", "Editer", idButtonEdition, "btn btn-light barItemInterface");
        this.addNewEvent(idButtonEdition, "click", this.ctrl.editRecord.bind(this.ctrl, viewName, id));
        buttonEdition.value = "Editer";
        return buttonEdition;
    }
    
    buildValid(viewName){
        var idButtonValider = viewName + "valid";
        var buttonValid = buildElement("button", "Valider", idButtonValider, "btn btn-primary buttonValidEdit");
        this.addNewEvent(idButtonValider, "click", this.ctrl.valid.bind(this.ctrl, viewName));
        buttonValid.value = "Editer";
        return buttonValid;
    }
    buildSelect(viewName){
        var idButtonSelection = viewName + "select";
        var buttonSelection = buildElement("button", "Sélectionner", idButtonSelection, "btn btn-primary buttonSelectionEdit");
        this.addNewEvent(idButtonSelection, "click", this.ctrl.valid.bind(this.ctrl, viewName));
        buttonSelection.value = "Sélectionner";
        return buttonSelection;
    }
    
    buildCancel(viewName){
        var idButtonCancel = viewName + "cancel";
        var buttonCancel = buildElement("button", "Annuler", idButtonCancel, "btn btn-secondary buttonCancelEdit");
        this.addNewEvent(idButtonCancel, "click", this.ctrl.cancel.bind(this.ctrl));
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
        this.model.getContainer().appendChild(this.popupMask);
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
    

