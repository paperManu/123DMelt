/*************/
// Constants
var cFOV = 50;

/*************/
// Global variables
var _modelFile;

// Three.js related
var _renderer, _scene, _camera;
var _model;

/*************/
function init() {
    console.log("Bake bake bake");

    // HTML
    var inputElement = document.getElementById("input");
    inputElement.addEventListener("change", handleFiles, false);

    // Three.js
    _renderer = new THREE.WebGLRenderer();
    _renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(_renderer.domElement);

    _scene = new THREE.Scene();
    _scene.name = "Bake";

    _camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    _camera.name = "Camera";
    _scene.add(_camera);

    var geom = new THREE.CubeGeometry(1, 1, 1);
    var mat = new THREE.MeshBasicMaterial({color: 0x00ff00});
    _model = new THREE.Mesh(geom, mat);
    _scene.add(_model);
    _camera.position.z = 5;
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
        fileReader.onload = (function(model) {
            return function(e) {
                _modelFile = e.target.result;
            }
        })(_modelFile);

        fileReader.readAsText(fileList[i]);
        console.log("File loaded");
    }
}

/*************/
function loop() {
    requestAnimationFrame(loop);
    draw();
}

/*************/
function draw() {
    if (_modelFile != undefined)
        console.log(_modelFile);

    _renderer.render(_scene, _camera);
    _model.rotation.y += 0.01;
}

/*************/
$(document).ready(function() {
    init();
    loop();
})
