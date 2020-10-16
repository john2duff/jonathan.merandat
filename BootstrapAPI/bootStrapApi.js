var BSBuilder = {};

BSBuilder.navBar = function(autoCollapse, interfaces){
    var nav = buildElement("nav", undefined, undefined, "navbar navbar-expand-lg navbar-dark bg-dark");
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
        nav.appendChild(buttonCollapse);
    }

    var divInterfaces = buildElement("div", undefined, "navbarSupportedContent", "collapse navbar-collapse");
    var ul = buildElement("ul", undefined, "navbarSupportedContent", "navbar-nav mr-auto");
    var li;
    for (var i = 0; i < interfaces.length; i++){
        li = buildElement("li", undefined, undefined, "nav-item dropdown");
        li.appendChild(interfaces[i]);
    }
    divInterfaces.appendChild(ul);
    nav.appendChild(divInterfaces);
    return nav;
                    
}

BSBuilder.dropDown = function(titre, interfaces){
    var div = buildElement("div");
    var a = buildElement("a", titre, "navbarDropdownMenuLink", "nav-link dropdown-toggle");
    a.setAttribute("data-toggle", "collapse");
    a.setAttribute("aria-haspopup", "true");
    a.setAttribute("aria-expanded", "false");
    a.setAttribute("href", "#")

    var dropDownMenu = buildElement("div", undefined, undefined, "dropdown-menu");
    dropDownMenu.setAttribute("aria-labelledb", "navbarDropdownMenuLink");

    for (var i = 0; i < interfaces.length; i++){
        interfaces[i].classList.add("dropdown-item");
        dropDownMenu.appendChild(interfaces[i]);
    }

    div.appendChild(a);
    div.appendChild(dropDownMenu);
    return 
}

