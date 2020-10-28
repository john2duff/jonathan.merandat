
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
            "basicString" : function(data){return true;},
            "basicInteger" : function(data){return isNaN(data);}
        },
        "basicString": {
            "viewer": function(view, data){return MH.makeSpan(data);},
            "editor": function(view, data){return MH.makeInputText(data);},
        },
        "basicInteger": {
            "viewer": function(view, data){return MH.makeSpan(data);},
            "editor": function(view, data){return MH.makeInputNumber(data);},
        }
    }
    
    init(container){
        this.container = container;
        this.models = {};
        var modelString = this.addNewModel("string", undefined, [], this.default.validators.basicString.bind(this));
        var modelInteger = this.addNewModel("integer", undefined, [], this.default.validators.basicInteger.bind(this));
        this.basicString = modelString.addNewView("basicString", undefined, undefined, this.default.basicString.viewer.bind(this), this.default.basicString.editor.bind(this));
        this.basicInteger = modelInteger.addNewView("basicInteger", undefined, undefined, this.default.basicInteger.viewer.bind(this), this.default.basicInteger.editor.bind(this));

        this.pages = {};
        
    }

    render(page){
        if (page != undefined) this.currentPage = page;
        if (this.currentPage != undefined){
            this.container.innerHTML = page.buildPage().innerHTML;
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
        var retour = new MTFrameworkModel(type, datas, validator)
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
        if (buildHeaderPage == undefined) buildHeaderPage = this.default.buildHeaderPage.bind(this);
        this.buildHeaderPage = buildHeaderPage;
        this.title = title;
    }
    title = null;
    buildHeaderPage = null;
    views = [];
    default = {
        "buildHeaderPage": function() { var div = MH.makeDiv(); div.innerHTML = this.title; return div; },
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
}

class MTFrameworkModel {
    constructor(type, datas, validator) {
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
        this.validator = validator;
    }
    type = null;
    datas = [];
    validator = null;
    modeEdition = false;
    modeSelection = false;
    views = {};
    
    addNewView(viewName, title, buildHeaderView, buildViewer, buildEditor){
        if (this.views[viewName] != undefined) console.warn("Le vue '" + viewName + "' existait déjà, elle a été écrasée");
        var retour = new MTFrameworkView(this, title, buildHeaderView, buildViewer, buildEditor);
        this.views[viewName] = retour;
        return retour;
    }

    setModeEdition(pBool){
        this.modeEdition = pBool;
    }
}

class MTFrameworkView {
    constructor(model, title, buildHeaderView, buildViewer, buildEditor) {
        if (buildHeaderView == undefined) buildHeaderView = this.default.buildHeaderView.bind(this, title);
        if (buildViewer == undefined) buildViewer = this.default.buildViewerList.bind(this);
        if (buildEditor == undefined) buildEditor = this.default.buildEditorList.bind(this);
        this.buildHeaderView = buildHeaderView;
        this.buildViewer = buildViewer;
        this.buildEditor = buildEditor;
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
    default = {
        "buildHeaderPage": function(page) { var div = MH.makeDiv(); div.innerHTML = page.title; return div; },
        "buildHeaderView": function(title) { 
            var div = MH.makeDiv(undefined, "stickyTop stickyLeft headerView"); 
            div.innerHTML = title; 
            if (this.interfaceHeaderView.length > 0){
                var divInterface = MH.makeDiv();
                for (var i = 0; i < this.interfaceHeaderView.length; i++){
                    divInterface.appendChild(this.interfaceHeaderView[i]);
                }
                div.appendChild(divInterface);
            }
            return div; 
        },
        "buildViewerList": this.buildListForm.bind(this),
        "buildEditorList": this.buildListForm.bind(this)
    }

    //***** BUILD */
    buildView() {
        var viewRetour = MH.makeDiv(undefined, "container");
        viewRetour.appendChild(this.buildHeaderView());
        viewRetour.appendChild(this.buildBodyView());
        return viewRetour;
    }
    buildBodyView(dataSelected){
        if (this.model.modeEdition){
            return this.buildEditor(this, dataSelected);
        }else{
            return this.buildViewer(this, dataSelected);
        }
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

    //*******VIEW ENGINE */
    buildListForm(view, dataSelected){
        var listForm = MH.makeDiv();
        var record;
        var model = view.model;
        if (dataSelected == undefined){
            for (var i = 0; i < model["datas"].length; i++){
                if (typeof(model["type"]) == "object") {
                    record = MH.makeDiv(undefined, "recordForm");
                    for (var attribut in model["type"]){
                        record.appendChild(model["type"][attribut].buildBodyView(model["datas"][i][attribut]));
                    }
                    listForm.appendChild(record);
                } else {
                    listForm.appendChild(this.buildItemForm(view, dataSelected));
                }
            }
        }else{
            listForm.appendChild(this.buildItemForm(view, dataSelected));
        }
        return listForm;
    }

    buildItemForm(view, dataSelected){
        var div = MH.makeDiv(undefined, "itemForm");
        div.appendChild(this.buildItemFormHeader(view));
        div.appendChild(view.model["type"].buildBodyView(dataSelected));
        return div;
    }

    buildItemFormHeader(view){
        return MH.makeSpan(view["title"], "labelRecordItemForm");
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