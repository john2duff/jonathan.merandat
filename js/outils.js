var changeHexa = function (hexaValue) {
    if (hexaValue != "") {
        if (isNaN(parseInt(hexaValue, 16))) {
            document.getElementById("inputDec").placeholder = "Conversion impossible";
            document.getElementById("inputDec").value = "";
        } else {
            document.getElementById("inputDec").placeholder = "2B";
            document.getElementById("inputDec").value = parseInt(hexaValue, 16);
        }
        if (isNaN((parseInt(hexaValue, 16)).toString(2))) {
            document.getElementById("inputBin").placeholder = "Conversion impossible";
            document.getElementById("inputBin").value = "";
        } else {
            document.getElementById("inputBin").placeholder = "0101001";
            document.getElementById("inputBin").value = (parseInt(hexaValue, 16)).toString(2);
        }
    } else {
        document.getElementById("inputDec").placeholder = "2B";
        document.getElementById("inputDec").value = "";
        document.getElementById("inputBin").placeholder = "0101001";
        document.getElementById("inputBin").value = "";
    }

    
}
var changeDec = function (decimalValue) {
    if (decimalValue != "") {
        if (0/*isNaN(parseInt(parseInt(decimalValue, 10).toString(16), 16))*/) {
            document.getElementById("inputHexa").placeholder = "Conversion impossible";
            document.getElementById("inputHexa").value = "";
        } else {
            document.getElementById("inputHexa").placeholder = "2B";
            document.getElementById("inputHexa").value = parseInt(decimalValue, 10).toString(16);
        }

        if (decimalValue != "" && isNaN(parseInt(decimalValue, 10).toString(2))) {
            document.getElementById("inputBin").placeholder = "Conversion impossible";
            document.getElementById("inputBin").value = "";
        } else {
            document.getElementById("inputBin").placeholder = "0101001";
            document.getElementById("inputBin").value = parseInt(decimalValue, 10).toString(2);
        }
    } else {
        document.getElementById("inputHexa").placeholder = "2B";
        document.getElementById("inputHexa").value = "";
        document.getElementById("inputBin").placeholder = "0101001";
        document.getElementById("inputBin").value = "";
    }

}
var changeBin = function (binaryValue) {
    if (binaryValue != "") {
        if (0/*isNaN((parseInt(binaryValue, 2)).toString(16))*/) {
            document.getElementById("inputHexa").placeholder = "Conversion impossible";
            document.getElementById("inputHexa").value = "";
        } else {
            document.getElementById("inputHexa").placeholder = "2B";
            document.getElementById("inputHexa").value = (parseInt(binaryValue, 2)).toString(16);
        }
        if (isNaN(parseInt(binaryValue, 2))) {
            document.getElementById("inputDec").placeholder = "Conversion impossible";
            document.getElementById("inputDec").value = "";
        } else {
            document.getElementById("inputDec").placeholder = "43";
            document.getElementById("inputDec").value = parseInt(binaryValue, 2);
        }
    } else {
        document.getElementById("inputHexa").placeholder = "2B";
        document.getElementById("inputHexa").value = "";
        document.getElementById("inputDec").placeholder = "43";
        document.getElementById("inputDec").value = "";
    }
}

var testHexa = function (evt) {
    var maRegex = new RegExp("[a-fA-F0-9]");
    if (!maRegex.test(event.key) && event.keyCode != 8) {
        event.returnValue = false;
    }
}
var testBin = function (evt) {
    var maRegex = new RegExp("[0-1]");
    if (!maRegex.test(event.key) && event.keyCode != 8) {
        event.returnValue = false;
    }
}
var testDec = function (evt) {
    var maRegex = new RegExp("[0-9]");
    if (!maRegex.test(event.key) && event.keyCode != 8 && event.keyCode != 38 && event.keyCode != 40) {
        event.returnValue = false;
    }
}