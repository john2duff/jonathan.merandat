
class MTFramework {
    constructor(container) {
        this.init(container);
    }

    container = null;
    models = [];
    pages = null;
    currentPage = null;
    basicString = null;
    basicInteger = null;
    default = {
        "validators" : {
            "basicString" : this.basicStringValidator,
            "basicInteger" : this.basicIntegerValidator
        },
    }
    
    init(container){
        this.container = container;
        this.models = {};
        //ajout des types primitifs
        var modelString = this.addNewModel("string", "string", [], this.default.validators.basicString);
        var modelInteger = this.addNewModel("integer", "integer", [], this.default.validators.basicInteger);
        //ajout des vues par défaut
        this.basicString = modelString.addNewView("basicString");
        this.basicInteger = modelInteger.addNewView("basicInteger");
        //init des pages
        this.pages = {};
    }

    render(page){
        if (page != undefined) this.currentPage = page;
        if (this.currentPage != undefined){
            this.container.innerHTML = this.currentPage.buildPage().innerHTML;
        } else{
            this.container.innerHTML = "Aucune page sélectionné";
        }
        MH.loadEvents();
    }

    getModelByViewName(viewName){
        for (var model in this.models){
            for (var view in this.models[model].views){
                if (view == viewName) return this.models[model];
            }
        }
        return null;
    }
    getViewByViewName(viewName){
        for (var model in this.models){
            for (var view in this.models[model].views){
                if (view == viewName) return  this.models[model].views[view];
            }
        }
        console.error("La vue : '" + viewName + "' n'existe pas");
        return null;
    }

    addNewModel(name, type, datas, validator){
        if (this.models[name] != undefined) console.warn("Le model '" + name + "' existait déjà, il a été écrasé");
        var retour = new MTFrameworkModel(this, type, datas, validator);
        this.models[name] = retour;
        return retour;
    }

    addNewPage(name, title, buildHeaderPage){
        if (this.pages[name] != undefined) console.warn("La page '" + name + "' existait déjà, elle a été écrasé");
        var retour = new MTFrameworkPage(title, buildHeaderPage);
        this.pages[name] = retour;
        return retour;
    }


}

class MTFrameworkPage {
    constructor(title, buildHeaderPage) {
        if (buildHeaderPage == undefined) buildHeaderPage = this.default.headerPage;
        this.buildHeaderPage = buildHeaderPage.bind(this);
        this.title = title;
    }
    title = null;
    buildHeaderPage = null;
    views = [];
    default = {      
        "headerPage": this.headerPage,
    }
    addNewView(view){
        if (!this.views.includes(view)) this.views.push(view);
    }
    buildPage(){
        var pageRetour = MH.makeDiv();
        pageRetour.appendChild(this.buildHeaderPage());
        for (var i = 0; i < this.views.length; i++){
            pageRetour.appendChild(this.views[i].buildView());
        }
        return pageRetour;
    }

    headerPage() { var div = MH.makeDiv(); div.innerHTML = this.title; return div; }
}

class MTFrameworkModel {
    constructor(ctrl, type, datas, validator) {
        this.ctrl = ctrl;
        if (validator == undefined) validator = function(){return true;};
        var dataInter = [];
        if (datas != undefined) {
            for (var i = 0; i < datas.length; i++){
                if (validator(datas[i]))
                    dataInter.push(datas[i]);
            }
        }
        this.type = type;
        this.datas = dataInter;
        this.validator = validator.bind(this);
    }
    type = null;
    datas = [];
    validator = null;
    modeEdition = false;
    modeSelection = false;
    views = {};
    default = {
    }
    
    addNewView(viewName, title, buildHeaderView, buildViewer, buildEditor, ){
        if (this.views[viewName] != undefined) console.warn("Le vue '" + viewName + "' existait déjà, elle a été écrasée");
        var retour = new MTFrameworkView(this, title, buildViewer, buildEditor, buildHeaderView);
        this.views[viewName] = retour;
        return retour;
    }

    setModeEdition(pBool){
        this.modeEdition = pBool;
    }

    basicStringValidator(){return true;}
    basicIntegerValidator(data){return isNaN(data);}
}

class MTFrameworkView {
    constructor(model, title, buildViewer, buildEditor, buildHeaderView) {
        if (buildHeaderView === undefined) buildHeaderView = null;
        if (buildViewer === undefined) {
            if (model.type === "string") buildViewer = this.default.basicString.viewer;
            else if (model.type === "integer") buildViewer = this.default.basicInteger.viewer;
            else if (typeof(model.type) === "object") buildViewer = this.default.basicForm.viewer;
        }
        if (buildEditor === undefined) {
            if (model.type === "string") buildEditor = this.default.basicString.editor;
            else if (model.type === "integer") buildEditor = this.default.basicInteger.editor;
            else if (typeof(model.type) === "object") buildEditor = this.default.basicForm.editor;
        }
        this.buildHeaderView = buildHeaderView === null ? undefined : buildHeaderView.bind(this);
        this.buildViewer = buildViewer === null ? undefined : buildViewer.bind(this);
        this.buildEditor = buildEditor === null ? undefined : buildEditor.bind(this);
        this.title = title;
        this.model = model;
    }
    model = null;
    title = null;
    buildHeaderView = null;
    interfaceHeaderView = [];
    interfaceViewer = [];
    interfaceEditor = [];
    buildViewer = null;
    buildEditor = false;
    actions = [];
    default = {
        "basicString": {
            "viewer": this.basicStringViewer,
            "editor": this.basicStringEditor,
        },
        "basicInteger": {
            "viewer": this.basicIntegerViewer,
            "editor": this.basicIntegerEditor,
        },
        "basicForm": {
            "viewer": this.buildListForm,
            "editor": this.buildListForm,
        },
        "headerView": this.headerView,
    }

