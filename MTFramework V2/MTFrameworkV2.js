
class MTFramework {
    constructor(container) {
        this.init(container);
    }

    container = null;
    models = null;
    pages = null;

    default = {
        "validators" : {
            "basicString" : function(data){return true;},
            "basicInteger" : function(data){return isNaN(data);}
        }, 
        "viewer" : {
            "basicString" : function(viewName, data){return this.makeSpan(data);},
            "basicInteger" : function(viewName, data){return this.makeSpan(data);},
        },
        "editor" : {
            "basicString" : function(viewName, data){return this.makeInputText(data);},
            "basicInteger" : function(viewName, data){return this.makeInputNumber(data);},
        },
        "buildHeaderPage": function(page) { var div = this.makeDiv(); div.innerHTML = page.title; return div; },
        "buildHeaderView": function(title) { var div = this.makeDiv(); div.innerHTML = title; return div; },
        "buildViewerList": this.buildListForm.bind(this),
        "buildEditorList": this.buildListForm.bind(this)
    }
    
    init(container){
        this.container = container;
        this.models = {};
        this.addNewModel("string", undefined, [], this.default.validators.basicString.bind(this));
        this.addNewViewInModel("string", "basicString", undefined, this.default.buildHeaderView.bind(this), this.default.viewer.basicString.bind(this), this.default.editor.basicString.bind(this));
        this.addNewModel("integer", undefined, [], this.default.validators.basicInteger.bind(this));
        this.addNewViewInModel("integer", "basicInteger", undefined, this.default.buildHeaderView.bind(this), this.default.viewer.basicInteger.bind(this), this.default.editor.basicInteger.bind(this));

        this.pages = {};
        this.addNewPage("home", "Accueil");

        this.currentPage = this.pages["home"];
    }

    render(){
        this.container.innerHTML = this.buildPage(this.currentPage).innerHTML;
    }

    buildPage(page){
        var pageRetour = this.makeDiv();
        //header page
        pageRetour.appendChild(page.buildHeaderPage(page));
        //views
        for (var i = 0; i < page.views.length; i++){
            pageRetour.appendChild(this.buildView(page.views[i]));
        }
        return pageRetour;
    }

    buildView(viewName) {
        var view = this.getViewByViewName(viewName);
        var viewRetour = this.makeDiv();
        viewRetour.appendChild(view.buildHeaderView(viewName));
        viewRetour.appendChild(this.buildBodyView(viewName));
        return viewRetour;
    }

    buildBodyView(viewName, dataSelected){
        var model = this.getModelByViewName(viewName);
        var view = this.getViewByViewName(viewName);
        if (model.modeEdition){
            return view.buildEditor(viewName, dataSelected);
        }else{
            return view.buildViewer(viewName, dataSelected);
        }
    }

    buildListForm(viewName, dataSelected){
        var model = this.getModelByViewName(viewName);
        var view = this.getViewByViewName(viewName);
        var listForm = this.makeDiv();
        var record;
        var recordItem;
        var value;
        var viewAttribut;
        if (dataSelected == undefined){
            for (var i = 0; i < model["datas"].length; i++){
                if (typeof(model["type"]) == "object") {
                    record = this.makeDiv(undefined, "recordForm");
                    for (var attribut in model["type"]){
                        recordItem = this.makeDiv(undefined, "recordItemForm");
                        viewAttribut = this.getViewByViewName(model["type"][attribut]);
                        recordItem.appendChild(this.buildFormHeader(viewAttribut["title"]));
                        value = this.buildBodyView(model["type"][attribut], model["datas"][i][attribut]);
                        value.classList.add("valueRecordItemForm");
                        recordItem.appendChild(value);
                        record.appendChild(recordItem);
                    }
                    listForm.appendChild(record);
                } else {
                    listForm.appendChild(this.buildBodyView(model["type"], dataSelected));
                }
            }
        }else{
            listForm.appendChild(this.buildBodyView(model["type"], dataSelected));
        }
        return listForm;
    }

    buildFormHeader(title){
        return this.makeSpan(title, "labelRecordItemForm");
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
        return null;
    }

    addNewModel(name, type, datas, validator){
        if (validator == undefined) validator = function(){return true;};
        var dataInter = [];
        if (datas != undefined) {
            var dataInter = [];
            for (var i = 0; i < datas.length; i++){
                if (validator(datas[i]))
                    dataInter.push(datas[i]);
            }
        }
        this.models[name] = { "type": type, "validator": validator, "datas": dataInter, "views": {}, "modeEdition": false, "modeSelection": false};
    }

    addNewViewInModel(modelName, name, title, buildHeaderView, buildViewer, buildEditor){
        if (buildHeaderView == undefined) buildHeaderView = this.default.buildHeaderView.bind(this, title);
        if (buildViewer == undefined) buildViewer = this.default.buildViewerList.bind(this);
        if (buildEditor == undefined) buildEditor = this.default.buildEditorList.bind(this);
        this.models[modelName].views[name] = { "title": title, "buildHeaderView": buildHeaderView, "buildViewer": buildViewer, "buildEditor": buildEditor};
    }

    addNewViewInPage(pageName, viewName){
        this.pages[pageName].views.push(viewName);
    }

    addNewPage(name, title, currentPage, buildHeaderPage, views){
        if (name == undefined) return;
        if (title == undefined) title = name;
        if (buildHeaderPage == undefined) buildHeaderPage = this.default.buildHeaderPage.bind(this);
        if (views == undefined) views = [];
        this.pages[name] = { "title": title, "buildHeaderPage": buildHeaderPage, "views": views};
        if (currentPage == true) this.currentPage = this.pages[name];
    }

    makeElt(type, id, className, style){
        var elt = document.createElement(type);
        if (id != undefined) elt.setAttribute("id", id);
        if (className != undefined) elt.setAttribute("class", className);
        if (style != undefined) elt.style = style;
        return elt;
    } 
    makeSpan(content, className){var span = this.makeElt("span", undefined, className); span.innerHTML = content; return span;};
    makeDiv(id, className, style){return this.makeElt("div", id, className, style)}
    makeButton(id, className, style){ return this.makeElt("button", id, className, style);}
    makeInput(type, attributes){ 
        var input = this.makeElt("input"); 
        input.setAttribute("type", type); 
        for (var elt in attributes){
            input.setAttribute(elt, attributes[elt]);
        }
        return input;
    }
    makeButton(id, className, style){ return this.makeElt("button", id, className, style);}
}

