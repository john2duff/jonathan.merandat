var BSBuilder = {};

BSBuilder.navBar = function(autoCollapse, interfacesTab){
    var nav = buildElement("nav", undefined, undefined, "navbar navbar-dark");
    if (autoCollapse !== false){
        var buttonCollapse = buildElement("button", undefined, undefined, "navbar-toggler");
        buttonCollapse.setAttribute("type", "button")
        buttonCollapse.setAttribute("href", "#")
        buttonCollapse.setAttribute("data-toggle", "collapse");
        buttonCollapse.setAttribute("data-target", "#navbarSupportedContent");
        buttonCollapse.setAttribute("aria-controls", "navbarSupportedContent");
        buttonCollapse.setAttribute("aria-expanded", "false");
        buttonCollapse.setAttribute("aria-label", "Toggle navigation");
        var spanCollapse = buildElement("span", undefined, undefined, "navbar-toggler-icon");
        buttonCollapse.appendChild(spanCollapse);
        nav.style["background-color"] = "#7f7d7d";
        nav.appendChild(buttonCollapse);
    }

    var divInterfaces = buildElement("div", undefined, "navbarSupportedContent", "collapse navbar-collapse");
    var ul = buildElement("ul", undefined, undefined, "navbar-nav mr-auto");
    var li = buildElement("li", "", undefined, "nav-item dropdown");

    for (var i = 0; i < interfacesTab.length; i++){
        li.innerHTML += interfacesTab[i].innerHTML;
    }
    ul.appendChild(li);
    divInterfaces.appendChild(ul);
    nav.appendChild(divInterfaces);
    return nav;
                    
}

BSBuilder.dropDown = function(titre, interfaces){
    var div = buildElement("div");
    var a = buildElement("a", titre, "navbarDropdownMenuLink", "nav-link dropdown-toggle");
    a.setAttribute("data-toggle", "dropdown");
    a.setAttribute("aria-haspopup", "true");
    a.setAttribute("aria-expanded", "false");
    a.setAttribute("href", "#")

    var dropDownMenu = buildElement("div", undefined, undefined, "dropdown-menu");
    dropDownMenu.style = "z-index:1030;";
    dropDownMenu.setAttribute("aria-labelledby", "navbarDropdownMenuLink");

    for (var i = 0; i < interfaces.length; i++){
        interfaces[i].classList.add("dropdown-item");
        dropDownMenu.appendChild(interfaces[i]);
    }

    div.appendChild(a);
    div.appendChild(dropDownMenu);
    return div;
}

