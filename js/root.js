const TYPE_RECETTE = {
    VORWERCK: "Vorwerck", 
    COOKEO: "Cookeo",
    NONE: "Sans robot"
}

const pages = {
    ACCUEIL: {
        title: "Jonathan Merandat",
        tiles: [
            {
                id: "RECETTE",
                title: "Recettes", 
                elements: {
                    headers: [
                        ["Nom", "Description"], 
                    ],
                    body: [
                        ["Boeuf bourguignon", "succulent"],
                        ["Lasagne bolognaise", "pas mal"],
                    ], 
                    elements:{
                        headers: [
                            ["Nom", "Description"], 
                            ["Etape", "Description", "Ingrédients", "Quantité"], 
                        ],
                        body: [
                            ["Boeuf bourguignon", "succulent"],
                            ["Lasagne bolognaise", "pas mal"],
                        ], 
                    }
                }
            }
        ]
    },
    RECETTE: {
        title: "Recette",
        tiles: [
            {
                id: null,
                title: "Recettes", 
                headers: [
                    ["Nom", "Description"]
                ],
                body: [
                    ["Boeuf bourguignon", "succulent"],
                    ["Lasagne bolognaise", "pas mal"],
                ]
            }
        ]
    }
}

let divRoot;
let currentPage = [pages.ACCUEIL];

function onDocumentReady(){
    divRoot = document.getElementById("root");
    loadPage();
}

function loadPage(){
    divRoot.innerHTML = "";
    loadHeaderPage();
    loadBodyPage();
}

function loadHeaderPage(){
    let divHeader = document.createElement('div');
    divHeader.classList.add("headerPage");
    let buttonRetour = document.createElement("label");
    buttonRetour.innerHTML = "Retour";
    divHeader.appendChild(buttonRetour);
    let title = document.createElement("label");
    title.innerHTML = pages[currentPage[currentPage.length - 1]].title;
    divHeader.appendChild(title);
    divRoot.appendChild(divHeader);
}

function loadBodyPage(){
    let divBody = document.createElement('div');
    divBody.classList.add("bodyPage");
    pages[currentPage[currentPage.length - 1]].tiles.forEach(
        p => {
            divBody.appendChild(createTile(p)); 
        }
    )
    divRoot.appendChild(divBody);
}

function createTile(tileModel){
    let tile = document.createElement('div');
    tile.classList.add("tile");
    let headerTile = document.createElement('div');
    headerTile.classList.add("headerTile");
    let bodyTile = document.createElement('div');
    bodyTile.classList.add("bodyTile");
    let table = document.createElement('table');
    table.classList.add("tableTile");

    let thead = document.createElement('thead');
    let trHeaders = document.createElement("tr");
    tileModel.headers.forEach(
        h => {
            let th = document.createElement("th");
            th.innerHTML = h;
            trHeaders.appendChild(th);
        }
    )
    thead.appendChild(trHeaders);

    let tbody = document.createElement('thead');
    let trHeaders = document.createElement("tr");
    tileModel.body.forEach(
        h => {
            let th = document.createElement("th");
            th.innerHTML = h;
            trHeaders.appendChild(th);
        }
    )
    thead.appendChild(trHeaders);

    tile.appendChild(headerTile);
    tile.appendChild(bodyTile);
    return tile;
}