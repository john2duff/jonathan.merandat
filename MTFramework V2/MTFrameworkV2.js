
class MTFramework {
    constructor(container) {
        this.init(container);
    }

    containers = [];
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
        this.containers.push(container);
        this.models = {};
        //ajout des types primitifs
        this.addNewModel("string", undefined, "Type chaine de caractère", [], this.default.validators.basicString, undefined, MTFrameworkView.prototype.basicStringViewer, MTFrameworkView.prototype.basicStringEditor);
        this.addNewModel("integer", undefined, "Type nombre entier", [], this.default.validators.basicInteger, undefined, MTFrameworkView.prototype.basicIntegerViewer, MTFrameworkView.prototype.basicIntegerEditor);
        //init des pages
        this.pages = {};
    }

    render(page){
        if (page != undefined) this.currentPage = page;
        if (this.currentPage != undefined){
            this.getContainer().innerHTML = this.currentPage.buildPage().innerHTML;
        } else{
            this.getContainer().innerHTML = "Aucune page sélectionné";
        }
        MH.loadEvents();
    }
    
    getContainer(){
        return this.containers[this.containers.length - 1];
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

    addNewModel(name, type, title, datas, validator, buildHeaderView, buildViewer, buildEditor){
        if (this.models[name] != undefined) console.warn("Le model '" + name + "' existait déjà, il a été écrasé");
        var retour = new MTFrameworkModel(this, type, title, datas, validator, buildHeaderView, buildViewer, buildEditor);
        this.models[name] = retour;
        return retour;
    }

    addNewPage(name, title, buildHeaderPage){
        if (this.pages[name] != undefined) console.warn("La page '" + name + "' existait déjà, elle a été écrasé");
        var retour = new MTFrameworkPage(this, title, buildHeaderPage);
        this.pages[name] = retour;
        return retour;
    }


}

