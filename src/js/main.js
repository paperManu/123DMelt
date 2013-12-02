/*************/
// Constants
var cFOV = 50;
var cRotationSpeed = 0.5;
var cSpeed = 0.00001;
var cPivotRatio = 0.1;
var cMeltLowerLimit = 0.1;
var cMeltViscosity = 1.0;

var cPlateRadius = 3;
var cAutoOrient = false;

var cModelDB = {
    image1 : './models/stanford_bunny.obj',
};

/*************/
// Global variables
var _selectedModel = "file";
var _modelFile, _modelFileType;
var _power = 3;
var _powerBtns = [];
var _isBaking = false;
var _startTime;

// Three.js related
var _renderer, _scene, _camera;
var _stand;
var _model, _isModelLoaded;
var _yMin, _yMax, _meltPivot;

/*************/
function init() {
    console.log("Bake bake bake");

    function powerPlay(a) {
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
        $(this).closest('#pick').find('.next-bn').css({'background-color':'yellow','box-shadow':'0px 0px 10px #E6E6E6'});
        if (this.id != "upload") {
            _selectedModel = this.id;
        };
    });

    for (var i = 1; i < 10; i++) {
        $('#image'+i).on('mouseenter', function() {
            $(this).find('.image-name').slideDown();
            console.log(i);
        });
        $('#image'+i).on('mouseleave', function () {
            $(this).find('.image-name').slideUp();
        });
    };

    $('#mw-bn').on('click', function(){
        if (_isBaking) {
            _isBaking = false;
            $(this).text('START').css({'background-color':'green'});
            $('embed').remove();
            $('body').append('<embed src="sounds/beep.wav" autostart="true" hidden="true" loop="false">');
        } else {
            _isBaking = true; 
            $(this).text('STOP').css({'background-color':'red'});
            _startTime = new Date().getTime() / 1000;
            $('embed').remove();
            $('body').append('<embed src="sounds/buzz.wav" autostart="true" hidden="true" loop="true">');
        }
    });

    $('#next-bake').on('click', function () {
        $('#bake').slideDown();
        $('#pick').slideUp();

        initGL();
    });

    $('#next-make').on('click', function () {
        $('#bake').slideUp();
        $('#make').slideDown();  
    });

    // HTML
    var inputElement = document.getElementById("input");
    inputElement.addEventListener("change", handleFiles, false);
}

/*************/
function initGL() {
    // Three.js
    _renderer = new THREE.WebGLRenderer();
    _renderer.gammaInput = true;
    _renderer.gammaOutput = true;
    _renderer.physicallyBasedShading = true;
    //_renderer.shadowMapEnabled = true;
    //_renderer.shadowMapCullFace = THREE.CullFaceBack;

    var mw = document.getElementById("mw-canvas");
    _renderer.setSize(mw.clientWidth, mw.clientHeight);
    mw.appendChild(_renderer.domElement);

    _scene = new THREE.Scene();
    _scene.name = "Bake";

    _camera = new THREE.PerspectiveCamera(50, mw.clientWidth / mw.clientHeight, 0.1, 20);
    _camera.position.set(0, 1.5, 7);
    _camera.lookAt(new THREE.Vector3(0, 1.5, 1));
    _camera.name = "Camera";
    _scene.add(_camera);

    // Plate
    var geom = new THREE.CylinderGeometry(cPlateRadius, cPlateRadius, 0.1, 64);
    var mat = new THREE.MeshPhongMaterial({ambient: 0xaaaaaa, color: 0xaaaaaa, specular: 0xffffff, shininess: 100});
    _stand = new THREE.Mesh(geom, mat);
    _stand.castShadow = true;
    _stand.receiveShadow = true;
    _stand.position = new THREE.Vector3(0, -0.5, -0.1);
    _stand.name = "Stand";
    _scene.add(_stand);

    // MW box
    geom = new THREE.CubeGeometry(8, 5, 8);
    mat = new THREE.MeshPhongMaterial({ambient: 0xffeeaf, color: 0xffeebf, specular: 0xffeebf});
    mat.side = THREE.BackSide;
    box = new THREE.Mesh(geom, mat);
    box.receiveShadow = true;
    box.position.set(0, 1.5, 0);
    _scene.add(box);

    // Load the model
    _model = loadModel();

    // Let there be light
    var ambientLight = new THREE.AmbientLight(0x404040);
    _scene.add(ambientLight);

    var pointLight = new THREE.PointLight(0x444444, 2, 800);
    pointLight.position.set(2, 3, 1);
    _stand.add(pointLight);

    var leftLight = new THREE.PointLight(0x444444, 2, 800);
    var rightLight = new THREE.PointLight(0x444444, 2, 800);
    leftLight.position.set(-4, 2, 1);
    rightLight.position.set(4, 2, 1);
    _scene.add(leftLight);
    _scene.add(rightLight);

    _isModelLoaded = false;
}

/*************/
function loadModel() {
    var object;

    if (_selectedModel == "file") {
        if (_modelFileType == "stl") {
            var loader = new THREE.STLLoader();
            var geometry = loader.parseASCII(new String(_modelFile));
            var material = new THREE.MeshPhongMaterial({ambient: 0x00ffff, color: 0x00bb00, specular: 0xbb0000});
            object = new THREE.Mesh(geometry, material);
        }
        else if (_modelFileType == "obj") {
            var loader = new THREE.OBJLoader();
            var objModel = loader.parse(new String(_modelFile));
            object = objModel.children[0];
        }
    }
    else {
        if (cModelDB[_selectedModel] != undefined) {
            loader = new THREE.OBJLoader();
            loader.load(cModelDB[_selectedModel], function(objModel) {
                object = objModel.children[0];
            });
        }
    }

    return object;
}

/*************/
function initModel() {
    _isModelLoaded = true;

    _model.castShadow = true;
    _model.receiveShadow = true;
    _model.name = "Model";
    _stand.add(_model);

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

        fileReader.readAsText(fileList[i]);
        _isModelLoaded = false;
    }
}

/*************/
function loop() {
    requestAnimationFrame(loop);
    draw();

    // pb : ça se fait à chaque fois //
    // if (_modelFile != undefined) {
    //    $('#up-confirmation').css({'opacity':'1'}, {'color':'green'});
    // }

    if (_isBaking) {
        var currentTime = (new Date().getTime() / 1000) - _startTime;
        currentTime = Math.round(currentTime).toFixed(0);
        var minutes = Math.floor(currentTime/60).toFixed(0);
        var seconds = currentTime-60*minutes;
        if (minutes < 10) {minutes = "0"+minutes;}
        if (seconds < 10) {seconds = "0"+seconds;}
        $('#mw-timer').find('span').text(minutes + ":" + seconds); 
    }
}

/*************/
function draw() {
    if (draw.lastTime == undefined)
        draw.lastTime = new Date().getTime();
    var elapsed = new Date().getTime() - draw.lastTime;

    if (_model != undefined && !_isModelLoaded) {
        initModel();
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
                v.y -= (cSpeed * _power * elapsed * 0.2 * v.y / limit) * (dist * 0.2 + 0.8);

                _model.geometry.vertices[i] = v;
            }
            else {
                var diff = cSpeed * Math.sqrt(_power) * 2.0 * elapsed * Math.pow(Math.sin(v.y * Math.PI / (2 * limit)), 2);
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

/*************/
$(document).ready(function() {
    init();
    loop();
})
