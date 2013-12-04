/*************/
var cModelDB = {
    image1 : './models/stanford_bunny.obj',
    image2 : './models/spiral_ornament.stl',
    image3 : './models/swedish_moose.stl',
    image4 : './models/owl_statue.stl',
    image5 : './models/thinker.stl',
    image6 : './models/squirel.stl',
    image7 : './models/turbine.stl',
    image8 : './models/saphos.stl',
    image9 : './models/bracelet.stl'
};

/*************/
// Global variables
var _selectedModel = "file";
var _modelFile, _modelFileType;
var _power = 3;
var _powerBtns = [];
var _isBaking = false;
var _startTime;

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

    $('#credits').on('click', function () {
        $(this).parent().find('#credits-text').toggle();
    });

    $('#contact').on('click', function () {
        $(this).parent().find('#contact-text').toggle();
    });

    // HTML
    var inputElement = document.getElementById("input");
    inputElement.addEventListener("change", handleFiles, false);
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
$(document).ready(function() {
    init();
    loop();
})