class MTFrameworkPage {
    constructor(ctrl, title, buildHeaderPage) {
        this.ctrl = ctrl;        
        if (buildHeaderPage == undefined) buildHeaderPage = this.default.headerPage;
        this.buildHeaderPage = buildHeaderPage.bind(this);
        this.title = title;
    }
    ctrl = null;
    title = null;
    buildHeaderPage = null;
    views = [];
    default = {      
        "headerPage": this.headerPage,
    }
    addView(modelName){
        var model = this.ctrl.models[modelName];
        if (!this.views.includes(model.view)) this.views.push(model.view);
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
    constructor(ctrl, type, title, datas, validator, buildHeaderView, buildViewer, buildEditor) {
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
        this.view = new MTFrameworkView(this, title, buildHeaderView, buildViewer, buildEditor);
    }
    type = null;
    datas = [];
    validator = null;
    modeEdition = false;
    modeSelection = false;
    view = null;

    default = {
    }

    setModeEdition(pBool){
        this.modeEdition = pBool;
    }

    basicStringValidator(){return true;}
    basicIntegerValidator(data){return isNaN(data);}
}

class MTFrameworkView {
    constructor(model, title, buildHeaderView, buildViewer, buildEditor) {
        if (buildHeaderView === undefined){
            if (model.view === null){
                this.buildHeaderView = undefined;
            }else{
                this.buildHeaderView = model.view.buildHeaderView;
            }
        }else{
            this.buildHeaderView = buildHeaderView.bind(this);
        }
        if (buildViewer === undefined){
            if (model.view === null){
                this.buildViewer = undefined;
            }else{
                this.buildViewer = model.view.buildViewer;
            }
        }else{
            this.buildViewer = buildViewer.bind(this);
        }
        if (buildEditor === undefined){
            if (model.view === null){
                this.buildEditor = undefined;
            }else{
                this.buildEditor = model.view.buildEditor;
            }
        }else{
            this.buildEditor = buildEditor.bind(this);
        }
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
    modalPopup = true;
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
        var viewRetour = MH.makeDiv(undefined, "container view");
        if (this.buildHeaderView !== undefined){
            viewRetour.appendChild(this.buildHeaderView());
        }
        if (this.model.modeEdition){
            if (this.buildEditor !== null){
                if (this.buildEditor === undefined){
                    var view = this.model.view;
                    //while (view.buildEditor === undefined){
                        view = view.model.view;
                    //}
                    viewRetour.appendChild(view.buildEditor(dataSelected));
                } else {
                    viewRetour.appendChild(this.buildEditor(dataSelected));
                }
            }else{
                viewRetour.appendChild(MH.makeSpan("Aucune vue n'a été créé"));
            }
        }else{
            if (this.buildViewer !== null){
                if (this.buildViewer === undefined){
                    var view = this.model.view;
                    //while (view.buildViewer === undefined) {
                        view = view.model.view;
                    //} 
                    viewRetour.appendChild(view.buildViewer());
                } else {
                    viewRetour.appendChild(this.buildViewer(dataSelected));
                }
            }else{
                viewRetour.appendChild(MH.makeSpan("Aucune vue n'a été créé"));
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
    basicStringEditor(data){return MH.makeInput("text", {"value": data});}
        
    //basicString
    basicIntegerViewer(data){ return MH.makeSpan(data); }
    basicIntegerEditor(data){return makeInput("number", {"value": data});}

    //Header
    headerView() { 
        var div = MH.makeDiv(undefined, "stickyTop stickyLeft headerView"); 
        div.innerHTML = this.title; 
        if (this.actions.includes("editView")){
            div.appendChild(MH.makeButton({type: "click", func: this.editView.bind(this, this.model["datas"])}, "edit"));
        }
        return div; 
    }

    //listForm par défaut
    buildListForm(dataSelected){
        var listForm = MH.makeDiv();
        var record;
        var listInterface;
        var entry;
        var modeEdition = this.model.modeEdition;
        if (this.model["datas"].length > 0){
            for (var i = 0; i < this.model["datas"].length; i++){
                entry = MH.makeDiv();
                record = MH.makeDiv(undefined, "recordForm");
                listInterface = MH.makeDiv();
                if (modeEdition){
                    record.appendChild(MH.makeInput("checkbox", dataSelected.includes(this.model["datas"][i]) ? {"checked": true} : undefined));
                }
                if (typeof(this.model["type"]) == "object") {
                    for (var attribut in this.model["type"]){
                        record.appendChild(this.buildItemForm(this.model["type"][attribut], this.model["datas"][i][attribut]));
                    }
                } else {
                    record.appendChild(this.model["type"], this.buildItemForm(dataSelected));
                }
                if (this.actions.includes("editRecord")){
                    listInterface.appendChild(MH.makeButton({type: "click", func: this.editView.bind(this, this.model["datas"][i])}, "edit"));
                }
                entry.appendChild(record);
                entry.appendChild(listInterface);
                listForm.appendChild(entry);
            }
        } else{
            record = MH.makeSpan("Aucune donnée");
            listForm.appendChild(record);
        }
        
        return listForm;
    }

    buildItemForm(type, dataSelected){
        var div = MH.makeDiv(undefined, "itemForm");
        div.appendChild(MH.makeSpan(this.title, "labelRecordItemForm"));
        var view = this.model.ctrl.getViewByViewName(type);
        div.appendChild(view.buildView(dataSelected));
        return div;
    }

    //actions
    editView(dataSelected){
        var modalPopup = this.buildModalPopup();
        this.model.modeEdition = true;
        modalPopup.appendChild(this.buildView(dataSelected));
    }

    //popup
    buildModalPopup() {
        var popupMask = MH.makeDiv(undefined, "popupMask");
        var popupDiv = MH.makeDiv(undefined, "popupView");
        popupMask.appendChild(popupDiv);
        this.model.ctrl.getContainer().appendChild(popupMask);
        return popupDiv;
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
    static makeInput(type, attributes){ 
        var input = MH.makeElt("input"); 
        input.setAttribute("type", type); 
        for (var elt in attributes){
            input.setAttribute(elt, attributes[elt]);
        }
        return input;
    }
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