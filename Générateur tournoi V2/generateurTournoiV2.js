
function loadMTFramework(){
    new MTFramework(document.body, config);
}

function buildTitlePage(title){
    var div = buildElement("div", undefined, undefined, undefined, "display:flex; justify-content:left;align-items:center;");
    var img = buildElement("img", undefined, "logoBadLevier");
    img.setAttribute("src", "./logoBadLevier.jpg");
    var span = buildElement("span", title, undefined, undefined, "line-height: 1.2rem;font-weight: 400;font-size: 1em;text-align: center;padding: 10px;font-family: cursive;color: lightgray;");
    div.appendChild(img);
    div.appendChild(span);
    return div;
}

function buildTitlePopup(title){
    return buildElement("h4", title);
}

function buildHeaderDefaultPreparation(){
    return buildElement("h4", "Préparation");
}

function buildHeaderJoueursPage1(){
    return buildElement("h4", "Joueurs");
}


function buildButtonLancerTournoi() {
    var buttonInverse = buildElement("button", "Inverser", undefined, "btn btn-primary");
    buttonInverse.setAttribute("onclick", "lancerTournoi('" + modelName + "');");
    buttonInverse.value = "Inverse";
    return buttonInverse;
}

function lancerTournoi(){
    
}
