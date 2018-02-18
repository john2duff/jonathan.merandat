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