    addAction(typeAction){ if (!this.actions.includes(typeAction)) this.actions.push(typeAction);}

    //***** BUILD */
    buildView(dataSelected) {
        var viewRetour = MH.makeDiv(undefined, "container");
        if (this.buildHeaderView != null){
            viewRetour.appendChild(this.buildHeaderView());
        }
        if (this.model.modeEdition){
            if (this.buildEditor != null){
                viewRetour.appendChild(this.buildEditor(dataSelected));
            }            
        }else{
            if (this.buildViewer != null){
                viewRetour.appendChild(this.buildViewer(dataSelected));
            }
        }
        return viewRetour;
    }

    addInterfaceHeaderView(inter){
        this.interfaceHeaderView.push(inter);
    }
    addInterfaceViewer(inter){
        this.interfaceViewer.push(inter);
    }
    addInterfaceEditor(inter){
        this.interfaceEditor.push(inter);
    }

    //basicString
    basicStringViewer(data){ return MH.makeSpan(data); }
    basicStringEditor(data){return MH.makeInputText(data);}
        
    //basicString
    basicIntegerViewer(data){ return MH.makeSpan(data); }
    basicIntegerEditor(data){return MH.makeInputNumber(data);}

    //Header
    headerView() { 
        var div = MH.makeDiv(undefined, "stickyTop stickyLeft headerView"); 
        div.innerHTML = this.title; 
        if (this.actions.includes("editView")){
            div.appendChild(MH.makeButton({type: "click", func: this.editView.bind(this)}, "edit"));
        }
        return div; 
    }

    //listForm par défaut
    buildListForm(dataSelected){
        var listForm = MH.makeDiv();
        var record;
        var listInterface;
        var entry;
        if (dataSelected == undefined){
            for (var i = 0; i < this.model["datas"].length; i++){
                entry = MH.makeDiv();
                listInterface = MH.makeDiv();
                record = MH.makeDiv(undefined, "recordForm");
                if (typeof(this.model["type"]) == "object") {
                    for (var attribut in this.model["type"]){
                        record.appendChild(this.model["type"][attribut].buildView(this.model["datas"][i][attribut]));
                    }
                } else {
                    record.appendChild(this.buildItemForm(dataSelected));
                }
                if (this.actions.includes("editRecord")){
                    listInterface.appendChild(MH.makeButton({type: "click", func: this.editView.bind(this)}, "edit"));
                }
                record.appendChild(listInterface);
                listForm.appendChild(record);
            }
        }else{
            listForm.appendChild(this.buildItemForm(dataSelected));
        }
        return listForm;
    }

    buildItemForm(dataSelected){
        var div = MH.makeDiv(undefined, "itemForm");
        div.appendChild(MH.makeSpan(this.title, "labelRecordItemForm"));
        div.appendChild(this.model["type"].buildView(dataSelected));
        return div;
    }

    //actions
    editView(){
        this.model.modeEdition = true;
        this.model.ctrl.render();
    }

}

//***** MAKER HTML */
class MH {
    static idCompt = 0;
    static listEvents = [];
    static getNewId(){
        var newId = "id" + this.idCompt;
        this.idCompt++;
        return newId;
    }
    static makeElt(type, id, className, style){
        var elt = document.createElement(type);
        if (id != undefined) elt.setAttribute("id", id);
        if (className != undefined) elt.setAttribute("class", className);
        if (style != undefined) elt.style = style;
        return elt;
    } 
    static makeSpan(content, className){var span = this.makeElt("span", undefined, className); span.innerHTML = content; return span;};
    static makeDiv(id, className, style){return this.makeElt("div", id, className, style)}
    static makeButton(id, className, style){ return this.makeElt("button", id, className, style);}
    static makeInput(type, attributes){ 
        var input = MH.makeElt("input"); 
        input.setAttribute("type", type); 
        for (var elt in attributes){
            input.setAttribute(elt, attributes[elt]);
        }
        return input;
    }
    static makeButton(id, className, style){ return this.makeElt("button", id, className, style);}
    static makeIcon(type){
        var img = MH.makeElt("img");
        var src = "../bootstrap-icons-1.0.0/";
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
    static makeButton(callBack, icon){
        var newId = undefined;
        if (callBack != undefined){
            newId = MH.getNewId();
            this.addNewEvent(newId, callBack.type, callBack.func);
        }
        var buttonEdition = MH.makeElt("button", newId, "btn btn-light barItemInterface");
        if (icon != undefined){
            buttonEdition.innerHTML = MH.makeIcon(icon).outerHTML;
        }
        return buttonEdition;
    }
    static addNewEvent(id, type, func){
        this.listEvents.push({
            "id": id,
            "type": type,
            "function": func
        });
    }
    static loadEvents(){
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

}