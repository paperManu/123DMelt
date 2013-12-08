// Constants
var cFOV = 50;
var cRotationSpeed = 0.5;
var cSpeed = 0.00001;
var cPivotRatio = 0.1;
var cMeltLowerLimit = 0.2;
var cMeltViscosity = 1.0;

var cPlateRadius = 6.0;
var cAutoOrient = false;

var cScale = 2.0;

// Three.js related
var _renderer, _scene, _camera;
var _stand, _box, _center;
var _model, _isModelInitialized;
var _yMin, _yMax, _meltPivot;

/*************/
function initBake() {
    _renderer = new THREE.WebGLRenderer();
    _renderer.gammaInput = true;
    _renderer.gammaOutput = true;
    _renderer.physicallyBasedShading = true;

    var mw = document.getElementById("mw-canvas");
    _renderer.setSize(mw.clientWidth, mw.clientHeight);
    mw.appendChild(_renderer.domElement);

    _scene = new THREE.Scene();
    _scene.name = "Bake";

    _camera = new THREE.PerspectiveCamera(50, mw.clientWidth / mw.clientHeight, 0.1, 1000);
    _camera.position.set(0.0, 0.0, 17.0);
    _camera.name = "Camera";
    _scene.add(_camera);

    var jsLoader = new THREE.JSONLoader(true);
    // Plate
    jsLoader.load('models/mw/plate.js', function(geometry, material) {
        var mat = new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture('models/mw/plate.jpg', new THREE.UVMapping()), ambient: 0xffffff, color: 0x000000});
        mat.side = THREE.DoubleSide;
        _stand = new THREE.Mesh(geometry, mat);
        _stand.position.set(0.0, -0.5, 0.0);
        _stand.name = "Stand";
        _scene.add(_stand);
    });

    // MW box
    jsLoader.load('models/mw/box.js', function(geometry, material) {
        var mat = new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture('models/mw/box.jpg', new THREE.UVMapping()), ambient: 0xffffff, color: 0x000000});
        mat.side = THREE.DoubleSide;
        _box = new THREE.Mesh(geometry, mat);
        _box.rotation.set(0.0, -3.1415 / 2.0, 0.0);
        _scene.add(_box);
    });

    // Load the model
    _model = loadModel();

    // Let there be light
    var ambientLight = new THREE.AmbientLight(0xffffff);
    _scene.add(ambientLight);

    var leftLight = new THREE.PointLight(0x444444, 2, 800);
    var rightLight = new THREE.PointLight(0x444444, 2, 800);
    var frontLight = new THREE.PointLight(0x444444, 2, 800);
    leftLight.position.set(-4, 4, 2);
    rightLight.position.set(4, 4, 2);
    frontLight.position.set(0, 2, 6);
    _scene.add(leftLight);
    _scene.add(rightLight);
    _scene.add(frontLight);

    _isModelInitialized = false;
}

/*************/
function initMake() {
    _center = new THREE.Object3D();
    _scene.add(_center);

    _stand.remove(_model);
    _center.add(_model);
    _model.position.set(0.0, -5.0, 0.0);

    _scene.remove(_stand);
    _scene.remove(_box);

    var geom = new THREE.PlaneGeometry(256, 256, 1, 1);
    var fogPlane = new THREE.Mesh(geom, new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture('images/empty_fog.png')}));
    fogPlane.position.set(0, 0, -100);
    _scene.add(fogPlane);

    var viewer = document.getElementById("viewer");
    _renderer.setSize(viewer.clientWidth, viewer.clientHeight);
    viewer.appendChild(_renderer.domElement);
}

/*************/
function rotateModel(v) {
    _center.rotation.y += v.x / 100.0;
    _center.rotation.x += v.y / 100.0;
}

/*************/
function loadModel() {
    var object;

    var material = new THREE.MeshPhongMaterial({ambient: 0x000000, color: 0xe77c3f, specular: 0xe7e74f});
    if (_selectedModel == "file") {
        if (_modelFileType == "stl") {
            var loader = new THREE.STLLoader();
            var geometry = loader.parse(_modelFile);
            object = new THREE.Mesh(geometry, material);

            _model = object;
            _model.castShadow = true;
            _model.receiveShadow = true;
            _model.name = "Model";
        }
        else if (_modelFileType == "obj") {
            var loader = new THREE.OBJLoader();
            var objModel = loader.parse(new String(_modelFile));
            object = objModel.children[0];
            object.material = material;
            
            _model = object;
            _model.castShadow = true;
            _model.receiveShadow = true;
            _model.name = "Model";
        }
    }
    else {
        filename = new String(cModelDB[_selectedModel]);
        if (filename.search(new String("obj")) != -1) {
            loader = new THREE.OBJLoader();
            loader.load(cModelDB[_selectedModel], function(objModel) {
                object = objModel.children[0];
                object.material = material
                _model = object;
                _model.castShadow = true;
                _model.receiveShadow = true;
                _model.name = "Model";
            });
        }
        else if (filename.search(new String("stl")) != -1) {
            loader = new THREE.STLLoader();
            loader.load(cModelDB[_selectedModel], function(objModel) {
                _model = new THREE.Mesh(objModel, material);
                _model.castShadow = true;
                _model.receiveShadow = true;
                _model.name = "Model";
            });
        }
    }

    return object;
}

