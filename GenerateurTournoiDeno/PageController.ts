const tab: string[] = []; 

class Page {
    body: string;
    render: Function;
    name: string;

    constructor(name : string, buildFunc : Function){
        this.body = "";
        this.name = name;
        this.render = buildFunc;
    }
}

export default class PageController {
    
    pages: any;
    constructor(){
        this.pages = {};
    }

    addPage(name: string, render: any){
        if (this.pages[name] == undefined){
            this.pages[name] = new Page(name, render);
            return true;
        }
        return false;
    }
}

