/*************/
// Constants
var cFOV = 50;
var cSpeed = 0.001;
var cPivotRatio = 0.1;
var cMeltLowerLimit = 0.1;
var cMeltViscosity = 1.0;

/*************/
// Global variables
var _modelFile;
var _power = 3;
var _powerBtns = [];
var _isBaking = false;

// Three.js related
var _renderer, _scene, _camera;
var _stand;
var _model, _isModelLoaded;
var _yMin, _yMax, _meltPivot;

/*************/
function init() {
    console.log("Bake bake bake");

    function powerPlay (a) {
        for (var i = 0; i < _power; ++i) {
            var name = '#power';
            name = name+(i+1);
            $(name).toggleClass('pow-on');
        }
        _power = a;
        for (var i = 0; i < _power; ++i) {
            var name = '#power';
            name = name+(i+1);
            $(name).toggleClass('pow-on');
        }   
    };

    $('#power1').on('click', function () {
        powerPlay(1);
    });
    $('#power2').on('click', function () {
        powerPlay(2);
    });
    $('#power3').on('click', function () {
        powerPlay(3);
    });
    $('#power4').on('click', function () {
        powerPlay(4);
    });
    $('#power5').on('click', function () {
        powerPlay(5);
    });

    $('.image').on('click', function () {
        $('.highlighted').toggleClass('highlighted');
        $(this).toggleClass('highlighted');
    });

    $('#mw-bn').on('click', function(){
        $(this).text('STOP').css({'background-color':'red'});
        if (_isBaking)
            _isBaking = false;
        else
            _isBaking = true;
    });

    $('#next-bake').on('click', function () {
        $('#bake').slideDown();
        $('#pick').slideUp();
    });

    // HTML
    var inputElement = document.getElementById("input");
    inputElement.addEventListener("change", handleFiles, false);

    // Three.js
    _renderer = new THREE.WebGLRenderer();
    _renderer.gammaInput = true;
    _renderer.gammaOutput = true;
    _renderer.physicallyBasedShading = true;
    _renderer.shadowMapEnabled = true;
    _renderer.shadowMapCullFace = THREE.CullFaceBack;

    var mw = document.getElementById("mw-canvas");
    _renderer.setSize(mw.clientWidth, mw.clientHeight);
    mw.appendChild(_renderer.domElement);

    _scene = new THREE.Scene();
    _scene.name = "Bake";

    _camera = new THREE.PerspectiveCamera(50, mw.clientWidth / mw.clientHeight, 0.1, 1000);
    _camera.position.set(0, 1, 30);
    _camera.lookAt(new THREE.Vector3(0, 2, 1));
    _camera.name = "Camera";
    _scene.add(_camera);

    var geom = new THREE.CylinderGeometry(3, 3, 0.1, 64);
    var mat = new THREE.MeshPhongMaterial({ambient: 0x0000ff, color: 0x0000ff, specular: 0x0000ff});
    _stand = new THREE.Mesh(geom, mat);
    _stand.castShadow = true;
    _stand.receiveShadow = true;
    _stand.position = new THREE.Vector3(0, -0.3, -0.1);
    _stand.name = "Stand";
    _scene.add(_stand);

    geom = new THREE.CubeGeometry(8, 5, 8);
    mat = new THREE.MeshPhongMaterial({ambient: 0xffeeaf, color: 0xffeebf, specular: 0xffeebf});
    mat.side = THREE.BackSide;
    box = new THREE.Mesh(geom, mat);
    box.receiveShadow = true;
    box.position.set(0, 1.5, 0);
    _scene.add(box);

    geom = new THREE.CubeGeometry(0, 0, 0);
    mat = new THREE.MeshPhongMaterial({color: 0x00ff00});
    _model = new THREE.Mesh(geom, mat);
    _model.castShadow = true;
    _model.receiveShadow = true;
    _model.position = new THREE.Vector3(0, 0.5, 0);
    _model.name = "Model";
    _stand.add(_model);
    _camera.position.z = 5;

    // Let there be light
    var ambientLight = new THREE.AmbientLight(0x404040);
    _scene.add(ambientLight);

    addShadowedLight(2, 1, 1, 0xff9988, 1.3);
    addShadowedLight(-2, 1, 1, 0xff9988, 1);

    _isModelLoaded = false;
}

/*************/
function addShadowedLight( x, y, z, color, intensity ) {
    var directionalLight = new THREE.DirectionalLight( color, intensity );
    directionalLight.position.set( x, y, z )
    _scene.add( directionalLight );
    
    directionalLight.castShadow = true;
    // directionalLight.shadowCameraVisible = true;
    
    var d = 1;
    directionalLight.shadowCameraLeft = -d;
    directionalLight.shadowCameraRight = d;
    directionalLight.shadowCameraTop = d;
    directionalLight.shadowCameraBottom = -d;
    
    directionalLight.shadowCameraNear = 1;
    directionalLight.shadowCameraFar = 4;
    
    directionalLight.shadowMapWidth = 1024;
    directionalLight.shadowMapHeight = 1024;
    
    directionalLight.shadowBias = -0.005;
    directionalLight.shadowDarkness = 0.15;
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
        var material = new THREE.MeshLambertMaterial({ambient: 0x00ffff, color: 0x00bb00, specular: 0xbb0000});

        _stand.remove(_stand.getObjectByName("Model"));
        _model = new THREE.Mesh(geometry, material);
        _model.castShadow = true;
        _model.receiveShadow = true;
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
        var scale = 4.0 / _yMax;
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
    else if (_isModelLoaded && _isBaking) {
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
                v.y -= (cSpeed * 0.2 * v.y / limit) * (dist * 0.2 + 0.8);
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

    if (_isBaking)
        _stand.rotation.y += 0.01;
}

/*************/
$(document).ready(function() {
    init();
    loop();
})
