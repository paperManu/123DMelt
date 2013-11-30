/*************/
// Constants
var cFOV = 50;
var cSpeed = 0.005;
var cPivotRatio = 0.1;
var cMeltLowerLimit = 0.1;
var cMeltViscosity = 1.0;

/*************/
// Global variables
var _modelFile;

// Three.js related
var _renderer, _scene, _camera;
var _stand;
var _model, _isModelLoaded;
var _yMin, _yMax, _meltPivot;

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
    _camera.position = new THREE.Vector3(0, 1, 0);
    _camera.name = "Camera";
    _scene.add(_camera);

    var geom = new THREE.CylinderGeometry(3, 3, 0.1, 32);
    var mat = new THREE.MeshBasicMaterial({color: 0x0000ff});
    _stand = new THREE.Mesh(geom, mat);
    _stand.position = new THREE.Vector3(0, -0.05, 0);
    _stand.name = "Stand";
    _scene.add(_stand);

    geom = new THREE.CubeGeometry(10, 10, 10);
    mat = new THREE.MeshBasicMaterial({color: 0xffe2af});
    mat.side = THREE.BackSide;
    box = new THREE.Mesh(geom, mat);
    _scene.add(box);

    geom = new THREE.CubeGeometry(1, 1, 1);
    mat = new THREE.MeshBasicMaterial({color: 0x00ff00});
    _model = new THREE.Mesh(geom, mat);
    _model.position = new THREE.Vector3(0, 0.5, 0);
    _model.name = "Model";
    _stand.add(_model);
    _camera.position.z = 5;

    _isModelLoaded = false;
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
        _isModelLoaded = false;
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
    if (_modelFile != undefined && !_isModelLoaded) {
        // Load the model
        var loader = new THREE.STLLoader();
        var geometry = loader.parseASCII(new String(_modelFile));
        var material = new THREE.MeshBasicMaterial({color: 0xffff00});

        _stand.remove(_stand.getObjectByName("Model"));
        _model = new THREE.Mesh(geometry, material);
        _model.name = "Model";
        _stand.add(_model);

        _isModelLoaded = true;

        // Place correctly the model on the stand
        _yMin = Number.MAX_VALUE;
        _yMax = -Number.MAX_VALUE;
        for (var i = 0; i < _model.geometry.vertices.length; ++i) {
            if (_model.geometry.vertices[i].y < _yMin)
                _yMin = _model.geometry.vertices[i].y;
            if (_model.geometry.vertices[i].y > _yMax)
                _yMax = _model.geometry.vertices[i].y;
        }

        _yMax -= _yMin;
        var scale = 2.0 / _yMax;
        for (var i = 0; i < _model.geometry.vertices.length; ++i) {
            _model.geometry.vertices[i].y -= _yMin;
            _model.geometry.vertices[i].multiplyScalar(scale);
            _model.geometry.vertices[i].y = Math.max(0.0, _model.geometry.vertices[i].y);
        }

        _yMin = 0;
        _model.geometry.verticesNeedUpdate = true;

        // Get the pivot axis
        _meltPivot = new THREE.Vector3(0, 0, 0);
        var nbr = 0;
        for (var i = 0; i < _model.geometry.vertices.length; ++i) {
            if (_model.geometry.vertices[i].y < cPivotRatio) {
                _meltPivot.add(_model.geometry.vertices[i]);
                nbr++;
            }
        }
        _meltPivot.divideScalar(nbr);
        _meltPivot.y = 0;
    }
    else if (_isModelLoaded) {
        for (var i = 0; i < _model.geometry.vertices.length; ++i) {
            var v = new THREE.Vector3();
            v.copy(_model.geometry.vertices[i]);
            var limit = cMeltLowerLimit;
            if (v.y >= limit) {
                var w = new THREE.Vector3();
                w.copy(v);
                w.y = 0;
                w.sub(_meltPivot);
                var dist = w.length();
                v.y -= (cSpeed * 0.2 * v.y / limit) * (dist * 0.5 + 0.5);
            }
            else {
                var diff = cSpeed * Math.pow(Math.sin(v.y * Math.PI / (2 * limit)), 2);
                var w = new THREE.Vector3();
                w.copy(v);
                w.y = 0;
                w.sub(_meltPivot);
                w.multiplyScalar(diff / cMeltViscosity);
                v.y = Math.max(v.y, v.y - diff);
                v.add(w);
            }

            _model.geometry.vertices[i] = v;
        }
        _model.geometry.verticesNeedUpdate = true;
    }

    _renderer.render(_scene, _camera);
    _stand.rotation.y += 0.01;
}

/*************/
$(document).ready(function() {
    init();
    loop();
})
