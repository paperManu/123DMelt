/*************/
function init() {
    console.log("Bake bake bake");

    var inputElement = document.getElementById("input");
    inputElement.addEventListener("change", handleFiles, false);
}

/*************/
function handleFiles() {
    console.log("New file selected");

    var extension = new String("stl");

    var fileList = this.files;
    for (var i = 0; i < fileList.length; ++i) {
        var name = new String(fileList[i].name);
        var type = new String(fileList[i].type);
        console.log(name.toString());
        console.log(type.toString());

        if (name.contains(extension)) {
            console.log("File accepted!");
        }
        else {
            console.log("Wrong file extension, STL file desired");
            continue;
        }

        var fileReader = new FileReader();
        fileReader.onload = (function(file) {
            var contents = file.target.result;
        })
    }
}

/*************/
$(document).ready(function() {
    init();
})