/*************/
function initModel() {
    _stand.add(_model);

    _isModelInitialized = true;
    _model.position.set(0.0, -4.1, 0.0);

    // Detect the main axis of the object
    var mainAxis = 2, maxValue = 0;
    var axes = ['x', 'y', 'z'];
    if (cAutoOrient) {
        for (var axis = 0; axis < 3; ++axis) {
            var min = Number.MAX_VALUE;
            var max = -Number.MAX_VALUE;
            for (var i = 0; i < _model.geometry.vertices.length; ++i) {
                if (_model.geometry.vertices[i][axes[axis]] < min)
                    min = _model.geometry.vertices[i][axes[axis]];
                if (_model.geometry.vertices[i][axes[axis]] > max)
                    max = _model.geometry.vertices[i][axes[axis]];
            }
            if (max - min > maxValue) {
                maxValue = max - min;
                mainAxis = axis;
            }
        }
    }
    
    // Change the orientation of the object
    var rotMat = new THREE.Matrix4();
    var euler = new THREE.Euler(0, 0, 0, 'XYZ');
    euler[axes[(mainAxis+1)%3]] = -Math.PI / 2.0;
    rotMat.makeRotationFromEuler(euler);
    _model.geometry.applyMatrix(rotMat);

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
    var scale = 4.0 / _yMax * cScale;
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

/*************/
function handleFiles() {
    console.log("New file selected");

    var fileList = this.files;
    for (var i = 0; i < fileList.length; ++i) {
        var name = new String(fileList[i].name);
        var type = new String(fileList[i].type);
        console.log(name.toString());
        console.log(type.toString());

        if (name.search(new String("stl")) != -1) {
            console.log("STL file detected");
            _modelFileType = "stl";
        }
        else if (name.search(new String("obj")) != -1) {
            console.log("OBJ file detected");
            _modelFileType = "obj";
        }
        else {
            console.log("Wrong file extension, looks like an unsupported file");
            continue;
        }

        var fileReader = new FileReader();
        fileReader.onload = (function(model) {
            return function(e) {
                _modelFile = e.target.result;
            }
        })(_modelFile);

        if (_modelFileType == "stl")
            fileReader.readAsArrayBuffer(fileList[i]);
        else if (_modelFileType == "obj")
            fileReader.readAsText(fileList[i]);
        _isModelInitialized = false;
        _selectedModel = "file";
    }
}

/*************/
function draw() {
    if (draw.lastTime == undefined)
        draw.lastTime = new Date().getTime();
    var elapsed = new Date().getTime() - draw.lastTime;

    if (_model != undefined && !_isModelInitialized) {
        initModel();
    }
    else if (_isModelInitialized && _isBaking) {
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
                v.y -= (cSpeed * _power * elapsed * 0.2 * v.y / limit) * (dist * 0.1 + 0.9);

                _model.geometry.vertices[i] = v;
            }
            else {
                var diff = cSpeed * Math.sqrt(_power) * elapsed * Math.pow(1.0 - v.y / (2.0 * limit), 2.0);
                var w = new THREE.Vector3();
                w.copy(v);
                w.y = 0;
                w.sub(_meltPivot);
                w.multiplyScalar(diff / cMeltViscosity);
                v.y = Math.max(v.y, v.y - diff);
                v.add(w);

                w.copy(v);
                w.y = 0;
                if (w.length() < cPlateRadius * 0.95)
                    _model.geometry.vertices[i] = v;
            }
        }
        _model.geometry.verticesNeedUpdate = true;
    }

    if (_renderer != undefined)
        _renderer.render(_scene, _camera);

    if (_isBaking)
        _stand.rotation.y += cRotationSpeed * elapsed / 1000;

    draw.lastTime = new Date().getTime();
}

