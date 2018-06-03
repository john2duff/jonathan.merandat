<<<<<<< HEAD
=======

>>>>>>> daebf581245e4d79d7649d16fe96538521a90f21
function buildElement(element, className, id, innerHTML, textContent, style) {
    var elementHTML = document.createElement(element);
    if (className != undefined) { elementHTML.className = className; }
    if (id != undefined) { elementHTML.id = id; }
    if (innerHTML != undefined) { elementHTML.innerHTML = innerHTML; }
    if (textContent != undefined) { elementHTML.textContent = textContent; }
    if (style != undefined) {
        for (var i in style) {
            elementHTML.style[i] = style[i];
        }
    }
    return elementHTML;
}

var showTitle = function (evt) {
    var el = evt.parentElement.nextElementSibling;
    while (el) {
        var display = el.style.display;
        if (display != "none" || display == "") {
            el.style.display = "none";
        } else {
            el.style.display = "block";
        }
        el = el.nextElementSibling;
    }
}

var setSticky = function (evt) {
    var el = evt.parentElement;
    var position = el.style.position;
    if (position != "sticky" || position == "") {
        el.style.position = "sticky";
<<<<<<< HEAD
        el.style.top = "0px";
        evt.textContent = "Sticky on";
    } else {
        el.style.position = "initial";
        el.style.position = "initial";
        evt.textContent = "Sticky off";
=======
        evt.style.backgroundColor = "orange";
        evt.style.opacity = "1";
        el.style.zIndex = "999999";
        el.style.top = "0px";
        evt.textContent = "Libérer l'élement";
    } else {
        el.style.position = "initial";
        evt.style.backgroundColor = "#C8C8C8";
        evt.style.opacity = "initial";
        el.style.zIndex = "1";
        el.style.position = "initial";
        evt.textContent = "Epingler l'élement";
>>>>>>> daebf581245e4d79d7649d16fe96538521a90f21
    }
}

const CONTAINER = "container";
const CONTAINER_FLUID = "container-fluid";
<<<<<<< HEAD
var modeAffichage = CONTAINER_FLUID;
=======
var modeAffichage = CONTAINER;
>>>>>>> daebf581245e4d79d7649d16fe96538521a90f21

var actualiserModeAffichage = function () {
    var t = document.getElementsByClassName("modeAffichage");
    var nb = t.length;
    for (var i = 0; i < nb; i++) {
        t[0].className = modeAffichage;
    }
}