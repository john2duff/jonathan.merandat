
export let pages: HtmlNode[];

export class HtmlNode{
    innerHTML: string;
    outerHTML: string;
    parentElement :HtmlNode;
    build: Function;

    constructor(){
        this.innerHTML = "";
        this.outerHTML = "";
        this.parentElement = new HtmlNode();
        this.build = new Function();
    }

}